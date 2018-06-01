using System;
using LyxFramework.Jsons;

namespace OAuth
{
    public sealed class Access
    {
        internal Access()
        { }
        internal Access(string accessToken, string refreshToken, DateTime expires)
        {
            AccessToken = accessToken;
            RefreshToken = refreshToken;
            Expires = expires;
        }

        [JsonMember]
        public string AccessToken { get; internal set; }
        [JsonMember]
        public string RefreshToken { get; internal set; }
        [JsonMember]
        public DateTime Expires { get; internal set; }

        public void Refresh()
        {
            if (RefreshToken == null)
                throw new InvalidOperationException("non refresh");

            Auth.Refresh(this);
        }
        public override string ToString()
        {
            return JsonSerializer.Serialize(this).ToString();
        }
    }
}
