using System;
using LyxFramework.Configuration;
using SimpleHttpServer.Handlers.Filters;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Handlers
{
    internal class HandleProvider
    {
        private const string FilterProperty = "Filter";
        private const string TypeProperty = "Type";
        private const string HandlerProperty = "Handler";

        private HandleFilter _filter;
        private Handler _handler;

        public HandleProvider(IHttpSite httpSite, Config conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));

            var name = conf.GetString(HandlerProperty);
            var type = Type.GetType(name, true);
            _handler = (Handler)Activator.CreateInstance(type, new object[] { httpSite });

            conf = conf.GetConfig(FilterProperty);
            name = conf.GetString(TypeProperty);
            type = Type.GetType(name, true);
            _filter = (HandleFilter)Activator.CreateInstance(type, new object[] { conf });
        }

        public Handler Handler => _handler;

        public bool IsMatch(string postfix)
        {
            return _filter.IsMatch(postfix);
        }
        public void Start()
        {
            _handler.OnStart();
        }
        public void Stop()
        {
            _handler.OnStop();
        }
    }
}