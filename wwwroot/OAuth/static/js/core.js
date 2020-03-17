define((require) => {
    let $ = require('static/jquery');
    
    class InvokeManager {

        constructor(gateway, opcodes) {
            this._gateway = gateway;
    
            for (let opcode of opcodes) {
                let action = opcode.action;
                if (action == 'Invoke') {
                    throw new Error('method name conflict: Invoke');
                }
    
                let name = opcode.hasOwnProperty('name') ? opcode.name : action;
                this[name] = function(param, callback) {
                    this.Invoke(action, param, callback);
                };
                this[name + 'Async'] = async function(param) {
                    return this.InvokeAsync(action, param);
                };
            }
        }
    
        Invoke(opcode, param, callback) {
            if (opcode == null)
                throw new Error('argument null exception: opcode');
            if (callback == null) 
                throw new Error('argument null exception: callback');
    
            $.post(this._gateway + '?action=' + opcode, param, p => callback($.eval(p)));
        }
        async InvokeAsync(opcode, param) {
            if (opcode == null)
                throw new Error('argument null exception: opcode');
    
            return new Promise((resolve, reject) => {
                $.post(this._gateway + '?action=' + opcode, param, p => {
                    let json = $.eval(p);
                    json.result ? resolve(json.data) : reject(json.data);
                });
            });
        }
    }
    
    class Core {
    
        static get account() {
            return this._account;
        }
        static get invite() {
            return this._invite;
        }
        static get app() {
            return this._app;
        }
        static get auth() {
            return this._auth;
        }
    }
    
    Core._account = new InvokeManager('/handler/AccountHandler.ashx', [
        { action: 'List', name: 'load' },
        { action: 'Info', name: 'Summary' },
        { action: 'New', name: 'Create' },
        { action: 'Update' },
        { action: 'Save' },
        { action: 'Integrity' },
        { action: 'Login', name: 'login' },
        { action: 'Logout', name: 'logout' },
        { action: 'ChangePassword' },
    ]);
    Core._invite = new InvokeManager('/handler/InviteHandler.ashx', [
        { action: 'List', name: 'Load' },
        { action: 'Delete' },
        { action: 'Build' },
    ]);
    Core._app = new InvokeManager('/handler/AppHandler.ashx', [
        { action: 'List', name: 'Load' },
        { action: 'New', name: 'Create' },
        { action: 'Update' },
        { action: 'Delete' },
    ]);
    Core._auth = new InvokeManager('/handler/AuthHandler.ashx', [
        { action: 'AppInfo', name: 'AppSummary' },
        { action: 'Login', name: 'login' },
    ]);

    return Core;
});