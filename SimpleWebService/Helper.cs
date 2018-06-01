using System.Diagnostics;

namespace SimpleWebService
{
    internal static class Helper
    {
        public static string ExecuteCommand(string command)
        {
            using (var p = new Process())
            {
                p.StartInfo.FileName = "cmd.exe";
                p.StartInfo.CreateNoWindow = false;
                p.StartInfo.UseShellExecute = false;
                p.StartInfo.RedirectStandardInput = true;
                p.StartInfo.RedirectStandardOutput = true;
                p.StartInfo.RedirectStandardError = true;

                p.Start();
                p.StandardInput.AutoFlush = true;
                p.StandardInput.WriteLine(command);
                p.StandardInput.WriteLine("exit");
                p.WaitForExit();
                return p.StandardOutput.ReadToEnd();
            }
        }
    }
}
