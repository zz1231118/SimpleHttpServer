using System;
using System.IO;
using SimpleHttpServer.Scripts.Assemblies.Metadata;

namespace SimpleHttpServer.Scripts.Assemblies
{
    internal class HandleScriptAssembly : InvokeScriptAssembly
    {
        public const string DefaultScriptAssembly = "Scripts.dll";
        public const string DebugScriptAssemblyProperty = "DebugScriptAssembly";

        private ScriptMetadata _debugScriptAssembly;

        public HandleScriptAssembly(ScriptEngines scriptDomain, string baseDirectory)
            : base(scriptDomain, baseDirectory)
        {
            if (ScriptEngines.IsDebug)
            {
                var scriptAssemblyName = ScriptEngines.Conf.GetString(DebugScriptAssemblyProperty, DefaultScriptAssembly);
                var scriptAssemblyPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, scriptAssemblyName);
                _debugScriptAssembly = new DllScriptMetadata(this, scriptAssemblyPath);
            }
        }

        public override string Extension => ScriptEngines.HandleExtension;
        public override string Filter => "*" + Extension;

        protected override ScriptMetadata CreateScriptMetadata(string path)
        {
            if (!File.Exists(path))
                throw new FileNotFoundException(path);

            return new HandleScriptMetadata(this, path);
        }
        protected override void WatcherChanged(object sender, FileSystemEventArgs e)
        {
            ScriptMetadata metadata;
            if (e.ChangeType == WatcherChangeTypes.Renamed)
            {
                ScriptAssemblys.TryRemove(e.FullPath, out metadata);
            }
            else if (ScriptAssemblys.TryGetValue(e.FullPath, out metadata))
            {
                metadata.Reset();
            }
        }
        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    if (_debugScriptAssembly != null)
                    {
                        _debugScriptAssembly.Dispose();

                        _debugScriptAssembly = null;
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
            var metadata = ScriptEngines.IsDebug && _debugScriptAssembly != null ? _debugScriptAssembly : GetOrCreateScriptMetadata(path);
            return metadata.CreateInstance(typename, args);
        }
    }
}
