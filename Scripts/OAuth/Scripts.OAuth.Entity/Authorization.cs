using System;
using System.Data;
using Framework.Data;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth.Entity
{
    [EntityTable(ConnectKey = "OAuth")]
    public class Authorization : RowAdapter
    {
        public static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

        [EntityColumn]
        public long OwnerID { get; set; }

        [EntityColumn]
        public long AppID { get; set; }

        [EntityColumn]
        public DateTime DeathLine { get; set; }

        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 32)]
        public string Token { get; set; }

        public bool Available
        {
            get { return DeathLine >= DateTime.Now; }
        }

        protected override void CreateSuccess()
        {
            base.CreateSuccess();
            DeathLine = DateTime.Now + Interval;
            Token = Guid.NewGuid().ToString("N");
        }

        public void Reset()
        {
            DeathLine = DateTime.Now + Interval;
            Token = Guid.NewGuid().ToString("N");
        }
    }
}
