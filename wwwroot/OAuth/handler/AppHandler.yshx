using System;
using System.Linq;
using System.Reflection;
using LyxFramework.Jsons;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Entity;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.Handler
{
    public class AppHandler : CSharpScript
    {
        private Account _account;

        public AppHandler(IScriptContext context)
            : base(context)
        { }

        public override void Invoke()
        {
            var action = Query.Find("action");
            if (action == null)
            {
                WrapResult(false, "invaild action!");
                return;
            }

            var bindAttr = BindingFlags.Instance | BindingFlags.Public |
                BindingFlags.NonPublic | BindingFlags.DeclaredOnly |
                BindingFlags.InvokeMethod;
            var method = GetType().GetMethod(action, bindAttr);
            if (method == null)
            {
                WrapResult(false, "unknown action:" + action);
                return;
            }

            StartSession();
            if (!(bool)Session.Find("has-login", false))
            {
                WrapResult(false, "not login!");
                return;
            }

            _account = JsonSerializer.Deserialize<Account>(Session["account"]);

            try
            {
                method.Invoke(this, null);
            }
            catch (Exception ex)
            {
                WrapResult(false, ex.Message);
            }
        }

        private JsonObject FromApp(App app)
        {
            var json = new JsonObject();
            json["ID"] = app.ID;
            json["Name"] = app.Name;
            json["Key"] = app.Key;
            json["Domain"] = app.Domain;
            return json;
        }

        void New()
        {
            var name = Form.Find("app_name");
            var domain = Form.Find("app_domain");

            var app = RowAdapter.Create<App>();
            app.OwnerID = _account.ID;
            app.Name = name;
            app.Domain = domain;
            app.Save();

            var json = new JsonObject();
            json["ID"] = app.ID;
            WrapResult(true, json);
        }
        void Update()
        {
            long id = Form.Find<long>("app_id");
            string domain = Form.Find<string>("app_domain");

            var apps = RowAdapter.Load<App>(p => p.OwnerID == _account.ID && p.Deleted == false && p.ID == id);
            var app = apps.FirstOrDefault();
            if (app == null)
            {
                WrapResult(false, "not found app id:" + id);
                return;
            }

            app.Domain = domain;
            app.Save();
            WrapResult(true, FromApp(app));
        }
        void Delete()
        {
            long id = Form.Find<long>("app_id");

            var apps = RowAdapter.Load<App>(p => p.OwnerID == _account.ID && p.Deleted == false && p.ID == id);
            var app = apps.FirstOrDefault();
            if (app == null)
            {
                WrapResult(false, "not found app id:" + id);
                return;
            }

            app.Delete();
            WrapResult(true);
        }
        void List()
        {
            var appList = RowAdapter.Load<App>(p => p.OwnerID == _account.ID && p.Deleted == false);
            var arrayForApp = new JsonArray();
            foreach (var app in appList)
            {
                var json = JsonSerializer.Serialize(app);
                arrayForApp.Add(json);
            }
            WrapResult(true, arrayForApp);
        }
    }
}