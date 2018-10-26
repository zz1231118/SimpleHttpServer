using System.IO;
using System.Reflection;
using LyxFramework.Log;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web.Bundles;

namespace SimpleHttpServer.Scripts
{
    public class ScriptBundleActivator : BundleActivator
    {
        private const string ScriptProperty = "Script";
        private ScriptEngines scriptEngines;

        protected override void OnInitialize()
        {
            base.OnInitialize();
            ContentTypes.SetContentType(".ashx", "text/plain");
            ContentTypes.SetContentType(".aspx", "text/html");
            scriptEngines = new ScriptEngines(Site, Config);
            scriptEngines.AddSysReferencedAssembly(Assembly.GetExecutingAssembly().Location);
            scriptEngines.AddSysReferencedAssembly(typeof(BundleActivator).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly(typeof(LogManager).Assembly.Location);
            scriptEngines.AddSysReferencedAssembly("System.ServiceModel.dll");
            scriptEngines.AddSysReferencedAssembly("System.Runtime.Serialization.dll");
            scriptEngines.Initialize();
        }

        protected override void OnStart()
        {
            scriptEngines.Start();

            var globalPath = Path.Combine(Site.BaseDirectory, ScriptEngines.GlobalScript);
            if (File.Exists(globalPath))
            {
                var obj = scriptEngines.CreateInstance(globalPath, null);
                Application.Current = obj as Application;
            }
            else
            {
                Application.Current = new App();
            }

            Application.Current.BaseDirectory = Site.BaseDirectory;
            Application.Current.Site = Site;
            Application.Current.ScriptEngines = scriptEngines;
            Application.Current.OnStartup();
        }

        protected override void OnStop()
        {
            scriptEngines.Close();
        }
    }
}
