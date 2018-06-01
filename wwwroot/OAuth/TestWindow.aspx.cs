using SimpleHttpServer.Scripts;

namespace Scripts.OAuth
{
    public class TestWindow : CSharpScript
    {
        public TestWindow(IScriptContext context)
            : base(context)
        { }

        public string Content { get; set; }
        public int Count { get; private set; }

        public override void Invoke()
        {
            Content = "Hello World!";
            Count = 15;
        }
    }
}
