using System;

namespace SimpleHttpServer.Scripts.Utility
{
    public static class DateTimeExtension
    {
        public static readonly DateTime MinTime = new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc);

        public static DateTime Now => DateTime.Now + TimeCorrection;

        public static TimeSpan TimeCorrection { get; set; }

        public static long NowTimestamp
        {
            get { return ConvertToTimestamp(Now); }
            set
            {
                if (value == 0)
                {
                    TimeCorrection = new TimeSpan(0, 0, 0);
                }
                else
                {
                    var targetTime = ConvertFromTimestamp(value);
                    TimeCorrection = targetTime - DateTime.Now;
                }
            }
        }

        public static long ToTimestamp(this DateTime time)
        {
            return (time.ToUniversalTime().Ticks - 621355968000000000) / 10000000;
        }

        public static long ConvertToTimestamp(DateTime time)
        {
            return (time.ToUniversalTime().Ticks - 621355968000000000) / 10000000;
        }

        public static DateTime ConvertFromTimestamp(long timestamp)
        {
            return new DateTime(1970, 1, 1, 0, 0, 0, DateTimeKind.Utc).AddSeconds(timestamp).ToLocalTime();
        }

        public static TimeSpan ToUtc(this TimeSpan time)
        {
            return time - TimeZoneInfo.Local.BaseUtcOffset;
        }

        public static TimeSpan GetLocal(this TimeSpan time)
        {
            return time + TimeZoneInfo.Local.BaseUtcOffset;
        }
    }
}
