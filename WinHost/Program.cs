using System;
using System.Runtime.InteropServices;
using System.Threading;
using LyxFramework.Log;
using SimpleHttpServer;

namespace WinHost
{
    class Program
    {
        private delegate bool ControlCtrlHandler(int type);

        [DllImport("kernel32.dll")]
        private static extern bool SetConsoleCtrlHandler(ControlCtrlHandler handler, bool add);
        private static ControlCtrlHandler _handler;
        private static HttpServer _httpService;
        
        static void Main(string[] args)
        {
            LogManager.Assign(FileLogFactory.Default);
            AppDomain.CurrentDomain.UnhandledException += CurrentDomain_UnhandledException;
            _handler = new ControlCtrlHandler(HandlerRoutine);
            SetConsoleCtrlHandler(_handler, true);

            Console.WriteLine("version: {0}", typeof(HttpServer).Assembly.GetName().Version);

            _httpService = new HttpServer();
            _httpService.Start();

            Console.WriteLine("started...");
            Console.ReadKey();
            Shutdown();
        }

        static void CurrentDomain_UnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            var appDomain = sender as AppDomain;
            LogManager.Fatal.Log("AppDomain:{0} UnhandledException:{1}", appDomain, e.ExceptionObject);
            if (e.IsTerminating)
                LogManager.Shutdown();
        }
        static bool HandlerRoutine(int type)
        {
            switch (type)
            {
                case 0:
                    //Ctrl+C关闭
                    Shutdown();
                    break;
                case 2:
                    //按控制台关闭按钮关闭
                    Shutdown();
                    break;
            }
            return false;
        }

        private static void Shutdown()
        {
            _httpService.Stop();
            LogManager.Shutdown();
        }
    }

    public class LinkedList<T>
    {
        private volatile Node _head;
        private volatile Node _tail;

        public LinkedList()
        {
            _head = _tail = new Node();
        }

        public void AddTail(T value)
        {
            var node = new Node();
            node.value = value;

            while (true)
            {
                var tail = _tail;
                if (Interlocked.CompareExchange(ref tail.next, node, null) == null)
                {

                    break;
                }
            }
        }

        class Node
        {
            public T value;
            public Node next;
        }
    }
}
