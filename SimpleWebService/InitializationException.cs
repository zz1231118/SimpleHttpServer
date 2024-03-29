﻿using System;

namespace SimpleWebService
{
    public class InitializationException : Exception
    {
        public InitializationException(string message)
            : base(message)
        { }

        public InitializationException(string message, Exception innerException)
            : base(message, innerException)
        { }
    }
}
