using System;
using System.Collections.Generic;
using Framework.JavaScript;

namespace SimpleHttpServer.Scripts.Utility
{
    public static class Extensions
    {
        public static TValue Find<TKey, TValue>(this IDictionary<TKey, TValue> source, TKey key, TValue @default = default(TValue))
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            TValue value;
            return source.TryGetValue(key, out value) ? value : @default;
        }

        public static TValue Find<TKey, TValue>(this IReadOnlyDictionary<TKey, TValue> source, TKey key, TValue @default = default(TValue))
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            TValue value;
            return source.TryGetValue(key, out value) ? value : @default;
        }

        public static T Find<T>(this IReadOnlyDictionary<string, Json> kv, string source, T @default = default(T))
        {
            if (kv == null)
                throw new ArgumentNullException(nameof(kv));

            Json value;
            return kv.TryGetValue(source, out value) ? JsonSerializer.Deserialize<T>(value) : @default;
        }

        public static bool TryGet<T>(this IReadOnlyDictionary<string, Json> source, string key, out T value)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            Json json;
            if (!source.TryGetValue(key, out json))
            {
                value = default(T);
                return false;
            }

            value = JsonSerializer.Deserialize<T>(json);
            return true;
        }

        public static T Find<T>(this IDictionary<string, Json> source, string key, T @default = default(T))
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            Json value;
            return source.TryGetValue(key, out value) ? JsonSerializer.Deserialize<T>(value) : @default;
        }

        public static bool TryGet<T>(this IDictionary<string, Json> source, string key, out T value)
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            Json json;
            if (!source.TryGetValue(key, out json))
            {
                value = default(T);
                return false;
            }

            value = JsonSerializer.Deserialize<T>(json);
            return true;
        }

        public static T Find<T>(this IReadOnlyDictionary<string, string> source, string key, T @default = default(T))
            where T : IConvertible
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            string content;
            if (!source.TryGetValue(key, out content))
                return @default;

            var type = typeof(T);
            if (type.IsEnum)
            {
                var underlyingType = Enum.GetUnderlyingType(type);
                var val = Convert.ChangeType(content, underlyingType);
                return (T)Enum.ToObject(type, val);
            }

            return (T)Convert.ChangeType(content, type);
        }

        public static bool TryGet<T>(this IReadOnlyDictionary<string, string> source, string key, out T value)
            where T : IConvertible
        {
            if (source == null)
                throw new ArgumentNullException(nameof(source));

            string content;
            if (!source.TryGetValue(key, out content))
            {
                value = default(T);
                return false;
            }

            var type = typeof(T);
            if (type.IsEnum)
            {
                var underlyingType = Enum.GetUnderlyingType(type);
                var val = Convert.ChangeType(content, underlyingType);
                value = (T)Enum.ToObject(type, val);
            }
            else
            {
                value = (T)Convert.ChangeType(content, typeof(T));
            }
            return true;
        }
    }
}