using System;
using System.IO;
using LyxFramework.Log;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class ScriptHandler : IHttpHandler
    {
        public void Handle(IHttpContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var rawUrl = context.RawUrl;
            var file = HttpUtility.GetFileInfo(context.Site, rawUrl);
            if (file == null)
                throw new FileNotFoundException(rawUrl);

            var extension = Path.GetExtension(file.Name);
            response.ContentType = ContentTypes.GetContentType(extension);
            response.StatusCode = (int)HttpStatusCode.OK;

            try
            {
                var obj = Application.Current.ScriptEngines.CreateInstance(file.FullName, null);
                var script = (CSharpScript)obj;

                try
                {
                    var scriptContext = new CSharpScriptContext(this, context, file);
                    script.Initialize(scriptContext);
                    script.Invoke();
                }
                finally
                {
                    script.Dispose();
                }
            }
            catch (Exception ex)
            {
                LogManager.Warn.Log("{0} file:{1} error: {2}", nameof(ScriptHandler), file.FullName, ex);
                if (Application.Current.ScriptEngines.IsDebug)
                    throw;

                throw new InvalidOperationException("Internal Server Error");
            }
        }

        class CSharpScriptContext : IScriptContext
        {
            private ScriptHandler handler;

            public CSharpScriptContext(ScriptHandler handler, IHttpContext context, FileInfo fileInfo)
            {
                this.handler = handler;

                HttpContext = context;
                FileInfo = fileInfo;
            }

            public IHttpContext HttpContext { get; }
            public IHttpHandler Handler => handler;
            public FileInfo FileInfo { get; }
        }
    }
}
