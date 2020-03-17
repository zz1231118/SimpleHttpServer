using System;

namespace OAuth
{
    public class AppKey : IEquatable<AppKey>
    {
        private long _id;

        public AppKey(long id)
        {
            _id = id;
        }

        public long ID => _id;

        public bool Equals(AppKey other)
        {
            return other != null && other._id == _id;
        }
        public override bool Equals(object obj)
        {
            return Equals(obj as AppKey);
        }
        public override int GetHashCode()
        {
            return _id.GetHashCode();
        }
    }
}
