using System;
using System.IO;
using System.Net;
using System.Reflection;
using Framework;
using Framework.Log;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web;
using SimpleHttpServer.Web.Processors;

namespace SimpleHttpServer.Scripts
{
    public class ScriptProcessor : ReadOnlyProcessor
    {
        private readonly ILogger logger = Logger.GetLogger<ScriptProcessor>();
        private ScriptEngines scriptEngines;

        protected override void OnStart()
        {
            base.OnStart();
            ContentTypes.SetContentType(ScriptEngines.HandleExtension, "text/plain");
            ContentTypes.SetContentType(ScriptEngines.WindowExtension, "text/html");
            scriptEngines = new ScriptEngines(Site, Config);

            var assembly = Assembly.Load("netstandard, Version=2.0.0.0, Culture=neutral, PublicKeyToken=cc7b13ffcd2ddd51");
            scriptEngines.AddSysReferencedAssembly(assembly.Location);

            scriptEngines.AddSysReferencedAssembly(Assembly.GetExecutingAssembly().Location);
            scriptEngines.AddSysReferencedAssembly(typeof(Processor).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(ReflexHelper).Assembly.Location);

            scriptEngines.AddSysReferencedAssembly(typeof(object).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.Uri).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.Linq.Enumerable).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.Data.SqlDbType).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.Data.SqlClient.SqlConnection).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.Data.SqlClient.SqlCommand).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.ServiceModel.ServiceHost).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(System.Runtime.Serialization.DataContractAttribute).Assembly.Location);
            foreach (var referencedAssemblyName in typeof(Framework.BaseDisposed).Assembly.GetReferencedAssemblies())
            {
                var referencedAssembly = Assembly.Load(referencedAssemblyName);
                scriptEngines.AddSysReferencedAssembly(referencedAssembly.Location);
            }

            scriptEngines.Start();

            var domain = scriptEngines.ApplicationDomain;
            var app = domain.CreateApplication();
            app.Site = Site;
            app.Setting = new ApplicationSetting(Site);

            Application.Current = app;
            Application.Current.Startup();
        }

        protected override void OnStop()
        {
            base.OnStop();
            Application.Current.Exit();

            scriptEngines?.Close();
        }

        public override void Handle(IHttpContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var rawUrl = context.RawUrl;
            var fileInfo = HttpUtility.GetFileInfo(context.Site, rawUrl);
            if (fileInfo == null)
            {
                throw new FileNotFoundException(rawUrl);
            }

            var extension = Path.GetExtension(fileInfo.Name);
            response.ContentType = ContentTypes.GetContentType(extension);
            response.StatusCode = (int)HttpStatusCode.OK;

            try
            {
                var obj = scriptEngines.CreateInstance(fileInfo.FullName, null);
                var script = (CSharpScript)obj;

                try
                {
                    script.Initialize(scriptEngines, context, fileInfo);
                    script.Invoke();
                }
                finally
                {
                    script.Dispose();
                }
            }
            catch (Exception ex)
            {
                logger.Warn("{0} file:{1} error: {2}", nameof(ScriptProcessor), fileInfo.FullName, ex);
                if (scriptEngines.IsDebug)
                    throw;

                throw new InvalidOperationException("Internal Server Error");
            }
        }
    }
}
