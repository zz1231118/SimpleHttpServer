namespace SimpleHttpServer.Net
{
    public delegate AuthenticationSchemes AuthenticationSchemeSelector(HttpListenerRequest httpRequest);
}