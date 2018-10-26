namespace SimpleHttpServer.Web
{
    public interface IHttpHandler
    {
        void Handle(IHttpContext context);
    }
}