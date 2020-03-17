using System.Reflection;

namespace SimpleHttpServer.Scripts.Domains.Assemblies
{
    internal class DllScriptAssembly : ScriptAssembly
    {
        public DllScriptAssembly(ScriptDomain scriptDomain, string path)
            : base(scriptDomain, path)
        { }

        protected override Assembly LoadAssembly()
        {
            return Assembly.LoadFrom(Path);
        }
    }
}
