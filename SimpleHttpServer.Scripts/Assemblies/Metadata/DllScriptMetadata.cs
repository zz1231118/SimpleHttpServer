using System.Reflection;

namespace SimpleHttpServer.Scripts.Assemblies.Metadata
{
    internal class DllScriptMetadata : ScriptMetadata
    {
        public DllScriptMetadata(ScriptAssembly scriptAssembly, string path)
            : base(scriptAssembly, path)
        { }

        protected override Assembly LoadAssembly()
        {
            return Assembly.LoadFrom(Path);
        }
    }
}
