using System;
using System.IO;
using SimpleHttpServer.Scripts.Domains.Assemblies;

namespace SimpleHttpServer.Scripts.Domains
{
    internal class HandleScriptDomain : InvokeScriptDomain
    {
        public const string DefaultScriptAssembly = "Scripts.dll";
        public const string DebugScriptAssemblyProperty = "DebugScriptAssembly";

        private ScriptAssembly debugScriptAssembly;

        public HandleScriptDomain(ScriptEngines scriptDomain, string baseDirectory)
            : base(scriptDomain, baseDirectory)
        {
            if (ScriptEngines.IsDebug)
            {
                var scriptAssemblyName = ScriptEngines.Conf.GetString(DebugScriptAssemblyProperty, DefaultScriptAssembly);
                var scriptAssemblyPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, scriptAssemblyName);
                debugScriptAssembly = new DllScriptAssembly(this, scriptAssemblyPath);
            }
        }

        public override string Extension => ScriptEngines.HandleExtension;

        public override string Filter => "*" + Extension;

        protected override ScriptAssembly CreateScriptAssembly(string path)
        {
            if (!File.Exists(path))
                throw new FileNotFoundException(path);

            return new HandleScriptAssembly(this, path);
        }

        protected override void WatcherChanged(object sender, FileSystemEventArgs e)
        {
            ScriptAssembly assembly;
            if (e.ChangeType == WatcherChangeTypes.Renamed)
            {
                ScriptAssemblies.TryRemove(e.FullPath, out assembly);
            }
            else if (ScriptAssemblies.TryGetValue(e.FullPath, out assembly))
            {
                assembly.Reset();
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    var scriptAssembly = debugScriptAssembly;
                    if (scriptAssembly != null)
                    {
                        debugScriptAssembly = null;
                        scriptAssembly.Dispose();
                    }
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        public override object CreateInstance(string path, string typename, params object[] args)
        {
            CheckDisposed();

            path = CorrectPath(path);
            typename = typename ?? CorrectTypeName(path);
            var metadata = ScriptEngines.IsDebug && debugScriptAssembly != null ? debugScriptAssembly : GetOrCreateScriptMetadata(path);
            return metadata.CreateInstance(typename, args);
        }
    }
}
