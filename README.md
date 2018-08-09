# SimpleHttpServer

简单的http服务器
====================

## 一：功能介绍

### 1.支持简单的 GET、POST 请求，文件上传下载。
### 2.支持像asp 一样的简单型混编
```C#
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
```
```ASP
<html>
	<head>
		<title>OAuth</title>
	</head>
	<body>
        <script>
            let str = '<% Response.Write(Content); %>';
            console.log(str);
        </script>

        <%
            for (int i = 0; i < Count; i++)
            {
         %>
         <div><% Response.Write("Hello World!"); %></div>
         <%
            }
         %>
	</body>
</html>
```