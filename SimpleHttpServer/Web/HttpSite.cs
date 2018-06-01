using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading;
using LyxFramework.Configuration;
using LyxFramework.Configuration.Hocon;
using LyxFramework.Log;
using SimpleHttpServer.Handlers;

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
        private const string HandlersProperty = "Handlers";
        private const string HostsProperty = "Hosts";
        private const string RootProperty = "Root";
        private const string NotFoundProperty = "NotFound";
        private const string ForwardSlashString = "/";
        private const char ForwardSlashChar = '/';
        private const string BackSlashString = @"\";
        private const char BackSlashChar = '\\';

        private List<HandleProvider> _handleProviders = new List<HandleProvider>();
        private HttpListener _httpListener;
        private Config _conf;
        private bool _activated;
        private List<string> _hosts;
        private string _root;
        private string _notFound;
        private DirectoryInfo _baseDir;

        public HttpSite(Config conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));

            _conf = conf;
            _hosts = conf.GetStringList(HostsProperty);
            _root = conf.GetString(RootProperty);
            _notFound = conf.GetString(NotFoundProperty);
            if (_notFound != null && !_notFound.StartsWith(ForwardSlashString))
                _notFound = ForwardSlashString + _notFound;

            var dirPath = _root.Contains(":") ? _root : Path.Combine(AppDomain.CurrentDomain.BaseDirectory, _root);
            _baseDir = new DirectoryInfo(dirPath);
            if (!_baseDir.Exists)
                _baseDir.Create();
        }

        public bool Activated => _activated;
        public string BaseDirectory => _baseDir.FullName;
        public Config Conf => _conf;

        public sealed override object InitializeLifetimeService()
        {
            return null;
        }

        public void Start()
        {
            if (_activated)
                throw new InvalidOperationException();

            LogManager.Assign(FileLogFactory.Default);

            _activated = true;
            _httpListener = new HttpListener();

            foreach (var host in _hosts)
                _httpListener.Prefixes.Add(host);

            LoadHandleProviders();
            foreach (var provider in _handleProviders)
                provider.Start();

            _httpListener.Start();
            PostAccept();
        }
        public void Stop()
        {
            if (!_activated)
                return;

            _activated = false;
            _httpListener.Stop();
            _httpListener.Close();

            foreach (var provider in _handleProviders)
                provider.Stop();

            LogManager.Shutdown();
        }

        private void LoadHandleProviders()
        {
            var hconf = _conf.GetConfig(HandlersProperty);
            var obj = hconf.Root.GetObject();
            foreach (var val in obj.Items.Values)
            {
                var acf = new Config(new HoconRoot(val));
                var adapter = new HandleProvider(this, acf);
                _handleProviders.Add(adapter);
            }
        }
        private void PostAccept()
        {
            _httpListener.BeginGetContext(new AsyncCallback(ProcessAccept), null);
        }
        private void ProcessAccept(IAsyncResult ar)
        {
            var context = _httpListener.EndGetContext(ar);
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
        private void SetupResponse(HttpListenerContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var path = request.Url.LocalPath;
            if (!TryGetHandler(path, out Handler handler, out FileInfo fileInfo))
            {
                //404
                path = Path.Combine(_baseDir.FullName, _notFound.TrimStart(ForwardSlashChar));
                if (_notFound != null && File.Exists(path))
                {
                    response.Redirect(_notFound);
                    response.StatusCode = (int)System.Net.HttpStatusCode.Redirect;
                }
                else
                {
                    response.StatusCode = (int)System.Net.HttpStatusCode.NotFound;
                }
            }
            else
            {
                try
                {
                    var handleContext = new HandleContext(context, fileInfo);
                    handler?.Handle(handleContext);
                }
                catch (Exception ex)
                {
                    //500
                    var encoding = request.ContentEncoding ?? Encoding.UTF8;
                    var bytes = encoding.GetBytes(ex.Message);
                    response.StatusCode = (int)System.Net.HttpStatusCode.InternalServerError;
                    response.ContentEncoding = encoding;
                    response.OutputStream.Write(bytes, 0, bytes.Length);
                }
            }

            context.Response.KeepAlive = false;
            context.Response.Close();
        }
        private bool TryGetHandler(string rawUrl, out Handler handler, out FileInfo fileInfo)
        {
            var path = rawUrl.Replace(ForwardSlashString, BackSlashString);
            if (path.EndsWith(BackSlashString))
                path += "index.html";
            if (path.StartsWith(BackSlashString))
                path = path.TrimStart(BackSlashChar);

            try
            {
                var files = _baseDir.GetFiles(path);
                if (files.Length == 1)
                {
                    var file = files[0];
                    var extension = Path.GetExtension(file.Name);
                    var provider = _handleProviders.Find(p => p.IsMatch(extension));
                    if (provider != null)
                    {
                        handler = provider.Handler;
                        fileInfo = file;
                        return true;
                    }
                }
            }
            catch (DirectoryNotFoundException)
            {
                LogManager.Warn.Log("directory not found:" + path);
            }

            handler = null;
            fileInfo = null;
            return false;
        }
    }
}
