using System;
using System.Text;
using LyxFramework.Utility;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class HttpResponse : BaseDisposed
    {
        private HttpListenerResponse _response;

        internal HttpResponse(HttpListenerResponse response)
        {
            if (response == null)
                throw new ArgumentNullException(nameof(response));

            _response = response;
        }

        public string ContentType
        {
            get => _response.ContentType;
            set => _response.ContentType = value;
        }
        public long ContentLength
        {
            get => _response.ContentLength64;
            set => _response.ContentLength64 = value;
        }

        public void Header(string key, string value)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            if (key.Equals("Content-Encoding", StringComparison.CurrentCultureIgnoreCase))
                _response.ContentEncoding = Encoding.GetEncoding(value);

            _response.Headers.Set(key, value);
        }
        public void Header(System.Net.HttpResponseHeader key, string value)
        {
            if (value == null)
                throw new ArgumentNullException(nameof(value));

            if (key == System.Net.HttpResponseHeader.ContentEncoding)
                _response.ContentEncoding = Encoding.GetEncoding(value);

            _response.Headers.Set(key, value);
        }

        public void Write(string text)
        {
            if (text == null)
                throw new ArgumentNullException(nameof(text));

            var bytes = _response.ContentEncoding.GetBytes(text);
            _response.OutputStream.Write(bytes, 0, bytes.Length);
        }
        public void Write(byte[] array)
        {
            if (array == null)
                throw new ArgumentNullException(nameof(array));

            _response.OutputStream.Write(array, 0, array.Length);
        }
        public void Write(byte[] array, int offset, int length)
        {
            if (array == null)
                throw new ArgumentNullException(nameof(array));
            if (offset < 0 || offset >= array.Length)
                throw new ArgumentOutOfRangeException(nameof(offset));
            if (length < 0 || offset + length > array.Length)
                throw new ArgumentOutOfRangeException(nameof(length));

            _response.OutputStream.Write(array, offset, length);
        }

        public void Redirect(string url)
        {
            if (url == null)
                throw new ArgumentNullException(nameof(url));

            _response.Redirect(url);
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    _response = null;   
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }
    }
}
