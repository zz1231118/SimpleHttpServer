using System;
using System.Collections.Generic;
using System.Reflection;
using LyxFramework.Jsons;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.test
{
    public class app_account : CSharpScript
    {
        private const string AppID = "1";
        private const string AppKey = "5529ea5a3677463385b7f34426dba0aa";

        public app_account(IScriptContext context)
            : base(context)
        { }

        public override void Invoke()
        {
            Header(System.Net.HttpResponseHeader.ContentEncoding, "utf-8");
            var action = Get.Find("action");
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

            try
            {
                method.Invoke(this, null);
            }
            catch (Exception ex)
            {
                WrapResult(false, ex.Message);
            }
        }

        void Login()
        {
            var code = Post.Find("code");

            var kv = new Dictionary<string, string>();
            kv["app_id"] = AppID;
            kv["app_key"] = AppKey;
            kv["code"] = code;
            var str = Http.Post(@"http://open.zz1231118.com/open.cs?action=Swap", null, kv);
            var json = Json.Parse<JsonObject>(str);

            kv = new Dictionary<string, string>();
            kv["access_token"] = ((JsonObject)json["data"])["access_token"];
            str = Http.Post(@"http://open.zz1231118.com/open.cs?action=UserInfo", null, kv);
            json = Json.Parse<JsonObject>(str);

            json = json["data"] as JsonObject;
            StartSession();
            Session["test-has-login"] = true;
            Session["test-account"] = json;

            //long appID = (long)json["app_id"];
            //string openID = (string)json["open_id"];
            //string nickname = (string)json["nick_name"];
            //string real_name = (string)json["real_name"];
            WrapResult(true, json);
        }
        void Logout()
        {
            DestroySession();
            WrapResult(true);
        }
        void Info()
        {
            StartSession();

            if (!(bool)Session.Find("test-has-login", false))
            {
                WrapResult(false, "not login!");
                return;
            }

            var account = Session["test-account"] as JsonObject;
            var json = new JsonObject();
            json["Name"] = account["open_id"];
            json["Nickname"] = account["nick_name"];
            json["Realname"] = account["real_name"];
            WrapResult(true, json);
        }
    }
}
