using System;
using System.Reflection;
using LyxFramework.Utility;
using SimpleHttpServer.Scripts.Utility;

namespace SimpleHttpServer.Scripts.Assemblies.Metadata
{
    internal abstract class ScriptMetadata : BaseDisposed
    {
        private ScriptAssembly _scriptAssembly;
        private UnLazy<Assembly> _lazyAssembly;
        private string _path;

        public ScriptMetadata(ScriptAssembly scriptAssembly, string path)
        {
            _scriptAssembly = scriptAssembly;
            _path = path;

            _lazyAssembly = new UnLazy<Assembly>(LoadAssembly);
        }

        public ScriptAssembly ScriptAssembly => _scriptAssembly;
        public Assembly Assembly
        {
            get
            {
                try
                {
                    return _lazyAssembly.Value;
                }
                catch
                {
                    _lazyAssembly.Clean();
                    throw;
                }
            }
        }
        public string Path => _path;

        protected abstract Assembly LoadAssembly();
        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    _lazyAssembly.Dispose();

                    _scriptAssembly = null;
                    _lazyAssembly = null;
                    _path = null;
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

            var type = Assembly.GetType(typename, false, true);
            if (type == null)
                throw new ArgumentException("not found type:" + typename);

            return Activator.CreateInstance(type, args);
        }
        public void Reset()
        {
            CheckDisposed();

            _lazyAssembly.Clean();
        }
    }
}
