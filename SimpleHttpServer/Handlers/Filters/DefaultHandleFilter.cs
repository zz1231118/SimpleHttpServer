using LyxFramework.Configuration;

namespace SimpleHttpServer.Handlers.Filters
{
    public class DefaultHandleFilter : HandleFilter
    {
        public DefaultHandleFilter(Config conf)
            : base(conf)
        { }

        public override bool IsMatch(string postfix)
        {
            return true;
        }
    }
}
