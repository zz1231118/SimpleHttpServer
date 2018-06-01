using System;
using System.Collections.Generic;
using System.Linq;
using LyxFramework.Jsons;
using LyxFramework.Security;

namespace OAuth
{
    public static class Auth
    {
        private const string GatewayURL = "http://open.apowogame.com/handler/AuthHandler.yshx";

        public static AppSummary GetAppSummary(AppKey key, bool throwOnError = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));

            var input = new Dictionary<string, string>();
            input["app_id"] = key.ID.ToString();
            var str = Http.Get(GatewayURL + "?action=AppInfo", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return null;
            }

            json = json["data"] as JsonObject;
            var summary = new AppSummary();
            summary.ID = key.ID;
            summary.Name = json["name"];
            summary.Domain = json["domain"];
            return summary;
        }
        public static Identity Login(AppKey key, string account, string password, bool throwOnError = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (account == null)
                throw new ArgumentNullException(nameof(account));
            if (password == null)
                throw new ArgumentNullException(nameof(password));

            IClientCredentials credentials = new ClientCredential(account, password);
            IAuthorization authorization = credentials.Create();
            var input = new Dictionary<string, string>();
            input["app_id"] = key.ID.ToString();
            input["account"] = authorization.Account;
            input["timestamp"] = authorization.Timestamp.ToString();
            input["token"] = authorization.Token;
            var str = Http.Post(GatewayURL + "?action=Login", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return null;
            }

            json = json["data"] as JsonObject;
            string token = json["auth_token"];
            double expires = json["expires_in"];
            return new Identity(key, account, token, DateTime.Now.AddSeconds(expires));
        }
        public static Access Authorization(AppLushKey key, Identity identity, bool throwOnError = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (identity == null)
                throw new ArgumentNullException(nameof(identity));

            return Authorization(key, identity.Token, throwOnError);
        }
        public static Access Authorization(AppLushKey key, string authToken, bool throwOnError = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (authToken == null)
                throw new ArgumentNullException(nameof(authToken));

            var input = new Dictionary<string, string>();
            input["app_id"] = key.ID.ToString();
            input["app_key"] = key.AccessKey;
            input["auth_token"] = authToken;
            var str = Http.Post(GatewayURL + "?action=Authorization", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return null;
            }

            json = json["data"] as JsonObject;
            string accessToken = json["access_token"];
            string refreshToken = json["refresh_token"];
            double seconds = json["expires_in"];
            return new Access(accessToken, refreshToken, DateTime.Now.AddSeconds(seconds));
        }
        public static bool Refresh(Access access, bool throwOnError = true)
        {
            if (access == null)
                throw new ArgumentNullException(nameof(access));
            if (access.RefreshToken == null)
                throw new ArgumentException("non refresh");

            var input = new Dictionary<string, string>();
            input["refresh_token"] = access.RefreshToken;
            var str = Http.Post(GatewayURL + "?action=Refresh", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return false;
            }

            json = json["data"] as JsonObject;
            double expires = json["expires_in"];
            access.AccessToken = json["access_token"];
            access.Expires = DateTime.Now.AddSeconds(expires);
            return true;
        }

        public static Access Token(AppKey key, string account, string password, bool throwOnError = true)
        {
            if (key == null)
                throw new ArgumentNullException(nameof(key));
            if (account == null)
                throw new ArgumentNullException(nameof(account));
            if (password == null)
                throw new ArgumentNullException(nameof(password));

            IClientCredentials credentials = new ClientCredential(account, password);
            IAuthorization authorization = credentials.Create();
            var input = new Dictionary<string, string>();
            input["app_id"] = key.ID.ToString();
            input["account"] = authorization.Account;
            input["timestamp"] = authorization.Timestamp.ToString();
            input["token"] = authorization.Token;
            var str = Http.Post(GatewayURL + "?action=Token", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return null;
            }

            json = json["data"] as JsonObject;
            string token = json["access_token"];
            double expires = json["expires_in"];
            return new Access(token, null, DateTime.Now.AddSeconds(expires));
        }
        public static UserSummary GetUserSummary(Access access, bool throwOnError = true)
        {
            if (access == null)
                throw new ArgumentNullException(nameof(access));

            var input = new Dictionary<string, string>();
            input["access_token"] = access.AccessToken;
            var str = Http.Post(GatewayURL + "?action=UserInfo", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return null;
            }

            json = json["data"] as JsonObject;
            var summary = new UserSummary();
            summary.OpenID = json["open_id"];
            summary.Nickname = json["nick_name"];
            summary.Realname = json["real_name"];
            summary.Gender = (Gender)(byte)json["gender"];
            return summary;
        }
        public static RelationSummary[] GetFriendList(Access access, string[] opens, bool throwOnError = true)
        {
            if (access == null)
                throw new ArgumentNullException(nameof(access));
            if (opens == null)
                throw new ArgumentNullException(nameof(opens));
            if (opens.Length == 0)
                return new RelationSummary[0];

            var input = new Dictionary<string, string>();
            input["access_token"] = access.AccessToken;
            input["opens"] = new JsonArray(opens.Select(p => new JsonValue(p))).Normalizing();
            var str = Http.Post(GatewayURL + "?action=GetFirendList", null, input);
            var json = Json.Parse<JsonObject>(str);
            if (!(bool)json["result"])
            {
                if (throwOnError)
                    throw new ArgumentException(json["data"]);

                return null;
            }

            var array = json["data"] as JsonArray;
            var list = new List<RelationSummary>();
            foreach (JsonObject us in array)
            {
                var summary = new RelationSummary();
                summary.OpenID = us["open_id"];
                summary.Nickname = us["nick_name"];
                summary.Realname = us["real_name"];
                summary.Gender = (Gender)(byte)us["gender"];
                summary.Available = us["available"];
                list.Add(summary);
            }
            
            return list.ToArray();
        }
    }
}