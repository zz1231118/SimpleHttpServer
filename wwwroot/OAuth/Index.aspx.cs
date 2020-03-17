namespace Scripts.OAuth
{
    public class Index : OAuthScript
    {
        public override void Invoke()
        {
            StartSession();
            if (!IsAuthority)
            {
                Response.Redirect("./login.aspx");
                return;
            }
        }
    }
}
