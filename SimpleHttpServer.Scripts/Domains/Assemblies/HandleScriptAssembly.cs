using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;

namespace SimpleHttpServer.Scripts.Domains.Assemblies
{
    internal class HandleScriptAssembly : ScriptAssembly
    {
        public HandleScriptAssembly(ScriptDomain scriptDomain, string path)
            : base(scriptDomain, path)
        { }

        protected override Assembly LoadAssembly()
        {
            var content = File.ReadAllText(Path, Encoding.UTF8);
            var source = new string[] { content };
            var scriptEngines = ScriptDomain.ScriptEngines;
            var appScriptRefs = new List<string>() { scriptEngines.AppScriptDomain.PathToAssembly };
            if (scriptEngines.ApplicationDomain.IsEnabled)
            {
                appScriptRefs.Add(scriptEngines.ApplicationDomain.PathToAssembly);
            }
            var refAssemblies = scriptEngines.ReferencedAssemblyNames.Concat(appScriptRefs).Distinct().ToArray();
            var assemblyName = System.IO.Path.GetFileNameWithoutExtension(Path);
            var result = ScriptCompiler.CompileFromSource(source, refAssemblies, assemblyName);
            if (!result.Success)
            {
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Diagnostics));
            }
            return result.Assembly;
        }
    }
}
