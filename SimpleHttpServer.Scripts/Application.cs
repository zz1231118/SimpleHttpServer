namespace SimpleHttpServer.Scripts
{
    public abstract class Application
    {
        public static Application Current { get; internal set; }
        public string BaseDirectory { get; internal set; }

        protected internal virtual void OnStartup()
        { }
        protected internal virtual void OnExit()
        { }
    }
    internal class App : Application
    { }
}