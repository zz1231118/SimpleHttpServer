using System;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;

namespace SimpleHttpServer.Scripts.Domains
{
    internal class ApplicationDomain : ScriptDomain
    {
        public const string AssemblyName = "Application";

        private Utility.Lazy<Assembly> lazyAssembly;
        private string pathToAssembly;

        public ApplicationDomain(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            lazyAssembly = new Utility.Lazy<Assembly>(LoadAssembly);

            var site = scriptEngines.Site;
            pathToAssembly = Path.Combine(scriptEngines.RuntimeDirectory, AssemblyName + ".dll");
        }

        public override string Extension => ScriptEngines.GlobalExtension;
        public string FullName => Path.Combine(ScriptEngines.BaseDirectory, ScriptEngines.GlobalScript);
        public bool IsEnabled => File.Exists(FullName);

        public Assembly Assembly
        {
            get
            {
                try
                {
                    return lazyAssembly.Value;
                }
                catch
                {
                    lazyAssembly.Clean();
                    throw;
                }
            }
        }

        public string PathToAssembly
        {
            get
            {
                _ = Assembly;
                return pathToAssembly;
            }
        }

        private Assembly LoadAssembly()
        {
            var path = FullName;
            if (!File.Exists(path))
            {
                throw new FileNotFoundException(path);
            }

            var content = File.ReadAllText(path, Encoding.UTF8);
            var source = new string[] { content };
            var appScriptRefs = new string[] { ScriptEngines.AppScriptDomain.PathToAssembly };
            var refAssemblies = ScriptEngines.ReferencedAssemblyNames.Concat(appScriptRefs).ToArray();
            var pathDirectory = System.IO.Path.GetDirectoryName(pathToAssembly);
            var result = ScriptCompiler.CompileFromSource(source, refAssemblies, AssemblyName, pathDirectory, false);
            if (!result.Success)
            {
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Diagnostics));
            }

            return result.Assembly;
        }

        public Application CreateApplication()
        {
            if (!IsEnabled)
            {
                return new App();
            }

            var typename = ScriptEngines.Namespace + "." + ScriptEngines.GlobalName;
            var type = Assembly.GetType(typename, true, true);
            return Activator.CreateInstance(type, null) as Application;
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    lazyAssembly.Dispose();

                    lazyAssembly = null;
                    pathToAssembly = null;
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        class App : Application
        { }
    }
}
