using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Reflection;
using Framework.JavaScript;
using SimpleHttpServer.Scripts.Behaviours;
using SimpleHttpServer.Scripts.VFS;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Scripts
{
    public abstract class CSharpScript : IDisposable
    {
        private const string SessCookieName = "SHSSESSID";

        private static ConcurrentDictionary<string, string> _skv = new ConcurrentDictionary<string, string>();
        private bool isDisposed;
        private ScriptEngines scriptEngines;
        private IHttpContext httpContext;
        private HttpRequest httpRequest;
        private HttpResponse httpResponse;
        private Dictionary<string, string> query;
        private Dictionary<string, string> form;
        private Dictionary<string, Json> session;
        private HttpFileCollection files;

        protected bool IsDisposed => isDisposed;

        public HttpRequest Request => httpRequest;

        public HttpResponse Response => httpResponse;

        public IReadOnlyDictionary<string, string> Query => query;

        public IReadOnlyDictionary<string, string> Form => form;

        public IDictionary<string, Json> Session
        {
            get
            {
                if (session == null)
                    throw new InvalidOperationException("not open session!");

                return session;
            }
        }

        public IHttpFileCollection Files => files;

        public bool IsSessionEnabled => session != null;

        public string FileName { get; private set; }

        private void SaveSession()
        {
            if (session.Count == 0)
            {
                //没有任何数据
                return;
            }
            var request = httpContext.Request;
            var cookie = request.Cookies[SessCookieName];
            if (cookie == null)
            {
                //第一次创建
                var response = httpContext.Response;
                cookie = response.Cookies[SessCookieName];
            }
            else if (cookie.Expired)
            {
                //cookie 已过期
                return;
            }

            var json = new JsonObject();
            foreach (var key in session.Keys)
            {
                json[key] = session[key];
            }
            var sessionDirectory = scriptEngines.SessionDirectory;
            var path = Path.Combine(sessionDirectory, cookie.Value);
            FileSystem.GetFile(path, true).Update(json.ToString());
        }

        internal void Initialize(ScriptEngines scriptEngines, IHttpContext httpContext, FileInfo fileInfo)
        {
            this.scriptEngines = scriptEngines;
            this.httpContext = httpContext;

            FileName = fileInfo.FullName;

            httpRequest = new HttpRequest(httpContext.Request);
            httpResponse = new HttpResponse(httpContext.Response);
            query = new Dictionary<string, string>();
            form = new Dictionary<string, string>();
            files = new HttpFileCollection();
            var request = this.httpContext.Request;
            var response = this.httpContext.Response;
            var encoding = httpRequest.ContentEncoding;
            if (response.ContentEncoding == null)
            {
                response.ContentEncoding = encoding;
                response.Headers.Set(HttpResponseHeader.ContentEncoding, encoding.BodyName);
            }

            var rawUrl = httpContext.RawUrl;
            var index = rawUrl.IndexOf("?");
            if (index >= 0 && index < rawUrl.Length - 1)
            {
                var queryText = rawUrl.Substring(index + 1, rawUrl.Length - index - 1);
                Utility.HttpUtility.ResolveUrlEncoded(query, queryText);
            }
            if (request.HttpMethod == WebRequestMethods.Http.Post)
            {
                if (request.ContentLength64 > Application.Current.Setting.MaxPostLength)
                    throw new InvalidOperationException("post size limited");
                if (request.ContentType == null)
                    throw new InvalidOperationException("content type error!");

                var array = request.ContentType.Split(';');
                var contentType = array[0].ToLower();
                switch (contentType)
                {
                    case "application/x-www-form-urlencoded":
                        {
                            var arraySegment = Utility.HttpUtility.ReadToEnd(request);
                            var postBodyText = encoding.GetString(arraySegment.Array, arraySegment.Offset, arraySegment.Count);
                            Utility.HttpUtility.ResolveUrlEncoded(form, postBodyText);
                        }
                        break;
                    case "multipart/form-data":
                        files.Resolve(request);
                        break;
                    default:
                        break;
                }
            }

            HttpBehaviour behaviour;
            Type scriptType = GetType();
            foreach (var behaviourAttribute in scriptType.GetCustomAttributes<HttpBehaviourAttribute>(true))
            {
                behaviour = (HttpBehaviour)Activator.CreateInstance(behaviourAttribute.BehaviourType);
                behaviour.Handle(this);
            }
        }

        protected void CheckDisposed()
        {
            if (isDisposed)
                throw new ObjectDisposedException(GetType().FullName);
        }

        protected void StartSession()
        {
            if (IsSessionEnabled)
                return;

            session = new Dictionary<string, Json>();

            Guid sessionID;
            var request = httpContext.Request;
            var response = httpContext.Response;
            var cookie = request.Cookies[SessCookieName];
            if (cookie == null || !Guid.TryParse(cookie.Value, out sessionID))
            {
                sessionID = Guid.NewGuid();
                var value = sessionID.ToString("N");
                if (cookie == null) cookie = new Cookie(SessCookieName, value);
                else cookie.Value = value;

                response.Cookies.Add(cookie);
            }
            else
            {
                var sessionDirectory = scriptEngines.SessionDirectory;
                var path = Path.Combine(sessionDirectory, cookie.Value);
                if (FileSystem.TryGet(path, out VFile file))
                {
                    var json = Json.Parse<JsonObject>(file.Content);
                    foreach (var key in json.Keys)
                        session[key] = json[key];
                }
            }
        }

        protected void DestroySession()
        {
            session = null;
            var cookie = httpContext.Request.Cookies[SessCookieName];
            if (cookie?.Expired == false)
            {
                var rcookie = httpContext.Response.Cookies[SessCookieName];
                if (rcookie == null) httpContext.Response.Cookies.Add(cookie);
                else cookie = rcookie;

                cookie.Expired = true;

                Guid sessionID;
                if (Guid.TryParse(cookie.Value, out sessionID))
                {
                    var value = sessionID.ToString("N");
                    var sessionDirectory = scriptEngines.SessionDirectory;
                    var path = Path.Combine(sessionDirectory, value);
                    FileSystem.Remove(path);
                }
            }
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!isDisposed)
            {
                try
                {
                    if (IsSessionEnabled)
                    {
                        SaveSession();
                    }
                    if (files != null)
                    {
                        files.Dispose();
                        files = null;
                    }

                    httpContext = null;
                    httpResponse = null;
                    query = null;
                    form = null;
                    session = null;
                }
                finally
                {
                    isDisposed = true;
                }
            }
        }

        public abstract void Invoke();

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }
}