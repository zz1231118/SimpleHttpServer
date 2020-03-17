using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Framework.JavaScript;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Entity;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.Handler
{
    public class AppHandler : AppScript
    {
        private Account _account;

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

        void UploadIcon()
        {
            if (Files.Count != 1)
            {
                WrapResult(false, "icon file not found!");
                return;
            }

            var file = Files.First();
            if (file.Length > 80 * 1024)
            {
                WrapResult(false, "file size error!");
                return;
            }
            var extension = Path.GetExtension(file.FileName);
            if (extension != ".png")
            {
                WrapResult(false, "file format error!");
                return;
            }

            var uri = "/icons/" + _account.OpenID + "/";
            var dirPath = Path.Combine(Application.Current.BaseDirectory, "icons", _account.OpenID);
            if (!Directory.Exists(dirPath)) Directory.CreateDirectory(dirPath);

            var name = Guid.NewGuid().ToString("N") + extension;
            var path = Path.Combine(dirPath, name);
            byte[] bytes = new byte[Math.Min(file.Length, 1024)];
            using (var fs = new FileStream(path, FileMode.Create, FileAccess.Write))
                file.Stream.CopyTo(fs);

            uri += name;
            WrapResult(true, uri);
        }
        void New()
        {
            var name = Form.Find("app_name");
            var domain = Form.Find("app_domain");
            var icon = Form.Find("icon");

            var app = RowAdapter.Create<App>();
            app.OwnerID = _account.ID;
            app.Name = name;
            app.Domain = domain;
            app.IconURL = icon;
            app.Save();

            var json = new JsonObject();
            json["ID"] = app.ID;
            WrapResult(true, json);
        }
        void Update()
        {
            long id = Form.Find<long>("app_id");
            var name = Form.Find("app_name");
            var domain = Form.Find("app_domain");

            var apps = RowAdapter.Load<App>(p => p.OwnerID == _account.ID && p.Deleted == false && p.ID == id);
            var app = apps.FirstOrDefault();
            if (app == null)
            {
                WrapResult(false, "not found app id:" + id);
                return;
            }

            app.Name = name;
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