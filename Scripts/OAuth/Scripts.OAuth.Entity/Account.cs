using System;
using System.Data;
using Framework.Data;
using Framework.JavaScript;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth.Entity
{
    [EntityTable(ConnectKey = "OAuth")]
    public class Account : RowAdapter
    {
        [JsonMember]
        [EntityColumn(IsPrimary = true, IsIdentity = true)]
        public override long ID { get; protected set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 50)]
        public string Name { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 200)]
        public string Password { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 32)]
        public string OpenID { get; set; }

        [JsonMember]
        [EntityColumn(MaxLength = 50)]
        public string Nickname { get; set; }

        [JsonMember]
        [EntityColumn]
        public DateTime CreateDate { get; set; }

        [JsonMember]
        [EntityColumn]
        public DateTime Birth { get; set; }

        [JsonMember]
        [EntityColumn(MaxLength = 5)]
        public string Realname { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 15)]
        public string Phone { get; set; }

        [JsonMember]
        [EntityColumn]
        public Gender Gender { get; set; }

        [JsonMember]
        [EntityColumn]
        public AdminType AdminType { get; set; }

        [JsonMember]
        [EntityColumn]
        public bool Available { get; set; }

        [EntityColumn]
        public bool Deleted { get; set; }

        [EntityColumn]
        public DateTime DeleteDate { get; set; }

        [EntityColumn]
        public int TotalErrorTimes { get; set; }

        [EntityColumn]
        public int TodayErrorTimes { get; set; }

        [EntityColumn]
        public DateTime LastCheckTime { get; set; }

        protected override void CreateSuccess()
        {
            base.CreateSuccess();
            CreateDate = DateTime.Now;
            Birth = new DateTime(1970, 1, 1);
            OpenID = Guid.NewGuid().ToString("N");
            Available = true;
            DeleteDate = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).ToLocalTime();
            LastCheckTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).ToLocalTime();
        }
        public void Delete()
        {
            Deleted = true;
            DeleteDate = DateTime.Now;
            Save();
        }
        public void CheckErrorReset()
        {
            if (LastCheckTime.Date != DateTime.Now.Date)
            {
                ResetError();
            }
        }
        public void ResetError()
        {
            TodayErrorTimes = 0;
            LastCheckTime = DateTime.Now;
        }
    }
}
