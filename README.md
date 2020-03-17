# 简单的http服务器（SimpleHttpServer）
====================

## 一：功能介绍

### 1.支持 GET、POST 请求，文件上传下载，断点续传。
### 2.支持像类asp 混编
```C#
public class TestWindow : CSharpScript
{
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