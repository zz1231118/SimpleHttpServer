using System;
using System.CodeDom.Compiler;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;

namespace SimpleHttpServer.Scripts.Assemblies.Metadata
{
    internal class HandleScriptMetadata : ScriptMetadata
    {
        public HandleScriptMetadata(ScriptAssembly scriptAssembly, string path)
            : base(scriptAssembly, path)
        { }

        protected override Assembly LoadAssembly()
        {
            var str = File.ReadAllText(Path, Encoding.UTF8);
            var source = new string[] { str };
            var scriptEngines = ScriptAssembly.ScriptEngines;
            var appScriptRefs = new string[] { scriptEngines.AppScriptAssembly.PathToAssembly };
            var refAssemblies = scriptEngines.ReferencedAssemblyNames.Concat(appScriptRefs).Distinct().ToArray();
            var result = ScriptCompiler.CompileFromSource(source, refAssemblies);
            if (result.Errors.Count > 0)
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Errors.Cast<CompilerError>()));

            return result.CompiledAssembly;
        }
    }
}
