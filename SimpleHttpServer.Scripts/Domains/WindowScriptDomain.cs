using System.IO;
using SimpleHttpServer.Scripts.Domains.Assemblies;

namespace SimpleHttpServer.Scripts.Domains
{
    internal class WindowScriptDomain : InvokeScriptDomain
    {
        private FileSystemWatcher watcher;

        public WindowScriptDomain(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            watcher = new FileSystemWatcher(baseDirectory, "*" + ScriptEngines.ScriptExtension);
            watcher.IncludeSubdirectories = true;
            watcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite;
            watcher.Changed += new FileSystemEventHandler(WatcherChanged);
            watcher.EnableRaisingEvents = true;
        }

        public override string Extension => ScriptEngines.WindowExtension;

        public override string Filter => "*" + Extension;

        protected override ScriptAssembly CreateScriptAssembly(string path)
        {
            if (!File.Exists(path))
                throw new FileNotFoundException(path);

            return new WindowScriptAssembly(this, path);
        }

        protected override void WatcherChanged(object sender, FileSystemEventArgs e)
        {
            var path = e.FullPath;
            var extension = Path.GetExtension(e.FullPath);
            if (extension == ScriptEngines.ScriptExtension)
            {
                if (e.FullPath.StartsWith(ScriptEngines.AppScriptDomain.BaseDirectory, System.StringComparison.CurrentCultureIgnoreCase))
                {
                    //AppScript 剔除
                    return;
                }

                var index = path.LastIndexOf('.');
                path = path.Substring(0, index);
            }

            ScriptAssembly assembly;
            if (e.ChangeType == WatcherChangeTypes.Renamed)
            {
                ScriptAssemblies.TryRemove(path, out assembly);
            }
            else if (ScriptAssemblies.TryGetValue(path, out assembly))
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
                    watcher.Dispose();
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

            var metadata = GetOrCreateScriptMetadata(path);
            return metadata.CreateInstance(typename, args);
        }
    }
}
