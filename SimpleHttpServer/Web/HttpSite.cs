using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using LyxFramework.Configuration;
using LyxFramework.Configuration.Hocon;
using LyxFramework.Log;
using SimpleHttpServer.Web.Bundles;
using SimpleHttpServer.Web.Routes;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web.Processors;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Web
{
    public class HttpSite : MarshalByRefObject, IHttpSite
    {
        private const string BundlesProperty = "Bundles";
        private const string HostsProperty = "Hosts";
        private const string RootProperty = "Root";
        private const string NotFoundProperty = "NotFound";
        private const string ProcessorsProperty = "Processors";

        private HttpListener httpListener;
        private Config conf;
        private bool activated;
        private string root;
        private string notFound;
        private DirectoryInfo baseDir;
        private List<Processor> processors = new List<Processor>();
        private List<BundleActivator> bundles = new List<BundleActivator>();

        public HttpSite(Config conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));

            this.conf = conf;
            root = conf.GetString(RootProperty);
            notFound = conf.GetString(NotFoundProperty);
            if (notFound != null && !notFound.StartsWith(HttpUtility.ForwardSlashString))
            {
                notFound = HttpUtility.ForwardSlashString + notFound;
            }

            var dirPath = root.Contains(":") ? root : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, root);
            baseDir = new DirectoryInfo(dirPath);
            if (!baseDir.Exists)
            {
                baseDir.Create();
            }
        }

        public bool Activated => activated;
        public string BaseDirectory => baseDir.FullName;
        public Config Config => conf;

        public sealed override object InitializeLifetimeService()
        {
            return null;
        }

        public void Start()
        {
            if (activated)
                throw new InvalidOperationException();

            LogManager.Assign(FileLogFactory.Default);

            activated = true;
            httpListener = new HttpListener();

            var hosts = conf.GetStringList(HostsProperty);
            foreach (var host in hosts)
            {
                httpListener.Prefixes.Add(host);
            }

            LoadProcessors();
            LoadBundles();
            foreach (var bundle in bundles)
            {
                bundle.OnStart();
            }

            httpListener.Start();
            PostAccept();
        }
        public void Stop()
        {
            if (!activated)
                return;

            activated = false;
            httpListener.Stop();
            httpListener.Close();
            foreach (var bundle in bundles)
            {
                bundle.OnStop();
            }

            LogManager.Shutdown();
        }

        private void LoadProcessors()
        {
            var hconf = conf.GetConfig(ProcessorsProperty);
            var obj = hconf.Root.GetObject();
            foreach (var val in obj.Items.Values)
            {
                var acf = new Config(new HoconRoot(val));
                var processor = Processor.Parse(acf);
                processors.Add(processor);
            }
        }
        private void LoadBundles()
        {
            var hconf = conf.GetConfig(BundlesProperty);
            if (hconf != null)
            {
                var obj = hconf.Root.GetObject();
                foreach (var val in obj.Items.Values)
                {
                    var acf = new Config(new HoconRoot(val));
                    var bundle = BundleActivator.Parse(acf);
                    bundle.Initialize(this);
                    bundles.Add(bundle);
                }
            }
        }

        private void PostAccept()
        {
            httpListener.BeginGetContext(new AsyncCallback(ProcessAccept), null);
        }
        private void ProcessAccept(IAsyncResult ar)
        {
            var context = httpListener.EndGetContext(ar);
            ThreadPool.QueueUserWorkItem(new WaitCallback(SetupContext), context);
            PostAccept();
        }
        private void SetupContext(object obj)
        {
            try
            {
                var context = (HttpListenerContext)obj;
                SetupResponse(context);
            }
            catch (ObjectDisposedException)
            { }
            catch (Exception ex)
            {
                LogManager.Error.Log("{0} error:{1}", nameof(ProcessAccept), ex);
            }
        }
        private void SetupResponse(HttpListenerContext httpContext)
        {
            var request = httpContext.Request;
            var response = httpContext.Response;
            var rawUrl = request.RawUrl;
            if (RouteManager.TryGet(rawUrl, out IRouteHandler routeHandler))
            {
                rawUrl = routeHandler.GetRawUrl(rawUrl);
            }
            if (rawUrl.EndsWith(HttpUtility.ForwardSlashString))
            {
                rawUrl += "index.html";
            }
            if (rawUrl.StartsWith(HttpUtility.ForwardSlashString))
            {
                rawUrl = rawUrl.TrimStart(HttpUtility.ForwardSlashChar);
            }
            if (TryGetProcessor(rawUrl, out Processor processor))
            {
                try
                {
                    var context = new HttpContext(this, httpContext, rawUrl);
                    processor.Handle(this, context);
                }
                catch (FileNotFoundException)
                {
                    goto NotFound;
                }
                catch (Exception ex)
                {
                    //500
                    var encoding = request.ContentEncoding ?? Encoding.UTF8;
                    var bytes = encoding.GetBytes(ex.Message);
                    response.StatusCode = (int)HttpStatusCode.InternalServerError;
                    response.ContentEncoding = encoding;
                    response.OutputStream.Write(bytes, 0, bytes.Length);
                }

                goto EndResponse;
            }

            //404
            NotFound:
            rawUrl = Path.Combine(baseDir.FullName, notFound.TrimStart(HttpUtility.ForwardSlashChar));
            if (notFound != null && File.Exists(rawUrl))
            {
                response.Redirect(notFound);
                response.StatusCode = (int)HttpStatusCode.Redirect;
            }
            else
            {
                response.StatusCode = (int)HttpStatusCode.NotFound;
            }

            //End
            EndResponse:
            httpContext.Response.KeepAlive = false;
            httpContext.Response.Close();
        }
        private bool TryGetProcessor(string rawUrl, out Processor processor)
        {
            processor = processors.Find(p => p.IsMath(rawUrl));
            return (processor != null);
        }
    }
}