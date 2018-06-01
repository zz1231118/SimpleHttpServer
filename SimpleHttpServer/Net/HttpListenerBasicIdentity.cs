using System.Security.Principal;

namespace SimpleHttpServer.Net
{
    public class HttpListenerBasicIdentity : GenericIdentity
    {
		string password;

		public HttpListenerBasicIdentity (string username, string password)
            : base (username, "Basic")
		{
			this.password = password;
		}

		public virtual string Password
        {
			get { return password; }
		}
	}
}