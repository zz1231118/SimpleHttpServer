using System;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Handlers
{
    public abstract class Handler
    {
        private IHttpSite _httpSite;

        public Handler(IHttpSite httpSite)
        {
            if (httpSite == null)
                throw new ArgumentNullException(nameof(httpSite));

            _httpSite = httpSite;
        }

        public IHttpSite HttpSite => _httpSite;

        public abstract void Handle(IHandleContext context);

        protected internal virtual void OnStart()
        { }
        protected internal virtual void OnStop()
        { }
    }
}