using System;
using System.Collections;
using System.Net;

namespace SimpleHttpServer.Net
{
    sealed class EndPointManager
	{
		private static Hashtable ip_to_endpoints = new Hashtable();
		
		private EndPointManager()
		{ }

		public static void AddListener(HttpListener listener)
		{
			ArrayList added = new ArrayList();
			try
            {
				lock (ip_to_endpoints)
                {
					foreach (string prefix in listener.Prefixes)
                    {
						AddPrefixInternal(prefix, listener);
						added.Add (prefix);
					}
				}
			}
            catch
            {
				foreach (string prefix in added)
                {
					RemovePrefix (prefix, listener);
				}
				throw;
			}
		}

		public static void AddPrefix(string prefix, HttpListener listener)
		{
			lock (ip_to_endpoints)
            {
				AddPrefixInternal(prefix, listener);
			}
		}

		static void AddPrefixInternal(string p, HttpListener listener)
		{
			ListenerPrefix lp = new ListenerPrefix(p);
			if (lp.Path.IndexOf ('%') != -1)
				throw new HttpListenerException (400, "Invalid path.");
			if (lp.Path.IndexOf ("//", StringComparison.Ordinal) != -1)
				throw new HttpListenerException (400, "Invalid path.");

			EndPointListener epl = GetEPListener(lp.Host, lp.Port, listener, lp.Secure);
			epl.AddPrefix(lp, listener);
		}

		static EndPointListener GetEPListener(string host, int port, HttpListener listener, bool secure)
		{
			IPAddress addr;
            if (!IPAddress.TryParse(host, out addr))
                addr = IPAddress.Any;

            Hashtable p = null;
			if (ip_to_endpoints.ContainsKey(addr))
            {
				p = (Hashtable) ip_to_endpoints[addr];
			}
            else
            {
				p = new Hashtable();
				ip_to_endpoints[addr] = p;
			}

			EndPointListener epl = null;
			if (p.ContainsKey(port))
            {
				epl = (EndPointListener)p[port];
			}
            else
            {
				epl = new EndPointListener(addr, port, secure);
				p [port] = epl;
			}

			return epl;
		}

		public static void RemoveEndPoint(EndPointListener epl, IPEndPoint ep)
		{
			lock (ip_to_endpoints)
            {
				Hashtable p = null;
				p = (Hashtable) ip_to_endpoints [ep.Address];
				p.Remove (ep.Port);
				if (p.Count == 0)
                {
					ip_to_endpoints.Remove (ep.Address);
				}

				epl.Close();
			}
		}

		public static void RemoveListener(HttpListener listener)
		{
			lock (ip_to_endpoints)
            {
				foreach (string prefix in listener.Prefixes)
                {
					RemovePrefixInternal (prefix, listener);
				}
			}
		}

		public static void RemovePrefix(string prefix, HttpListener listener)
		{
			lock (ip_to_endpoints)
            {
				RemovePrefixInternal (prefix, listener);
			}
		}

		static void RemovePrefixInternal(string prefix, HttpListener listener)
		{
			ListenerPrefix lp = new ListenerPrefix (prefix);
			if (lp.Path.IndexOf ('%') != -1)
				return;
			if (lp.Path.IndexOf ("//", StringComparison.Ordinal) != -1)
				return;

			EndPointListener epl = GetEPListener (lp.Host, lp.Port, listener, lp.Secure);
			epl.RemovePrefix (lp, listener);
		}
	}
}