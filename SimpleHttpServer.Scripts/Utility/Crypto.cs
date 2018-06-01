using System;
using System.Security.Cryptography;
using System.Text;

namespace SimpleHttpServer.Scripts.Utility
{
    public static class Crypto
    {
        public static string Md5(string str)
        {
            if (str == null)
                throw new ArgumentNullException(nameof(str));

            byte[] bytes = Encoding.ASCII.GetBytes(str);
            using (var md5 = MD5.Create())
                bytes = md5.ComputeHash(bytes);

            var sb = new StringBuilder(32);
            foreach (var by in bytes)
                sb.Append(by.ToString("x2"));

            return sb.ToString();
        }
    }
}
