using System;
using System.CodeDom.Compiler;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using LyxFramework.Log;

namespace SimpleHttpServer.Scripts.Assemblies.Metadata
{
    internal class WindowScriptMetadata : ScriptMetadata
    {
        internal const string WindowExtension = "Window";

        public WindowScriptMetadata(ScriptAssembly scriptAssembly, string path)
            : base(scriptAssembly, path)
        { }

        public string ScriptPath => Path + WindowScriptAssembly.ScriptExtension;

        private string CodeConverter(string str, string namespacename, string typename)
        {
            if (str == null)
                throw new ArgumentNullException(nameof(str));

            int index = 0;
            bool enterCode = false;
            char quotation = '\'';
            bool enterQuotation = false;
            var ctn = typename + WindowExtension;
            var sb = new StringBuilder(str.Length);
            var hasNamespace = !string.IsNullOrEmpty(namespacename);
            var tab = hasNamespace ? "    " : string.Empty;

            sb.Append("using System;").AppendLine();
            sb.Append("using System.Linq;").AppendLine();
            sb.Append("using System.Collections;").AppendLine();
            sb.Append("using System.Collections.Generic;").AppendLine();
            sb.Append("using SimpleHttpServer.Scripts;").AppendLine();
            sb.AppendLine();
            if (hasNamespace)
            {
                sb.Append("namespace ").Append(namespacename).AppendLine();
                sb.Append("{").AppendLine();
            }

            sb.Append(tab).Append("public sealed class ").Append(ctn).Append(" : ").AppendLine(typename);
            sb.Append(tab).Append("{").AppendLine();
            sb.Append(tab).Append("    public ").Append(ctn).AppendLine("(IScriptContext context)");
            sb.Append(tab).Append("        : base(context)").AppendLine();
            sb.Append(tab).Append("    { }").AppendLine();
            sb.AppendLine();
            sb.Append(tab).Append("    public sealed override void Invoke()").AppendLine();
            sb.Append(tab).Append("    {").AppendLine();
            sb.Append(tab).Append("        base.Invoke();").AppendLine();
            var tsb = new StringBuilder();
            while (index < str.Length)
            {
                if (!enterCode)
                {
                    if (!enterQuotation)
                    {
                        if (str[index] == '"' || str[index] == '\'')
                        {
                            enterQuotation = true;
                            quotation = str[index];
                            if (str[index] == '"')
                            {
                                tsb.Append('"');
                            }

                            tsb.Append(str[index]);
                        }
                        else if (str[index] == '<' && index + 1 < str.Length && str[index + 1] == '%')
                        {
                            enterCode = true;
                            index++;
                            if (tsb.Length > 0)
                            {
                                sb.Append(tab).Append("        Response.Write(@\"").Append(tsb.ToString()).AppendLine("\");");
                                tsb.Clear();
                            }
                        }
                        else
                        {
                            tsb.Append(str[index]);
                        }
                    }
                    else
                    {
                        if (str[index] == quotation)
                        {
                            enterQuotation = false;
                            if (str[index] == '"')
                            {
                                tsb.Append('"');
                            }
                            tsb.Append(str[index]);
                        }
                        else
                        {
                            if (str[index] == '"')
                            {
                                tsb.Append('"');
                            }
                            tsb.Append(str[index]);
                        }
                    }
                }
                else
                {
                    if (str[index] == '%' && index + 1 < str.Length && str[index + 1] == '>')
                    {
                        enterCode = false;
                        index++;
                        sb.AppendLine();
                    }
                    else
                    {
                        sb.Append(str[index]);
                    }
                }

                index++;
            }
            if (tsb.Length > 0)
            {
                sb.Append(tab).Append("        Response.Write(@\"").Append(tsb.ToString()).AppendLine("\");");
                tsb.Clear();
            }
            sb.Append(tab).Append("    }").AppendLine();
            sb.Append(tab).Append("}").AppendLine();
            if (hasNamespace)
            {
                sb.Append("}").AppendLine();
            }
            return sb.ToString();
        }

        protected override Assembly LoadAssembly()
        {
            var scriptEngines = ScriptAssembly.ScriptEngines;
            var right = Path.Substring(scriptEngines.BaseDirectory.Length + 1).Replace('\\', '.').Replace('-', '_');
            var left = System.IO.Path.GetFileNameWithoutExtension(right);
            var namespacename = scriptEngines.Namespace;
            var typename = left;
            var index = left.LastIndexOf('.');
            if (index > 0)
            {
                namespacename += "." + left.Substring(0, index);
                typename = left.Substring(index + 1);
            }

            var path = Path + WindowScriptAssembly.ScriptExtension;
            var script = File.ReadAllText(path, Encoding.UTF8);
            var html = File.ReadAllText(Path);
            html = CodeConverter(html, namespacename, typename);

            var appScriptRefs = new string[] { scriptEngines.AppScriptAssembly.PathToAssembly };
            var refAssemblies = scriptEngines.ReferencedAssemblyNames.Concat(appScriptRefs).Distinct().ToArray();
            var sources = new string[] { script, html };
            var result = ScriptCompiler.CompileFromSource(sources, refAssemblies);
            if (result.Errors.Count > 0)
            {
                LogManager.Debug.Log(typename + WindowExtension + WindowScriptAssembly.ScriptExtension);
                LogManager.Debug.Log(html);
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Errors.Cast<CompilerError>()));
            }
            return result.CompiledAssembly;
        }

        public override object CreateInstance(string typename, params object[] args)
        {
            CheckDisposed();

            typename += WindowExtension;
            return base.CreateInstance(typename, args);
        }
    }
}
