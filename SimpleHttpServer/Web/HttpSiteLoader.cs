using System;
using System.IO;
using System.Text;
using LyxFramework.Configuration;

namespace SimpleHttpServer.Web
{
    public class HttpSiteLoader : MarshalByRefObject
    {
        public IHttpSite Load(string baseDirectory)
        {
            var path = Path.Combine(baseDirectory, "Config.conf");
            if (!File.Exists(path))
                throw new FileNotFoundException(path);

            var str = File.ReadAllText(path, Encoding.UTF8);
            var conf = Config.Parse(str);
            return new HttpSite(conf);
        }
    }
}
