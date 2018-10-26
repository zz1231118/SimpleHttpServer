using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using LyxFramework.Jsons;
using Scripts.OAuth.Entity;
using SimpleHttpServer.Scripts;
using SimpleHttpServer.Scripts.Entity;
using SimpleHttpServer.Scripts.Utility;

namespace Scripts.OAuth.Handler
{
    public class InviteHandler : CSharpScript
    {
        private Account _account;

        public override void Invoke()
        {
            var action = Query.Find("action");
            if (action == null)
            {
                WrapResult(ResultCode.InvalidAction, "invaild action!");
                return;
            }

            var bindAttr = BindingFlags.Instance | BindingFlags.Public |
                BindingFlags.NonPublic | BindingFlags.DeclaredOnly |
                BindingFlags.InvokeMethod;
            var method = GetType().GetMethod(action, bindAttr);
            if (method == null)
            {
                WrapResult(ResultCode.InvalidAction, "unknown action:" + action);
                return;
            }

            StartSession();
            if (!(bool)Session.Find("has-login", false))
            {
                WrapResult(ResultCode.NotLoin, "not login!");
                return;
            }

            _account = JsonSerializer.Deserialize<Account>(Session["account"]);
            if (_account.AdminType < AdminType.管理)
            {
                WrapResult(ResultCode.InvalidAction, "权限不够！");
                return;
            }

            try
            {
                method.Invoke(this, null);
            }
            catch (Exception ex)
            {
                WrapResult(ResultCode.ServerError, ex.Message);
            }
        }

        public void List()
        {
            var list = RowAdapter.Load<Invite>(p => p.Deleted == false);
            WrapResult(ResultCode.OK, list);
        }
        public void Build()
        {
            var count = Form.Find<int>("count");
            if (count <= 0)
            {
                WrapResult(ResultCode.InvalidParam, "参数错误！");
                return;
            }

            var result = new List<Invite>();
            for (int i = 0; i < count; i++)
            {
                var invite = RowAdapter.Create<Invite>();
                result.Add(invite);
                invite.Save();
            }

            WrapResult(ResultCode.OK, result);
        }
        public void Delete()
        {
            var id = Form.Find<long>("id");
            var invite = RowAdapter.Load<Invite>(p => p.ID == id && p.Deleted == false).FirstOrDefault();
            if (invite == null)
            {
                WrapResult(ResultCode.InvalidParam, string.Format("not found Invite.ID:{0}", id));
                return;
            }
            if (!invite.Available)
            {
                WrapResult(ResultCode.InvalidAction, "不能删除已使用的邀请码！");
                return;
            }

            invite.Delete();
            WrapResult(ResultCode.OK);
        }
    }
}
