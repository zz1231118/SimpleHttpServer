using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading;
using Framework.Configuration;
using Framework.Log;
using SimpleHttpServer.Scripts.Domains;
using SimpleHttpServer.Scripts.VFS;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Scripts
{
    internal class ScriptEngines
    {
        private const bool DefaultIsDebug = false;

        private const string IsDebugProperty = "IsDebug";
        private const string SessionDirectoryProperty = "SessionDirectory";
        private const string SessionCheckIntervalProperty = "SessionCheckInterval";
        private const string SessionTimeoutProperty = "SessionTimeout";
        private const string DefaultSession = "Session";
        private const string NamespaceProperty = "Namespace";
        private const string ReferencesProperty = "References";

        internal const string ScriptExtension = ".cs";
        internal const string GlobalExtension = ".asax";
        internal const string HandleExtension = ".ashx";
        internal const string WindowExtension = ".aspx";
        internal const string GlobalName = "Global";
        internal const string GlobalScript = GlobalName + GlobalExtension;

        private readonly ILogger logger = Logger.GetLogger<ScriptEngines>();
        private readonly TimeSpan DefaultSessionCheckInterval = TimeSpan.FromMinutes(5);
        private readonly TimeSpan DefaultSessionTimeout = TimeSpan.FromHours(2);
        private readonly IHttpSite httpSite;
        private readonly Config conf;

        private bool isActivated;
        private List<string> referencedAssemblyNames = new List<string>();
        private bool isDebug;
        private string runtimeDirectory;
        private string sessionDirectory;
        private Timer timer;
        private TimeSpan sessionTimeout;
        private string @namespace;

        private AppScriptDomain appScriptDomain;
        private ApplicationDomain applicationDomain;
        private Dictionary<string, InvokeScriptDomain> invokeScriptDomains = new Dictionary<string, InvokeScriptDomain>();

        public ScriptEngines(IHttpSite httpSite, Config conf)
        {
            if (httpSite == null)
                throw new ArgumentNullException(nameof(httpSite));
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));

            var baseDirectory = AppDomain.CurrentDomain.BaseDirectory;

            this.httpSite = httpSite;
            this.conf = conf;
            runtimeDirectory = Path.Combine(baseDirectory, "Runtime");

            isDebug = conf.GetBoolean(IsDebugProperty, DefaultIsDebug);
            sessionDirectory = conf.GetString(SessionDirectoryProperty, DefaultSession);
            sessionDirectory = Path.Combine(baseDirectory, sessionDirectory);
            sessionTimeout = conf.GetTimeSpan(SessionTimeoutProperty, DefaultSessionTimeout);
            if (Directory.Exists(sessionDirectory))
            {
                Directory.Delete(sessionDirectory, true);
            }
            if (!Directory.Exists(runtimeDirectory))
            {
                Directory.CreateDirectory(runtimeDirectory);
            }
            Directory.CreateDirectory(sessionDirectory);
            var interval = conf.GetTimeSpan(SessionCheckIntervalProperty, DefaultSessionCheckInterval);
            timer = new Timer(new TimerCallback(CheckSession), null, TimeSpan.Zero, interval);
        }

        public bool IsDebug => isDebug;
        public string RuntimeDirectory => runtimeDirectory;
        public string SessionDirectory => sessionDirectory;
        public IReadOnlyList<string> ReferencedAssemblyNames => referencedAssemblyNames;
        public string BaseDirectory => httpSite.BaseDirectory;
        public string Namespace => @namespace;

        public Config Conf => conf;
        public IHttpSite Site => httpSite;
        public AppScriptDomain AppScriptDomain => appScriptDomain;
        public ApplicationDomain ApplicationDomain => applicationDomain;

        private void CheckSession(object obj)
        {
            var dir = new DirectoryInfo(sessionDirectory);
            foreach (var file in dir.GetFiles())
            {
                if (file.Attributes.HasFlag(FileAttributes.System))
                    continue;

                var left = DateTime.Now - file.LastAccessTime;
                if (left > sessionTimeout)
                {
                    try
                    {
                        file.Delete();
                    }
                    catch (Exception ex)
                    {
                        logger.Error("check remove session file error:{0}", ex);
                    }
                }
            }
            foreach (var file in FileSystem.Files)
            {
                if (DateTime.Now - file.LastModifyTime > sessionTimeout)
                {
                    FileSystem.Remove(file);
                }
            }
        }

        private Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs e)
        {
            if (e.Name.Contains(","))
            {
                var name = e.Name.Split(',')[0];
                if (name == AppScriptDomain.AssemblyName)
                    return appScriptDomain.Assembly;
                if (name == ApplicationDomain.AssemblyName)
                    return applicationDomain.Assembly;
            }

            return null;
        }

        public void AddSysReferencedAssembly(params string[] assemblys)
        {
            foreach (var assembly in assemblys)
            {
                if (assembly == null)
                    throw new ArgumentException();
                if (!referencedAssemblyNames.Contains(assembly))
                    referencedAssemblyNames.Add(assembly);
            }
        }

        public object CreateInstance(string path, string typename, params object[] args)
        {
            var extension = Path.GetExtension(path);
            invokeScriptDomains.TryGetValue(extension, out InvokeScriptDomain domain);
            return domain?.CreateInstance(path, typename, args);
        }

        public void Start()
        {
            if (isActivated)
                throw new InvalidOperationException("activated");

            isActivated = true;
            @namespace = conf.GetString(NamespaceProperty);
            var references = conf.GetStringArray(ReferencesProperty);
            foreach (var re in references)
            {
                var reference = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, re);
                AddSysReferencedAssembly(reference);
            }

            var scriptBaseDirectory = Path.Combine(BaseDirectory, AppScriptDomain.AssemblyName);
            if (!Directory.Exists(scriptBaseDirectory))
            {
                Directory.CreateDirectory(scriptBaseDirectory);
            }

            appScriptDomain = new AppScriptDomain(this, scriptBaseDirectory);
            applicationDomain = new ApplicationDomain(this, scriptBaseDirectory);
            var handleScript = new HandleScriptDomain(this, BaseDirectory);
            var windowScript = new WindowScriptDomain(this, BaseDirectory);
            invokeScriptDomains[handleScript.Extension] = handleScript;
            invokeScriptDomains[windowScript.Extension] = windowScript;

            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;
        }

        public void Close()
        {
            timer.Dispose();
            Directory.Delete(sessionDirectory, true);

            appScriptDomain.Dispose();
            applicationDomain.Dispose();
            foreach (var scriptDomain in invokeScriptDomains.Values)
                scriptDomain.Dispose();

            invokeScriptDomains.Clear();
        }
    }
}
