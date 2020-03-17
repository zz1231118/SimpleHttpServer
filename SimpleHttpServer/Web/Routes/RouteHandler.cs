using System;
using System.Text.RegularExpressions;
using System.Web;

namespace SimpleHttpServer.Web.Routes
{
    class RouteHandler : IRouteHandler
    {
        private Regex regex;
        private string physical;

        public RouteHandler(string name, string routeUrl, string physical)
        {
            if (routeUrl == null)
                throw new ArgumentNullException(nameof(routeUrl));
            if (physical == null)
                throw new ArgumentNullException(nameof(physical));

            Name = name;
            regex = new Regex(routeUrl);
            this.physical = physical;
        }

        public string Name { get; }

        public string GetRawUrl(string rawUrl)
        {
            var match = regex.Match(rawUrl);
            if (!match.Success)
                throw new ArgumentException(nameof(rawUrl));

            string param = null;
            var index = rawUrl.IndexOf("?");
            if (index >= 0 && index < rawUrl.Length)
            {
                param = rawUrl.Substring(index, rawUrl.Length - index);
            }
            if (match.Groups.Count > 1)
            {
                var group = match.Groups[1];
                var names = regex.GetGroupNames();
                param += param == null ? "?" : "&";
                param += string.Format("{0}={1}", HttpUtility.UrlEncode(names[1]), HttpUtility.UrlEncode(group.Value));
                for (int i = 2; i < match.Groups.Count; i++)
                {
                    group = match.Groups[i];
                    param += string.Format("&{0}={1}", HttpUtility.UrlEncode(names[i]), HttpUtility.UrlEncode(group.Value));
                }

                return physical + param;
            }

            return physical;
        }

        public bool IsMatch(string rawUrl)
        {
            return regex.IsMatch(rawUrl);
        }
    }
}
