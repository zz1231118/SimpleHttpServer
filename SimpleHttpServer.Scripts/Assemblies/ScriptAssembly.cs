using System.IO;
using LyxFramework.Utility;

namespace SimpleHttpServer.Scripts.Assemblies
{
    internal abstract class ScriptAssembly : BaseDisposed
    {
        private ScriptEngines _scriptEngines;
        private FileSystemWatcher _watcher;
        private string _baseDirectory;

        public ScriptAssembly(ScriptEngines scriptEngines, string baseDirectory)
        {
            _scriptEngines = scriptEngines;
            _baseDirectory = baseDirectory;

            _watcher = new FileSystemWatcher(baseDirectory, Filter);
            _watcher.IncludeSubdirectories = true;
            _watcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite;
            _watcher.Changed += new FileSystemEventHandler(WatcherChanged);
            _watcher.EnableRaisingEvents = true;
        }

        public abstract string Extension { get; }
        public abstract string Filter { get; }
        public ScriptEngines ScriptEngines => _scriptEngines;
        public string BaseDirectory => _baseDirectory;

        protected abstract void WatcherChanged(object sender, FileSystemEventArgs e);
        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    _watcher.Dispose();

                    _scriptEngines = null;
                    _watcher = null;
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }
    }
}
