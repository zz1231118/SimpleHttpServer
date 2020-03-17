using System;

namespace SimpleHttpServer.Scripts.Behaviours
{
    [AttributeUsage(AttributeTargets.Class, AllowMultiple = true, Inherited = true)]
    public class HttpBehaviourAttribute : Attribute
    {
        public HttpBehaviourAttribute(Type behaviourType)
        {
            if (behaviourType == null)
                throw new ArgumentNullException(nameof(behaviourType));

            BehaviourType = behaviourType;
        }

        public Type BehaviourType { get; }
    }
}
