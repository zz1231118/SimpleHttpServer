using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using Framework;

namespace SimpleHttpServer.Scripts
{
    public class HttpFile : BaseDisposed
    {
        private readonly Encoding encoding;
        private readonly IReadOnlyDictionary<string, string> header;
        private readonly Stream stream;
        private readonly string path;
        private string key;
        private string fileName;

        internal HttpFile(Encoding encoding, IReadOnlyDictionary<string, string> header, Stream stream, string path)
        {
            this.encoding = encoding;
            this.header = header;
            this.stream = stream;
            this.path = path;

            Initialize();
        }

        public IReadOnlyDictionary<string, string> Header => header;

        public Stream Stream => stream;

        public long Length => stream.Length;

        public string Key => key;

        public string FileName => fileName;

        public bool IsFormField => !header.ContainsKey("Content-Type");

        private void Initialize()
        {
            if (header.TryGetValue("Content-Disposition", out string content))
            {
                //form-data; name=\"file\"; filename=\"test.pcm\"
                foreach (var part in content.Split(';'))
                {
                    var array = part.Split('=');
                    if (array.Length == 2)
                    {
                        var key = array[0].TrimStart();
                        var value = array[1].Trim('"');
                        switch (key.ToLower())
                        {
                            case "name":
                                this.key = value;
                                break;
                            case "filename":
                                fileName = value;
                                break;
                        }
                    }
                }
            }
        }

        protected override void Dispose(bool disposing)
        {
            if (!IsDisposed)
            {
                try
                {
                    stream.Dispose();

                    try
                    {
                        File.Delete(path);
                    }
                    catch
                    { }
                }
                finally
                {
                    base.Dispose(disposing);
                }
            }
        }

        public bool GetBoolean()
        {
            return stream.ReadByte() == 1;
        }

        public byte GetByte()
        {
            var value = stream.ReadByte();
            return value == -1 ? (byte)0 : (byte)value;
        }

        public sbyte GetSByte()
        {
            var value = stream.ReadByte();
            return value == -1 ? (sbyte)0 : (sbyte)value;
        }

        public short GetInt16()
        {
            var buffer = new byte[sizeof(short)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToInt16(buffer, 0);
        }

        public ushort GetUInt16()
        {
            var buffer = new byte[sizeof(ushort)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToUInt16(buffer, 0);
        }

        public int GetInt32()
        {
            var buffer = new byte[sizeof(int)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToInt32(buffer, 0);
        }

        public uint GetUInt32()
        {
            var buffer = new byte[sizeof(uint)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToUInt32(buffer, 0);
        }

        public long GetInt64()
        {
            var buffer = new byte[sizeof(long)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToInt64(buffer, 0);
        }

        public ulong GetUInt64()
        {
            var buffer = new byte[sizeof(ulong)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToUInt64(buffer, 0);
        }

        public float GetSingle()
        {
            var buffer = new byte[sizeof(float)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToSingle(buffer, 0);
        }

        public double GetDouble()
        {
            var buffer = new byte[sizeof(double)];
            stream.Read(buffer, 0, buffer.Length);
            return BitConverter.ToDouble(buffer, 0);
        }

        public decimal GetDecimal()
        {
            var buffer = new byte[sizeof(decimal)];
            stream.Read(buffer, 0, buffer.Length);
            int lo = buffer[0] | (buffer[1] << 8) | (buffer[2] << 16) | (buffer[3] << 24);
            int mid = buffer[4] | (buffer[5] << 8) | (buffer[6] << 16) | (buffer[7] << 24);
            int hi = buffer[8] | (buffer[9] << 8) | (buffer[10] << 16) | (buffer[11] << 24);
            int flags = buffer[12] | (buffer[13] << 8) | (buffer[14] << 16) | (buffer[15] << 24);
            return new decimal(lo, mid, hi, false, (byte)(flags >> 16));
        }

        public string GetString()
        {
            var bytes = new byte[stream.Length];
            stream.Read(bytes, 0, bytes.Length);
            return encoding.GetString(bytes);
        }

        public byte[] GetBytes()
        {
            var bytes = new byte[stream.Length];
            stream.Read(bytes, 0, bytes.Length);
            return bytes;
        }
    }
}
