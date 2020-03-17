using System;
using System.Data;
using Framework.Data;
using Framework.JavaScript;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth.Entity
{
    [EntityTable(ConnectKey = "OAuth")]
    public class Invite : RowAdapter
    {
        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 32)]
        public string Code { get; set; }

        [JsonMember]
        [EntityColumn]
        public DateTime Birth { get; set; }

        [JsonMember]
        [EntityColumn]
        public bool Available { get; set; }

        [JsonMember]
        [EntityColumn]
        public DateTime UseTime { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 20)]
        public string Account { get; set; }

        [EntityColumn]
        public bool Deleted { get; set; }

        [EntityColumn]
        public DateTime DeleteDate { get; set; }

        protected override void CreateSuccess()
        {
            base.CreateSuccess();
            Code = Guid.NewGuid().ToString("N");
            Birth = DateTime.Now;
            Available = true;
            UseTime = new DateTime(1970, 1, 1);
            DeleteDate = new DateTime(1970, 1, 1);
        }

        public void Delete()
        {
            Deleted = true;
            DeleteDate = DateTime.Now;
            Save();
        }
    }
}
