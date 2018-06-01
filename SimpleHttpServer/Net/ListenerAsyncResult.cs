using System;
using System.Threading;

namespace SimpleHttpServer.Net
{
    class ListenerAsyncResult : IAsyncResult
    {
        private static WaitCallback InvokeCB = new WaitCallback(InvokeCallback);
        private ManualResetEvent handle;
        private bool synch;
        private bool completed;
        private AsyncCallback cb;
        private object state;
        private Exception exception;
        private HttpListenerContext context;
        private object locker = new object ();
        private ListenerAsyncResult forward;
		internal bool EndCalled;
		internal bool InGet;

		public ListenerAsyncResult(AsyncCallback cb, object state)
		{
			this.cb = cb;
			this.state = state;
		}

		internal void Complete(Exception exc)
		{
			if (forward != null)
            {
				forward.Complete(exc);
				return;
			}

			exception = exc;
			if (InGet && (exc is ObjectDisposedException))
				exception = new HttpListenerException(500, "Listener closed");
			lock (locker)
            {
				completed = true;
				if (handle != null)
					handle.Set();

				if (cb != null)
					ThreadPool.UnsafeQueueUserWorkItem(InvokeCB, this);
			}
		}

		private static void InvokeCallback(object o)
		{
			ListenerAsyncResult ares = (ListenerAsyncResult)o;
			if (ares.forward != null)
            {
				InvokeCallback(ares.forward);
				return;
			}
			try
            {
				ares.cb(ares);
			}
            catch
            { }
		}

		internal void Complete(HttpListenerContext context)
		{
			Complete(context, false);
		}

		internal void Complete(HttpListenerContext context, bool synch)
		{
			if (forward != null)
            {
				forward.Complete (context, synch);
				return;
			}

			this.synch = synch;
			this.context = context;
			lock (locker)
            {
				AuthenticationSchemes schemes = context.Listener.SelectAuthenticationScheme (context);
				if ((schemes == AuthenticationSchemes.Basic || context.Listener.AuthenticationSchemes == AuthenticationSchemes.Negotiate) && context.Request.Headers ["Authorization"] == null)
                {
					context.Response.StatusCode = 401;
					context.Response.Headers ["WWW-Authenticate"] = schemes + " realm=\"" + context.Listener.Realm + "\"";
					context.Response.OutputStream.Close();
					IAsyncResult ares = context.Listener.BeginGetContext(cb, state);
					this.forward = (ListenerAsyncResult) ares;
					lock (forward.locker)
                    {
						if (handle != null)
							forward.handle = handle;
					}
					ListenerAsyncResult next = forward;
					for (int i = 0; next.forward != null; i++)
                    {
						if (i > 20)
							Complete (new HttpListenerException (400, "Too many authentication errors"));

						next = next.forward;
					}
				}
                else
                {
					completed = true;
					if (handle != null)
						handle.Set();

					if (cb != null)
						ThreadPool.UnsafeQueueUserWorkItem(InvokeCB, this);
				}
			}
		}

		internal HttpListenerContext GetContext()
		{
			if (forward != null)
				return forward.GetContext();
			if (exception != null)
				throw exception;

			return context;
		}
		
		public object AsyncState
        {
			get
            {
				if (forward != null)
					return forward.AsyncState;
				return state;
			}
		}

		public WaitHandle AsyncWaitHandle
        {
			get
            {
				if (forward != null)
					return forward.AsyncWaitHandle;

				lock (locker)
                {
					if (handle == null)
						handle = new ManualResetEvent(completed);
				}
				
				return handle;
			}
		}

		public bool CompletedSynchronously
        {
			get
            {
				if (forward != null)
					return forward.CompletedSynchronously;
				return synch;
			}

		}

		public bool IsCompleted
        {
			get
            {
				if (forward != null)
					return forward.IsCompleted;

				lock (locker)
                {
					return completed;
				}
			}
		}
	}
}