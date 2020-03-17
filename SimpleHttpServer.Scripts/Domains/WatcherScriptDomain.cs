using System.IO;

namespace SimpleHttpServer.Scripts.Domains
{
    internal abstract class WatcherScriptDomain : ScriptDomain
    {
        private FileSystemWatcher watcher;

        public WatcherScriptDomain(ScriptEngines scriptEngines, string baseDirectory)
            : base(scriptEngines, baseDirectory)
        {
            watcher = new FileSystemWatcher(baseDirectory, Filter);
            watcher.IncludeSubdirectories = true;
            watcher.NotifyFilter = NotifyFilters.FileName | NotifyFilters.LastWrite;
            watcher.Changed += new FileSystemEventHandler(WatcherChanged);
            watcher.EnableRaisingEvents = true;
        }

        public abstract string Filter { get; }

        protected abstract void WatcherChanged(object sender, FileSystemEventArgs e);

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    watcher.Dispose();

                    watcher = null;
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }
    }
}
