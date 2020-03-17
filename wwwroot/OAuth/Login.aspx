<!doctype html>
<html>
	<head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
		<title>OAuth</title>
		<link rel="stylesheet" type="text/css" href="http://open.apowogame.com/library/static/css/simple-img.css" />
        <link rel="stylesheet" type="text/css" href="http://open.apowogame.com/library/static/css/simple-style.css" />
        <link rel="stylesheet" type="text/css" href="http://open.apowogame.com/library/static/css/wui.css" />

        <script type="text/javascript" charset="utf-8" src="http://open.apowogame.com/library/static/js/akky.js"></script>
        <style>
            .pm-label { margin-left:25px; width: 40px; float: left; padding-top: 5px; text-align: right; }
            .pm-content { width:230px; }
            .form-horizontal { display: flex; margin-bottom: 5px; }
        </style>
	</head>
	<body style="margin: 0; padding: 0;">

        <div class="header navbar-fixed-top">
            <div id="nav-home" class="nav-logo">
                <a class="logo-inner" href="/index.html" title="爱扑网络">
                    <i class="logo-icon"></i>
                    <span id="nav-home-title" class="logo-text">爱扑网络</span>
                </a>
            </div>
            <ul id="nav-user" class="nav-user">
                <li class="nav-user-li"><a href="/wiki.html" target="_blank"><i class="nav-icon icon-book icon-white"></i> 帮助文档</a></li>
                <li class="nav-user-li"><a href="/register.html" target="_blank"><i class="nav-icon icon-th-large icon-white"></i> 注册</a></li>
            </ul>
        </div>

        <div class="wui-container-fluid">
            <div class="wui-panel" style="width: 350px;">
                <div class="wui-panel-heading">
                    <span class="wui-panel-title">登录</span>
                </div>
                <div class="wui-panel-body">
                    <div class="form-horizontal">
                        <span class="pm-label">账号：</span>
                        <input id="user_name" type="text" class="wui-input pm-content" />
                    </div>
                    <div class="form-horizontal">
                        <span class="pm-label">密码：</span>
                        <input id="user_pwd" type="password" class="wui-input pm-content" />
                    </div>
                    <hr class="mt10 mb15">
                    <div class="form-horizontal">
                        <span class="pm-label"></span>
                        <button id="btn-login" class="wui-btn wui-btn-default">登录</button>
                    </div>
                    
                </div>
            </div>
        </div>

        <script>
            akky.config({
                baseUrl: '/static/js/',
                paths: {
                    static: 'http://open.apowogame.com/library/static/js/',
                }
            });
            akky.run(['static/jquery', 'core', 'security'], ($, core, security) => {
                $('#btn-login').click(() => {
                    var user_name = document.getElementById("user_name");
                    var user_pwd = document.getElementById('user_pwd');
                    if (user_name.value === "") {
                        alert("账号不能为空!");
                        return false;
                    }
                    if (user_pwd.value === "") {
                        alert("密码不能为空!");
                        return false;
                    }
                    
                    let credential = new security.ClientCredential(user_name.value, user_pwd.value);
                    let auth = credential.create();
                    let param = { account: auth.account, timestamp: auth.timestamp, token: auth.token };
                    core.account.login(param, p => p.result ? window.location.href = "/" : alert(p.data));
                });

                console.log($('body').find('*'));
            });
        </script>
	</body>
</html>