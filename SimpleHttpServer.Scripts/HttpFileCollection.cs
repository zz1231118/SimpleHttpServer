using System;
using System.Collections;
using System.Collections.Generic;
using System.Collections.Specialized;
using System.IO;
using System.Linq;
using System.Text;
using LyxFramework.Utility;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    public class HttpFileCollection : BaseDisposed, IReadOnlyCollection<HttpFile>
    {
        private const long MaxFileLength = 10 * 1024 * 1024;
        private List<HttpFile> _httpFiles = new List<HttpFile>();

        public HttpFileCollection()
        { }

        public HttpFile this[int index]
        {
            get
            {
                CheckDisposed();
                return _httpFiles[index];
            }
        }
        public HttpFile this[string key]
        {
            get
            {
                CheckDisposed();
                return _httpFiles.FirstOrDefault(p => p.Key == key);
            }
        }
        public int Count => _httpFiles.Count;

        private static bool IsMatch(byte[] lhs, int offset, byte[] rhs)
        {
            if (lhs.Length - offset < rhs.Length)
                return false;

            for (int i = 0; i < rhs.Length; i++)
            {
                if (lhs[offset + i] != rhs[i])
                    return false;
            }
            return true;
        }
        private static int Find(byte[] lhs, int offset, byte[] rhs)
        {
            int end = lhs.Length - rhs.Length;
            for (int i = offset; i < end; i++)
            {
                if (IsMatch(lhs, i, rhs))
                    return i;
            }

            return -1;
        }
        private string GetBoundary(HttpListenerRequest request)
        {
            var contentType = request.Headers.Get("Content-Type");
            // multipart/form-data; boundary=----WebKitFormBoundarybwuLrLBGufffONo5
            var muls = contentType.Split(';');
            foreach (var mul in muls)
            {
                var ts = mul.Split('=');
                if (ts.Length != 2)
                    continue;

                if (ts[0].TrimStart().Equals("Boundary", StringComparison.CurrentCultureIgnoreCase))
                    return ts[1];
            }
            throw new InvalidOperationException();
        }

        public IEnumerator<HttpFile> GetEnumerator()
        {
            return _httpFiles.GetEnumerator();
        }
        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        internal void Resolve(HttpListenerRequest request)
        {
            if (request == null)
                throw new ArgumentNullException(nameof(request));
            if (request.ContentLength64 > MaxFileLength)
                throw new ArgumentException("file too large");

            var startBoundary = "--" + GetBoundary(request);
            var endBounary = startBoundary + "--";
            var encoding = Encoding.UTF8;
            var byteArrayForStartBounary = encoding.GetBytes(startBoundary);
            var byteArrayForEndBounary = encoding.GetBytes(endBounary);
            var newLineByteLength = encoding.GetByteCount(Environment.NewLine);
            var minLength = byteArrayForStartBounary.Length + newLineByteLength + byteArrayForEndBounary.Length;
            var buffer = new byte[request.ContentLength64];
            Utility.HttpHelper.Read(request.InputStream, buffer, 0, buffer.Length);
            if (IsMatch(buffer, 0, byteArrayForEndBounary))
                return;

            for (int i = 0; i < buffer.Length; i++)
            {
                if (!IsMatch(buffer, i, byteArrayForStartBounary))
                    continue;

                var headLength = 0;
                var header = new NameValueCollection();
                using (var mStream = new MemoryStream(buffer, i, buffer.Length - i))
                {
                    using (var reader = new StreamReader(mStream, encoding))
                    {
                        var str = reader.ReadLine();
                        headLength += byteArrayForStartBounary.Length + newLineByteLength;
                        while ((str = reader.ReadLine()) != string.Empty)
                        {
                            var ts = str.Split(':');
                            headLength += encoding.GetByteCount(str) + newLineByteLength;
                            header[ts[0]] = ts[1];
                        }
                        headLength += newLineByteLength;
                    }
                }
                int offset = i + headLength;
                int end = Find(buffer, offset, byteArrayForStartBounary);
                if (end == -1)
                    throw new ArgumentException("not found end bounary");

                int count = end - offset - newLineByteLength;
                var fStream = new MemoryStream(buffer, offset, count);
                _httpFiles.Add(new HttpFile(header, fStream));
                i = end - 1;
                if (buffer.Length - end <= minLength)
                {
                    break;
                }
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (IsDisposed)
                return;

            base.Dispose(disposing);
            foreach (var multimedia in _httpFiles)
                multimedia.Dispose();

            _httpFiles = null;
        }
    }
}
