define((require) => {
    let system = require('./netcore/system');
    let generic = require('./netcore/system.collections.generic');
    let $ = require('./jquery');

    let EventArgs = system.Event;
    let EventDispatcher = system.EventDispatcher;
    let Dictionary = generic.Dictionary;

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
            if (0 <= index && index < this._length) {
                return this[index];
            }
            return undefined;
        }
        add(element) {
            return this[this._length++] = element;
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
                if (child.id == key) {
                    return child;
                } else if ('children' in child && child.children.length > 0) {
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
                if (child.tagName == name) {
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

    class WindowInput {

        constructor(dictionary) {
            this._dictionary = dictionary;
        }

        get(key, defval) {
            if (this._dictionary.containsKey(key)) {
                return this._dictionary.get(key);
            }
            return defval;
        }
        getString(key, defval) {
            if (this._dictionary.containsKey(key)) {
                return this._dictionary.get(key);
            }
            return defval;
        }
        getNumber(key, defval) {
            if (this._dictionary.containsKey(key)) {
                let value = this._dictionary.get(key);
                return Number(value);
            }
            return defval;
        }
        getBoolean(key, defval) {
            if (this._dictionary.containsKey(key)) {
                let value = this._dictionary.get(key);
                return Boolean(value);
            }
            return defval;
        }
    }
    class WindowEventArgs extends EventArgs {
        constructor(type, viewport) {
            super(type, viewport);
        }

        get viewport() {
            return this.data;
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

    class Window extends EventDispatcher {
        constructor(metadata) {
            super();
            if (!metadata.url) {
                throw 'metadata url property not found.';
            }

            this._metadata = metadata;
            this._viewport = this.getViewport();
            this._input = this.getInput();
            this._status = WindowStatus.none;
        }

        get name() {
            return this._metadata.name;
        }
        get url() {
            return this._metadata.url;
        }
        get metadata() {
            return this._metadata;
        }
        get input() {
            return this._input;
        }
        get status() {
            return this._status;
        }

        getViewport() {
            let url = this._metadata.url.replace('/controller/', '/view/');
            let index = url.indexOf('?');
            if (index > 0) {
                return url.substring(0, index) + '.html' + url.substring(index);
            } else {
                return url + '.html';
            }
        }
        getInput() {
            let dictionary = new Dictionary();
            let index = this._viewport.indexOf('?');
            if (index >= 0) {
                let array = this._viewport.substring(index + 1, this._viewport.length).split('&');
                for (let param of array) {
                    let parray = param.split('=');
                    if (parray.length === 2) {
                        let key = unescape(parray[0]);
                        let value = unescape(parray[1]);
                        dictionary.add(key, value);
                    }
                }
            }
            return new WindowInput(dictionary);
        }
        initialize(context) {
            let child;
            let fragment = document.createDocumentFragment();
            for (let i = 0; i < context.children.length; i++) {
                child = context.children.item(i);
                fragment.appendChild(child);
            }

            this._status = WindowStatus.initialized;
            this.dispatchEvent(new WindowEventArgs(Window.Render, fragment));
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
            } else {
                node.onreadystatechange = () => {
                    if (/loaded|complete/.test(node.readyState)) {
                        callback && callback();
                    }
                };
            }
            head.appendChild(node);
        }
        show() {
            switch (this._status) {
                case WindowStatus.none:
                    this._status = WindowStatus.loading;
                    if ('styles' in this._metadata) {
                        let styles = this._metadata['styles'];
                        let count = 0;
                        let length = styles.length;
                        for (let style of styles) {
                            this.importStyle(style, () => {
                                if (++count === length) {
                                    $.get(this._viewport, null, (html) => {
                                        this._html = html;
                                        this._status = WindowStatus.loaded;
                                        this.initializing();
                                    });
                                }
                            });
                        }
                    } else {
                        $.get(this._viewport, null, (html) => {
                            this._html = html;
                            this._status = WindowStatus.loaded;
                            this.initializing();
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

    class Application {

        constructor() {
            Application._current = this;
            this._running = false;
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

    return {
        Window: Window,
        WindowStatus: WindowStatus,

        Application: Application,
    }
});