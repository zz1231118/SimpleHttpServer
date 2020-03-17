using System;
using System.Text;
using SimpleHttpServer.Scripts.Utility;
using System.IO;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class HttpRequest
    {
        private readonly HttpListenerRequest request;
        private Encoding encoding;

        internal HttpRequest(HttpListenerRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            this.request = request;
        }

        public HttpListenerRequest Request => request;

        public long ContentLength => request.ContentLength64;

        public string ContentType => request.ContentType;

        public string HttpMethod => request.HttpMethod;

        public Stream InputStream => request.InputStream;

        public Encoding ContentEncoding
        {
            get
            {
                if (encoding == null)
                {
                    string postDataCharset = request.Headers["x-up-devcap-post-charset"];
                    if (postDataCharset != null && postDataCharset.Length > 0)
                    {
                        try
                        {
                            encoding = Encoding.GetEncoding(postDataCharset);
                        }
                        catch (ArgumentException)
                        { }
                    }
                    if (encoding == null)
                    {
                        encoding = Encoding.UTF8;
                    }
                }

                return encoding;
            }
        }

        public IPEndPoint LocalEndPoint => request.LocalEndPoint;

        public IPEndPoint RemoteEndPoint => request.RemoteEndPoint;

        public ArraySegment<byte> ReadToEnd()
        {
            return HttpUtility.ReadToEnd(request);
        }
    }
}
