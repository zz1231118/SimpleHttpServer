define((require) => {
    let system = require('./system');
    let Type = system.Type;
    let ArgumentException = system.ArgumentException;
    let Event = system.Event;
    let EventDispatcher = system.EventDispatcher;
    class URLReaderEvent extends Event {
        constructor(type, data) {
            super(type, data);
        }
    }
    class URLReader extends EventDispatcher {
        constructor(contentType = '') {
            super();
            this._contentType = contentType;
            if (window['XMLHttpRequest']) {
                // code for IE7+, Firefox, Chrome, Opera, Safari 
                this._xhr = new XMLHttpRequest();
            }
            else if (window['ActiveXObject']) {
                try {
                    this._xhr = new ActiveXObject("Microsoft.XMLHTTP");
                }
                catch (ex) {
                    this._xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }
            }
            this._xhr.responseType = contentType == 'file' ? 'blob' : contentType;
            this._xhr.onload = e => {
                let xhr = e.currentTarget;
                if (xhr.status == 200) {
                    let response = xhr.response;
                    switch (this._contentType) {
                        case 'file':
                            let url = xhr.responseURL;
                            let index = url.lastIndexOf('/') >= 0 ? url.lastIndexOf('/') : url.lastIndexOf('\\');
                            let name = index >= 0 ? url.substring(index + 1) : url;
                            let blob = xhr.response;
                            response = new File([blob], name, { type: blob.type });
                        default:
                            response = xhr.response;
                            break;
                    }
                    this.dispatchEvent(new URLReaderEvent(URLReader.Completed, response));
                }
            };
        }
        get contentType() {
            return this._contentType;
        }
        set contentType(value) {
            this._xhr.responseType = value === 'file' ? 'blob' : value;
        }
        load(url) {
            if (!Type.isString(url))
                throw new ArgumentException('url is not of "string"');
            this._xhr.open("get", url, true);
            this._xhr.send();
        }
    }
    URLReader.Completed = 'completed';
    return {
        URLReader: URLReader,
    };
});
//# sourceMappingURL=system.io.js.map