using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Web;
using LyxFramework.Jsons;
using LyxFramework.Utility;
using SimpleHttpServer.Scripts.VFS;

namespace SimpleHttpServer.Scripts
{
    public abstract class CSharpScript : BaseDisposed
    {
        private const string SessCookieName = "SHSSESSID";

        private static ConcurrentDictionary<string, string> _skv = new ConcurrentDictionary<string, string>();
        protected readonly string FileName;
        private IScriptContext _context;
        private HttpRequest _request;
        private HttpResponse _response;
        private Dictionary<string, string> _query;
        private Dictionary<string, string> _form;
        private Dictionary<string, Json> _session;
        private HttpFileCollection _files;

        public CSharpScript(IScriptContext context)
        {
            if (context == null)
                throw new ArgumentNullException(nameof(context));

            FileName = context.FileInfo.FullName;

            _context = context;
            _request = new HttpRequest(context.HttpContext.Request);
            _response = new HttpResponse(context.HttpContext.Response);
            Initialize();
        }

        protected HttpRequest Request => _request;
        protected HttpResponse Response => _response;
        protected IReadOnlyDictionary<string, string> Query => _query;
        protected IReadOnlyDictionary<string, string> Form => _form;
        protected IDictionary<string, Json> Session
        {
            get
            {
                if (_session == null)
                    throw new InvalidOperationException("not open session!");

                return _session;
            }
        }
        protected HttpFileCollection Files => _files;
        protected bool IsSessionEnabled => _session != null;

        private static void ParseUrlEncodedQuery(IDictionary<string, string> kv, string query)
        {
            foreach (var str in query.Split('&'))
            {
                if (!string.IsNullOrEmpty(str))
                {
                    var ts = str.Split('=');
                    var key = HttpUtility.UrlDecode(ts[0]);
                    var value = HttpUtility.UrlDecode(ts[1]);
                    kv[key] = value;
                }
            }
        }
        private static void ParseJsonQuery(IDictionary<string, string> kv, string query)
        {
            var json = Json.Parse(query);
            if (json is JsonObject job)
            {
                foreach (var key in job.Keys)
                {
                    kv[key] = job[key].ToString();
                }
            }
            else
            {
                throw new InvalidOperationException("invalid json format:" + json.GetType().Name);
            }
        }

        public abstract void Invoke();

        private void Initialize()
        {
            _query = new Dictionary<string, string>();
            _form = new Dictionary<string, string>();
            _files = new HttpFileCollection();
            var request = _context.HttpContext.Request;
            var response = _context.HttpContext.Response;
            var encoding = _request.ContentEncoding;
            if (response.ContentEncoding == null)
            {
                response.ContentEncoding = encoding;
                response.Headers.Set(HttpResponseHeader.ContentEncoding, encoding.BodyName);
            }

            var query = request.Url.Query;
            if (query?.StartsWith("?") == true)
            {
                ParseUrlEncodedQuery(_query, query.TrimStart('?'));
            }
            if (request.HttpMethod == WebRequestMethods.Http.Post)
            {
                if (request.ContentLength64 > _context.UploadMaxFileSize)
                    throw new InvalidOperationException("upload file size limited");
                if (request.ContentType == null)
                    throw new InvalidOperationException("content type error!");

                var array = request.ContentType.Split(';');
                var contentType = array[0].ToLower();
                switch (contentType)
                {
                    case "multipart/form-data":
                        _files.Resolve(request);
                        break;
                    case "application/json":
                        {
                            var bytes = new byte[request.ContentLength64];
                            Utility.HttpHelper.Read(request.InputStream, bytes, 0, bytes.Length);
                            ParseJsonQuery(_form, encoding.GetString(bytes));
                        }
                        break;
                    default:
                        {
                            //application/x-www-form-urlencoded
                            var bytes = new byte[request.ContentLength64];
                            Utility.HttpHelper.Read(request.InputStream, bytes, 0, bytes.Length);
                            ParseUrlEncodedQuery(_form, encoding.GetString(bytes));
                        }
                        break;
                }
            }
        }
        private void SaveSession()
        {
            if (!IsSessionEnabled)
                return;
            if (_session.Count == 0)
                return;

            var request = _context.HttpContext.Request;
            var cookie = request.Cookies[SessCookieName];
            if (cookie == null)
            {
                //第一次创建
                var response = _context.HttpContext.Response;
                cookie = response.Cookies[SessCookieName];
            }
            else if (cookie.Expired)
            {
                return;
            }

            var json = new JsonObject();
            foreach (var key in _session.Keys)
                json[key] = _session[key];

            var path = Path.Combine(_context.SessionDirectory, cookie.Value);
            FileSystem.GetOrCreate(path).Update(json.ToString());
        }

        public void Header(string key, string value)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            _response.Header(key, value);
        }
        public void Header(HttpResponseHeader key, string value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            _response.Header(key, value);
        }

        protected void StartSession()
        {
            if (IsSessionEnabled)
                return;

            _session = new Dictionary<string, Json>();

            Guid sessionID;
            var request = _context.HttpContext.Request;
            var response = _context.HttpContext.Response;
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
                var path = Path.Combine(_context.SessionDirectory, cookie.Value);
                if (FileSystem.TryGet(path, out VFile file))
                {
                    var json = Json.Parse<JsonObject>(file.Content);
                    foreach (var key in json.Keys)
                        _session[key] = json[key];
                }
            }
        }
        protected void DestroySession()
        {
            _session = null;
            var cookie = _context.HttpContext.Request.Cookies[SessCookieName];
            if (cookie?.Expired == false)
            {
                var rcookie = _context.HttpContext.Response.Cookies[SessCookieName];
                if (rcookie == null) _context.HttpContext.Response.Cookies.Add(cookie);
                else cookie = rcookie;

                cookie.Expired = true;

                Guid sessionID;
                if (Guid.TryParse(cookie.Value, out sessionID))
                {
                    var value = sessionID.ToString("N");
                    var path = Path.Combine(_context.SessionDirectory, value);
                    FileSystem.Remove(path);
                }
            }
        }
        protected void WrapResult(bool result, object data = null)
        {
            var json = new JsonObject();
            json["result"] = result;
            if (data != null)
            {
                json["data"] = JsonSerializer.Serialize(data);
            }

            _response.Write(json.Normalizing());
        }
        protected void WrapResult(int code, object data = null)
        {
            var json = new JsonObject();
            json["code"] = code;
            if (data != null)
            {
                json["data"] = JsonSerializer.Serialize(data);
            }

            _response.Write(json.Normalizing());
        }
        protected void WrapResult(Enum code, object data = null)
        {
            var underlyingType = Enum.GetUnderlyingType(code.GetType());
            var enval = Convert.ChangeType(code, underlyingType);
            WrapResult(Convert.ToInt32(enval), data);
        }
        protected override void Dispose(bool disposing)
        {
            if (IsDisposed)
                return;

            base.Dispose(disposing);
            if (IsSessionEnabled)
                SaveSession();

            if (_files != null)
            {
                _files.Dispose();
                _files = null;
            }

            _context = null;
            _response = null;
            _query = null;
            _form = null;
            _session = null;
        }
    }

    public enum ResultCode : byte
    {
        OK = 0,
        NotLoin,
        ServerError,
        InvalidParam,
        InvalidAction,
    }
}