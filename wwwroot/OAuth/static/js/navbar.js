var context = context || { };
context.isDebug = false;

class Guaranty {

    constructor(period = 5 * 1000) {
        this._period = period;
    }

    get period() {
        return this._period;
    }
    get activated() {
        return this._ptr != null;
    }

    _callback() {
        $.post('/handler/AccountHandler.yshx?action=Info', null, function(str) {
            let p = $.eval(str);
            if (!p.result) {
                window.location.href = "/login.html";
            }
        });
    }

    start() {
        if (this._ptr == null) {
            this._callback();
            this._ptr = setInterval(this._callback, this._period);
        }
    }
    stop() {
        if (this._ptr != null) {
            clearInterval(this._ptr);
            this._ptr = null;
        }
    }
}

function logout() {
    $.post('/handler/AccountHandler.yshx?action=Logout', null, function(dst) {
        window.location.href = "/login.html";
    });
}
function getScriptArgs() {
    let scripts = document.getElementsByTagName("script");
    let script = null;
    for (let i = 0; i < scripts.length; i++) {
        if (scripts[i].src.indexOf('navbar.js') >= 0) {
            script = scripts[i];
            break;
        }
    }

    let res = {};
    if (script == null) {
        return res;
    }

    let temp;
    let reg = /(?:\?|&)(.*?)=(.*?)(?=&|$)/g; 
    while((temp = reg.exec(script.src)) != null) {
        res[temp[1]] = decodeURIComponent(temp[2]);
    }
    return res; 
};
function buildSidebar(login, admin) {
    /*
    <li><a id="changeinfo" href="/user_info.html"><i class="nav-icon icon-user icon-white"></i>六月雪</a></li>
    <li><a href="javascript: logout()"><i class="nav-icon icon-off icon-white"></i>退出</a></li>
    */
    var array = [
        {
            login: false,
            admin: 0,
            url: '<a href="/wiki.html" target="_blank"><i class="nav-icon icon-book icon-white"></i> 帮助文档</a>'
        },
        {
            login: false,
            admin: 0,
            url: '<a href="/register.html" target="_blank"><i class="nav-icon icon-user icon-white"></i> 注册</a>'
        },
        {
            login: true,
            admin: 0,
            url: '<a id="changeinfo" href="javascript: context.menu.UnknownSelect(\'用户信息\', \'/route/user-info.html\');"><i class="nav-icon icon-user icon-white"></i> </a>'
        },
        {
            login: true,
            admin: 0,
            url: '<a href="javascript: logout()"><i class="nav-icon icon-off icon-white"></i> 退出</a>'
        },
    ];
    let root = document.getElementById('nav-user');
    for (let i = 0; i < array.length; i++) {
        let obj = array[i];
        if (obj.login) {
            if (!login) {
                continue;
            }
        }

        if (obj.admin <= admin) {
            let li = document.createElement('li');
            li.innerHTML = obj.url;
            root.appendChild(li);
        }
    }
}
function buildMenu(admin) {
    let array = [{
        name: '应用列表',
        url: '/route/app-list.html',
        selected: true,
    }, {
        name: '帐号管理',
        url: '/route/account.html',
        admin: 2
    }, {
        name: '邀请码',
        url: '/route/invite.html',
        admin: 1
    }];

    let newArray = new Array();
    for (let key in array) {
        let item = array[key];
        if (item.hasOwnProperty('admin') && admin < item.admin) {
            continue;
        }

        newArray.push(item);
    }
    context.menu = new ContextMenu('aside-menu', newArray);
}

$.ready(function() {
    let home_title = document.getElementById('nav-home-title');
    if (home_title != null) {
        home_title.innerHTML = '爱扑开放平台';
    }

    var args = getScriptArgs();
    context.notCheckLogin = args.notCheckLogin == 'true';
    if (!context.notCheckLogin) {
        $.post('/handler/AccountHandler.yshx?action=Info', null, function(str) {
            var result = $.eval(str);
            if (!result.result) {
                if (args.notCheckSkip != 'true') {
                    window.location.href = "/login.html";
                } else {
                    buildSidebar(false, 0);
                }
            } else {
                let data = result.data;
                let admin = data.AdminType;
                buildSidebar(true, admin);
                buildMenu(admin);

                let element = document.getElementById('changeinfo');
                element.innerHTML += data.Nickname;

                if (!context.isDebug) {
                    context.guaranty = new Guaranty();
                    context.guaranty.start();
                }
            }
        });
    } else {
        buildSidebar(false, 0);
    }
});

var hiddenProperty = 'hidden' in document ? 'hidden' : 'webkitHidden' in document ? 'webkitHidden' : 'mozHidden' in document ? 'mozHidden' : null;
var visibilityChangeEvent = hiddenProperty.replace(/hidden/i, 'visibilitychange');
document.addEventListener(visibilityChangeEvent, function() {
    if (document[hiddenProperty]) {
        context.guaranty && context.guaranty.stop();
    } else {
        context.guaranty && context.guaranty.start();
    }
});