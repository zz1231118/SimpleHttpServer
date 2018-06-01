using System;

namespace SimpleHttpServer.Net
{
    [Flags]
	public enum AuthenticationSchemes
    {
		None,
		Digest = 1,
		Negotiate = 2,
		Ntlm = 4,
		IntegratedWindowsAuthentication = 6,
		Basic = 8,
		Anonymous = 0x8000,
	}
}