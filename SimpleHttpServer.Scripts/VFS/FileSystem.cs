using System;
using System.Collections.Concurrent;
using System.Collections.Generic;

namespace SimpleHttpServer.Scripts.VFS
{
    public static class FileSystem
    {
        private static ConcurrentDictionary<string, VFile> _kv = new ConcurrentDictionary<string, VFile>();
        private static Func<string, VFile> _valueFactory = key => new VFile(key);

        public static IReadOnlyList<VFile> Files => (IReadOnlyList<VFile>)_kv.Values;

        public static VFile GetOrCreate(string path)
        {
            return _kv.GetOrAdd(path, _valueFactory);
        }
        public static bool TryGet(string path, out VFile file)
        {
            return _kv.TryGetValue(path, out file);
        }
        public static bool Remove(VFile file)
        {
            return _kv.TryRemove(file.FullName, out VFile rFile);
        }
        public static bool Remove(string path)
        {
            return _kv.TryRemove(path, out VFile file);
        }
    }
}
