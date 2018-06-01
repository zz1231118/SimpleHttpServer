using System;
using System.CodeDom.Compiler;
using LyxFramework.Log;
using Microsoft.CSharp;

namespace SimpleHttpServer.Scripts
{
    public static class ScriptCompiler
    {
        public static CompilerResults CompileFromSource(string[] sources, string[] refAssemblies, string assemblyName = null, bool isDebug = false)
        {
            try
            {
                CodeDomProvider provider = new CSharpCodeProvider();
                CompilerParameters options = new CompilerParameters();
                options.GenerateInMemory = !isDebug;
                options.IncludeDebugInformation = isDebug;
                if (assemblyName != null)
                {
                    if (!assemblyName.EndsWith(".dll"))
                        assemblyName += ".dll";

                    options.OutputAssembly = assemblyName;
                }

                options.ReferencedAssemblies.Add("System.dll");
                options.ReferencedAssemblies.Add("System.Core.dll");
                options.ReferencedAssemblies.Add("System.Data.dll");
                options.ReferencedAssemblies.Add("System.Xml.dll");
                options.ReferencedAssemblies.Add("System.Xml.Linq.dll");
                options.ReferencedAssemblies.Add("Microsoft.CSharp.dll");
                options.ReferencedAssemblies.Add("System.Configuration.dll");
                options.ReferencedAssemblies.Add("System.Web.dll");
                //options.ReferencedAssemblies.Add("System.Windows.Forms.dll");
                //options.ReferencedAssemblies.Add("mscorlib.dll");
                
                foreach (var assembly in refAssemblies)
                {
                    if (!string.IsNullOrEmpty(assembly) && !options.ReferencedAssemblies.Contains(assembly))
                    {
                        options.ReferencedAssemblies.Add(assembly);
                    }
                }
                CompilerResults cr = provider.CompileAssemblyFromSource(options, sources);
                if (cr.Errors.HasErrors)
                {
                    string errStr = string.Format("Compile assembly:{0} error:", assemblyName);
                    foreach (CompilerError err in cr.Errors)
                    {
                        errStr += "\r\nFile:" + err.FileName + ", Line:" + err.Line + "\r\nMessage:" + err.ErrorText;
                    }

                    LogManager.Error.Log(errStr);
                }
                return cr;
            }
            catch (Exception ex)
            {
                LogManager.Error.Log("CompileCSharp script error:{0}", ex);
                throw ex;
            }
        }
        public static CompilerResults CompileFromFile(string[] paths, string[] refAssemblies, string assemblyName = null, bool isDebug = false)
        {
            try
            {
                CodeDomProvider provider = new CSharpCodeProvider();
                CompilerParameters options = new CompilerParameters();
                options.GenerateInMemory = false;
                options.IncludeDebugInformation = isDebug;
                if (assemblyName != null)
                {
                    if (!assemblyName.EndsWith(".dll"))
                        assemblyName += ".dll";

                    options.OutputAssembly = assemblyName;
                }

                options.ReferencedAssemblies.Add("System.dll");
                options.ReferencedAssemblies.Add("System.Core.dll");
                options.ReferencedAssemblies.Add("System.Data.dll");
                options.ReferencedAssemblies.Add("System.Xml.dll");
                options.ReferencedAssemblies.Add("System.Xml.Linq.dll");
                options.ReferencedAssemblies.Add("Microsoft.CSharp.dll");
                options.ReferencedAssemblies.Add("System.Configuration.dll");
                options.ReferencedAssemblies.Add("System.Web.dll");
                //options.ReferencedAssemblies.Add("System.Windows.Forms.dll");
                //options.ReferencedAssemblies.Add("mscorlib.dll");
                foreach (var assembly in refAssemblies)
                {
                    if (!string.IsNullOrEmpty(assembly) &&
                        !options.ReferencedAssemblies.Contains(assembly))
                    {
                        options.ReferencedAssemblies.Add(assembly);
                    }
                }

                CompilerResults cr = provider.CompileAssemblyFromFile(options, paths);
                if (cr.Errors.HasErrors)
                {
                    string errStr = string.Format("Compile assembly:{0} error:", assemblyName);
                    foreach (CompilerError err in cr.Errors)
                    {
                        errStr += "\r\nFile:" + err.FileName + ", Line:" + err.Line + "\r\nMessage:" + err.ErrorText;
                    }

                    LogManager.Error.Log(errStr);
                }
                else
                {
                    cr.PathToAssembly = assemblyName;
                }

                return cr;
            }
            catch (Exception ex)
            {
                LogManager.Error.Log("CompileCSharp script error:{0}", ex);
                throw ex;
            }
        }
    }
}
