using System;
using System.Runtime.ExceptionServices;
using Framework;

namespace SimpleHttpServer.Scripts.Utility
{
    public class Lazy<T> : BaseDisposed
    {
        private object syncRoot = new object();
        private Func<T> valueFactory;
        private volatile object boxed;

        public Lazy(T value)
        {
            boxed = new Boxed(value);
        }

        public Lazy(Func<T> valueFactory)
        {
            if (valueFactory == null)
                throw new ArgumentNullException(nameof(valueFactory));
            
            this.valueFactory = valueFactory;
        }

        public bool IsValueCreated => boxed is Boxed;

        public T Value
        {
            get
            {
                CheckDisposed();
                
                var oldval = boxed;
                if (oldval != null)
                {
                    var boxed = oldval as Boxed;
                    if (boxed != null)
                        return boxed.value;

                    UnLazyInternalExceptionHolder exc = oldval as UnLazyInternalExceptionHolder;
                    exc.edi.Throw();
                }
                return LazyInitValue();
            }
        }

        private T LazyInitValue()
        {
            Boxed boxed = null;
            lock (syncRoot)
            {
                if (this.boxed == null)
                {
                    boxed = CreateValue();
                    this.boxed = boxed;
                }
                else
                {
                    boxed = this.boxed as Boxed;
                    if (boxed == null)
                    {
                        UnLazyInternalExceptionHolder holder = this.boxed as UnLazyInternalExceptionHolder;
                        holder.edi.Throw();
                    }
                }
            }
            return boxed.value;
        }

        private Boxed CreateValue()
        {
            try
            {
                return valueFactory != null
                    ? new Boxed(valueFactory())
                    : new Boxed(default(T));
            }
            catch (Exception ex)
            {
                boxed = new UnLazyInternalExceptionHolder(ex);
                throw;
            }
        }

        public void Clean()
        {
            CheckDisposed();

            lock (syncRoot)
                boxed = null;
        }

        protected override void Dispose(bool disposing)
        {
            if (IsDisposed)
                return;

            base.Dispose(disposing);

            boxed = null;
            valueFactory = null;
        }

        class Boxed
        {
            internal T value;

            internal Boxed(T value)
            {
                this.value = value;
            }
        }

        class UnLazyInternalExceptionHolder
        {
            internal ExceptionDispatchInfo edi;

            internal UnLazyInternalExceptionHolder(Exception ex)
            {
                edi = ExceptionDispatchInfo.Capture(ex);
            }
        }
    }
}
