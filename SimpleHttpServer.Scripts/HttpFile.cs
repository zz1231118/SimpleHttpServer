using System.Collections.Specialized;
using System.IO;
using LyxFramework.Utility;

namespace SimpleHttpServer.Scripts
{
    public class HttpFile : BaseDisposed
    {
        private NameValueCollection _header;
        private Stream _stream;
        private string _key;
        private string _fileName;

        public HttpFile(NameValueCollection header, Stream stream)
        {
            _header = header;
            _stream = stream;

            Init();
        }

        public NameValueCollection Header => _header;
        public Stream Stream => _stream;
        public long Length => _stream.Length;
        public string Key => _key;
        public string FileName => _fileName;

        private void Init()
        {
            var name = "Content-Disposition";
            var content = _header.Get(name);
            if (content != null)
            {
                //form-data; name=\"file\"; filename=\"test.pcm\"
                foreach (var str in content.Split(';'))
                {
                    if (!str.Contains("="))
                        continue;

                    var ts = str.Split('=');
                    var key = ts[0].TrimStart();
                    var value = ts[1].Trim('"');
                    switch (key.ToLower())
                    {
                        case "name":
                            _key = value;
                            break;
                        case "filename":
                            _fileName = value;
                            break;
                    }
                }
            }
        }
        protected override void Dispose(bool disposing)
        {
            if (IsDisposed)
                return;

            base.Dispose(disposing);
            _header = null;
            _stream.Dispose();
            _stream = null;
            _key = null;
            _fileName = null;
        }
    }
}
