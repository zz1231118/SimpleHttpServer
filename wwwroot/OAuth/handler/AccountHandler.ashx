using System;
using System.Linq;
using System.Reflection;
using LyxFramework.Data;
using LyxFramework.Jsons;
using LyxFramework.Log;
using LyxFramework.Security;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Entity;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.Handler
{
    public class AccountHandler : CSharpScript
    {
        private const int MaxErrorTimes = 10;
        private static readonly TimeSpan Interval = TimeSpan.FromMinutes(5);

        public override void Invoke()
        {
            var action = Query.Find("action");
            if (action == null)
            {
                WrapResult(false, "invaild action!");
                return;
            }

            var bindAttr = BindingFlags.Instance | BindingFlags.Public | 
                BindingFlags.NonPublic | BindingFlags.DeclaredOnly | BindingFlags.InvokeMethod;
            var method = GetType().GetMethod(action, bindAttr);
            if (method == null)
            {
                WrapResult(false, "unknown action:" + action);
                return;
            }

            var nonLogin = method.GetCustomAttribute<NonLoginAttribute>();
            if (nonLogin == null && !Authority())
            {
                WrapResult(false, "not login!");
                return;
            }

            try
            {
                method.Invoke(this, null);
            }
            catch (Exception ex)
            {
                LogManager.Warn.Log(ex.ToString());
                WrapResult(false, ex.Message);
            }
        }

        private bool Authority()
        {
            StartSession();
            return Session.ContainsKey("account");
        }
        private JsonObject FromAccount(Account account)
        {
            var json = new JsonObject();
            json["ID"] = account.ID;
            json["Name"] = account.Name;
            json["Nickname"] = account.Nickname;
            json["OpenID"] = account.OpenID;
            json["Realname"] = account.Realname;
            json["Birth"] = account.Birth.ToString("yyyy-MM-dd");
            json["Gender"] = (int)account.Gender;
            json["AdminType"] = (int)account.AdminType;
            json["Phone"] = account.Phone;
            json["Available"] = account.Available;
            return json;
        }

        void List()
        {
            var account = JsonSerializer.Deserialize<Account>(Session["account"]);
            if (account.AdminType <= AdminType.普通)
            {
                WrapResult(false, "无权操作!");
                return;
            }

            var accounts = RowAdapter.Load<Account>(p => p.Deleted == false);
            WrapResult(true, accounts);
        }
        void Update()
        {
            var id = Form.Find<long>("ID");
            var account = RowAdapter.LoadFirstOrDefault<Account>(p => p.ID == id && p.Deleted == false);
            if (account == null)
            {
                WrapResult(false, "未找到指定账号！");
                return;
            }

            var view = EntitySchemaSet.GetOrCreate<Account>();
            foreach (var column in view.Columns)
            {
                string str;
                if (Form.TryGet(column.Name, out str))
                {
                    var json = Json.Parse(str);
                    var value = JsonSerializer.Deserialize(json, column.PropertyType);
                    column.SetValue(account, value);
                }
            }

            account.Save();
            var myaccount = JsonSerializer.Deserialize<Account>(Session["account"]);
            if (account.ID == myaccount.ID)
            {
                Session["account"] = JsonSerializer.Serialize(account);
            }

            WrapResult(true, FromAccount(account));
        }
        void Delete()
        {
            var id = Form.Find<long>("id");
            var account = RowAdapter.Load<Account>(p => p.Deleted == false && p.ID == id).FirstOrDefault();
            if (account == null)
            {
                WrapResult(false, "指定帐号不存在！");
                return;
            }

            account.Delete();
            WrapResult(true);
        }
        void ChangePassword()
        {
            var oldPassword = Form.Find("old_password");
            var newPassword = Form.Find("new_password");
            var account = JsonSerializer.Deserialize<Account>(Session["account"]);
            account = RowAdapter.LoadFirst<Account>(p => p.ID == account.ID);
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
            if (account.Password != oldPassword)
            {
                account.TodayErrorTimes++;
                account.TotalErrorTimes++;
                account.Save();
                WrapResult(false, "密码错误！");
                return;
            }

            account.Password = newPassword;
            account.ResetError();
            account.Save();
            Session["account"] = JsonSerializer.Serialize(account);
            WrapResult(true, "修改成功");
        }

        [NonLogin]
        void New()
        {
            var name = Form.Find("user_name");
            var password = Form.Find("user_pwd");
            var nickname = Form.Find("nick_name");
            var realname = Form.Find("realname");
            var birth = Form.Find("birth");
            var gender = Form.Find<int>("gender");
            var phone = Form.Find("phone");
            var inviteCode = Form.Find("invite_code");
            if (string.IsNullOrEmpty(name))
            {
                WrapResult(false, "账号不能为空！");
                return;
            }
            if (string.IsNullOrEmpty(password))
            {
                WrapResult(false, "密码不能为空！");
                return;
            }
            if (string.IsNullOrEmpty(nickname))
            {
                WrapResult(false, "昵称不能为空！");
                return;
            }
            if (string.IsNullOrEmpty(inviteCode))
            {
                WrapResult(false, "邀请码不能为空！");
                return;
            }

            var invites = RowAdapter.Load<Invite>(p => p.Code == inviteCode);
            if (invites.Count == 0)
            {
                WrapResult(false, "指定邀请码不存在！");
                return;
            }

            var invite = invites.First();
            if (!invite.Available)
            {
                WrapResult(false, "无效的邀请码！");
                return;
            }

            var accounts = RowAdapter.Load<Account>(p => p.Name == name);
            if (accounts.Count > 0)
            {
                WrapResult(false, "指定帐号已存在！");
                return;
            }

            invite.Available = false;
            invite.UseTime = DateTime.Now;
            invite.Account = name;
            invite.Save();

            var account = RowAdapter.Create<Account>();
            account.Name = name;
            account.Password = password;
            account.Nickname = nickname;
            account.Realname = realname;
            account.Birth = DateTime.Parse(birth);
            account.Gender = (Gender)gender;
            account.Phone = phone;
            account.Save();
            WrapResult(true, "ok");
        }
        [NonLogin]
        void Login()
        {
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

            var account = RowAdapter.LoadFirstOrDefault<Account>(p => p.Deleted == false && p.Name == name);
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

            var credentials = new ServerDirectionalCredentials(account.Name, account.Password);
            var authorization = new LyxFramework.Security.Authorization(name, timestamp, token);
            if (!credentials.Authenticate(authorization))
            {
                account.TodayErrorTimes++;
                account.TotalErrorTimes++;
                account.Save();
                WrapResult(false, "密码错误！");
                return;
            }
            if (account.TodayErrorTimes > 0)
            {
                account.ResetError();
                account.Save();
            }

            StartSession();
            Session["has-login"] = true;
            Session["account"] = JsonSerializer.Serialize(account);
            WrapResult(true, "ok");
        }
        void Logout()
        {
            DestroySession();
            WrapResult(true);
        }
        void Info()
        {
            StartSession();
            var account = JsonSerializer.Deserialize<Account>(Session["account"]);
            WrapResult(true, FromAccount(account));
        }
        void Save()
        {
            StartSession();

            var realname = Form.Find("Realname");
            var birth = Form.Find("Birth");
            var gender = Form.Find<int>("Gender");
            var phone = Form.Find("Phone");

            var account = JsonSerializer.Deserialize<Account>(Session["account"]);
            account = RowAdapter.Load<Account>(p => p.ID == account.ID).FirstOrDefault();
            if (account == null)
            {
                WrapResult(false, "save fail!");
                return;
            }

            account.Realname = realname;
            account.Birth = DateTime.Parse(birth);
            account.Gender = (Gender)gender;
            account.Phone = phone;
            account.Save();
            Session["account"] = JsonSerializer.Serialize(account);

            WrapResult(true, "save success!");
        }

        void Integrity()
        {
            StartSession();
            if (Session.ContainsKey("reply"))
            {
                WrapResult(false);
                return;
            }

            Session["reply"] = true;
            var account = JsonSerializer.Deserialize<Account>(Session["account"]);
            WrapResult(string.IsNullOrEmpty(account.Realname) || string.IsNullOrEmpty(account.Phone));
        }
    }
}