using LyxFramework.Jsons;

namespace OAuth
{
    public class UserSummary
    {
        [JsonMember]
        public string OpenID { get; internal set; }
        [JsonMember]
        public string Nickname { get; internal set; }
        [JsonMember]
        public string Realname { get; internal set; }
        [JsonMember]
        public Gender Gender { get; internal set; }

        public override string ToString()
        {
            return JsonSerializer.Serialize(this).ToString();
        }
    }

    public enum Gender : byte
    {
        Unknown,
        Man,
        Woman,
    }
}
