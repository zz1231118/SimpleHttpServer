using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using SimpleHttpServer.Web;

namespace SimpleHttpServer.Utility
{
    public static class HttpUtility
    {
        public const string ForwardSlashString = "/";
        public const char ForwardSlashChar = '/';
        public const string BackSlashString = @"\";
        public const char BackSlashChar = '\\';

        public static string GetLocalPath(string rawUrl)
        {
            if (rawUrl == null)
                throw new ArgumentNullException(nameof(rawUrl));

            var index = rawUrl.IndexOf("?");
            rawUrl = index >= 0 ? rawUrl.Substring(0, index) : rawUrl;
            return rawUrl.Replace(ForwardSlashString, BackSlashString);
        }

        public static FileInfo GetFileInfo(IHttpSite httpSite, string rawUrl)
        {
            var path = GetLocalPath(rawUrl);
            if (path.StartsWith(BackSlashString))
                path = path.TrimStart(BackSlashChar);

            var dir = new DirectoryInfo(httpSite.BaseDirectory);
            var files = dir.GetFiles(path);
            if (files.Length > 1)
                throw new ArgumentException(nameof(rawUrl));

            return files.FirstOrDefault();
        }

        public static void FillFromString(IDictionary<string, string> kv, string input, bool urlencoded, Encoding encoding)
        {
            int l = (input != null) ? input.Length : 0;
            int i = (input.Length > 0 && input[0] == '?') ? 1 : 0;
            while (i < l)
            {
                int si = i;
                int ti = -1;
                while (i < l)
                {
                    char ch = input[i];
                    if (ch == '=')
                    {
                        if (ti < 0)
                            ti = i;
                    }
                    else if (ch == '&')
                    {
                        break;
                    }

                    i++;
                }

                string name = null;
                string value = null;
                if (ti >= 0)
                {
                    name = input.Substring(si, ti - si);
                    value = input.Substring(ti + 1, i - ti - 1);
                }
                else
                {
                    value = input.Substring(si, i - si);
                }

                if (urlencoded)
                    kv.Add(name == null ? null : System.Web.HttpUtility.UrlDecode(name, encoding),
                       System.Web.HttpUtility.UrlDecode(value, encoding));
                else
                    kv.Add(name, value);

                if (i == l - 1 && input[i] == '&')
                    kv.Add(null, "");

                i++;
            }
        }
    }
}