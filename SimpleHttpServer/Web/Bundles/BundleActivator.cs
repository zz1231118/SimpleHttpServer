using System;
using Framework.Configuration;

namespace SimpleHttpServer.Web.Bundles
{
    public abstract class BundleActivator
    {
        private const string TypeProperty = "Type";

        public Config Config { get; internal set; }

        public IHttpSite Site { get; internal set; }

        internal static BundleActivator Parse(Config conf)
        {
            var name = conf.GetString(TypeProperty);
            var type = Type.GetType(name, true);
            return (BundleActivator)Activator.CreateInstance(type);
        }

        protected internal virtual void OnStart()
        { }

        protected internal virtual void OnStop()
        { }
    }
}
