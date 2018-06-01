using System.IO;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Handlers
{
    public interface IHandleContext
    {
        HttpListenerContext HttpContext { get; }
        FileInfo FileInfo { get; }
    }
}
