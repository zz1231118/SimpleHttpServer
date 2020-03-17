using System;
using System.Reflection;
using Framework.JavaScript;
using Framework.Log;
using OAuth;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.Test
{
    public class AppAccount : AppScript
    {
        private const long AppID = 14;
        private const string AppKey = "3c2e3f96821e4358ab63c0f257bb3b51";

        private readonly ILogger logger = Logger.GetLogger<AppAccount>();

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

            try
            {
                method.Invoke(this, null);
            }
            catch (Exception ex)
            {
                logger.Warn(ex.ToString());
                WrapResult(false, ex.Message);
            }
        }

        void Login()
        {
            var auth_token = Form.Find("auth_token");

            var key = new AppLushKey(AppID, AppKey);
            var access = Auth.Authorization(key, auth_token);
            var summary = Auth.GetUserSummary(access);

            StartSession();
            Session["test-has-login"] = true;
            Session["test-user-summary"] = JsonSerializer.Serialize(summary);

            //long appID = (long)json["app_id"];
            //string openID = (string)json["open_id"];
            //string nickname = (string)json["nick_name"];
            //string real_name = (string)json["real_name"];
            WrapResult(true, summary);
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

            var userSummary = JsonSerializer.Deserialize<UserSummary>(Session["test-user-summary"]);
            WrapResult(true, userSummary);
        }
    }
}
