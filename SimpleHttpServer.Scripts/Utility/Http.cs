using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;

namespace SimpleHttpServer.Scripts.Utility
{
    public static class Http
    {
        private static Encoding GetEncoding(HttpWebResponse response)
        {
            var encodingText = response.ContentEncoding;
            if (string.IsNullOrEmpty(encodingText))
                encodingText = "UTF-8";

            return Encoding.GetEncoding(encodingText);
        }

        public static string Post(string url, byte[] body, IDictionary<HttpResponseHeader, string> header = null, IEnumerable<Cookie> cookies = null, Encoding encoding = null)
        {
            if (url == null)
                throw new ArgumentNullException(nameof(url));

            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = WebRequestMethods.Http.Post;
            request.ContentType = "application/x-www-form-urlencoded";
            if (header != null)
            {
                foreach (var key in header.Keys)
                {
                    var value = header[key];
                    switch (key)
                    {
                        case HttpResponseHeader.ContentType:
                            request.ContentType = value;
                            break;
                        case HttpResponseHeader.ContentLength:
                            request.ContentLength = Convert.ToInt64(value);
                            break;
                        default:
                            request.Headers.Set(key, value);
                            break;
                    }
                }
            }
            if (cookies != null)
            {
                request.CookieContainer = new CookieContainer();
                foreach (var cookie in cookies)
                {
                    request.CookieContainer.Add(cookie);
                }
            }
            if (body != null)
            {
                request.ContentLength = body.Length;
                using (var rStream = request.GetRequestStream())
                {
                    rStream.Write(body, 0, body.Length);
                }
            }
            using (var response = (HttpWebResponse)request.GetResponse())
            {
                using (var rStream = response.GetResponseStream())
                {
                    if (encoding == null)
                    {
                        encoding = GetEncoding(response);
                    }
                    using (var reader = new StreamReader(rStream, encoding))
                        return reader.ReadToEnd();
                }
            }
        }
        public static string Post(string url, Stream stream, IDictionary<HttpResponseHeader, string> header = null, IEnumerable<Cookie> cookies = null, Encoding encoding = null)
        {
            if (url == null)
                throw new ArgumentNullException(nameof(url));

            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = WebRequestMethods.Http.Post;
            request.ContentType = "application/x-www-form-urlencoded";
            if (header != null)
            {
                foreach (var key in header.Keys)
                {
                    var value = header[key];
                    switch (key)
                    {
                        case HttpResponseHeader.ContentType:
                            request.ContentType = value;
                            break;
                        case HttpResponseHeader.ContentLength:
                            request.ContentLength = Convert.ToInt64(value);
                            break;
                        default:
                            request.Headers.Set(key, value);
                            break;
                    }
                }
            }
            if (cookies != null)
            {
                request.CookieContainer = new CookieContainer();
                foreach (var cookie in cookies)
                {
                    request.CookieContainer.Add(cookie);
                }
            }
            if (stream != null)
            {
                request.ContentLength = stream.Length;
                using (var rStream = request.GetRequestStream())
                {
                    stream.CopyTo(rStream);
                }
            }
            using (var response = (HttpWebResponse)request.GetResponse())
            {
                using (var rStream = response.GetResponseStream())
                {
                    if (encoding == null)
                    {
                        encoding = GetEncoding(response);
                    }
                    using (var reader = new StreamReader(rStream, encoding))
                        return reader.ReadToEnd();
                }
            }
        }
        public static string Post(string url, IDictionary<string, string> input = null, IDictionary<HttpResponseHeader, string> header = null, IEnumerable<Cookie> cookies = null, Encoding encoding = null)
        {
            Stream dst = null;
            if (input != null)
            {
                var str = string.Join("&", input.Select(p => string.Format("{0}={1}", p.Key, p.Value)));
                if (encoding == null)
                    encoding = Encoding.UTF8;

                var bytes = encoding.GetBytes(str);
                dst = new MemoryStream(bytes);
            }

            try
            {
                return Post(url, dst, header, cookies, encoding);
            }
            finally
            {
                dst?.Dispose();
            }
        }
        public static string Get(string url, IDictionary<string, string> input = null, IDictionary<HttpResponseHeader, string> header = null, IEnumerable<Cookie> cookies = null)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = WebRequestMethods.Http.Get;
            request.ContentType = "application/x-www-form-urlencoded";
            if (header != null)
            {
                foreach (var key in header.Keys)
                {
                    switch (key)
                    {
                        case HttpResponseHeader.ContentType:
                            request.ContentType = header[key];
                            break;
                        case HttpResponseHeader.ContentLength:
                            request.ContentLength = Convert.ToInt64(header[key]);
                            break;
                        default:
                            request.Headers[key] = header[key];
                            break;
                    }
                }
            }
            if (input != null)
            {
                url += "?" + string.Join("&", input.Select(p => string.Format("{0}={1}", p.Key, p.Value)));
            }
            if (cookies != null)
            {
                request.CookieContainer = new CookieContainer();
                foreach (var cookie in cookies)
                {
                    request.CookieContainer.Add(cookie);
                }
            }
            using (var response = (HttpWebResponse)request.GetResponse())
            {
                using (var rStream = response.GetResponseStream())
                {
                    var encoding = GetEncoding(response);
                    using (var reader = new StreamReader(rStream, encoding))
                        return reader.ReadToEnd();
                }
            }
        }
        public static string Upload(string url, Stream fStream, string name)
        {
            HttpWebRequest request = (HttpWebRequest)WebRequest.Create(url);
            CookieContainer cookieContainer = new CookieContainer();
            request.CookieContainer = cookieContainer;
            request.AllowAutoRedirect = true;
            request.Method = WebRequestMethods.Http.Post;
            string boundary = DateTime.Now.Ticks.ToString("X"); // 随机分隔线
            request.ContentType = "multipart/form-data;charset=utf-8;boundary=" + boundary;
            byte[] itemBoundaryBytes = Encoding.UTF8.GetBytes("\r\n--" + boundary + "\r\n");
            byte[] endBoundaryBytes = Encoding.UTF8.GetBytes("\r\n--" + boundary + "--\r\n");

            //请求头部信息 
            StringBuilder sb = new StringBuilder(string.Format("Content-Disposition:form-data;name=\"file\";filename=\"{0}\"\r\nContent-Type:application/octet-stream\r\n\r\n", name));
            byte[] headerBytes = Encoding.UTF8.GetBytes(sb.ToString());
            byte[] array = new byte[fStream.Length];
            fStream.Read(array, 0, array.Length);
            using (Stream postStream = request.GetRequestStream())
            {
                postStream.Write(itemBoundaryBytes, 0, itemBoundaryBytes.Length);
                postStream.Write(headerBytes, 0, headerBytes.Length);
                postStream.Write(array, 0, array.Length);
                postStream.Write(endBoundaryBytes, 0, endBoundaryBytes.Length);
            }
            using (var response = (HttpWebResponse)request.GetResponse())
            {
                using (Stream instream = response.GetResponseStream())
                {
                    var encoding = GetEncoding(response);
                    using (StreamReader sr = new StreamReader(instream, encoding))
                        return sr.ReadToEnd();
                }
            }
        }
    }
}