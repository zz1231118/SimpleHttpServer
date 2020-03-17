using SimpleHttpServer.Web;

namespace SimpleHttpServer.Scripts
{
    public class ApplicationSetting
    {
        private const string MaxUploadFileLengthProperty = "MaxUploadFileLength";
        private const string MaxPostLengthProperty = "MaxPostLength";

        private const long DefaultMaxUploadFileLength = 2 * 1024 * 1024;
        private const long DefaultMaxPostLength = 8 * 1024 * 1024;

        internal ApplicationSetting(IHttpSite httpSite)
        {
            var conf = httpSite.Config;
            MaxUploadFileLength = conf.GetInt64(MaxUploadFileLengthProperty, DefaultMaxUploadFileLength);
            MaxPostLength = conf.GetInt64(MaxPostLengthProperty, DefaultMaxPostLength);
        }

        public long MaxUploadFileLength { get; private set; }

        public long MaxPostLength { get; private set; }
    }
}
