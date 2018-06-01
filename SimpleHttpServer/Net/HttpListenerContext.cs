using System;
using System.Security.Principal;

namespace SimpleHttpServer.Net
{
    public sealed class HttpListenerContext
    {
		private HttpListenerRequest request;
        private HttpListenerResponse response;
        private IPrincipal user;
        private HttpConnection cnc;
        private string error;
        private int err_status = 400;
		internal HttpListener Listener;

		internal HttpListenerContext(HttpConnection cnc)
		{
			this.cnc = cnc;
			request = new HttpListenerRequest(this);
			response = new HttpListenerResponse(this);
		}

		internal int ErrorStatus
        {
			get { return err_status; }
			set { err_status = value; }
		}

		internal string ErrorMessage
        {
			get { return error; }
			set { error = value; }
		}

		internal bool HaveError
        {
			get { return (error != null); }
		}

		internal HttpConnection Connection
        {
			get { return cnc; }
		}

		public HttpListenerRequest Request
        {
			get { return request; }
		}

		public HttpListenerResponse Response{
			get { return response; }
		}

		public IPrincipal User
        {
			get { return user; }
		}

		internal void ParseAuthentication(AuthenticationSchemes expectedSchemes)
        {
			if (expectedSchemes == AuthenticationSchemes.Anonymous)
				return;

			string header = request.Headers["Authorization"];
			if (header == null || header.Length < 2)
				return;

			string [] authenticationData = header.Split (new char [] {' '}, 2);
			if (string.Compare (authenticationData [0], "basic", true) == 0)
            {
				user = ParseBasicAuthentication(authenticationData [1]);
			}
		}

		internal IPrincipal ParseBasicAuthentication(string authData)
        {
			try
            {
				// Basic AUTH Data is a formatted Base64 String
				//string domain = null;
				string user = null;
				string password = null;
				int pos = -1;
				string authString = System.Text.Encoding.Default.GetString(Convert.FromBase64String(authData));
	
				// The format is DOMAIN\username:password
				// Domain is optional

				pos = authString.IndexOf(':');
	
				// parse the password off the end
				password = authString.Substring(pos+1);
				
				// discard the password
				authString = authString.Substring(0, pos);
	
				// check if there is a domain
				pos = authString.IndexOf('\\');
	
				if (pos > 0)
                {
					//domain = authString.Substring (0, pos);
					user = authString.Substring(pos);
				}
                else
                {
					user = authString;
				}
	
				HttpListenerBasicIdentity identity = new HttpListenerBasicIdentity (user, password);
				return new GenericPrincipal (identity, new string [0]);
			}
            catch (Exception)
            {
				// Invalid auth data is swallowed silently
				return null;
			} 
		}
	}
}