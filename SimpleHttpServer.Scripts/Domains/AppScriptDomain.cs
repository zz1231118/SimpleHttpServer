using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;

namespace SimpleHttpServer.Scripts.Domains
{
    internal class AppScriptDomain : WatcherScriptDomain
    {
        internal const string AssemblyName = "AppScript";

        private Utility.Lazy<Assembly> lazyAssembly;
        private string pathToAssembly;

        public AppScriptDomain(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            lazyAssembly = new Utility.Lazy<Assembly>(this.LoadAssembly);

            var site = scriptEngines.Site;
            pathToAssembly = Path.Combine(scriptEngines.RuntimeDirectory, AssemblyName + ".dll");
            if (!Directory.Exists(baseDirectory))
            {
                Directory.CreateDirectory(baseDirectory);
            }
        }

        public override string Extension => ".cs";

        public override string Filter => "*" + Extension;

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

        protected override void WatcherChanged(object sender, FileSystemEventArgs e)
        {
            lazyAssembly.Clean();
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

        private Assembly LoadAssembly()
        {
            var paths = GetScriptPaths(BaseDirectory).ToArray();
            var refAssemblies = ScriptEngines.ReferencedAssemblyNames.ToArray();
            var pathDirectory = System.IO.Path.GetDirectoryName(pathToAssembly);
            var result = ScriptCompiler.CompileFromFile(paths, refAssemblies, AssemblyName, pathDirectory, false);
            if (!result.Success)
            {
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Diagnostics));
            }
            return result.Assembly;
        }

        private IEnumerable<string> GetScriptPaths(string dirPath)
        {
            foreach (var path in Directory.GetFiles(dirPath, Filter))
            {
                yield return path;
            }
            foreach (var path in Directory.GetDirectories(dirPath))
            {
                foreach (var script in GetScriptPaths(path))
                {
                    yield return script;
                }
            }
        }
    }
}
