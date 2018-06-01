using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Web;

namespace OAuth
{
    internal static class Http
    {
        private static Encoding GetEncoding(HttpWebResponse response)
        {
            var encodingText = response.ContentEncoding;
            if (string.IsNullOrEmpty(encodingText))
                encodingText = "UTF-8";

            return Encoding.GetEncoding(encodingText);
        }
        private static string JoinParam(IDictionary<string, string> input)
        {
            var sb = new StringBuilder();
            using (var e = input.GetEnumerator())
            {
                if (e.MoveNext())
                {
                    var key = HttpUtility.UrlEncode(e.Current.Key);
                    var value = HttpUtility.UrlEncode(e.Current.Value);
                    sb.AppendFormat("{0}={1}", key, value);
                    while (e.MoveNext())
                    {
                        key = HttpUtility.UrlEncode(e.Current.Key);
                        value = HttpUtility.UrlEncode(e.Current.Value);
                        sb.AppendFormat("&{0}={1}", key, value);
                    }
                }
            }
            return sb.ToString();
        }

        public static string PostStream(string url, IDictionary<string, string> header = null, Stream stream = null, Encoding encoding = null)
        {
            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = WebRequestMethods.Http.Post;
            if (header != null)
            {
                foreach (var key in header.Keys)
                {
                    var value = header[key];
                    switch (key)
                    {
                        case "Content-Type":
                            request.ContentType = value;
                            break;
                        case "Content-Length":
                            request.ContentLength = Convert.ToInt64(value);
                            break;
                        default:
                            request.Headers.Set(key, value);
                            break;
                    }
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
        public static string Post(string url, IDictionary<string, string> header = null, IDictionary<string, string> input = null)
        {
            Stream dst = null;
            if (input != null)
            {
                var str = JoinParam(input);
                var bytes = Encoding.UTF8.GetBytes(str);
                dst = new MemoryStream(bytes);
            }

            var result = PostStream(url, header, dst);
            dst?.Dispose();
            return result;
        }
        public static string Get(string url, IDictionary<string, string> header = null, IDictionary<string, string> input = null)
        {
            if (input != null)
            {
                url += url.Contains("?")
                    ? url.EndsWith("?")
                        ? JoinParam(input)
                        : "&" + JoinParam(input)
                    : "?" + JoinParam(input);
            }

            var request = (HttpWebRequest)WebRequest.Create(url);
            request.Method = WebRequestMethods.Http.Get;
            if (header != null)
            {
                foreach (var key in header.Keys)
                    request.Headers[key] = header[key];
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