using System;

namespace OAuth
{
    public class AppLushKey : AppKey
    {
        private string _accessKey;

        public AppLushKey(long id, string accessKey)
            : base(id)
        {
            if (accessKey == null)
                throw new ArgumentNullException(nameof(accessKey));

            _accessKey = accessKey;
        }

        public string AccessKey => _accessKey;
    }
}
