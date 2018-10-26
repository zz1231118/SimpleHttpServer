using SimpleHttpServer.Web;

namespace SimpleHttpServer.Scripts
{
    public abstract class Application
    {
        public static Application Current { get; internal set; }
        public IHttpSite Site { get; internal set; }
        public ScriptEngines ScriptEngines { get; internal set; }
        public string BaseDirectory { get; internal set; }

        protected internal virtual void OnStartup()
        { }
        protected internal virtual void OnExit()
        { }
    }
    internal class App : Application
    { }
}