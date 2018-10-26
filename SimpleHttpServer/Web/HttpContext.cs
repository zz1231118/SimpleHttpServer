using System.IO;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Web
{
    internal class HttpContext : IHttpContext
    {
        private IHttpSite site;
        private HttpListenerContext httpContext;
        private string rawUrl;

        public HttpContext(IHttpSite site, HttpListenerContext httpContext, string rawUrl)
        {
            this.site = site;
            this.httpContext = httpContext;
            this.rawUrl = rawUrl;
        }

        public IHttpSite Site => site;
        public HttpListenerRequest Request => httpContext.Request;
        public HttpListenerResponse Response => httpContext.Response;
        public string RawUrl => rawUrl;
    }
}
