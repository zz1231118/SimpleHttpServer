<!DOCTYPE HTML>
<html>
	<head>
        <meta http-equiv="content-type" content="text/html; charset=utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>OAuth</title>
        <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="stylesheet" type="text/css" href="http://open.apowogame.com/library/static/css/simple-img.css" />
        <link rel="stylesheet" type="text/css" href="http://open.apowogame.com/library/static/css/simple-style.css" />
        <link rel="stylesheet" type="text/css" href="http://open.apowogame.com/library/static/css/wui.css" />

        <script type="text/javascript" charset="utf-8" src="http://open.apowogame.com/library/static/js/akky.js"></script>
	</head>
	
	<body style="margin: 0; padding: 0;">

        <div class="header unselectable">
            <div id="nav-home" class="nav-logo">
                <a class="logo-inner" href="/index.aspx" title="爱扑网络">
                    <i class="logo-icon"></i>
                    <span id="nav-home-title" class="logo-text">爱扑网络</span>
                </a>
            </div>
            <ul id="nav-user" class="nav-user">
                <li class="nav-user-li"><a href="/wiki.html" target="_blank"><i class="nav-icon icon-book icon-white"></i> 帮助文档</a></li>
                <li class="nav-user-li"><a href="/register.html" target="_blank"><i class="nav-icon icon-th-large icon-white"></i> 注册</a></li>
                <li class="nav-user-li">
                    <a href="javascript: context.UnknownSelect('用户信息', '/user-info.html');">
                        <i class="nav-icon icon-user icon-white"></i>
                        <span id="user-info" style="display: inline-block;"><% Response.Write(Account.Nickname); %></span>
                        <i class="nav-arrows"></i>
                    </a>
                    <ul class="nav-user-menu">
                        <li><a href="javascript: context.menu.UnknownSelect('用户信息', '/user-info.html');"><span><i class="nav-icon icon-list-alt icon-white"></i>详细信息</span></a></li>
                        <li><a href="javascript: context.menu.UnknownSelect('修改密码', '/user-info.html');"><span><i class="nav-icon icon-pencil icon-white"></i>修改密码</span></a></li>
                        <li><span class="user-info-line"></span></li>
                        <li><a href="javascript: freshen();"><span><i class="nav-icon icon-refresh icon-white"></i>刷新</span></a></li>
                        <li><a href="javascript: modeSwitch();"><span id="user-mode"><i class="nav-icon icon-adjust icon-white"></i>正常</span></a></li>
                        <li><span class="user-info-line"></span></li>
                        <li><a href="javascript: logout()"><span><i class="nav-icon icon-off icon-white"></i>退出</span></a></li>
                    </ul>
                </li>
            </ul>
        </div>

        <div id="container" class="container">
            <div id="sidebar" class="aside unselectable">
                <div class="aside-area">
                    <h2 class="aside-headline">
                        <span>爱扑开放平台</span>
                    </h2>
                    <ul id="aside-menu" class="aside-list"></ul>
                </div>
                <div id="retract" class="menu-fold" onclick="toggle_sidebar()"><i></i></div>
            </div>
            <div id="main" class="main">
                <div class="manage-area">
                    <div class="manage-area-title">
                        <h2 id="main-title">脚本执行</h2>
                    </div>
                    <div class="manage-area-main">
                        <div id="main-content" class="main-content"></div>
                    </div>
                </div>
            </div>
        </div>
        <script>
            function toggle_sidebar() {
                let container = document.getElementById('container');
                if (container.className.indexOf('aside-hidden') < 0) {
                    container.className = 'container aside-hidden';
                } else {
                    container.className = 'container aside-visible';
                }
            }
            akky.config({
                baseUrl: '/static/js/',
                paths: {
                    static: 'http://open.apowogame.com/library/static/js/',
                    controller: '/controller/',
                }
            });
            akky.run(['core', 'app'], (core, app) => {
                core.account.Integrity(null, p => {
                    if (p.result) {
                        if (confirm('您的资料不完整，是否前往完善？')) {
                            window.location.href = '/route/user-info.html';
                            return;
                        }
                    }
                });

                new app.Application();
            });
            function freshen() {
                window.location.href = "/";
            }
            function logout() {
                akky.run(['core'], (core) => {
                    core.account.logout(null, p => window.location.href = "/login.aspx");
                });
            }
        </script>
	</body>
</html>