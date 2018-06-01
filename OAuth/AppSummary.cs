using LyxFramework.Jsons;

namespace OAuth
{
    public class AppSummary
    {
        [JsonMember]
        public long ID { get; internal set; }
        [JsonMember]
        public string Name { get; internal set; }
        [JsonMember]
        public string Domain { get; internal set; }

        public override string ToString()
        {
            return JsonSerializer.Serialize(this).ToString();
        }
    }
}
