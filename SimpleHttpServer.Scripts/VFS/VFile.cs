using System;

namespace SimpleHttpServer.Scripts.VFS
{
    public class VFile
    {
        private DateTime creationTime = DateTime.Now;
        private DateTime lastModifyTime = DateTime.Now;
        private string content;

        public VFile(string fullName)
        {
            FullName = fullName;
        }

        public string FullName { get; }

        public DateTime CreationTime => creationTime;

        public DateTime LastModifyTime => lastModifyTime;

        public string Content => content;

        public void Update(string content)
        {
            this.content = content;
            lastModifyTime = DateTime.Now;
        }
    }
}
