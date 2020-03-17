using System;
using System.Data.SqlClient;
using System.Reflection;
using Framework.Data;
using Framework.Data.MsSql;
using Framework.JavaScript;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Behaviours;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth
{
    public class Global : Application
    {
        protected override void OnStartup()
        {
            var sb = new SqlConnectionStringBuilder();
            sb.DataSource = "(local)";
            sb.IntegratedSecurity = true;
            sb.InitialCatalog = "Manager.OAuth";
            DbFactory.Register("OAuth", new MsSqlDbProvider(10, sb.ConnectionString));

            EntitySchemaManager.LoadAssemblys(new Assembly[] { typeof(App).Assembly });
            foreach (var dbProvider in DbFactory.DbProviders)
            {
                EntityUtils.CheckCreateDatabase(dbProvider.ConnectionString);
            }
            foreach (var view in EntitySchemaManager.Schemas)
            {
                EntityUtils.CheckSchema(view);
                RowAdapter.LoadPrimary(view);
            }
        }
    }

    [HttpBehaviour(typeof(HttpJsonBodyBehaviour))]
    public abstract class AppScript : CSharpScript
    {
        protected void WrapResult(bool result, object data = null)
        {
            var json = new JsonObject();
            json["result"] = result;
            if (data != null)
            {
                json["data"] = JsonSerializer.Serialize(data);
            }

            Response.Write(json.ToString());
        }

        protected void WrapResult(int status, object data = null)
        {
            var json = new JsonObject();
            json["status"] = status;
            if (data != null)
            {
                json["data"] = JsonSerializer.Serialize(data);
            }

            Response.Write(json.ToString());
        }

        protected void WrapResult(Enum code, object data = null)
        {
            var underlyingType = Enum.GetUnderlyingType(code.GetType());
            var enval = Convert.ChangeType(code, underlyingType);
            WrapResult(Convert.ToInt32(enval), data);
        }
    }

    public enum ResultCode : byte
    {
        OK = 0,
        NotLoin,
        ServerError,
        InvalidParam,
        InvalidAction,
    }

    public abstract class OAuthScript : AppScript
    {
        public const string AccountProperty = "account";

        private Account _account;

        public bool IsAuthority
        {
            get
            {
                StartSession();
                return Session.ContainsKey(AccountProperty);
            }
        }

        public Account Account
        {
            get
            {
                if (_account == null)
                {
                    StartSession();
                    if (Session.ContainsKey(AccountProperty))
                    {
                        _account = JsonSerializer.Deserialize<Account>(Session[AccountProperty]);
                    }
                }

                return _account;
            }
        }
    }
}