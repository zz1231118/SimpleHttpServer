using System;
using System.Collections.Generic;
using LyxFramework.Configuration;

namespace SimpleHttpServer.Handlers.Filters
{
    public class FixedHandleFilter : HandleFilter
    {
        private const string PostfixesProperty = "Postfixes";

        private List<string> _postfixes;

        public FixedHandleFilter(Config conf)
            : base(conf)
        {
            if (conf == null)
                throw new ArgumentNullException(nameof(conf));
            if (!conf.HasPath(PostfixesProperty))
                throw new ArgumentException("not found path: " + PostfixesProperty);

            _postfixes = conf.GetStringList(PostfixesProperty);
        }

        public override bool IsMatch(string postfix)
        {
            return _postfixes.Contains(postfix);
        }
    }
}