using System;
using LyxFramework.Data;
using LyxFramework.Jsons;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth.Entity
{
    [EntityTable(ConnectKey = "OAuth")]
    public class App : RowAdapter
    {
        [EntityColumn]
        public long OwnerID { get; set; }
        [JsonMember]
        [EntityColumn(DbType = "NVarChar(20)")]
        public string Name { get; set; }
        [JsonMember]
        [EntityColumn(DbType = "VarChar(50)")]
        public string Domain { get; set; }
        [JsonMember]
        [EntityColumn(DbType = "VarChar(32)")]
        public string Key { get; set; }
        [EntityColumn]
        public DateTime CreateTime { get; set; }
        [EntityColumn]
        public bool Deleted { get; set; }
        [EntityColumn]
        public DateTime DeleteTime { get; set; }

        protected override void CreateSuccess()
        {
            base.CreateSuccess();
            Key = Guid.NewGuid().ToString("N");
            CreateTime = DateTime.Now;
            DeleteTime = new DateTime(1970, 1, 1);
        }
        public void Delete()
        {
            Deleted = true;
            DeleteTime = DateTime.Now;
            Save();
        }
    }
}
