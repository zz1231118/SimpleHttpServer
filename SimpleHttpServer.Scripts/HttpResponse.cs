using System;
using System.Text;
using Framework;
using System.IO;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class HttpResponse : BaseDisposed
    {
        private HttpListenerResponse response;

        internal HttpResponse(HttpListenerResponse response)
        {
            if (response == null)
                throw new ArgumentNullException(nameof(response));

            this.response = response;
        }

        public HttpListenerResponse Response => response;

        public Stream OutputStream => response.OutputStream;

        public HttpStatusCode StatusCode 
        {
            get => (HttpStatusCode)response.StatusCode;
            set => response.StatusCode = (int)value;
        }

        public string ContentType
        {
            get => response.ContentType;
            set => response.ContentType = value;
        }

        public long ContentLength
        {
            get => response.ContentLength64;
            set => response.ContentLength64 = value;
        }

        public void Header(string key, string value)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            if (key.Equals("Content-Encoding", StringComparison.CurrentCultureIgnoreCase))
                response.ContentEncoding = Encoding.GetEncoding(value);

            response.Headers.Set(key, value);
        }

        public void Header(System.Net.HttpResponseHeader key, string value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            if (key == System.Net.HttpResponseHeader.ContentEncoding)
                response.ContentEncoding = Encoding.GetEncoding(value);

            response.Headers.Set(key, value);
        }

        public void Write(string text)
        {
            if (text != null)
            {
                var bytes = response.ContentEncoding.GetBytes(text);
                response.OutputStream.Write(bytes, 0, bytes.Length);
            }
        }

        public void Write(string format, params object[] args)
        {
            if (format == null)
                throw new ArgumentNullException(nameof(format));

            Write(string.Format(format, args));
        }

        public void Write(object obj)
        {
            if (!object.ReferenceEquals(obj, null))
            {
                Write(obj.ToString());
            }
        }

        public void Write(byte[] array)
        {
            if (array == null)
                throw new ArgumentNullException(nameof(array));

            response.OutputStream.Write(array, 0, array.Length);
        }

        public void Write(byte[] array, int offset, int length)
        {
            if (array == null)
                throw new ArgumentNullException(nameof(array));
            if (offset < 0 || offset >= array.Length)
                throw new ArgumentOutOfRangeException(nameof(offset));
            if (length < 0 || offset + length > array.Length)
                throw new ArgumentOutOfRangeException(nameof(length));

            response.OutputStream.Write(array, offset, length);
        }

        public void Redirect(string url)
        {
            if (url == null)
                throw new ArgumentNullException(nameof(url));

            response.Redirect(url);
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    response = null;   
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }
    }
}
