using System.IO;
using LyxFramework.Configuration;

namespace SimpleHttpServer.Web
{
    public interface IHttpSite
    {
        bool Activated { get; }
        string BaseDirectory { get; }
        Config Config { get; }

        void Start();
        void Stop();
    }
}
