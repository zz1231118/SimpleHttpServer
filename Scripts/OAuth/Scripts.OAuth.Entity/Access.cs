using System;
using System.Data;
using Framework.Data;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth.Entity
{
    [EntityTable(ConnectKey = "OAuth")]
    public class Access : RowAdapter
    {
        public static readonly TimeSpan Interval = TimeSpan.FromDays(5);

        [EntityColumn]
        public long OwnerID { get; set; }

        [EntityColumn]
        public long AppID { get; set; }

        [EntityColumn]
        public DateTime DeathLine { get; set; }

        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 32)]
        public string AccessToken { get; set; }

        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 32)]
        public string RefreshToken { get; set; }

        public bool Available
        {
            get { return DeathLine >= DateTime.Now; }
        }

        protected override void CreateSuccess()
        {
            base.CreateSuccess();
            Reset();
        }
        public void Reset()
        {
            Refresh();
            RefreshToken = Guid.NewGuid().ToString("N");
        }
        public void Refresh()
        {
            DeathLine = DateTime.Now + Interval;
            AccessToken = Guid.NewGuid().ToString("N");
        }
    }
}
