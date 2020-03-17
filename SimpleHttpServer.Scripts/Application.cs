using SimpleHttpServer.Web;

namespace SimpleHttpServer.Scripts
{
    public abstract class Application
    {
        public static Application Current { get; internal set; }

        public IHttpSite Site { get; internal set; }

        public ApplicationSetting Setting { get; internal set; }

        public string BaseDirectory => Site.BaseDirectory;

        internal void Startup()
        {
            OnStartup();
        }

        internal void Exit()
        {
            OnExit();
        }

        protected virtual void OnStartup()
        { }

        protected virtual void OnExit()
        { }
    }
}