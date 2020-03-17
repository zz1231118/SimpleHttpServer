using Framework.Configuration;

namespace SimpleHttpServer.Web
{
    public interface IHttpSite
    {
        bool IsActivated { get; }

        string BaseDirectory { get; }

        Config Config { get; }

        void Start();

        void Stop();
    }
}
