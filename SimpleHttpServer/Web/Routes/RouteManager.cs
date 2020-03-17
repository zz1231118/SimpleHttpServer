using System;
using System.Collections.Generic;

namespace SimpleHttpServer.Web.Routes
{
    public static class RouteManager
    {
        private static List<IRouteHandler> routes = new List<IRouteHandler>();

        public static IReadOnlyCollection<IRouteHandler> Routes => routes;

        internal static bool TryGet(string rawUrl, out IRouteHandler handler)
        {
            foreach (var route in routes)
            {
                if (route.IsMatch(rawUrl))
                {
                    handler = route;
                    return true;
                }
            }

            handler = null;
            return false;
        }

        public static void AddRoute(string name, string routeUrl, string physical)
        {
            if (routeUrl == null)
                throw new ArgumentNullException(nameof(routeUrl));
            if (physical == null)
                throw new ArgumentNullException(nameof(physical));

            routes.Add(new RouteHandler(name, routeUrl, physical));
        }

        public static int Remove(string name)
        {
            return routes.RemoveAll(p => p.Name == name);
        }
    }
}
