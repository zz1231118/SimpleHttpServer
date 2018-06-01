using System.IO;
using SimpleHttpServer.Scripts.Assemblies.Metadata;

namespace SimpleHttpServer.Scripts.Assemblies
{
    internal class WindowScriptAssembly : InvokeScriptAssembly
    {
        internal const string ScriptExtension = ".cs";
        private FileSystemWatcher _watcher;

        public WindowScriptAssembly(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            _watcher = new FileSystemWatcher(baseDirectory, "*" + ScriptExtension);
            _watcher.IncludeSubdirectories = true;
            _watcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite;
            _watcher.Changed += new FileSystemEventHandler(WatcherChanged);
            _watcher.EnableRaisingEvents = true;
        }

        public override string Extension => ".aspx";
        public override string Filter => "*" + Extension;

        protected override ScriptMetadata CreateScriptMetadata(string path)
        {
            if (!File.Exists(path))
                throw new FileNotFoundException(path);

            return new WindowScriptMetadata(this, path);
        }
        protected override void WatcherChanged(object sender, FileSystemEventArgs e)
        {
            var path = e.FullPath;
            var extension = Path.GetExtension(e.FullPath);
            if (extension == ScriptExtension)
            {
                if (e.FullPath.StartsWith(ScriptEngines.AppScriptAssembly.BaseDirectory, System.StringComparison.CurrentCultureIgnoreCase))
                {
                    //AppScript 剔除
                    return;
                }

                var index = path.LastIndexOf('.');
                path = path.Substring(0, index);
            }

            ScriptMetadata metadata;
            if (e.ChangeType == WatcherChangeTypes.Renamed)
            {
                ScriptAssemblys.TryRemove(path, out metadata);
            }
            else if (ScriptAssemblys.TryGetValue(path, out metadata))
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
                    _watcher.Dispose();
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
