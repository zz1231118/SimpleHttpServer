using System;
using System.Collections.Generic;
using System.IO;
using System.Reflection;
using System.Threading;
using LyxFramework.Configuration;
using LyxFramework.Log;
using SimpleHttpServer.Scripts.Assemblies;
using SimpleHttpServer.Scripts.VFS;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Scripts
{
    public class ScriptEngines
    {
        private const bool DefaultIsDebug = false;

        private const string IsDebugProperty = "IsDebug";
        private const string SessionDirectoryProperty = "SessionDirectory";
        private const string SessionCheckIntervalProperty = "SessionCheckInterval";
        private const string SessionTimeoutProperty = "SessionTimeout";
        private const string DefaultSession = "Session";
        private const string NamespaceProperty = "Namespace";
        private const string ReferencesProperty = "References";

        internal const string GlobalExtension = ".ysax";
        internal const string GlobalScript = "Global" + GlobalExtension;

        private readonly TimeSpan DefaultSessionCheckInterval = TimeSpan.FromMinutes(5);
        private readonly TimeSpan DefaultSessionTimeout = TimeSpan.FromHours(2);
        private IHttpSite _httpSite;
        private Config _conf;

        private bool _initlized;
        private List<string> _referencedAssemblyNames = new List<string>();
        private bool _isDebug;
        private string _sessionDirectory;
        private Timer _timer;
        private TimeSpan _sessionTimeout;
        private string _namespace;
        private AppScriptAssembly _appScriptAssembly;
        private Dictionary<string, InvokeScriptAssembly> _scriptAssemblys = new Dictionary<string, InvokeScriptAssembly>();

        public ScriptEngines(IHttpSite httpSite, Config conf)
        {
            _httpSite = httpSite;
            _conf = conf;

            _isDebug = conf.GetBoolean(IsDebugProperty, DefaultIsDebug);
            _sessionDirectory = conf.GetString(SessionDirectoryProperty, DefaultSession);
            _sessionDirectory = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, _sessionDirectory);
            _sessionTimeout = conf.GetTimeSpan(SessionTimeoutProperty, DefaultSessionTimeout);
            if (Directory.Exists(_sessionDirectory))
            {
                Directory.Delete(_sessionDirectory, true);
            }

            Directory.CreateDirectory(_sessionDirectory);
            var interval = conf.GetTimeSpan(SessionCheckIntervalProperty, DefaultSessionCheckInterval);
            _timer = new Timer(new TimerCallback(CheckSession), null, TimeSpan.Zero, interval);
        }

        public bool IsDebug => _isDebug;
        public string SessionDirectory => _sessionDirectory;
        public IReadOnlyList<string> ReferencedAssemblyNames => _referencedAssemblyNames;
        public string BaseDirectory => _httpSite.BaseDirectory;
        public string Namespace => _namespace;
        internal Config Conf => _conf;
        internal IHttpSite Site => _httpSite;
        internal AppScriptAssembly AppScriptAssembly => _appScriptAssembly;

        internal void Initialize()
        {
            if (_initlized)
                throw new InvalidOperationException("initialized...");

            _initlized = true;
            AppDomain.CurrentDomain.AssemblyResolve += CurrentDomain_AssemblyResolve;
            _namespace = _conf.GetString(NamespaceProperty);
            var references = _conf.GetStringList(ReferencesProperty);
            foreach (var re in references)
            {
                var reference = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, re);
                AddSysReferencedAssembly(reference);
            }

            _appScriptAssembly = new AppScriptAssembly(this, Path.Combine(BaseDirectory, AppScriptAssembly.AssemblyName));
            var handleScript = new HandleScriptAssembly(this, BaseDirectory);
            var windowScript = new WindowScriptAssembly(this, BaseDirectory);
            _scriptAssemblys[".cs"] = handleScript;
            _scriptAssemblys[handleScript.Extension] = handleScript;
            _scriptAssemblys[windowScript.Extension] = windowScript;
            var globalPath = Path.Combine(_httpSite.BaseDirectory, GlobalScript);
            if (File.Exists(globalPath))
            {
                var obj = handleScript.CreateInstance(globalPath, null);
                Application.Current = obj as Application;
            }
            else
            {
                Application.Current = new App();
            }

            Application.Current.BaseDirectory = _httpSite.BaseDirectory;
            Application.Current.OnStartup();
        }
        internal void AddSysReferencedAssembly(params string[] assemblys)
        {
            foreach (var assembly in assemblys)
            {
                if (assembly == null)
                    throw new ArgumentException();
                if (!_referencedAssemblyNames.Contains(assembly))
                    _referencedAssemblyNames.Add(assembly);
            }
        }
        internal object CreateInstance(string path, string typename, params object[] args)
        {
            var extension = Path.GetExtension(path);
            _scriptAssemblys.TryGetValue(extension, out InvokeScriptAssembly assembly);
            return assembly?.CreateInstance(path, typename, args);
        }
        internal void Shutdown()
        {
            _timer.Dispose();
            Directory.Delete(_sessionDirectory, true);

            _appScriptAssembly.Dispose();
            foreach (var assembly in _scriptAssemblys.Values)
                assembly.Dispose();

            _scriptAssemblys.Clear();
        }
        
        void CheckSession(object obj)
        {
            var dir = new DirectoryInfo(_sessionDirectory);
            foreach (var file in dir.GetFiles())
            {
                if (file.Attributes.HasFlag(FileAttributes.System))
                    continue;

                var left = DateTime.Now - file.LastAccessTime;
                if (left > _sessionTimeout)
                {
                    try
                    {
                        file.Delete();
                    }
                    catch (Exception ex)
                    {
                        LogManager.Error.Log("check remove session file error:{0}", ex);
                    }
                }
            }
            foreach (var file in FileSystem.Files)
            {
                if (DateTime.Now - file.LastModifyTime > _sessionTimeout)
                {
                    FileSystem.Remove(file);
                }
            }
        }
        Assembly CurrentDomain_AssemblyResolve(object sender, ResolveEventArgs e)
        {
            if (e.Name.Contains(","))
            {
                if (e.Name.Split(',')[0] == AppScriptAssembly.AssemblyName)
                    return _appScriptAssembly.Assembly;
            }

            throw new NotImplementedException();
        }
    }
}
