using System;
using System.Linq;
using System.Reflection;
using LyxFramework.Data;
using LyxFramework.Data.Expressions;
using LyxFramework.Jsons;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Entity;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.Handler
{
    public class AuthHandler : CSharpScript
    {
        private const int MaxErrorTimes = 10;
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

        public AuthHandler(IScriptContext context)
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

            try
            {
                method.Invoke(this, null);
            }
            catch (Exception ex)
            {
                WrapResult(false, ex.Message);
            }
        }

        private JsonObject ErrorResult(int code, object data = null)
        {
            var json = new JsonObject();
            json["code"] = code;
            if (data != null)
            {
                json["data"] = JsonSerializer.Serialize(data);
            }

            return json;
        }

        void AppInfo()
        {
            long appID;
            if (!Form.TryGet("app_id", out appID))
            {
                WrapResult(false, "invalid param!");
                return;
            }

            var app = RowAdapter.LoadFirstOrDefault<App>(p => p.ID == appID && p.Deleted == false);
            if (app == null)
            {
                WrapResult(false, "not found app!");
                return;
            }

            var json = new JsonObject();
            json["name"] = app.Name;
            json["domain"] = app.Domain;
            WrapResult(true, json);
        }
        void Login()
        {
            var appID = Form.Find<long>("app_id");
            var name = Form.Find("account");
            var timestamp = Form.Find<long>("timestamp");
            var token = Form.Find("token");
            if (string.IsNullOrEmpty(name))
            {
                WrapResult(false, ErrorResult(1, "账号不能为空！"));
                return;
            }
            if (string.IsNullOrEmpty(token))
            {
                WrapResult(false, ErrorResult(1, "Token 不能为空！"));
                return;
            }

            var time = DateTimeExtension.ConvertFromTimestamp(timestamp);
            if (Math.Abs((DateTime.Now - time).TotalSeconds) > Interval.TotalSeconds)
            {
                WrapResult(false, ErrorResult(1, "Token 已过期！"));
                return;
            }

            var app = RowAdapter.LoadFirstOrDefault<App>(p => p.ID == appID && p.Deleted == false);
            if (app == null)
            {
                WrapResult(false, ErrorResult(1, "not found app!"));
                return;
            }

            var account = RowAdapter.LoadFirstOrDefault<Account>(p => p.Name == name);
            if (account == null)
            {
                WrapResult(false, ErrorResult(1, "指定帐号不存在！"));
                return;
            }
            if (!account.Available)
            {
                WrapResult(false, ErrorResult(1, "该帐号不可用！"));
                return;
            }

            account.CheckErrorReset();
            if (account.TodayErrorTimes >= MaxErrorTimes)
            {
                WrapResult(false, ErrorResult(1, "您的账号已被限制登录！"));
                return;
            }

            var credentials = new LyxFramework.Security.ServerDirectionalCredentials(account.Name, account.Password);
            var authorization = new LyxFramework.Security.Authorization(name, timestamp, token);
            if (!credentials.Authenticate(authorization))
            {
                account.TodayErrorTimes++;
                account.TotalErrorTimes++;
                account.Save();
                WrapResult(false, ErrorResult(1, "无效的Token！"));
                return;
            }
            if (string.IsNullOrEmpty(account.Realname) || string.IsNullOrEmpty(account.Phone))
            {
                WrapResult(false, ErrorResult(2, "帐号信息不完善，请先完善帐号信息！"));
                return;
            }

            var auth = RowAdapter.LoadFirstOrDefault<Authorization>(p => p.OwnerID == account.ID && p.AppID == app.ID);
            if (auth == null)
            {
                auth = RowAdapter.Create<Authorization>();
                auth.OwnerID = account.ID;
                auth.AppID = appID;
            }
            else
            {
                auth.Reset();
            }
            if (account.TodayErrorTimes > 0)
            {
                account.ResetError();
                account.Save();
            }

            auth.Save();
            var json = new JsonObject();
            json["auth_token"] = auth.Token;
            json["expires_in"] = (auth.DeathLine - DateTime.Now).TotalSeconds;
            WrapResult(true, json);
        }
        void Token()
        {
            var appID = Form.Find<long>("app_id");
            var name = Form.Find("account");
            var timestamp = Form.Find<long>("timestamp");
            var token = Form.Find("token");
            if (string.IsNullOrEmpty(name))
            {
                WrapResult(false, "账号不能为空！");
                return;
            }
            if (string.IsNullOrEmpty(token))
            {
                WrapResult(false, "Token 不能为空！");
                return;
            }

            var time = DateTimeExtension.ConvertFromTimestamp(timestamp);
            if (Math.Abs((DateTime.Now - time).TotalSeconds) > Interval.TotalSeconds)
            {
                WrapResult(false, "Token 已过期！");
                return;
            }

            var app = RowAdapter.LoadFirstOrDefault<App>(p => p.ID == appID && p.Deleted == false);
            if (app == null)
            {
                WrapResult(false, "not found app!");
                return;
            }

            var account = RowAdapter.LoadFirstOrDefault<Account>(p => p.Name == name);
            if (account == null)
            {
                WrapResult(false, "指定帐号不存在！");
                return;
            }
            if (!account.Available)
            {
                WrapResult(false, "该帐号不可用！");
                return;
            }

            account.CheckErrorReset();
            if (account.TodayErrorTimes >= MaxErrorTimes)
            {
                WrapResult(false, "您的账号已被限制登录！");
                return;
            }

            var credentials = new LyxFramework.Security.ServerDirectionalCredentials(account.Name, account.Password);
            var authorization = new LyxFramework.Security.Authorization(name, timestamp, token);
            if (!credentials.Authenticate(authorization))
            {
                account.TodayErrorTimes++;
                account.TotalErrorTimes++;
                account.Save();
                WrapResult(false, "无效的Token！");
                return;
            }
            if (account.TodayErrorTimes > 0)
            {
                account.ResetError();
                account.Save();
            }

            var access = RowAdapter.LoadFirstOrDefault<Access>(p => p.AppID == appID && p.OwnerID == account.ID);
            if (access == null)
            {
                access = RowAdapter.Create<Access>();
                access.OwnerID = account.ID;
                access.AppID = appID;
            }

            access.Reset();
            access.Save();
            var json = new JsonObject();
            json["access_token"] = access.AccessToken;
            json["expires_in"] = (access.DeathLine - DateTime.Now).TotalSeconds;
            WrapResult(true, json);
        }
        void Authorization()
        {
            var appID = Form.Find<long>("app_id");
            var appKey = Form.Find("app_key");
            var authToken = Form.Find("auth_token");

            var app = RowAdapter.LoadFirstOrDefault<App>(p => p.ID == appID && p.Deleted == false);
            if (app == null)
            {
                WrapResult(false, "not found app!");
                return;
            }
            if (!app.Key.Equals(appKey))
            {
                WrapResult(false, "invaild app key!");
                return;
            }

            var auth = RowAdapter.LoadFirstOrDefault<Authorization>(p => p.AppID == appID && p.Token == authToken);
            if (auth == null)
            {
                WrapResult(false, "invaild code!");
                return;
            }
            if (!auth.Available)
            {
                WrapResult(false, "code expire!");
                return;
            }

            var access = RowAdapter.LoadFirstOrDefault<Access>(p => p.AppID == appID && p.OwnerID == auth.OwnerID);
            if (access == null)
            {
                access = RowAdapter.Create<Access>();
                access.OwnerID = auth.OwnerID;
                access.AppID = appID;
            }

            access.Reset();
            access.Save();
            if (!access.Available)
            {
                WrapResult(false, "invaild access!");
                return;
            }

            var json = new JsonObject();
            json["access_token"] = access.AccessToken;
            json["refresh_token"] = access.RefreshToken;
            json["expires_in"] = (access.DeathLine - DateTime.Now).TotalSeconds;
            WrapResult(true, json);
        }
        void Refresh()
        {
            var token = Form.Find("refresh_token");

            var access = RowAdapter.LoadFirstOrDefault<Access>(p => p.RefreshToken == token);
            if (access == null)
            {
                WrapResult(false, "invaild access!");
                return;
            }

            access.Refresh();
            access.Save();
            if (!access.Available)
            {
                WrapResult(false, "invaild access!");
                return;
            }

            var json = new JsonObject();
            json["access_token"] = access.AccessToken;
            json["expires_in"] = (access.DeathLine - DateTime.Now).TotalSeconds;
            WrapResult(true, json);
        }
        void UserInfo()
        {
            var token = Form.Find("access_token");
            var access = RowAdapter.LoadFirstOrDefault<Access>(p => p.AccessToken == token);
            if (access == null)
            {
                WrapResult(false, "invaild access_token!");
                return;
            }
            if (!access.Available)
            {
                WrapResult(false, "access_token expire!");
                return;
            }

            var account = RowAdapter.LoadFirstOrDefault<Account>(p => p.ID == access.OwnerID);
            var json = new JsonObject();
            json["app_id"] = access.AppID;
            json["open_id"] = account.OpenID;
            json["nick_name"] = account.Nickname;
            json["real_name"] = account.Realname;
            json["gender"] = account.Gender;
            json["phone"] = account.Phone;
            WrapResult(true, json);
        }
        void GetFirendList()
        {
            var token = Form.Find("access_token");
            var openStrings = Form.Find("opens");
            JsonArray opens;
            if (!Json.TryParse<JsonArray>(openStrings, out opens))
            {
                WrapResult(false, "invaild param: opens!");
                return;
            }
            if (string.IsNullOrEmpty(token))
            {
                WrapResult(false, "nvaild param: access_token");
                return;
            }
            if (opens.Count == 0)
            {
                WrapResult(false, "opens length error!");
                return;
            }

            var access = RowAdapter.LoadFirstOrDefault<Access>(p => p.AccessToken == token);
            if (access == null)
            {
                WrapResult(false, "invaild access_token!");
                return;
            }
            if (!access.Available)
            {
                WrapResult(false, "access_token expire!");
                return;
            }

            var view = EntitySchemaSet.GetOrCreate<Account>();
            var dbProvider = DbFactory.Get(view.ConnectKey);
            var commandStruct = dbProvider.CreateCommand<Account>(view.Name, DbCommandMode.Select);
            var member = SqlExpression.Member(view.Columns.First(p => p.Name == "OpenID").Name);
            var newArray = SqlExpression.NewArray(opens.Select(p => SqlExpression.Constant((string)p)).ToArray());
            commandStruct.Condition = SqlExpression.In(member, newArray);
            var accounts = RowAdapter.Load<Account>(dbProvider, commandStruct);
            var array = new JsonArray();
            foreach (var account in accounts)
            {
                var json = new JsonObject();
                json["open_id"] = account.OpenID;
                json["nick_name"] = account.Nickname;
                json["real_name"] = account.Realname;
                json["gender"] = account.Gender;
                json["available"] = account.Available;
                array.Add(json);
            }

            WrapResult(true, array);
        }
    }
}
