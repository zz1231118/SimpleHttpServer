using System;
using System.Collections.Generic;
using System.IO;
using SimpleHttpServer.Web;

namespace SimpleHttpServer
{
    public class HttpServer : IHttpServer
    {
        private List<HttpSiteActivator> _activators = new List<HttpSiteActivator>();
        private bool _activated;

        public bool Activated => _activated;

        public void Start()
        {
            if (_activated)
                throw new InvalidOperationException();

            _activated = true;
            var dirPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Sites");
            var baseDir = new DirectoryInfo(dirPath);
            if (!baseDir.Exists)
                baseDir.Create();

            foreach (var dir in baseDir.GetDirectories())
            {
                var activator = HttpSiteActivator.Load(dir);
                _activators.Add(activator);
            }

            foreach (var activator in _activators)
                activator.Start();
        }
        public void Stop()
        {
            if (!_activated)
                return;

            _activated = false;
            foreach (var activator in _activators)
                activator.Stop();
        }
    }
}