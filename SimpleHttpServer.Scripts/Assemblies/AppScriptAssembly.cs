using System;
using System.CodeDom.Compiler;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using SimpleHttpServer.Scripts.Utility;

namespace SimpleHttpServer.Scripts.Assemblies
{
    internal class AppScriptAssembly : ScriptAssembly
    {
        internal const string AssemblyName = "AppScript";

        private UnLazy<Assembly> _lazyAssembly;
        private string _pathToAssembly;

        public AppScriptAssembly(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            _lazyAssembly = new UnLazy<Assembly>(LoadAssembly);

            var site = scriptEngines.Site;
            _pathToAssembly = Path.Combine(baseDirectory, AssemblyName + ".dll");
            if (!Directory.Exists(baseDirectory))
                Directory.CreateDirectory(baseDirectory);
        }

        public override string Extension => ".cs";
        public override string Filter => "*" + Extension;
        public Assembly Assembly
        {
            get
            {
                try
                {
                    return _lazyAssembly.Value;
                }
                catch
                {
                    _lazyAssembly.Clean();
                    throw;
                }
            }
        }
        public string PathToAssembly
        {
            get
            {
                var assembly = Assembly;
                return _pathToAssembly;
            }
        }

        protected override void WatcherChanged(object sender, FileSystemEventArgs e)
        {
            _lazyAssembly.Clean();
        }
        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    _lazyAssembly.Dispose();

                    _lazyAssembly = null;
                    _pathToAssembly = null;
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
            var result = ScriptCompiler.CompileFromFile(paths, refAssemblies, _pathToAssembly, false);
            if (result.Errors.Count > 0)
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Errors.Cast<CompilerError>()));

            return result.CompiledAssembly;
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
                    yield return script;
            }
        }
    }
}
