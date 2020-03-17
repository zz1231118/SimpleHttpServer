define((require) => {
    let system = require('./system');

    let Type: system.TypeConstructor = system.Type;
    let ArgumentException: system.ArgumentExceptionConstructor = system.ArgumentException;
    let Event: system.EventConstructor = system.Event;
    let EventDispatcher: system.EventDispatcherConstructor = system.EventDispatcher;

    class URLReaderEvent extends Event {
        public constructor(type: string, data: any) {
            super(type, data);
        }
    }

    class URLReader extends EventDispatcher {
        public static readonly Completed = 'completed';
        private _xhr: XMLHttpRequest;
        private _contentType: system.io.URLReaderContentType;

        public constructor(contentType: system.io.URLReaderContentType = '') {
            super();

            this._contentType = contentType;
            if (window['XMLHttpRequest']) {
                // code for IE7+, Firefox, Chrome, Opera, Safari 
                this._xhr = new XMLHttpRequest();
            } else if (window['ActiveXObject']) {
                try {
                    this._xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (ex) {
                    this._xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }
            }
            this._xhr.responseType = contentType == 'file' ? 'blob' : <XMLHttpRequestResponseType>contentType;
            this._xhr.onload = e => {
                let xhr = <XMLHttpRequest>e.currentTarget;
                if (xhr.status == 200) {
                    let response = xhr.response;
                    switch (this._contentType) {
                        case 'file':
                            let url = xhr.responseURL;
                            let index = url.lastIndexOf('/') >= 0 ? url.lastIndexOf('/') : url.lastIndexOf('\\');
                            let name = index >= 0 ? url.substring(index + 1) : url;
                            let blob = <Blob>xhr.response;
                            response = new File([blob], name, { type: blob.type });
                        default:
                            response = xhr.response;
                            break;
                    }

                    this.dispatchEvent(new URLReaderEvent(URLReader.Completed, response));
                }
            };
        }

        public get contentType(): system.io.URLReaderContentType {
            return this._contentType;
        }
        public set contentType(value: system.io.URLReaderContentType) {
            this._xhr.responseType = value === 'file' ? 'blob' : <XMLHttpRequestResponseType>value;
        }

        public load(url: string): void {
            if (!Type.isString(url))
                throw new ArgumentException('url is not of "string"');

            this._xhr.open("get", url, true);
            this._xhr.send();
        }
    }

    return {
        URLReader: URLReader,
    };
});