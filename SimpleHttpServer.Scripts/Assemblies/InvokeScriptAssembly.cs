using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using SimpleHttpServer.Scripts.Assemblies.Metadata;

namespace SimpleHttpServer.Scripts.Assemblies
{
    internal abstract class InvokeScriptAssembly : ScriptAssembly
    {
        private ConcurrentDictionary<string, ScriptMetadata> _kvScriptAssembly = new ConcurrentDictionary<string, ScriptMetadata>(new PathComparer());
        private Func<string, ScriptMetadata> _assemblyFactory;

        public InvokeScriptAssembly(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            _assemblyFactory = new Func<string, ScriptMetadata>(CreateScriptMetadata);
        }

        protected ConcurrentDictionary<string, ScriptMetadata> ScriptAssemblys => _kvScriptAssembly;

        public abstract object CreateInstance(string path, string typename, params object[] args);

        protected abstract ScriptMetadata CreateScriptMetadata(string path);
        protected ScriptMetadata GetOrCreateScriptMetadata(string path)
        {
            return _kvScriptAssembly.GetOrAdd(path, _assemblyFactory);
        }
        protected string CorrectPath(string path)
        {
            return path.Contains(":") ? path : Path.Combine(ScriptEngines.BaseDirectory, path);
        }
        protected string CorrectTypeName(string path)
        {
            var right = path.Substring(ScriptEngines.BaseDirectory.Length + 1).Replace('\\', '.').Replace('-', '_');
            var name = Path.GetFileNameWithoutExtension(right);
            return ScriptEngines.Namespace + "." + name;
        }
        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    foreach (var sm in _kvScriptAssembly.Values)
                        sm.Dispose();

                    _kvScriptAssembly.Clear();

                    _kvScriptAssembly = null;
                    _assemblyFactory = null;
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
                if (x == y)
                    return true;
                if (x == null || y == null)
                    return false;

                return x.Equals(y, StringComparison.CurrentCultureIgnoreCase);
            }
            public int GetHashCode(string obj)
            {
                return obj == null ? 0 : obj.ToLower().GetHashCode();
            }
        }
    }
}
