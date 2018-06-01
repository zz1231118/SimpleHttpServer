using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Reflection;
using System.Security.Principal;
using System.ServiceProcess;

namespace SimpleWebService
{
    static class Program
    {
        private const string ServiceName = "SimpleWebService";
        private const string DisplayName = ServiceName;

        /// <summary>
        /// 应用程序的主入口点。
        /// </summary>
        static void Main(string[] args)
        {
            if (args.Length > 0 && args[0] == "run")
            {
                ServiceBase.Run(new ServiceBase[] { new WebService() });
            }
            else
            {
                var identity = WindowsIdentity.GetCurrent();
                var principal = new WindowsPrincipal(identity);
                if (!principal.IsInRole(WindowsBuiltInRole.Administrator))
                {
                    var startInfo = new ProcessStartInfo();
                    startInfo.FileName = Assembly.GetExecutingAssembly().Location;
                    startInfo.Arguments = String.Join(" ", args);
                    //设置启动动作,确保以管理员身份运行
                    startInfo.Verb = "runas";
                    //如果不是管理员，则启动UAC
                    try
                    {
                        Process.Start(startInfo);
                    }
                    catch (Win32Exception ex) when (ex.NativeErrorCode == 1223)
                    {
                        //1223 用户取消了授权
                    }
                    return;
                }

                Console.WriteLine("这是Windows应用程序");
                bool isRunning = true;
                while (isRunning)
                {
                    Console.WriteLine("请选择，[install]安装服务 [uninstall]卸载服务 [start]启动服务 [stop]停止服务 [restart]重启服务");
                    string command = Console.ReadLine();
                    switch (command)
                    {
                        case "install":
                            //取当前可执行文件路径，加上"s"参数，证明是从windows服务启动该程序
                            var path = Process.GetCurrentProcess().MainModule.FileName + " run";
                            Console.WriteLine(Helper.ExecuteCommand(string.Format("sc create {0} binpath= \"" + path + "\" displayName= {1} start= auto", ServiceName, DisplayName)));
                            break;
                        case "uninstall":
                            Console.WriteLine(Helper.ExecuteCommand(string.Format("sc delete {0}", ServiceName)));
                            break;
                        case "start":
                            Console.WriteLine(Helper.ExecuteCommand(string.Format("sc start {0}", ServiceName)));
                            break;
                        case "stop":
                            Console.WriteLine(Helper.ExecuteCommand(string.Format("sc stop {0}", ServiceName)));
                            break;
                        case "restart":
                            Console.WriteLine(Helper.ExecuteCommand(string.Format("sc stop {0}", ServiceName)));
                            Console.WriteLine(Helper.ExecuteCommand(string.Format("sc start {0}", ServiceName)));
                            break;
                        case "exit":
                            isRunning = false;
                            break;
                        case "cls":
                            Console.Clear();
                            break;
                        default:
                            Console.WriteLine("无效的命令！");
                            break;
                    }
                }
            }
        }
    }
}
