﻿using System;
using System.Collections.Generic;
using System.Data;
using System.Net;
using Framework.Data;
using Framework.Data.Converters;
using Framework.JavaScript;
using Framework.JavaScript.Converters;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth.Entity
{
    [EntityTable(ConnectKey = "OAuth")]
    public class App : RowAdapter
    {
        [EntityColumn]
        public long OwnerID { get; set; }

        [JsonMember]
        [EntityColumn(MaxLength = 20)]
        public string Name { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 50)]
        public string Domain { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString)]
        public string IconURL { get; set; }

        [JsonMember]
        [EntityColumn(DbType = DbType.AnsiString, MaxLength = 32)]
        public string Key { get; set; }

        [EntityColumn]
        public DateTime CreateTime { get; set; }

        [EntityColumn]
        public bool Deleted { get; set; }

        [EntityColumn]
        public DateTime DeleteTime { get; set; }

        [EntityColumn(DbType = DbType.AnsiString, ConvertType = typeof(JsonEntityConverter<AccessRestriction>))]
        public AccessRestriction AccessRestriction { get; set; }

        protected override void CreateSuccess()
        {
            base.CreateSuccess();
            Key = Guid.NewGuid().ToString("N");
            CreateTime = DateTime.Now;
            DeleteTime = new DateTime(1970, 1, 1);
            AccessRestriction = new AccessRestriction();
        }

        protected override void Initialize()
        {
            base.Initialize();
            if (AccessRestriction == null)
                AccessRestriction = new AccessRestriction();
        }

        public void Delete()
        {
            Deleted = true;
            DeleteTime = DateTime.Now;
            Save();
        }
    }

    public class AccessRestriction
    {
        public AccessRestriction()
        {
            Addresses = new List<string>();
        }

        [JsonMember]
        public IPLimitStatus State { get; set; }

        [JsonMember(ConverterType = typeof(JsonCollectionConverter<string>))]
        public List<string> Addresses { get; set; }

        public bool Security(IPAddress address)
        {
            if (address == null)
                throw new ArgumentNullException("address");

            return State == IPLimitStatus.所有IP || Addresses.Contains(address.ToString());
        }

        public enum IPLimitStatus : byte
        {
            所有IP,
            特定IP,
        }
    }
}
