using System.Data.SqlClient;
using System.Reflection;
using LyxFramework.Data;
using LyxFramework.Data.MsSql;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Entity;

namespace Scripts.OAuth
{
    public class Global : Application
    {
        protected override void OnStartup()
        {
            var sb = new SqlConnectionStringBuilder();
            sb.DataSource = "(local)";
            sb.InitialCatalog = "Account";
            sb.IntegratedSecurity = true;
            DbFactory.Register(sb.InitialCatalog, new MsSqlDbProvider(10, sb.ConnectionString));
            sb = new SqlConnectionStringBuilder();
            sb.DataSource = "(local)";
            sb.InitialCatalog = "OAuth";
            sb.IntegratedSecurity = true;
            DbFactory.Register(sb.InitialCatalog, new MsSqlDbProvider(10, sb.ConnectionString));

            EntitySchemaSet.LoadAssemblys(new Assembly[] { typeof(App).Assembly });
            foreach (var dbProvider in DbFactory.DbProviders)
                EntityUtils.CheckDb(dbProvider.ConnectionString);
            foreach (var view in EntitySchemaSet.Views)
            {
                EntityUtils.CheckSchema(view);
                RowAdapter.LoadPrimary(view);
            }
        }
    }
}