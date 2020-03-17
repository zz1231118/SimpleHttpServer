namespace SimpleHttpServer.Web
{
    public interface IHttpServer
    {
        bool IsActivated { get; }

        void Start();
        void Stop();
    }
}