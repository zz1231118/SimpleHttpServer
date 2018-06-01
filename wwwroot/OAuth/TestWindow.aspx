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