using System;
using System.ServiceProcess;
using LyxFramework.Log;
using SimpleHttpServer;

namespace SimpleWebService
{
    public partial class WebService : ServiceBase
    {
        private HttpServer _httpService;

        public WebService()
        {
            InitializeComponent();

            LogManager.Assign(FileLogFactory.Default);
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
        }

        private void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            var appDomain = sender as AppDomain;
            LogManager.Fatal.Log("AppDomain:{0} UnhandledException:{1}", appDomain, e.ExceptionObject);
            if (e.IsTerminating)
                LogManager.Shutdown();
        }

        protected override void OnStart(string[] args)
        {
            try
            {
                _httpService = new HttpServer();
                _httpService.Start();
            }
            catch (Exception ex)
            {
                LogManager.Fatal.Log(nameof(OnStart) + " error: {0}", ex);
                throw ex;
            }
        }

        protected override void OnStop()
        {
            try
            {
                _httpService.Stop();
            }
            catch (Exception ex)
            {
                LogManager.Fatal.Log(nameof(OnStop) + " error: {0}", ex);
            }
            LogManager.Shutdown();
        }
    }
}
