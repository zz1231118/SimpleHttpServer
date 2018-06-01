using LyxFramework.Configuration;

namespace SimpleHttpServer.Web
{
    public interface IHttpSite
    {
        bool Activated { get; }
        string BaseDirectory { get; }
        Config Conf { get; }

        void Start();
        void Stop();
    }
}
