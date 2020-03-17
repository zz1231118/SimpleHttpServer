using System;
using Framework.Configuration;

namespace SimpleHttpServer.Web.Processors
{
    public abstract class Processor
    {
        private const string TypeProperty = "Type";

        public Config Config { get; internal set; }

        public IHttpSite Site { get; internal set; }

        public static Processor Parse(Config conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));

            var name = conf.GetString(TypeProperty);
            var type = Type.GetType(name, true);
            return (Processor)Activator.CreateInstance(type);
        }

        public abstract bool IsMath(IHttpSite httpSite, string rawUrl);

        public abstract void Handle(IHttpContext context);

        protected internal virtual void OnStart()
        { }

        protected internal virtual void OnStop()
        { }
    }
}
