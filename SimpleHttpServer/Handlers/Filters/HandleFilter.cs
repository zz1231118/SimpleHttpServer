using System;
using LyxFramework.Configuration;

namespace SimpleHttpServer.Handlers.Filters
{
    public abstract class HandleFilter
    {
        public HandleFilter(Config conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));
        }

        public abstract bool IsMatch(string postfix);
    }
}