using System.IO;
using SimpleHttpServer.Web;

#if UserDefined
using SimpleHttpServer.Net;
#else
#endif

namespace SimpleHttpServer.Scripts
{
    public interface IScriptContext
    {
        IHttpContext HttpContext { get; }
        IHttpHandler Handler { get; }
        FileInfo FileInfo { get; }
    }
}
