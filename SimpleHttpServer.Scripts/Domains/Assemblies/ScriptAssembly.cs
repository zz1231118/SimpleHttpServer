using System;
using System.Reflection;
using Framework;
using SimpleHttpServer.Scripts.Utility;

namespace SimpleHttpServer.Scripts.Domains.Assemblies
{
    internal abstract class ScriptAssembly : BaseDisposed
    {
        private ScriptDomain scriptDomain;
        private Utility.Lazy<Assembly> lazyAssembly;
        private string path;

        public ScriptAssembly(ScriptDomain scriptDomain, string path)
        {
            this.scriptDomain = scriptDomain;
            this.path = path;

            lazyAssembly = new Utility.Lazy<Assembly>(this.LoadAssembly);
        }

        public ScriptDomain ScriptDomain => scriptDomain;

        public Assembly Assembly
        {
            get
            {
                try
                {
                    return lazyAssembly.Value;
                }
                catch
                {
                    lazyAssembly.Clean();
                    throw;
                }
            }
        }

        public string Path => path;

        protected abstract Assembly LoadAssembly();

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    lazyAssembly.Dispose();

                    scriptDomain = null;
                    lazyAssembly = null;
                    path = null;
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        public virtual object CreateInstance(string typename, params object[] args)
        {
            CheckDisposed();

            var type = Assembly.GetType(typename, true, true);
            return Activator.CreateInstance(type, args);
        }

        public void Reset()
        {
            CheckDisposed();

            lazyAssembly.Clean();
        }
    }
}
