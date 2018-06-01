using System;
using System.Collections.Generic;

namespace WinHost
{
    public class ParamWrapper
    {
        private Dictionary<string, string> _kv = new Dictionary<string, string>();

        public ParamWrapper(IEnumerable<string> collection)
        {
            if (collection == null)
                throw new ArgumentNullException(nameof(collection));

            foreach (var arg in collection)
            {
                if (string.IsNullOrWhiteSpace(arg))
                    continue;

                var str = arg.Trim();
                if (str.StartsWith("-"))
                {
                    _kv[str.Substring(1).ToLower()] = null;
                    continue;
                }

                var ts = str.Split('=');
                if (ts.Length != 2)
                    throw new ArgumentException("param error");

                _kv[ts[0].Trim().ToLower()] = ts[1].Trim().ToLower();
            }
        }

        public bool Switch(string name)
        {
            if (name == null)
                throw new ArgumentNullException(nameof(name));

            return _kv.ContainsKey(name.ToLower());
        }
        public ParamWrapper Required<T>(string name, out T value)
            where T : IConvertible
        {
            if (name == null)
                throw new ArgumentNullException(nameof(name));

            string str;
            if (!_kv.TryGetValue(name.ToLower(), out str))
                throw new ArgumentException("缺少参数：" + name);

            try
            {
                value = (T)Convert.ChangeType(str, typeof(T));
                return this;
            }
            catch (Exception ex)
            {
                throw new ArgumentException("参数：" + name + " 类型错误。" + ex.Message);
            }
        }
        public ParamWrapper Optional<T>(string name, ref T value)
            where T : IConvertible
        {
            if (name == null)
                throw new ArgumentNullException(nameof(name));

            try
            {
                string str;
                if (_kv.TryGetValue(name.ToLower(), out str))
                    value = (T)Convert.ChangeType(str, typeof(T));

                return this;
            }
            catch (Exception ex)
            {
                throw new ArgumentException("参数：" + name + " 类型错误。" + ex.Message);
            }
        }
    }
}
