using System;
using System.Runtime.ExceptionServices;
using LyxFramework.Utility;

namespace SimpleHttpServer.Scripts.Utility
{
    public class UnLazy<T> : BaseDisposed
    {
        private object _syncRoot = new object();
        private Func<T> _valueFactory;
        private volatile object _boxed;

        public UnLazy(T value)
        {
            _boxed = new Boxed(value);
        }
        public UnLazy(Func<T> valueFactory)
        {
            if (valueFactory == null)
                throw new ArgumentNullException(nameof(valueFactory));
            
            _valueFactory = valueFactory;
        }

        public bool IsValueCreated => _boxed is Boxed;
        public T Value
        {
            get
            {
                CheckDisposed();

                var oldval = _boxed;
                if (oldval != null)
                {
                    var boxed = oldval as Boxed;
                    if (boxed != null)
                        return boxed._value;

                    UnLazyInternalExceptionHolder exc = oldval as UnLazyInternalExceptionHolder;
                    exc._edi.Throw();
                }
                return LazyInitValue();
            }
        }

        private T LazyInitValue()
        {
            Boxed boxed = null;
            lock (_syncRoot)
            {
                if (_boxed == null)
                {
                    boxed = CreateValue();
                    _boxed = boxed;
                }
                else
                {
                    boxed = _boxed as Boxed;
                    if (boxed == null)
                    {
                        UnLazyInternalExceptionHolder holder = _boxed as UnLazyInternalExceptionHolder;
                        holder._edi.Throw();
                    }
                }
            }
            return boxed._value;
        }
        private Boxed CreateValue()
        {
            try
            {
                return _valueFactory != null
                    ? new Boxed(_valueFactory())
                    : new Boxed(default(T));
            }
            catch (Exception ex)
            {
                _boxed = new UnLazyInternalExceptionHolder(ex);
                throw;
            }
        }

        public void Clean()
        {
            CheckDisposed();

            lock (_syncRoot)
                _boxed = null;
        }

        protected override void Dispose(bool disposing)
        {
            if (IsDisposed)
                return;

            base.Dispose(disposing);

            _boxed = null;
            _valueFactory = null;
        }

        class Boxed
        {
            internal T _value;

            internal Boxed(T value)
            {
                _value = value;
            }
        }
        class UnLazyInternalExceptionHolder
        {
            internal ExceptionDispatchInfo _edi;

            internal UnLazyInternalExceptionHolder(Exception ex)
            {
                _edi = ExceptionDispatchInfo.Capture(ex);
            }
        }
    }
}
