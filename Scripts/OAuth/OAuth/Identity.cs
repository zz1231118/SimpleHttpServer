using System;
using Framework.JavaScript;

namespace OAuth
{
    public sealed class Identity : IEquatable<Identity>
    {
        private AppKey _key;
        private string _account;
        private string _token;
        private DateTime _expires;

        internal Identity(AppKey key, string account, string token, DateTime expires)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (account == null)
                throw new ArgumentNullException(nameof(account));
            if (token == null)
                throw new ArgumentNullException(nameof(token));

            _key = key;
            _account = account;
            _token = token;
            _expires = expires;
        }

        [JsonMember]
        public string Account => _account;

        [JsonMember]
        public string Token => _token;

        [JsonMember]
        public DateTime Expires => _expires;

        public bool Equals(Identity other)
        {
            return other != null && other._account == _account;
        }
        public override bool Equals(object obj)
        {
            return Equals(obj as Identity);
        }
        public override int GetHashCode()
        {
            return _account.GetHashCode();
        }
        public override string ToString()
        {
            return JsonSerializer.Serialize(this).ToString();
        }
    }
}