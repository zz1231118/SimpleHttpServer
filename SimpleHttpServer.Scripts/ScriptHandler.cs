using System;
using System.IO;
using System.Reflection;
using LyxFramework.Log;
using SimpleHttpServer.Handlers;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class ScriptHandler : Handler
    {
        private const string ScriptProperty = "Script";
        private const string UploadMaxFileSizeProperty = "UploadMaxFileSize";
        private const long DefaultUploadMaxFileSize = 100 * 1024 * 1024;
        private ScriptEngines _scriptEngines;
        private long _uploadMaxFileSize;

        public ScriptHandler(IHttpSite site)
            : base(site)
        { }

        protected override void OnStart()
        {
            ContentTypes.SetContentType(".cs", "text/plain");
            ContentTypes.SetContentType(".yshx", "text/plain");
            ContentTypes.SetContentType(".aspx", "text/html");
            var conf = HttpSite.Conf.GetConfig(ScriptProperty);
            _uploadMaxFileSize = conf.GetLong(UploadMaxFileSizeProperty, DefaultUploadMaxFileSize);

            _scriptEngines = new ScriptEngines(HttpSite, conf);
            _scriptEngines.AddSysReferencedAssembly(Assembly.GetExecutingAssembly().Location);
            _scriptEngines.AddSysReferencedAssembly(typeof(Handler).Assembly.Location);
            _scriptEngines.AddSysReferencedAssembly(typeof(LogManager).Assembly.Location);
            _scriptEngines.AddSysReferencedAssembly("System.ServiceModel.dll");
            _scriptEngines.AddSysReferencedAssembly("System.Runtime.Serialization.dll");
            _scriptEngines.Initialize();
        }
        protected override void OnStop()
        {
            _scriptEngines.Shutdown();
        }

        public override void Handle(IHandleContext context)
        {
            var extension = Path.GetExtension(context.FileInfo.Name);
            var response = context.HttpContext.Response;
            response.ContentType = ContentTypes.GetContentType(extension);
            response.StatusCode = (int)HttpStatusCode.OK;

            try
            {
                var scriptContext = new CSharpScriptContext(this, context.HttpContext, context.FileInfo);
                var obj = _scriptEngines.CreateInstance(context.FileInfo.FullName, null, scriptContext);
                var script = (CSharpScript)obj;

                try
                {
                    script.Invoke();
                }
                finally
                {
                    script.Dispose();
                }
            }
            catch (Exception ex)
            {
                LogManager.Warn.Log("{0} file:{1} error: {2}", nameof(ScriptHandler), context.FileInfo.FullName, ex);
                if (_scriptEngines.IsDebug)
                    throw;

                throw new InvalidOperationException("Internal Server Error");
            }
        }

        class CSharpScriptContext : IScriptContext
        {
            private ScriptHandler _handler;

            public CSharpScriptContext(ScriptHandler handler, HttpListenerContext context, FileInfo fileInfo)
            {
                _handler = handler;

                HttpContext = context;
                FileInfo = fileInfo;
            }

            public HttpListenerContext HttpContext { get; }
            public Handler Handler => _handler;
            public FileInfo FileInfo { get; }
            public string SessionDirectory => _handler._scriptEngines.SessionDirectory;
            public long UploadMaxFileSize => _handler._uploadMaxFileSize;
        }
    }
}
