define((require) => {
    let system = require('static/netcore/system');
    let $ = require('static/jquery');

    let EventArgs = system.Event;
    let EventDispatcher = system.EventDispatcher;

    class HtmlElementCollection {
        constructor(children = null) {
            this._length = 0;
            if (children != null) {
                for (let child of children) {
                    this.add(child);
                }
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
        constructor(children = null) {
            this._children = new HtmlElementCollection(children);
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
        constructor(url) {
            super();

            this._url = url;
            this._viewport = url.replace('controller', 'view') + '.html';
            this._status = WindowStatus.none;
        }

        get url() {
            return this._url;
        }
        get status() {
            return this._status;
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
            let element = document.createElement('div');
            element.innerHTML = this._html;
            //akky.Script.execHtmlScript(this._html);

            this._status = WindowStatus.initializing;
            this.initialize(new DocumentContext(element.children));
        }

        show() {
            switch (this._status) {
                case WindowStatus.none:
                    this._status = WindowStatus.loading;
                    $.get(this._viewport, null, (html) => {
                        this._html = html;
                        this._status = WindowStatus.loaded;
                        this.initializing();
                    });
                    break;
                case WindowStatus.initialized:
                    this.initializing();
                    break;
            }
        }
    }
    Window.Render = 'render';

    return {
        Window: Window,
        WindowStatus: WindowStatus,
    }
});