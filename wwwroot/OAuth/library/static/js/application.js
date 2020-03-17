define((require) => {
    let system = require('./netcore/system');
    let jquery = require('./jquery');
    let $ = jquery;
    let Event = system.Event;
    let EventDispatcher = system.EventDispatcher;
    class Application {
        constructor() {
            this._running = false;
            Application._current = this;
        }
        static get current() {
            return Application._current;
        }
        onStartup() {
        }
        onShutdown() {
        }
        startup() {
            if (this._running) {
                throw 'repeated initialization.';
            }
            this._running = true;
            this.onStartup();
        }
        shutdown() {
            if (this._running) {
                this._running = false;
                this.onShutdown();
            }
        }
    }
    class HtmlElementCollection {
        constructor(collection = null) {
            this._length = 0;
            if (collection != null) {
                this.addRange(collection);
            }
        }
        get length() {
            return this._length;
        }
        item(index) {
            return 0 <= index && index < this._length ? this[index] : undefined;
        }
        add(element) {
            this[this._length++] = element;
        }
        addRange(collection) {
            for (let child of collection) {
                this.add(child);
            }
        }
        [Symbol.iterator]() {
            let enumerable = this;
            function* anotherGenerator() {
                let length = enumerable.length;
                for (let i = 0; i < length; i++) {
                    yield enumerable.item(i);
                }
            }
            return anotherGenerator();
        }
    }
    class DocumentContext {
        constructor(children) {
            this._children = children;
        }
        get children() {
            return this._children;
        }
        getParentElementById(parent, key) {
            let child;
            let length = parent.children.length;
            for (let i = 0; i < length; i++) {
                child = parent.children.item(i);
                if (child.id === key) {
                    return child;
                }
                else if ('children' in child && child.children.length > 0) {
                    child = this.getParentElementById(child, key);
                    if (child !== undefined) {
                        return child;
                    }
                }
            }
            return undefined;
        }
        getParentElementByTagName(parent, name) {
            let child;
            let children;
            let array = new Array();
            let length = parent.children.length;
            for (let i = 0; i < length; i++) {
                child = parent.children.item(i);
                if (child.tagName === name) {
                    array.push(child);
                }
                if ('children' in child && child.children.length > 0) {
                    children = this.getParentElementByTagName(child, name);
                    if (children.length > 0) {
                        for (let pc of children) {
                            array.push(pc);
                        }
                    }
                }
            }
            return array;
        }
        getParentElementsByClassName(parent, name) {
            let child;
            let children;
            let array = new Array();
            let length = parent.children.length;
            for (let i = 0; i < length; i++) {
                child = parent.children.item(i);
                if (child.classList.contains(name)) {
                    array.push(child);
                }
                if ('children' in child && child.children.length > 0) {
                    children = this.getParentElementsByClassName(child, name);
                    if (children.length > 0) {
                        for (let pc of children) {
                            array.push(pc);
                        }
                    }
                }
            }
            return array;
        }
        getElementById(key) {
            return this.getParentElementById(this, key);
        }
        getElementsByTagName(name) {
            return this.getParentElementByTagName(this, name);
        }
        getElementsByClassName(name) {
            return this.getParentElementsByClassName(this, name);
        }
    }
    let WindowStatus;
    (function (WindowStatus) {
        WindowStatus[WindowStatus["none"] = 0] = "none";
        WindowStatus[WindowStatus["loading"] = 1] = "loading";
        WindowStatus[WindowStatus["loaded"] = 2] = "loaded";
        WindowStatus[WindowStatus["initializing"] = 3] = "initializing";
        WindowStatus[WindowStatus["initialized"] = 4] = "initialized";
    })(WindowStatus || (WindowStatus = {}));
    class WindowEvent extends Event {
        constructor(type, viewport) {
            super(type, viewport);
        }
        get viewport() {
            return this.data;
        }
    }
    class Window extends EventDispatcher {
        constructor(metadata) {
            super();
            if (!metadata.url) {
                throw 'metadata url property not found.';
            }
            this._metadata = metadata;
            this._viewport = metadata.url.replace('controller', 'view') + '.html';
            this._status = WindowStatus.none;
        }
        get url() {
            return this._metadata.url;
        }
        get metadata() {
            return this._metadata;
        }
        get status() {
            return this._status;
        }
        initializing() {
            this._status = WindowStatus.initializing;
            let htmlContainer = document.createElement('div');
            htmlContainer.innerHTML = this._html;
            //akky.Script.execHtmlScript(this._html);
            let collection = new HtmlElementCollection(htmlContainer.children);
            this.initialize(new DocumentContext(collection));
        }
        importStyle(url, callback) {
            let head = document.head || document.getElementsByTagName('head')[0] || document.documentElement;
            let node = document.createElement('link');
            node.setAttribute('rel', 'stylesheet');
            node.setAttribute('charset', 'utf-8');
            node.setAttribute('href', url);
            if ('onload' in node) {
                node.onload = () => {
                    callback && callback();
                };
                node.onerror = () => {
                    console.error('load style error: ' + url);
                };
            }
            else {
                let element = node;
                element.onreadystatechange = () => {
                    if (/loaded|complete/.test(element.readyState)) {
                        callback && callback();
                    }
                };
            }
            head.appendChild(node);
        }
        loadStruct() {
            $.get(this._viewport, null, (html) => {
                this._html = html;
                this._status = WindowStatus.loaded;
                this.initializing();
            });
        }
        initialize(context) {
            let child;
            let fragment = document.createDocumentFragment();
            for (let i = 0; i < context.children.length; i++) {
                child = context.children.item(i);
                fragment.appendChild(child);
            }
            this._status = WindowStatus.initialized;
            this.dispatchEvent(new WindowEvent(Window.Render, fragment));
        }
        show() {
            switch (this._status) {
                case WindowStatus.none:
                    this._status = WindowStatus.loading;
                    if ('styles' in this._metadata) {
                        let count = 0;
                        let styles = this._metadata['styles'];
                        for (let style of styles) {
                            this.importStyle(style, () => {
                                if (++count === styles.length) {
                                    this.loadStruct();
                                }
                            });
                        }
                    }
                    else {
                        $.get(this._viewport, null, (html) => {
                            this.loadStruct();
                        });
                    }
                    break;
                case WindowStatus.initialized:
                    this.initializing();
                    break;
            }
        }
    }
    Window.Render = 'render';
    return {
        Application: Application,
        Window: Window,
        WindowStatus: WindowStatus,
    };
});
//# sourceMappingURL=application.js.map