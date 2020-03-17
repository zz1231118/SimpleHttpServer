using System;
using System.Runtime.Serialization;

namespace SimpleHttpServer.Web
{
    [Serializable]
    public class SiteInitializationException : Exception, ISerializable
    {
        public SiteInitializationException()
        { }

        public SiteInitializationException(string message)
            : base(message)
        { }

        public SiteInitializationException(string message, Exception innerException)
            : base(message, innerException)
        { }

        protected SiteInitializationException(SerializationInfo info, StreamingContext context)
            : base(info, context)
        { }
    }
}
