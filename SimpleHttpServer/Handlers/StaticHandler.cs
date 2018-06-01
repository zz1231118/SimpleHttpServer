using System.IO;
using System.Net;
using SimpleHttpServer.Utility;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Handlers
{
    public class StaticHandler : Handler
    {
        public StaticHandler(IHttpSite site)
            : base(site)
        { }

        public override void Handle(IHandleContext context)
        {
            var extension = Path.GetExtension(context.FileInfo.Name);
            var response = context.HttpContext.Response;
            response.ContentType = ContentTypes.GetContentType(extension);
            response.ContentLength64 = context.FileInfo.Length;
            response.StatusCode = (int)HttpStatusCode.OK;

            using (var fStream = context.FileInfo.Open(FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                fStream.CopyTo(response.OutputStream);
            }
        }
    }
}