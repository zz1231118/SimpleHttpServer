using System;
using System.Text;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class HttpRequest
    {
        private HttpListenerRequest _request;

        internal HttpRequest(HttpListenerRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));

            _request = request;
        }

        public Encoding ContentEncoding
        {
            get
            {
                string postDataCharset = _request.Headers["x-up-devcap-post-charset"];
                if (postDataCharset != null && postDataCharset.Length > 0)
                {
                    try
                    {
                        return Encoding.GetEncoding(postDataCharset);
                    }
                    catch (ArgumentException)
                    {
                    }
                }

                return Encoding.UTF8;
            }
        }
        public long ContentLength => _request.ContentLength64;
    }
}
