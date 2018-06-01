using System.IO;

namespace SimpleHttpServer.Scripts.Utility
{
    internal static class HttpHelper
    {
        public static void Read(Stream dst, byte[] bytes, int offset, int count)
        {
            int len = 0;
            while (len < count)
            {
                len += dst.Read(bytes, offset + len, count - len);
            }
        }
    }
}
