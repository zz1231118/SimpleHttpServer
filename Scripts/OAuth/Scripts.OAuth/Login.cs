namespace Scripts.OAuth
{
    public class Login : OAuthScript
    {
        public override void Invoke()
        {
            StartSession();
            if (IsAuthority)
            {
                Response.Redirect("./index.aspx");
                return;
            }
        }
    }
}
