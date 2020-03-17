using System;
using System.Reflection;

namespace SimpleWebService
{
    [AttributeUsage(AttributeTargets.Method)]
    class CommandAttribute : Attribute
    {
        private MethodInfo method;

        public CommandAttribute(string helpText)
        {
            HelpText = helpText;
        }

        public string HelpText { get; }

        public string Name => method.Name;

        public static CommandAttribute GetAttribute(MethodInfo method)
        {
            if (method == null)
                throw new ArgumentNullException(nameof(method));

            var attribute = method.GetCustomAttribute<CommandAttribute>();
            if (attribute != null) attribute.method = method;
            return attribute;
        }

        public ParameterInfo[] GetParameters()
        {
            return method.GetParameters();
        }

        public object Invoke(object obj, object[] args)
        {
            return method.Invoke(obj, args);
        }
    }
}
