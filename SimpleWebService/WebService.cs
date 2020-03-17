using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Reflection;
using System.ServiceProcess;
using System.Text;
using Framework.Configuration;
using Framework.JavaScript;
using Framework.Log;
using SimpleHttpServer;

namespace SimpleWebService
{
    public partial class WebService : ServiceBase
    {
        public const string RemoteManagerPortProperty = "Remote.Port";
        public const ushort DefaultRemoteManagerPort = 56000;

        private readonly ILogger logger = Logger.GetLogger<WebService>();
        private Config conf;
        private HttpServer httpService;
        private HttpListener httpListener;
        private OperationTree operationRoot;

        public WebService()
        {
            InitializeComponent();
        }

        [OperationContract("site/start")]
        private void SiteStart(string name)
        {
            if (name == null)
                throw new ArgumentNullException(nameof(name));

            var activator = httpService.Activators.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            if (activator == null)
            {
                throw new ArgumentException(string.Format("site:{0} not found.", name));
            }

            activator.Start();
        }

        [OperationContract("site/stop")]
        private void SiteStop(string name)
        {
            if (name == null)
                throw new ArgumentNullException(nameof(name));

            var activator = httpService.Activators.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            if (activator == null)
            {
                throw new ArgumentException(string.Format("site:{0} not found.", name));
            }

            activator.Stop();
        }

        [OperationContract("site/restart")]
        private void SiteRestart(string name)
        {
            if (name == null)
                throw new ArgumentNullException(nameof(name));

            var activator = httpService.Activators.FirstOrDefault(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
            if (activator == null)
            {
                throw new ArgumentException(string.Format("site:{0} not found.", name));
            }

            activator.Stop();
            activator.Start();
        }

        private OperationTree GetOperationRoot()
        {
            if (operationRoot == null)
            {
                operationRoot = new OperationTree(OperationTree.SeparatorString);
                var methods = GetType().GetMethods(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance);
                foreach (var method in methods)
                {
                    var contract = method.GetCustomAttribute<OperationContractAttribute>(false);
                    if (contract != null)
                    {
                        var node = operationRoot.GetChild(contract.Path, true);
                        node.Method = method;
                    }
                }
            }
            return operationRoot;
        }

        private void SetupResponse(HttpListenerContext context)
        {
            var httpResponse = new HttpResponse(context.Response);
            var uri = context.Request.Url;
            if (uri.Segments.Length <= 1)
            {
                httpResponse.WriteError(1001, "invalid path.");
                return;
            }
            
            var path = uri.AbsolutePath.TrimStart(OperationTree.SeparatorChar);
            var operation = GetOperationRoot().GetChild(path, false);
            if (operation == null || operation.Method == null)
            {
                httpResponse.WriteError(1002, string.Format("path:{0} not found.", path));
                return;
            }

            try
            {
                var query = context.Request.QueryString;
                var parameters = operation.Method.GetParameters();
                var objParams = new object[parameters.Length];
                for (int i = 0; i < parameters.Length; i++)
                {
                    var parameter = parameters[i];
                    var value = (object)query.Get(parameter.Name);
                    if (value == null)
                    {
                        if (parameter.ParameterType.IsValueType)
                        {
                            value = Activator.CreateInstance(parameter.ParameterType);
                        }
                    }
                    else if (parameter.ParameterType != value.GetType() && typeof(IConvertible).IsAssignableFrom(parameter.ParameterType))
                    {
                        value = Convert.ChangeType(value, parameter.ParameterType);
                    }

                    objParams[i] = value;
                }

                var result = operation.Method.Invoke(this, objParams);
                httpResponse.WriteResult(result);
            }
            catch (Exception ex)
            {
                httpResponse.WriteError(1000, ex.ToString());
            }
        }

        private void PostAccept()
        {
            httpListener.BeginGetContext(new AsyncCallback(ProcessAccept), null);
        }

        private void ProcessAccept(IAsyncResult ar)
        {
            HttpListenerContext context;

            try
            {
                context = httpListener.EndGetContext(ar);
            }
            catch (ObjectDisposedException)
            {
                //被释放了
                return;
            }
            try
            {
                SetupResponse(context);
            }
            catch (ObjectDisposedException)
            { }
            catch (Exception ex)
            {
                logger.Error("{0} error:{1}", nameof(ProcessAccept), ex);
            }
            try
            {
                context.Response.Close();
            }
            catch (Exception ex)
            {
                logger.Error("{0} error:{1}", nameof(ProcessAccept), ex);
            }

            PostAccept();
        }

        protected override void OnStart(string[] args)
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "conf.conf");
            conf = File.Exists(path) ? Config.LoadFile(path) : Config.Empty;

            try
            {
                httpService = new HttpServer();
                httpService.Start();

                var port = conf.GetUInt16(RemoteManagerPortProperty, DefaultRemoteManagerPort);
                httpListener = new HttpListener();
                httpListener.Prefixes.Add(string.Format("http://localhost:{0}/", port));
                httpListener.Start();
                PostAccept();
            }
            catch (Exception ex)
            {
                logger.Fatal(nameof(OnStart) + " error: {0}", ex);
                throw ex;
            }
        }

        protected override void OnStop()
        {
            try
            {
                httpListener?.Close();
            }
            catch (Exception ex)
            {
                logger.Fatal("{0} error: {1}", nameof(OnStop), ex);
            }

            try
            {
                httpService.Stop();
            }
            catch (Exception ex)
            {
                logger.Fatal("{0} error: {1}", nameof(OnStop), ex);
            }
        }

        class HttpResponse
        {
            private HttpListenerResponse response;

            public HttpResponse(HttpListenerResponse response)
            {
                this.response = response;
            }

            private void Write(string responseText)
            {
                var responseBytes = Encoding.UTF8.GetBytes(responseText);
                response.StatusCode = (int)HttpStatusCode.OK;
                response.ContentEncoding = Encoding.UTF8;
                response.ContentType = "application/json";
                response.ContentLength64 = responseBytes.Length;
                response.OutputStream.Write(responseBytes, 0, responseBytes.Length);
            }

            public void WriteError(int errcode, string errmsg)
            {
                var json = new JsonObject();
                json["errcode"] = errcode;
                json["errmsg"] = errmsg;
                Write(json.ToString());
            }

            public void WriteResult(object obj)
            {
                var json = new JsonObject();
                json["errcode"] = 0;
                json["data"] = JsonSerializer.Serialize(obj);
                Write(json.ToString());
            }
        }

        [AttributeUsage(AttributeTargets.Method)]
        class OperationContractAttribute : Attribute
        {
            public OperationContractAttribute(string path)
            {
                Path = path;
            }

            public string Path { get; }
        }

        class OperationTree
        {
            public const char SeparatorChar = '/';
            public const string SeparatorString = "/";

            private List<OperationTree> children = new List<OperationTree>();

            public OperationTree(string name)
            {
                Name = name;
            }

            public OperationTree(string name, MethodInfo method)
                : this(name)
            {
                Method = method;
            }

            public string Name { get; }

            public MethodInfo Method { get; set; }

            public IReadOnlyCollection<OperationTree> Children => children;

            private OperationTree GetChild(string[] segments, int index, bool createIfNull)
            {
                var name = segments[index];
                var child = children.Find(p => p.Name.Equals(name, StringComparison.OrdinalIgnoreCase));
                if (child == null && createIfNull)
                {
                    child = new OperationTree(name);
                    children.Add(child);
                }
                return index + 1 < segments.Length ? child.GetChild(segments, index + 1, createIfNull) : child;
            }

            public OperationTree GetChild(string path, bool createIfNull)
            {
                var segments = path.Split(SeparatorChar);
                return GetChild(segments, 0, createIfNull);
            }
        }
    }
}
