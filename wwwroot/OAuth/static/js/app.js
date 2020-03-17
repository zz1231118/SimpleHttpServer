define((require) => {
    let generic = require('static/netcore/system.collections.generic');
    let menus = require('static/context-menu');
    let $ = require('static/jquery');

    let ContextMenu = menus.ContextMenu;
    let List = generic.List;

    class Application {
        constructor() {
            Application._current = this;

            let menuMetadatas = [{
                header: '应用列表',
                //url: '/route/app-list.html',
                url: 'controller/app-list',
                selected: true,
            }, {
                header: '帐号管理',
                url: 'controller/account',
                admin: 2
            }, {
                header: '邀请码',
                url: 'controller/invite',
                admin: 1
            }];

            this._windows = new List();
            this._title = document.getElementById('main-title');
            this._content = document.getElementById('main-content');
            this._contextMenu = new ContextMenu('aside-menu', menuMetadatas);
            this._contextMenu.addEventListener(ContextMenu.ItemSelectedChanged, this.onMenuSelectedChanged, this);
            this._contextMenu.initialize();
        }

        static get current() {
            if (Application._current == null) {
                throw 'current is null.';
            }
            return Application._current;
        }

        get windows() {
            return this._windows;
        }

        onWindowRender(e) {
            this._content.innerHTML = '';
            this._content.appendChild(e.viewport);
        }

        onMenuSelectedChanged(e) {
            this.open(e.data);
        }

        open(metadata) {
            if (metadata == null) {
                this._title.innerHTML = null;
                return;
            }

            this._title.innerHTML = metadata.header;
            let window = this._windows.find(p => p.url == metadata.url);
            if (window != null) {
                window.show();
                return;
            }
            require.async(metadata.url, (windows) => {
                let window = new windows.Window(metadata.url);
                window.addEventListener(windows.Window.Render, this.onWindowRender, this);
                window.show();
                this._windows.add(window);
            });
        }
    }
    return {
        Application: Application,
    };
});