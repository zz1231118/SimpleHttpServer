using System;
using System.Collections.Generic;
using System.IO;
using Framework.Log;
using SimpleHttpServer.Web;

namespace SimpleHttpServer
{
    public class HttpServer : IHttpServer
    {
        private readonly List<HttpSiteActivator> activators = new List<HttpSiteActivator>();
        private readonly ILogger logger = Logger.GetLogger<HttpServer>();
        private bool isActivated;

        public bool IsActivated => isActivated;

        public IReadOnlyCollection<HttpSiteActivator> Activators => activators;

        public void Start()
        {
            if (isActivated)
                throw new InvalidOperationException();

            isActivated = true;
            var dirPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sites");
            var baseDir = new DirectoryInfo(dirPath);
            if (!baseDir.Exists)
            {
                baseDir.Create();
            }
            foreach (var dir in baseDir.GetDirectories())
            {
                var activator = HttpSiteActivator.Load(dir);
                activators.Add(activator);
            }
            foreach (var activator in activators)
            {
                activator.Start();
            }
        }

        public void Stop()
        {
            if (!isActivated)
            {
                return;
            }

            isActivated = false;
            List<Exception> exceptions = null;
            foreach (var activator in activators)
            {
                try
                {
                    activator.Stop();
                }
                catch (Exception ex)
                {
                    if (exceptions == null) exceptions = new List<Exception>() { ex };
                    else exceptions.Add(ex);
                    logger.Error("stop site:{0} error:{1}", activator.Name, ex);
                }
            }
            if (exceptions?.Count > 0)
            {
                throw new AggregateException(exceptions);
            }
        }
    }
}