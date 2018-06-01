using System;

namespace Scripts.OAuth.Entity
{
    [AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
    public class NonLoginAttribute : Attribute
    { }
}
