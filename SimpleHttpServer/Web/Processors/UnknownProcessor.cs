using System.IO;
using System.Net;
using SimpleHttpServer.Utility;

namespace SimpleHttpServer.Web.Processors
{
    public class UnknownProcessor : Processor
    {
        public override bool IsMath(IHttpSite httpSite, string rawUrl)
        {
            return HttpUtility.GetFileInfo(httpSite, rawUrl) != null;
        }

        public override void Handle(IHttpContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var rawUrl = context.RawUrl;
            var fileInfo = HttpUtility.GetFileInfo(context.Site, rawUrl);
            if (fileInfo == null)
            {
                throw new FileNotFoundException(rawUrl);
            }

            var extension = Path.GetExtension(fileInfo.Name);
            response.ContentType = ContentTypes.GetContentType(extension);
            response.ContentLength64 = fileInfo.Length;
            response.StatusCode = (int)HttpStatusCode.OK;
            using (var fStream = fileInfo.Open(FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                fStream.CopyTo(response.OutputStream);
            }
        }
    }
}