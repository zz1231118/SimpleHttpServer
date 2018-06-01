using System.IO;
using SimpleHttpServer.Handlers;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public interface IScriptContext
    {
        HttpListenerContext HttpContext { get; }
        Handler Handler { get; }
        FileInfo FileInfo { get; }
        string SessionDirectory { get; }
        long UploadMaxFileSize { get; }
    }
}
