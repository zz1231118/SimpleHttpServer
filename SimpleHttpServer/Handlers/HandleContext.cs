using System.IO;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Handlers
{
    internal class HandleContext : IHandleContext
    {
        private HttpListenerContext _context;
        private FileInfo _fileInfo;

        public HandleContext(HttpListenerContext context, FileInfo fileInfo)
        {
            _context = context;
            _fileInfo = fileInfo;
        }

        public HttpListenerContext HttpContext => _context;
        public FileInfo FileInfo => _fileInfo;
    }
}
