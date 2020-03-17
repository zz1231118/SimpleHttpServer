using System;
using System.IO;
using System.Reflection;
using Framework;

namespace SimpleHttpServer.Web
{
    public class HttpSiteActivator : BaseDisposed
    {
        private AppDomain appDomain;
        private IHttpSite httpSite;
        private string name;

        private HttpSiteActivator()
        { }

        public string Name => name;

        private static Assembly AppDomain_AssemblyResolve(object sender, ResolveEventArgs e)
        {
            if (e.Name.Contains(","))
            {
                var name = e.Name.Split(',')[0];
                return Assembly.Load(e.Name);
            }

            return null;
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
            var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;
            var setup = new AppDomainSetup();
            setup.ApplicationBase = dir.FullName;
            //setup.PrivateBinPath = (baseDirectory.EndsWith(Path.DirectorySeparatorChar.ToString()) ? baseDirectory.TrimEnd(Path.DirectorySeparatorChar) : baseDirectory) + Path.PathSeparator;

            var appDomain = AppDomain.CreateDomain(dir.Name + "-AppDomain", null, setup);
            //appDomain.AssemblyResolve += new ResolveEventHandler(AppDomain_AssemblyResolve);
            var assemblyName = typeof(HttpSiteLoader).Assembly.FullName;
            var typeName = typeof(HttpSiteLoader).FullName;
            var obj = appDomain.CreateInstanceAndUnwrap(assemblyName, typeName);
            var loader = (HttpSiteLoader)obj;

            try
            {
                var activator = new HttpSiteActivator();
                activator.name = dir.Name;
                activator.appDomain = appDomain;
                activator.httpSite = loader.Load(dir.FullName);
                return activator;
            }
            catch
            {
                Unload(appDomain);
                throw;
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    if (httpSite.IsActivated)
                        httpSite.Stop();

                    Unload(appDomain);
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        public void Start()
        {
            CheckDisposed();
            httpSite.Start();
        }

        public void Stop()
        {
            CheckDisposed();
            httpSite.Stop();
        }
    }
}
