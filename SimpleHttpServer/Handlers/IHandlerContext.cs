using SimpleHttpServer.Web;

namespace SimpleHttpServer.Handlers
{
    public interface IHandlerContext
    {
        IHttpSite Site { get; }
    }
}
