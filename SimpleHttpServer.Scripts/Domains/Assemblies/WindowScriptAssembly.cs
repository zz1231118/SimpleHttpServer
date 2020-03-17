using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using Framework.Log;

namespace SimpleHttpServer.Scripts.Domains.Assemblies
{
    internal class WindowScriptAssembly : ScriptAssembly
    {
        internal const string WindowExtension = "Window";

        private readonly ILogger logger = Logger.GetLogger<WindowScriptAssembly>();

        public WindowScriptAssembly(ScriptDomain scriptDomain, string path)
            : base(scriptDomain, path)
        { }

        public string ScriptPath => Path + ScriptEngines.ScriptExtension;

        private string CodeConverter(string str, string namespacename, string typename)
        {
            if (str == null)
                throw new ArgumentNullException(nameof(str));

            bool isEnterCode = false;
            bool isEnterQuotation = false;

            var index = 0;
            var quotation = '\'';
            var ctn = typename + WindowExtension;
            var sb = new StringBuilder(str.Length);
            var isThereNamespace = !string.IsNullOrEmpty(namespacename);
            var tab = isThereNamespace ? "    " : string.Empty;

            sb.Append("using System;").AppendLine();
            sb.Append("using System.Linq;").AppendLine();
            sb.Append("using System.Collections;").AppendLine();
            sb.Append("using System.Collections.Generic;").AppendLine();
            sb.Append("using SimpleHttpServer.Scripts;").AppendLine();
            sb.AppendLine();
            if (isThereNamespace)
            {
                sb.Append("namespace ").Append(namespacename).AppendLine();
                sb.Append("{").AppendLine();
            }

            sb.Append(tab).Append("public sealed class ").Append(ctn).Append(" : ").AppendLine(typename);
            sb.Append(tab).Append("{").AppendLine();
            sb.Append(tab).Append("    public sealed override void Invoke()").AppendLine();
            sb.Append(tab).Append("    {").AppendLine();
            sb.Append(tab).Append("        base.Invoke();").AppendLine();
            var tsb = new StringBuilder();
            while (index < str.Length)
            {
                if (!isEnterCode)
                {
                    if (!isEnterQuotation)
                    {
                        if (str[index] == '"' || str[index] == '\'')
                        {
                            isEnterQuotation = true;
                            quotation = str[index];
                            if (str[index] == '"')
                            {
                                tsb.Append('"');
                            }

                            tsb.Append(str[index]);
                        }
                        else if (str[index] == '<' && index + 1 < str.Length && str[index + 1] == '%')
                        {
                            index++;
                            isEnterCode = true;
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
                            isEnterQuotation = false;
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
                        isEnterCode = false;
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
            if (isThereNamespace)
            {
                sb.Append("}").AppendLine();
            }
            return sb.ToString();
        }

        protected override Assembly LoadAssembly()
        {
            var scriptEngines = ScriptDomain.ScriptEngines;
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
            if (typename.Length > 0 && char.IsLower(typename[0]))
            {
                typename = char.ToUpper(typename[0]) + typename.Substring(1, typename.Length - 1);
            }

            var path = Path + ScriptEngines.ScriptExtension;
            var script = File.ReadAllText(path, Encoding.UTF8);
            var html = File.ReadAllText(Path);
            html = CodeConverter(html, namespacename, typename);

            var appScriptRefs = new List<string>() { scriptEngines.AppScriptDomain.PathToAssembly };
            if (scriptEngines.ApplicationDomain.IsEnabled)
            {
                appScriptRefs.Add(scriptEngines.ApplicationDomain.PathToAssembly);
            }
            var refAssemblies = scriptEngines.ReferencedAssemblyNames.Concat(appScriptRefs).Distinct().ToArray();
            var sources = new string[] { script, html };
            var assemblyName = System.IO.Path.GetFileNameWithoutExtension(Path);
            var result = ScriptCompiler.CompileFromSource(sources, refAssemblies, assemblyName);
            if (!result.Success)
            {
                logger.Debug(typename + WindowExtension + ScriptEngines.ScriptExtension);
                logger.Debug(html);
                throw new InvalidOperationException("compile error:" + string.Join(Environment.NewLine, result.Diagnostics));
            }
            return result.Assembly;
        }

        public override object CreateInstance(string typename, params object[] args)
        {
            CheckDisposed();

            typename += WindowExtension;
            return base.CreateInstance(typename, args);
        }
    }
}
