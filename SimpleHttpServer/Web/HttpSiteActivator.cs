using System;
using System.IO;
using LyxFramework.Utility;

namespace SimpleHttpServer.Web
{
    public class HttpSiteActivator : BaseDisposed
    {
        private AppDomain _appDomain;
        private IHttpSite _httpSite;

        private HttpSiteActivator(AppDomain appDomain, IHttpSite httpSite)
        {
            _appDomain = appDomain;
            _httpSite = httpSite;
        }

        private static void Unload(AppDomain appDomain)
        {
            try
            {
                if (!appDomain.IsFinalizingForUnload())
                    AppDomain.Unload(appDomain);
            }
            catch (CannotUnloadAppDomainException ex)
            {
                var type = ex.GetType();
                var a = ex;
            }
        }

        public static HttpSiteActivator Load(DirectoryInfo dir)
        {
            var setup = new AppDomainSetup();
            setup.ApplicationBase = dir.FullName;
            var appDomain = AppDomain.CreateDomain(dir.Name + "-AppDomain", null, setup);
            var assemblyName = typeof(HttpSiteLoader).Assembly.FullName;
            var typeName = typeof(HttpSiteLoader).FullName;
            var obj = appDomain.CreateInstanceAndUnwrap(assemblyName, typeName);
            var loader = (HttpSiteLoader)obj;

            try
            {
                var httpSite = loader.Load(dir.FullName);
                return new HttpSiteActivator(appDomain, httpSite);
            }
            catch
            {
                Unload(appDomain);
                throw;
            }
        }
        public void Start()
        {
            CheckDisposed();
            _httpSite.Start();
        }
        public void Stop()
        {
            CheckDisposed();
            _httpSite.Stop();
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    if (_httpSite.Activated)
                        _httpSite.Stop();

                    Unload(_appDomain);
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }
    }
}
