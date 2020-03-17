using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Framework;

#if UserDefined
using SimpleHttpServer.Net;
#else
using System.Net;
#endif

namespace SimpleHttpServer.Scripts
{
    internal class HttpFileCollection : BaseDisposed, IHttpFileCollection
    {
        private List<HttpFile> files = new List<HttpFile>();

        internal HttpFileCollection()
        { }

        public HttpFile this[int index]
        {
            get
            {
                CheckDisposed();
                return files[index];
            }
        }

        public HttpFile this[string key]
        {
            get
            {
                CheckDisposed();
                return files.Find(p => p.Key == key);
            }
        }

        public int Count => files.Count;

        public IEnumerator<HttpFile> GetEnumerator()
        {
            return files.GetEnumerator();
        }

        IEnumerator IEnumerable.GetEnumerator()
        {
            return GetEnumerator();
        }

        internal void Resolve(HttpListenerRequest httpRequest)
        {
            HttpFile file;
            Reader reader = new Reader(httpRequest, Encoding.UTF8);
            while (!reader.EndOfReader)
            {
                try
                {
                    file = reader.Read();
                }
                catch
                {
                    files.ForEach(p => p.Dispose());
                    files.Clear();
                    throw;
                }

                files.Add(file);
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    foreach (var multimedia in files)
                    {
                        multimedia.Dispose();
                    }

                    files.Clear();
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        class Reader
        {
            private readonly HttpListenerRequest httpRequest;
            private readonly Encoding encoding;
            private readonly Stream stream;
            private readonly string beginBounaryText;
            private readonly byte[] byteArrayForBeginBounary;
            private readonly byte[] byteArrayForEndBounary;
            private readonly byte[] byteArrayForNewLine;
            private readonly int halfLength;
            private byte[] buffer;
            private int bufferOffset;
            private int bufferCount;
            private bool endOfStream;
            private bool endOfReader;

            public Reader(HttpListenerRequest httpRequest, Encoding encoding)
            {
                this.httpRequest = httpRequest;
                this.encoding = encoding;
                this.stream = httpRequest.InputStream;

                var separatorText = "--";
                var boundaryText = GetBoundary();
                beginBounaryText = separatorText + boundaryText;
                byteArrayForBeginBounary = encoding.GetBytes(beginBounaryText);
                byteArrayForEndBounary = encoding.GetBytes(beginBounaryText + separatorText);
                byteArrayForNewLine = encoding.GetBytes("\r\n");
                halfLength = Math.Max(5120, byteArrayForBeginBounary.Length + byteArrayForEndBounary.Length);
                buffer = new byte[halfLength * 2];
            }

            public bool EndOfReader => endOfReader;

            private string GetBoundary()
            {
                // multipart/form-data; boundary=----WebKitFormBoundarybwuLrLBGufffONo5
                foreach (var pair in httpRequest.ContentType.Split(';'))
                {
                    var array = pair.Split('=');
                    if (array.Length == 2)
                    {
                        var name = array[0].TrimStart();
                        if (name.Equals("Boundary", StringComparison.CurrentCultureIgnoreCase))
                        {
                            return array[1];
                        }
                    }
                }
                throw new InvalidOperationException();
            }

            private bool IsMatch(int offset, byte[] bytes)
            {
                if (bufferCount - offset < bytes.Length)
                {
                    //缓存字节不够
                    return false;
                }
                for (int i = 0; i < bytes.Length; i++)
                {
                    if (buffer[bufferOffset + offset + i] != bytes[i])
                        return false;
                }
                return true;
            }

            private int Find(byte[] bytes)
            {
                if (bufferCount > bytes.Length)
                {
                    int endSentinel = bufferCount - bytes.Length;
                    for (int i = 0; i < endSentinel; i++)
                    {
                        if (IsMatch(i, bytes))
                            return bufferOffset + i;
                    }
                }
                return -1;
            }

            private void EnsureBuffer()
            {
                if (!endOfStream)
                {
                    if (bufferOffset >= halfLength)
                    {
                        if (bufferCount > 0)
                        {
                            Array.Copy(buffer, bufferOffset, buffer, 0, bufferCount);
                        }
                        bufferOffset = 0;
                    }

                    int length;
                    int remainder = buffer.Length - bufferOffset - bufferCount;
                    while (remainder > 0)
                    {
                        if ((length = stream.Read(buffer, bufferOffset, buffer.Length - bufferOffset)) <= 0)
                        {
                            endOfStream = true;
                            return;
                        }

                        bufferCount += length;
                        remainder -= length;
                    }
                }
            }

            private string ReadLine()
            {
                int index;
                var length = 0;
                var bytes = new byte[1024];
                do
                {
                    EnsureBuffer();
                    index = Find(byteArrayForNewLine);
                    var influenced = index == -1 ? bufferCount : index - bufferOffset;
                    var estimated = influenced + length;
                    if (estimated > bytes.Length)
                    {
                        var newLength = bytes.Length * 2;
                        if (newLength < estimated) newLength = estimated;
                        Array.Resize(ref bytes, newLength);
                    }

                    Array.Copy(buffer, bufferOffset, bytes, length, influenced);
                    bufferCount -= influenced;
                    bufferOffset += influenced;
                    length += influenced;
                    if (index != -1)
                    {
                        bufferCount -= byteArrayForNewLine.Length;
                        bufferOffset += byteArrayForNewLine.Length;
                        break;
                    }
                } while (!endOfStream);
                return encoding.GetString(bytes, 0, length);
            }

            public HttpFile Read()
            {
                var lineText = ReadLine();
                if (!lineText.StartsWith(beginBounaryText, StringComparison.Ordinal))
                    throw new InvalidOperationException("begin bounary match failed.");

                var header = new Dictionary<string, string>();
                while (!(lineText = ReadLine()).Equals(string.Empty))
                {
                    var array = lineText.Split(':');
                    header[array[0]] = array[1].TrimStart();
                }

                int influenced;
                var inputPath = Path.GetTempFileName();
                var inputStream = new FileStream(inputPath, FileMode.Create, FileAccess.ReadWrite);
                try
                {
                    do
                    {
                        EnsureBuffer();
                        var index = Find(byteArrayForBeginBounary);
                        if (index != -1)
                        {
                            //找到了结束标识
                            if (index - byteArrayForNewLine.Length < bufferOffset)
                            {
                                //说明开始符号和结束符号之间没换行
                                throw new InvalidOperationException("start and end bounary match failed.");
                            }

                            influenced = index - bufferOffset - byteArrayForNewLine.Length;
                        }
                        else
                        {
                            //文件没结束
                            influenced = bufferCount;
                        }
                        if (inputStream.Length + influenced > Application.Current.Setting.MaxUploadFileLength)
                        {
                            //文件超过配置最大长度
                            throw new FileLengthOutOfSettingException("file too large");
                        }
                        inputStream.Write(buffer, bufferOffset, influenced);
                        bufferCount -= influenced;
                        bufferOffset += influenced;
                        if (index != -1)
                        {
                            //跳过文件内容到分隔标识的换行
                            bufferCount -= byteArrayForNewLine.Length;
                            bufferOffset += byteArrayForNewLine.Length;

                            EnsureBuffer();
                            if (IsMatch(0, byteArrayForEndBounary))
                            {
                                //结束了
                                endOfReader = true;
                                bufferCount -= byteArrayForEndBounary.Length;
                                bufferOffset += byteArrayForEndBounary.Length;
                            }

                            inputStream.Position = 0;
                            return new HttpFile(encoding, header, inputStream, inputPath);
                        }

                    } while (!endOfStream);

                    throw new InvalidOperationException("file stream error.");
                }
                catch
                {
                    inputStream.Dispose();
                    try
                    {
                        File.Delete(inputPath);
                    }
                    catch
                    { }
                    throw;
                }
            }
        }

        class FileLengthOutOfSettingException : Exception
        {
            public FileLengthOutOfSettingException(string message)
                : base(message)
            { }
        }
    }

    public interface IHttpFileCollection : IReadOnlyCollection<HttpFile>
    {
        HttpFile this[int index] { get; }

        HttpFile this[string key] { get; }
    }
}
