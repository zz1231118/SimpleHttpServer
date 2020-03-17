using System;
using System.Globalization;
using System.IO;
using System.Net;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Framework.Configuration;
using SimpleHttpServer.Utility;

namespace SimpleHttpServer.Web.Processors
{
    public class ReadOnlyProcessor : Processor
    {
        private const string ExtensionsProperty = "Extensions";

        private string[] extensions;

        private bool IsMatchExtension(string rawUrl)
        {
            if (extensions?.Length > 0)
            {
                var path = HttpUtility.GetLocalPath(rawUrl);
                var suffix = Path.GetExtension(path);
                foreach (var extension in extensions)
                {
                    if (extension.Equals(suffix, StringComparison.CurrentCultureIgnoreCase))
                    {
                        return true;
                    }
                }
            }

            return false;
        }

        private string GetETag(FileInfo fileInfo)
        {
            var bytes = Encoding.UTF8.GetBytes(fileInfo.Name + fileInfo.LastWriteTimeUtc.ToString(CultureInfo.InvariantCulture));
            using (var md5 = MD5.Create())
            {
                bytes = md5.ComputeHash(bytes);
            }
            var sb = new StringBuilder(32);
            foreach (var by in bytes)
            {
                sb.Append(by.ToString("x2"));
            }

            /* 1.强ETag
             * 只要实体发生任何改变，都会改变ETag值.如:
             * ETag: &quot;1234234234&quot;
             * 
             * 2.弱ETag
             * 它在前面会有个 W/ ，如：
             * ETag: W/&quot;12342423&quot;
             */
            return "W/" + sb.ToString();
        }

        protected internal override void OnStart()
        {
            base.OnStart();
            extensions = Config.GetStringArray(ExtensionsProperty);
        }

        public override bool IsMath(IHttpSite httpSite, string rawUrl)
        {
            return IsMatchExtension(rawUrl) && HttpUtility.GetFileInfo(httpSite, rawUrl) != null;
        }

        public override void Handle(IHttpContext context)
        {
            var request = context.Request;
            var response = context.Response;
            var rawUrl = context.RawUrl;
            var fileInfo = HttpUtility.GetFileInfo(context.Site, rawUrl);
            if (fileInfo == null)
            {
                //文件未找到
                throw new FileNotFoundException(rawUrl);
            }
            var extension = Path.GetExtension(fileInfo.Name);
            response.ContentType = ContentTypes.GetContentType(extension);
            using (var outputStream = fileInfo.Open(FileMode.Open, FileAccess.Read, FileShare.Read))
            {
                //先锁定文件，再从新获取
                fileInfo.Refresh();
                response.AddHeader(HttpResponseHeader.ETag.ToString(), GetETag(fileInfo));
                response.AddHeader(HttpResponseHeader.LastModified.ToString(), fileInfo.LastWriteTime.ToUniversalTime().ToString("r"));
                var rangeText = request.Headers[HttpRequestHeader.Range.ToString()];
                if (rangeText != null)
                {
                    var pattern = @"^bytes=(?<begin>\d*?)-(?<end>\d*?)$";
                    var match = Regex.Match(rangeText, pattern);
                    if (match.Success)
                    {
                        //分段下载
                        response.AddHeader(HttpResponseHeader.AcceptRanges.ToString(), "bytes");
                        var lengthSentinel = fileInfo.Length - 1;
                        var rangeEndText = match.Groups["end"].Value;
                        var rangeBeginText = match.Groups["begin"].Value;
                        var rangeEndIndex = !string.IsNullOrEmpty(rangeEndText) ? long.Parse(rangeEndText) : lengthSentinel;
                        var rangeBeginIndex = !string.IsNullOrEmpty(rangeBeginText) ? long.Parse(rangeBeginText) : 0;
                        if (rangeBeginIndex < 0 || rangeEndIndex < 0 || rangeBeginIndex > rangeEndIndex)
                        {
                            response.StatusCode = (int)HttpStatusCode.RequestedRangeNotSatisfiable;
                            return;
                        }
                        if (rangeBeginIndex > lengthSentinel) rangeBeginIndex = lengthSentinel;
                        if (rangeEndIndex > lengthSentinel) rangeEndIndex = lengthSentinel;

                        //Content-Range: bytes 0-10/3103
                        var remainderLength = rangeEndIndex - rangeBeginIndex + 1;
                        response.ContentLength64 = remainderLength;
                        response.StatusCode = (int)HttpStatusCode.PartialContent;
                        response.AddHeader(HttpResponseHeader.ContentRange.ToString(), string.Format("bytes {0}-{1}/{2}", rangeBeginIndex, rangeEndIndex, fileInfo.Length));
                        if (remainderLength > 0)
                        {
                            int length;
                            int affectedLength;
                            var buffer = new byte[Math.Min(10240, remainderLength)];
                            outputStream.Seek(rangeBeginIndex, SeekOrigin.Begin);
                            while (remainderLength > 0)
                            {
                                affectedLength = Math.Min(checked((int)remainderLength), buffer.Length);
                                if ((length = outputStream.Read(buffer, 0, affectedLength)) <= 0)
                                {
                                    break;
                                }

                                remainderLength -= length;
                                response.OutputStream.Write(buffer, 0, length);
                            }
                        }
                        return;
                    }
                }

                response.ContentLength64 = fileInfo.Length;
                response.StatusCode = (int)HttpStatusCode.OK;
                outputStream.CopyTo(response.OutputStream);
            }
        }
    }
}
