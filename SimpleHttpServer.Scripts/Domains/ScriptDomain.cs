using System.IO;
using Framework;

namespace SimpleHttpServer.Scripts.Domains
{
    internal abstract class ScriptDomain : BaseDisposed
    {
        private ScriptEngines scriptEngines;
        private string baseDirectory;

        public ScriptDomain(ScriptEngines scriptEngines, string baseDirectory)
        {
            this.scriptEngines = scriptEngines;
            this.baseDirectory = baseDirectory;
        }

        public abstract string Extension { get; }
        
        public ScriptEngines ScriptEngines => scriptEngines;

        public string BaseDirectory => baseDirectory;

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                scriptEngines = null;
            }
        }
    }
}
