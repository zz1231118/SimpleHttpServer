using System;

namespace SimpleHttpServer.Scripts.VFS
{
    public class VFile
    {
        private DateTime _createTime = DateTime.Now;
        private DateTime _lastModifyTime = DateTime.Now;
        private string _content;

        public VFile(string fullName)
        {
            FullName = fullName;
        }

        public string FullName { get; }
        public DateTime CreateTime => _createTime;
        public DateTime LastModifyTime => _lastModifyTime;
        public string Content => _content;

        public void Update(string content)
        {
            _content = content;
            _lastModifyTime = DateTime.Now;
        }
    }
}
