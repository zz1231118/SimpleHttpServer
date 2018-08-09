using System.IO;

namespace SimpleHttpServer.Scripts.Utility
{
    internal static class HttpHelper
    {
        public static int Read(Stream dst, byte[] bytes, int offset, int count)
        {
            int length = 0;
            while (length < count)
            {
                var len = dst.Read(bytes, offset + length, count - length);
                if (len == 0)
                    break;

                length += len;
            }
            return length;
        }
    }
}
