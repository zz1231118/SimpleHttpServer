namespace SimpleHttpServer.Web
{
    public interface IHttpServer
    {
        bool Activated { get; }

        void Start();
        void Stop();
    }
}