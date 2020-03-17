using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using Framework.Configuration;
using Framework.Configuration.Hocon;
using Framework.Log;
using SimpleHttpServer.Web.Routes;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web.Bundles;
using SimpleHttpServer.Web.Processors;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Web
{
    internal class HttpSite : MarshalByRefObject, IHttpSite
    {
        private const string BundlesProperty = "Bundles";
        private const string HostsProperty = "Hosts";
        private const string RootProperty = "Root";
        private const string IndicesProperty = "Indices";
        private const string NotFoundProperty = "NotFound";
        private const string ProcessorsProperty = "Processors";

        private readonly ILogger logger;
        private readonly Config conf;
        private HttpListener httpListener;
        private bool isActivated;
        private string root;
        private string notFound;
        private IReadOnlyList<string> indices;
        private DirectoryInfo baseDir;
        private List<Processor> processors = new List<Processor>();
        private List<BundleActivator> bundleActivators = new List<BundleActivator>();

        public HttpSite(Config conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));

            this.conf = conf;
            var loggerFactory = new LoggerFactory();
            loggerFactory.AddProvider<FileLoggerProvider>();
            Logger.LoggerFactory = loggerFactory;

            logger = Logger.GetLogger<HttpSite>();

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

            if (conf.HasPath(BundlesProperty))
            {
                var bconf = conf.GetConfig(BundlesProperty);
                var bobj = bconf.Root.GetObject();
                foreach (var val in bobj.Items.Values)
                {
                    var acf = new Config(new HoconRoot(val));
                    var bundleActivator = BundleActivator.Parse(acf);
                    bundleActivator.Config = acf;
                    bundleActivator.Site = this;
                    bundleActivators.Add(bundleActivator);
                }
            }
            if (conf.HasPath(ProcessorsProperty))
            {
                var hconf = conf.GetConfig(ProcessorsProperty);
                var hobj = hconf.Root.GetObject();
                foreach (var val in hobj.Items.Values)
                {
                    var acf = new Config(new HoconRoot(val));
                    var processor = Processor.Parse(acf);
                    processor.Config = acf;
                    processor.Site = this;
                    processors.Add(processor);
                }
            }
        }

        public bool IsActivated => isActivated;

        public string BaseDirectory => baseDir.FullName;

        public Config Config => conf;

        private void PostAccept()
        {
            httpListener.BeginGetContext(new AsyncCallback(ProcessAccept), null);
        }

        private void ProcessAccept(IAsyncResult ar)
        {
            HttpListenerContext context;

            try
            {
                context = httpListener.EndGetContext(ar);
            }
            catch (ObjectDisposedException)
            {
                //被释放了
                return;
            }

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
                logger.Error("{0} error:{1}", nameof(ProcessAccept), ex);
            }
        }

        private void SetupResponse(HttpListenerContext httpContext)
        {
            var request = httpContext.Request;
            var response = httpContext.Response;
            var rawUrl = request.RawUrl;
            httpContext.Response.KeepAlive = false;
            if (RouteManager.TryGet(rawUrl, out IRouteHandler routeHandler))
            {
                rawUrl = routeHandler.GetRawUrl(rawUrl);
            }
            if (rawUrl != HttpUtility.ForwardSlashString && rawUrl.StartsWith(HttpUtility.ForwardSlashString))
            {
                rawUrl = rawUrl.TrimStart(HttpUtility.ForwardSlashChar);
            }
            try
            {
                if (rawUrl.EndsWith(HttpUtility.ForwardSlashString))
                {
                    string url;
                    for (int i = 0; i < indices.Count; i++)
                    {
                        url = rawUrl + indices[i];
                        if (TryExecuteProcessor(httpContext, url))
                        {
                            goto EndResponse;
                        }
                    }
                }
                else if (TryExecuteProcessor(httpContext, rawUrl))
                {
                    goto EndResponse;
                }
            }
            catch (Exception ex)
            {
                //500
                var encoding = request.ContentEncoding ?? Encoding.UTF8;
                var bytes = encoding.GetBytes(ex.Message);
                response.StatusCode = (int)HttpStatusCode.InternalServerError;
                response.ContentEncoding = encoding;
                response.OutputStream.Write(bytes, 0, bytes.Length);
                goto EndResponse;
            }

            //404
            if (notFound != null && File.Exists(Path.Combine(baseDir.FullName, notFound.TrimStart(HttpUtility.ForwardSlashChar))))
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
            httpContext.Response.Close();
        }

        private bool TryExecuteProcessor(HttpListenerContext httpContext, string rawUrl)
        {
            if (TryGetProcessor(rawUrl, out Processor processor))
            {
                var context = new HttpContext(this, httpContext, rawUrl);
                processor.Handle(context);
                return true;
            }

            return false;
        }

        private bool TryGetProcessor(string rawUrl, out Processor processor)
        {
            processor = processors.Find(p => p.IsMath(this, rawUrl));
            return (processor != null);
        }

        public sealed override object InitializeLifetimeService()
        {
            return null;
        }

        public void Start()
        {
            if (isActivated)
                throw new InvalidOperationException();

            isActivated = true;
            httpListener = new HttpListener();
            indices = conf.GetStringArray(IndicesProperty) ?? new string[0];
            foreach (var host in conf.GetStringArray(HostsProperty))
            {
                httpListener.Prefixes.Add(host);
            }

            try
            {
                foreach (var bundleActivator in bundleActivators)
                {
                    bundleActivator.OnStart();
                }
                foreach (var processor in processors)
                {
                    processor.OnStart();
                }

                httpListener.Start();
            }
            catch (Exception ex)
            {
                throw new SiteInitializationException(BaseDirectory, ex);
            }

            PostAccept();
        }

        public void Stop()
        {
            if (!isActivated)
                return;

            isActivated = false;
            httpListener.Stop();
            httpListener.Close();
            foreach (var processor in processors)
            {
                processor.OnStop();
            }
            foreach (var bundleActivator in bundleActivators)
            {
                bundleActivator.OnStop();
            }

            Logger.Flush();
        }
    }
}