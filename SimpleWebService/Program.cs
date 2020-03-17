using System;
using System.Collections;
using System.Collections.Generic;
using System.Configuration.Install;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Reflection;
using System.Security.Principal;
using System.ServiceProcess;
using System.Text;
using Framework.Configuration;
using Framework.JavaScript;
using Framework.Log;

namespace SimpleWebService
{
    static class Program
    {
        private static ILogger logger;

        static void Main(string[] args)
        {
            if (args.Length == 1 && args[0].Equals("-installed", StringComparison.OrdinalIgnoreCase))
            {
                var loggerFactory = new LoggerFactory();
                loggerFactory.AddProvider<FileLoggerProvider>();
                Logger.LoggerFactory = loggerFactory;
                logger = Logger.GetLogger(typeof(Program).FullName);

                AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
                ServiceBase.Run(new ServiceBase[] { new WebService() });

                Logger.Shutdown();
                return;
            }

            var windowsIdentity = WindowsIdentity.GetCurrent();
            var windowsPrincipal = new WindowsPrincipal(windowsIdentity);
            if (!windowsPrincipal.IsInRole(WindowsBuiltInRole.Administrator))
            {
                if (!Debugger.IsAttached)
                {
                    var info = new ProcessStartInfo();
                    info.UseShellExecute = true;
                    info.WorkingDirectory = AppDomain.CurrentDomain.BaseDirectory;
                    info.FileName = Assembly.GetEntryAssembly().Location;
                    info.Verb = "runas";
                    Process.Start(info);
                    return;
                }

                WriteLine("温馨提示：当前运行环境为非管理员用户执行环境...");
                WriteLine();
            }

            var exitForWindow = false;
            var bindingAttr = BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic;
            var methods = typeof(Program).GetMethods(bindingAttr);
            var commands = new Dictionary<string, CommandAttribute>();
            foreach (var method in methods)
            {
                var attribute = CommandAttribute.GetAttribute(method);
                if (attribute != null) commands[method.Name.ToLower()] = attribute;
            }
            while (!exitForWindow)
            {
                WriteLine("请输入命令...");

                try
                {
                    var commandLine = Console.ReadLine()?.ToLower();
                    if (commandLine == null)
                    {
                        //没有获取到数据
                        break;
                    }

                    var commandLineArray = commandLine.Split(' ');
                    var commandname = commandLineArray[0];
                    switch (commandname)
                    {
                        case "exit":
                            exitForWindow = true;
                            break;
                        case "clear":
                            Console.Clear();
                            break;
                        case "help":
                            commands.Values.ForEach(p => WriteLine(p.Name.ToLower().PadRight(20) + p.HelpText));
                            WriteLine();
                            break;
                        default:
                            if (!commands.TryGetValue(commandname, out CommandAttribute command))
                            {
                                WriteLine(string.Format("unknown command: {0}", commandname), ConsoleColor.Yellow);
                                break;
                            }

                            var parameters = command.GetParameters();
                            var objParams = new object[parameters.Length];
                            for (int i = 0; i < parameters.Length; i++)
                            {
                                objParams[i] = Convert.ChangeType(commandLineArray[i + 1], parameters[i].ParameterType);
                            }
                            command.Invoke(null, objParams);
                            break;
                    }
                }
                catch (Exception ex)
                {
                    WriteLine(ex.ToString(), ConsoleColor.Red);
                }

                WriteLine();
            }
        }

        static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            var appDomain = (AppDomain)sender;
            logger.Error("AppDomain:{0} UnhandledException：{1}", appDomain, e.ExceptionObject);
            if (e.IsTerminating)
            {
                Logger.Shutdown();
            }
        }

        private static void WriteLine(string message = null, ConsoleColor color = ConsoleColor.White)
        {
            lock (typeof(Console))
            {
                Console.ForegroundColor = color;
                Console.WriteLine(message);
            }
        }

        private static ServiceController GetServiceController()
        {
            var name = Assembly.GetExecutingAssembly().GetName().Name;
            return new ServiceController(name, ".");
        }

        [Command("安装服务")]
        private static void Install()
        {
            var assembly = Assembly.GetEntryAssembly();
            var installer = new AssemblyInstaller(assembly, null);
            installer.UseNewContext = false;

            var input = new string[] { "AssemblyPath=\"" + assembly.Location + "\" -installed" };
            var transactedInstaller = new TransactedInstaller();
            transactedInstaller.Context = new InstallContext(null, input);
            transactedInstaller.Installers.Add(installer);
            transactedInstaller.Install(new Hashtable());
        }

        [Command("卸载服务")]
        private static void Uninstall()
        {
            var assembly = Assembly.GetEntryAssembly();
            var installer = new AssemblyInstaller(assembly, null);
            installer.UseNewContext = false;

            var input = new string[] { "AssemblyPath=\"" + assembly.Location + "\"" };
            var transactedInstaller = new TransactedInstaller();
            transactedInstaller.Context = new InstallContext(null, input);
            transactedInstaller.Installers.Add(installer);
            transactedInstaller.Uninstall(null);
        }

        [Command("启动服务")]
        private static void Start()
        {
            using (var controller = GetServiceController())
            {
                controller.Start();
            }
        }

        [Command("停止服务")]
        private static void Stop()
        {
            using (var controller = GetServiceController())
            {
                controller.Stop();
            }
        }

        [Command("重启服务")]
        private static void Restart()
        {
            using (var controller = GetServiceController())
            {
                switch (controller.Status)
                {
                    case ServiceControllerStatus.StartPending:
                    case ServiceControllerStatus.Running:
                        int retry = 5;
                        while (controller.Status != ServiceControllerStatus.Stopped && (--retry) >= 0)
                        {
                            controller.Stop();
                            controller.Refresh();
                        }
                        break;
                }

                controller.Start();
            }
        }

        [Command("远程控制")]
        private static void Remote(string command, string name)
        {
            var path = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "conf.conf");
            var conf = File.Exists(path) ? Config.LoadFile(path) : Config.Empty;
            var port = conf.GetUInt16(WebService.RemoteManagerPortProperty, WebService.DefaultRemoteManagerPort);
            
            string responseText;
            using (var webClient = new WebClient())
            {
                webClient.Encoding = Encoding.UTF8;
                responseText = webClient.DownloadString(string.Format("http://localhost:{0}/{1}?name={2}", port, command, name));
            }
            var json = Json.Parse<JsonObject>(responseText);
            if (json["errcode"] != 0)
            {
                WriteLine(json["errmsg"], ConsoleColor.Red);
                return;
            }

            WriteLine(json["data"]);
        }
    }
}
