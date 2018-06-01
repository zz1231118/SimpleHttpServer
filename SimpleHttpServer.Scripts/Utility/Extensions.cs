using System;
using System.Collections.Generic;
using LyxFramework.Jsons;

namespace SimpleHttpServer.Scripts.Utility
{
    public static class Extensions
    {
        public static TValue Find<TKey, TValue>(this IDictionary<TKey, TValue> kv, TKey key, TValue @default = default(TValue))
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            TValue value;
            return kv.TryGetValue(key, out value) ? value : @default;
        }
        public static TValue Find<TKey, TValue>(this IReadOnlyDictionary<TKey, TValue> kv, TKey key, TValue @default = default(TValue))
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            TValue value;
            return kv.TryGetValue(key, out value) ? value : @default;
        }

        public static T Find<T>(this IReadOnlyDictionary<string, Json> kv, string key, T @default = default(T))
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            Json value;
            return kv.TryGetValue(key, out value) ? JsonSerializer.Deserialize<T>(value) : @default;
        }
        public static bool TryGet<T>(this IReadOnlyDictionary<string, Json> kv, string key, out T value)
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            Json json;
            if (!kv.TryGetValue(key, out json))
            {
                value = default(T);
                return false;
            }

            value = JsonSerializer.Deserialize<T>(json);
            return true;
        }
        public static T Find<T>(this IDictionary<string, Json> kv, string key, T @default = default(T))
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            Json value;
            return kv.TryGetValue(key, out value) ? JsonSerializer.Deserialize<T>(value) : @default;
        }
        public static bool TryGet<T>(this IDictionary<string, Json> kv, string key, out T value)
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            Json json;
            if (!kv.TryGetValue(key, out json))
            {
                value = default(T);
                return false;
            }

            value = JsonSerializer.Deserialize<T>(json);
            return true;
        }

        public static T Find<T>(this IReadOnlyDictionary<string, string> kv, string key, T @default = default(T))
            where T : IConvertible
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            string value;
            if (!kv.TryGetValue(key, out value))
                return @default;

            var type = typeof(T);
            if (type.IsEnum)
            {
                var underlyingType = Enum.GetUnderlyingType(type);
                var val = Convert.ChangeType(value, underlyingType);
                return (T)Enum.ToObject(type, val);
            }

            return (T)Convert.ChangeType(value, type);
        }
        public static bool TryGet<T>(this IReadOnlyDictionary<string, string> kv, string key, out T value)
            where T : IConvertible
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            string str;
            if (!kv.TryGetValue(key, out str))
            {
                value = default(T);
                return false;
            }

            var type = typeof(T);
            if (type.IsEnum)
            {
                var underlyingType = Enum.GetUnderlyingType(type);
                var val = Convert.ChangeType(str, underlyingType);
                value = (T)Enum.ToObject(type, val);
            }
            else
            {
                value = (T)Convert.ChangeType(str, typeof(T));
            }
            return true;
        }
    }
}