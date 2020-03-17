using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using SimpleHttpServer.Scripts.Domains.Assemblies;

namespace SimpleHttpServer.Scripts.Domains
{
    internal abstract class InvokeScriptDomain : WatcherScriptDomain
    {
        private ConcurrentDictionary<string, ScriptAssembly> scriptAssemblies = new ConcurrentDictionary<string, ScriptAssembly>(new PathComparer());
        private Func<string, ScriptAssembly> assemblyFactory;

        public InvokeScriptDomain(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            assemblyFactory = new Func<string, ScriptAssembly>(CreateScriptAssembly);
        }

        protected ConcurrentDictionary<string, ScriptAssembly> ScriptAssemblies => scriptAssemblies;

        public abstract object CreateInstance(string path, string typename, params object[] args);

        protected abstract ScriptAssembly CreateScriptAssembly(string path);

        protected ScriptAssembly GetOrCreateScriptMetadata(string path)
        {
            return scriptAssemblies.GetOrAdd(path, assemblyFactory);
        }

        protected string CorrectPath(string path)
        {
            return path.Contains(":") ? path : Path.Combine(ScriptEngines.BaseDirectory, path);
        }

        protected string CorrectTypeName(string path)
        {
            var baseDirectory = ScriptEngines.BaseDirectory;
            var endSentinel = baseDirectory.EndsWith("\\") ? 0 : 1;
            var right = path.Substring(ScriptEngines.BaseDirectory.Length + endSentinel).Replace('\\', '.').Replace('-', '_');
            var name = Path.GetFileNameWithoutExtension(right);
            return ScriptEngines.Namespace + "." + name;
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    foreach (var sm in scriptAssemblies.Values)
                    {
                        sm.Dispose();
                    }

                    scriptAssemblies.Clear();

                    scriptAssemblies = null;
                    assemblyFactory = null;
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        class PathComparer : IEqualityComparer<string>
        {
            public bool Equals(string x, string y)
            {
                if (x == y) return true;
                if (x == null || y == null) return false;

                return x.Equals(y, StringComparison.CurrentCultureIgnoreCase);
            }

            public int GetHashCode(string obj)
            {
                return obj == null ? 0 : obj.ToLower().GetHashCode();
            }
        }
    }
}
