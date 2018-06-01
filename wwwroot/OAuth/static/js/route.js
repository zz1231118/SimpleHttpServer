class ResultCode {
    static get ok() {
        return 0;
    }
}
class ServerError {

    constructor(code, message) {
        this._code = code;
        this._message = message;
    }

    get code() {
        return this._code;
    }
    get message() {
        return this._message;
    }
}
window.onerror = function(message, url, row, column, error) {
    console.log(typeof(message));
    if (error instanceof ServerError) {
        if (error.code == 1) {
            window.parent.postMessage({ action: 1 }, '*');
        }
    }
};

class Result {

    static check(p) {
        if (p == null)
            throw new Error('argument null exception: p');

        if (p.hasOwnProperty('result')) {
            return p.result;
        } else if (p.hasOwnProperty('code')) {
            if (p.code == ResultCode.ok) {
                return true;
            }

            throw new ServerError(p.code, p.data);
        } else {
            throw new Error('unknown result!');
        }
    }
}