namespace SimpleHttpServer.Web.Routes
{
    public interface IRouteHandler
    {
        string Name { get; }

        bool IsMatch(string rawUrl);

        string GetRawUrl(string rawUrl);
    }
}
