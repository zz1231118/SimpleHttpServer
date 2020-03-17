using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using Framework.Log;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.Emit;

namespace SimpleHttpServer.Scripts
{
    internal static class ScriptCompiler
    {
        private static readonly ILogger logger = Logger.GetLogger(nameof(ScriptCompiler));

        private static byte[] ReadToEnd(Stream stream)
        {
            var count = checked((int)(stream.Length - stream.Position));
            var bytes = new byte[count];
            var offset = 0;

            int length;
            while ((length = stream.Read(bytes, 0, count)) > 0)
            {
                offset += length;
                count -= length;
            }
            return bytes;
        }

        public static CompileAssemblyResult CompileFromSource(string[] sources, string[] refAssemblies, string assemblyName, string output = null, bool isDebug = false)
        {
            if (sources == null)
                throw new ArgumentNullException(nameof(sources));
            if (refAssemblies == null)
                throw new ArgumentNullException(nameof(refAssemblies));
            if (assemblyName == null)
                throw new ArgumentNullException(nameof(assemblyName));

            try
            {
                var references = new List<MetadataReference>();
                var trees = new List<SyntaxTree>();
                foreach (var refAssemby in refAssemblies)
                {
                    var metadataReference = MetadataReference.CreateFromFile(refAssemby);
                    references.Add(metadataReference);
                }
                foreach (var source in sources)
                {
                    trees.Add(SyntaxFactory.ParseSyntaxTree(source));
                }
                var compilation = CSharpCompilation.Create(assemblyName)
                    .WithOptions(new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary))
                    .WithReferences(references)
                    .AddSyntaxTrees(trees);

                EmitResult emitResult;
                if (output != null)
                {
                    var dllPath = System.IO.Path.Combine(output, assemblyName + ".dll");
                    var pdbPath = System.IO.Path.Combine(output, assemblyName + ".pdb");
                    using (var dllStream = new System.IO.FileStream(dllPath, FileMode.Create, FileAccess.ReadWrite))
                    using (var pdbStream = new System.IO.FileStream(pdbPath, FileMode.Create, FileAccess.ReadWrite))
                        emitResult = compilation.Emit(dllStream, pdbStream);

                    if (emitResult.Success)
                    {
                        var assembly = Assembly.LoadFile(dllPath);
                        return new CompileAssemblyResult(true, emitResult.Diagnostics, assembly);
                    }
                }
                else
                {
                    var dllStream = new MemoryStream();
                    var pdbStream = new MemoryStream();
                    try
                    {
                        emitResult = compilation.Emit(dllStream, pdbStream);
                        if (emitResult.Success)
                        {
                            dllStream.Position = 0;
                            pdbStream.Position = 0;
                            var rawAssembly = ReadToEnd(dllStream);
                            var rawSymbolStore = ReadToEnd(pdbStream);
                            var assembly = Assembly.Load(rawAssembly, rawSymbolStore);
                            return new CompileAssemblyResult(true, emitResult.Diagnostics, assembly);
                        }
                    }
                    finally
                    {
                        dllStream.Dispose();
                        pdbStream.Dispose();
                    }
                }

                var sb = new System.Text.StringBuilder();
                sb.AppendFormat("Compile assembly:{0} error:", assemblyName);
                sb.AppendLine();
                foreach (var diagnostic in emitResult.Diagnostics)
                {
                    sb.AppendFormat("location: {0} message:{1}", diagnostic.Location, diagnostic.GetMessage());
                    sb.AppendLine();
                }
                logger.Error(sb.ToString());
                return new CompileAssemblyResult(false, emitResult.Diagnostics, null);
            }
            catch (Exception ex)
            {
                logger.Error("CompileCSharp script error:{0}", ex);
                throw ex;
            }
        }

        public static CompileAssemblyResult CompileFromFile(string[] paths, string[] refAssemblies, string assemblyName, string output = null, bool isDebug = false)
        {
            var sources = new List<string>();
            foreach (var path in paths)
            {
                var source = System.IO.File.ReadAllText(path, System.Text.Encoding.UTF8);
                sources.Add(source);
            }
            return CompileFromSource(sources.ToArray(), refAssemblies, assemblyName, output, isDebug);
        }
    }

    internal class CompileAssemblyResult
    {
        public CompileAssemblyResult(bool success, IEnumerable<Diagnostic> diagnostics, Assembly assembly)
        {
            Success = success;
            Diagnostics = diagnostics;
            Assembly = assembly;
        }

        public bool Success { get; }

        public IEnumerable<Diagnostic> Diagnostics { get; }

        public Assembly Assembly { get; }
    }
}
