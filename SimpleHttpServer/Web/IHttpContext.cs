using System.IO;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Web
{
    public interface IHttpContext
    {
        IHttpSite Site { get; }

        HttpListenerRequest Request { get; }

        HttpListenerResponse Response { get; }

        string RawUrl { get; }
    }
}
