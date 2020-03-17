using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace SimpleHttpServer.Scripts.VFS
{
    public static class FileSystem
    {
        private static ConcurrentDictionary<string, VFile> dictionary = new ConcurrentDictionary<string, VFile>();
        private static Func<string, VFile> _valueFactory = key => new VFile(key);

        public static IReadOnlyList<VFile> Files => (IReadOnlyList<VFile>)dictionary.Values;

        public static VFile GetFile(string path, bool createIfNull)
        {
            if (createIfNull)
            {
                return dictionary.GetOrAdd(path, _valueFactory);
            }
            else
            {
                dictionary.TryGetValue(path, out VFile value);
                return value;
            }
        }

        public static bool TryGet(string path, out VFile file)
        {
            return dictionary.TryGetValue(path, out file);
        }

        public static bool Remove(VFile file)
        {
            return dictionary.TryRemove(file.FullName, out VFile rFile);
        }

        public static bool Remove(string path)
        {
            return dictionary.TryRemove(path, out VFile file);
        }
    }
}
