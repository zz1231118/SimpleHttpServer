define((require) => {
    let cryptography = require('static/netcore/system.security.cryptography');

    let MD5 = cryptography.MD5;

    class Authorization {

        constructor(account, timestamp, token) {
            this._account = account;
            this._timestamp = timestamp;
            this._token = token;
        }
    
        get account() {
            return this._account;
        }
        get timestamp() {
            return this._timestamp;
        }
        get token() {
            return this._token;
        }
    }
    
    class ClientCredential {
    
        constructor(account, accessKey) {
            this._account = account;
            this._accessKey = accessKey;
        }
    
        get account() {
            return this._account;
        }
        get accessKey() {
            return this._accessKey;
        }
    
        _sort(str) {
            let array = new Array();
            for (let i = 0; i < str.length; i++) {
                array.push(str.charAt(i));
            }
            array.sort();
            return array.join("");
        }
        create() {
            let timestamp = parseInt(new Date().getTime() / 1000);
            let str = this._sort(this._account + this._accessKey + timestamp);
            let token = (new MD5()).md5(str);
            return new Authorization(this._account, timestamp, token);
        }
    }

    return {
        Authorization: Authorization,
        ClientCredential: ClientCredential,
    };
});