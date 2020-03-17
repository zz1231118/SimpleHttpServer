define((require) => {
    let rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i;
    class Char {

        static isDigit(ch) {
            let val = ch.charCodeAt(0);
            return Char._0 <= val && val <= Char._9;
        }
        static isLetter(ch) {
            let val = ch.charCodeAt(0);
            return (Char._la <= val && val <= Char._lz) || (Char._ma <= val && val <= Char._mz);
        }
    }
    Char._0 = '0'.charCodeAt(0);
    Char._9 = '9'.charCodeAt(0);
    Char._la = 'a'.charCodeAt(0);
    Char._lz = 'z'.charCodeAt(0);
    Char._ma = 'A'.charCodeAt(0);
    Char._mz = 'Z'.charCodeAt(0);

    class TextReader {
        constructor(str) {
            this._pos = 0;
            this._str = str;
        }

        get position() {
            return this._pos;
        }

        read() {
            return this._pos >= this._str.length ? -1 : this._str.charAt(this._pos++);
        }
        peek(offset = 0) {
            let pos = this._pos + offset;
            return pos >= this._str.length ? -1 : this._str.charAt(pos);
        }
    }
    class HtmlParser {
        constructor(str) {
            this._reader = new TextReader(str);
            this._name = null;
            this._content = null;
            this._attributes = new Array();

            let start = str.indexOf('>');
            let end = str.lastIndexOf('<');
            if (end >= 0 && end > start) {
                this._content = str.substring(start + 1, end);
            }

            this.init();
        }

        get name() {
            return this._name;
        }
        get content() {
            return this._content;
        }
        get attributes() {
            return this._attributes;
        }

        static parse(str) {
            return new HtmlParser(str);
        }
        readSpace() {
            let ch;
            while ((ch = this._reader.peek()) != -1) {
                if (ch == ' ') {
                    this._reader.read();
                } else {
                    break;
                }
            }
        }
        readSymbol() {
            let ch = this._reader.read();
            if (!Char.isLetter(ch) && ch != '_' && ch != '-') {
                throw ("read symbol error: " + ch);
            }

            let name = ch;
            while ((ch = this._reader.peek()) != -1) {
                if (Char.isDigit(ch) || Char.isLetter(ch) || ch == '_' || ch == '-') {
                    name += this._reader.read();
                } else {
                    break;
                }
            }
            return name;
        }
        readString() {
            let ch = this._reader.read();
            if (ch != '"' && ch != "'") {
                throw 'read string error!'
            }

            let value = "";
            while (true) {
                ch = this._reader.read();
                if (ch == -1) {
                    throw 'stream of end error!';
                } else if (ch == "\\") {
                    ch = this._reader.read();
                } else if (ch == '"' || ch == "'") {
                    break;
                }

                value += ch;
            }
            return value;
        }
        readAttribute() {
            this.readSpace();
            let name = this.readSymbol();
            this.readSpace();
            if (this._reader.read() != '=') {
                throw "attribute '=' symbol error";
            }

            this.readSpace();
            let value = this.readString();
            return {
                name: name,
                value: value
            };
        }
        init() {
            this.readSpace();
            if (this._reader.read() != '<') {
                throw "'<' symbol error";
            }

            let ch;
            this._name = this.readSymbol();
            this.readSpace();
            while ((ch = this._reader.peek()) != -1) {
                if (ch == '/') {
                    this._reader.read();
                    break;
                } else if (ch == '>') {
                    break;
                }

                let attr = this.readAttribute();
                this._attributes.push(attr);
                this.readSpace();
            }
            if (this._reader.read() != '>') {
                throw "'>' symbol error";
            }
        }
        toString() {
            let sb = "<" + this._name;
            if (this._attributes.length > 0) {
                for (let i = 0; i < this._attributes.length; i++) {
                    let att = this._attributes[i];
                    sb += ' ' + att.name + '="' + att.value + '"';
                }
            }
            sb += ">";
            if (this._content != null) {
                sb += this._content + "</" + this._name + ">";
            }
            return sb;
        }
    }

    let Tween = {
        // 以下算子的参数分别表示: t:运行时间，b:开始量，c:总变化量，d:总时间
        Linear: function (t, b, c, d) {
            return c * t / d + b;
        },
        Quad: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t + b;
            },
            easeOut: function (t, b, c, d) {
                return -c * (t /= d) * (t - 2) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t + b;
                return -c / 2 * ((--t) * (t - 2) - 1) + b;
            }
        },
        Cubic: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
                return c / 2 * ((t -= 2) * t * t + 2) + b;
            }
        },
        Quart: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return -c * ((t = t / d - 1) * t * t * t - 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
                return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
            }
        },
        Quint: {
            easeIn: function (t, b, c, d) {
                return c * (t /= d) * t * t * t * t + b;
            },
            easeOut: function (t, b, c, d) {
                return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
                return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
            }
        },
        Sine: {
            easeIn: function (t, b, c, d) {
                return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
            },
            easeOut: function (t, b, c, d) {
                return c * Math.sin(t / d * (Math.PI / 2)) + b;
            },
            easeInOut: function (t, b, c, d) {
                return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
            }
        },
        Expo: {
            easeIn: function (t, b, c, d) {
                return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
            },
            easeOut: function (t, b, c, d) {
                return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
            },
            easeInOut: function (t, b, c, d) {
                if (t == 0) return b;
                if (t == d) return b + c;
                if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
                return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
            }
        },
        Circ: {
            easeIn: function (t, b, c, d) {
                return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
            },
            easeOut: function (t, b, c, d) {
                return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
            },
            easeInOut: function (t, b, c, d) {
                if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
                return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
            }
        },
        Elastic: {
            easeIn: function (t, b, c, d, a, p) {
                if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
                if (!a || a < Math.abs(c)) { a = c; var s = p / 4; }
                else var s = p / (2 * Math.PI) * Math.asin(c / a);
                return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
            },
            easeOut: function (t, b, c, d, a, p) {
                if (t == 0) return b; if ((t /= d) == 1) return b + c; if (!p) p = d * .3;
                if (!a || a < Math.abs(c)) { a = c; var s = p / 4; }
                else var s = p / (2 * Math.PI) * Math.asin(c / a);
                return (a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b);
            },
            easeInOut: function (t, b, c, d, a, p) {
                if (t == 0) return b; if ((t /= d / 2) == 2) return b + c; if (!p) p = d * (.3 * 1.5);
                if (!a || a < Math.abs(c)) { a = c; var s = p / 4; }
                else var s = p / (2 * Math.PI) * Math.asin(c / a);
                if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
                return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
            }
        },
        Back: {
            easeIn: function (t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                return c * (t /= d) * t * ((s + 1) * t - s) + b;
            },
            easeOut: function (t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
            },
            easeInOut: function (t, b, c, d, s) {
                if (s == undefined) s = 1.70158;
                if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
                return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
            }
        },
        Bounce: {
            easeIn: function (t, b, c, d) {
                return c - Tween.Bounce.easeOut(d - t, 0, c, d) + b;
            },
            easeOut: function (t, b, c, d) {
                if ((t /= d) < (1 / 2.75)) {
                    return c * (7.5625 * t * t) + b;
                } else if (t < (2 / 2.75)) {
                    return c * (7.5625 * (t -= (1.5 / 2.75)) * t + .75) + b;
                } else if (t < (2.5 / 2.75)) {
                    return c * (7.5625 * (t -= (2.25 / 2.75)) * t + .9375) + b;
                } else {
                    return c * (7.5625 * (t -= (2.625 / 2.75)) * t + .984375) + b;
                }
            },
            easeInOut: function (t, b, c, d) {
                if (t < d / 2) return Tween.Bounce.easeIn(t * 2, 0, c, d) * .5 + b;
                else return Tween.Bounce.easeOut(t * 2 - d, 0, c, d) * .5 + c * .5 + b;
            }
        }
    };

    class Event {
        constructor(type, data) {
            this._type = type;
            this._data = data;
        }

        get type() {
            return this._type;
        }
        get data() {
            return this._data;
        }
        get target() {
            return this._target;
        }

        setTarget(value) {
            this._target = value;
        }
    }
    class Listener {
        constructor(handler, target) {
            this._handler = handler;
            this._target = target;
        }

        get handler() {
            return this._handler;
        }
        get target() {
            return this._target;
        }

        invoke(e) {
            this._handler.call(this._target, e);
        }
    }
    class EventListener {
        constructor(dom, type) {
            this._dom = dom;
            this._type = type;
            this._listeners = new Array();
            this._handler = (e) => this.invoke(e);
            dom.addEventListener(type, this._handler);
        }

        get type() {
            return this._type;
        }
        get count() {
            return this._listeners.length;
        }

        addEventListener(handler, target) {
            let callTarget = target !== undefined ? target : this;
            let listener = new Listener(handler, callTarget);
            this._listeners.push(listener);
        }
        removeEventListener(handler) {
            let listener;
            let count = 0, index = 0;
            while (index < this._listeners.length) {
                listener = this._listeners[index];
                if (listener.handler === handler) {
                    count++;
                    this._listeners.splice(index, 1);
                } else {
                    index++;
                }
            }
            return count > 0;
        }
        invoke(e) {
            for (let listener of this._listeners) {
                listener.invoke(e);
            }
        }
        dispose() {
            this._dom.removeEventListener(this._type, this._handler);
        }
    }
    class EventObject {
        constructor(dom) {
            this._dom = dom;
            this._eventListeners = {};
            this._size = 0;
        }

        get dom() {
            return this._dom;
        }
        get count() {
            return this._size;
        }

        addEventListener(type, handler, target) {
            let eventListener;
            if (type in this._eventListeners) {
                eventListener = this._eventListeners[type];
            } else {
                eventListener = new EventListener(this._dom, type);
                this._eventListeners[type] = eventListener;
                this._size++;
            }
            
            eventListener.addEventListener(handler, target);
        }
        removeEventListener(type, handler) {
            if (type in this._eventListeners) {
                let eventListener = this._eventListeners[type];
                if (eventListener.removeEventListener(handler)) {
                    if (eventListener.count === 0) {
                        eventListener.dispose();
                        delete this._eventListeners[type];
                        this._size--;
                    }
                    return true;
                }
            }
            return false;
        }
        clearEventListener(type) {
            if (type in this._eventListeners) {
                let eventListener = this._eventListeners[type];
                eventListener.dispose();

                delete this._eventListeners[type];
                this._size--;
            }
        }
        invoke(type, e) {
            switch(arguments.length) {
                case 1:
                    {
                        let eventListener;
                        for (let type in this._eventListeners) {
                            eventListener = this._eventListeners[type];
                            eventListener.invoke(type);
                        }
                    }
                    break;
                case 2:
                    {
                        if (type in this._eventListeners) {
                            let eventListener = this._eventListeners[type];
                            eventListener.invoke(e);
                        }
                    }
                    break;
                default:
                    throw 'argument count error.';
            }
        }
        dispose() {
            let eventListener;
            for (let type in this._eventListeners) {
                eventListener = this._eventListeners[type];
                eventListener.dispose();

                delete this._eventListeners[type];
                this._size--;
            }
        }
    }
    class EventManager {
        static gain(dom, createIfNull) {
            for (let obj of EventManager._eventObjects) {
                if (obj.dom === dom) {
                    return obj;
                }
            }
            if (createIfNull) {
                let eventObject = new EventObject(dom);
                EventManager._eventObjects.push(eventObject);
                return eventObject;
            }
        }
        static dispose(dom) {
            let eventObject;
            for (let i = 0; i < EventManager._eventObjects.length; i++) {
                eventObject = EventManager._eventObjects[i];
                if (eventObject.dom === dom) {
                    EventManager._eventObjects.splice(i, 1);
                    eventObject.dispose();
                    break;
                }
            }
        }
    }
    EventManager._eventObjects = new Array();

    class Selector {
        
    }

    function findForChildById(parent, id) {
        let child;
        let length = parent.children.length;
        for (let i = 0; i < length; i++) {
            child = parent.children.item(i);
            if (child.id == id) {
                return child;
            }
            if ('children' in child && child.children.length > 0) {
                child = findForChildById(child, id);
                if (child !== undefined) {
                    return child;
                }
            }
        }
        return undefined;
    }
    function findForChildByClassName(parent, name) {
        let child;
        let array = new Array();
        let length = parent.children.length;
        for (let i = 0; i < length; i++) {
            child = parent.children.item(i);
            if (child.classList.contains(name)) {
                array.push(child);
            }
            if ('children' in child && child.children.length > 0) {
                let childForArray = findForChildByClassName(child, name);
                if (childForArray.length > 0) {
                    for (let c of childForArray) {
                        array.push(c);
                    }
                }
            }
        }
        return array;
    }
    function findForChild(parent, selector) {
        let result = new Array();
        if (selector === '*') {
            for (let child of parent.children) {
                result.push(child);
            }
        } else {
            let ch = selector.charAt(0);
            if (ch === '#') {
                let val = selector.substr(1);
                let child = parent.getElementById !== undefined
                    ? parent.getElementById(val)
                    : findForChildById(parent, val);
                if (child != null) {
                    result.push(child);
                }
            } else if (ch === ".") {
                let val = selector.substr(1);
                let array = parent.getElementsByClassName !== undefined
                    ? parent.getElementsByClassName(val)
                    : findForChildByClassName(parent, val);
                for (let i = 0; i < array.length; i++) {
                    result.push(array[i]);
                }
            } else {
                let array = parent.getElementsByTagName(selector);
                for (let i = 0; i < array.length; i++) {
                    result.push(array[i]);
                }
            }
        }
        return result;
    }
    function findForArray(parents, selector) {
        if (parents == null) {
            return findForChild(document, selector);
        } else {
            let result = new Array();
            for (let i = 0; i < parents.length; i++) {
                let array = findForChild(parents[i], selector);
                for (let j = 0; j < array.length; j++) {
                    result.push(array[j]);
                }
            }
            return result;
        }
    };

    class Core {
        constructor(selector, context) {
            this._context = context;
            this._elements = new Array();
            if (selector !== undefined) {
                if (typeof selector === 'string') {
                    if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
                        let node = HtmlParser.parse(selector);
                        let element = document.createElement(node.name);
                        element.innerHTML = node.content;
                        for (let attribute of node.attributes) {
                            element.setAttribute(attribute.name, attribute.value);
                        }
                        this._elements.push(element);
                    } else {
                        let selectors = selector.split(' ');
                        let parents = context != null ? context._elements : null;
                        let array = findForArray(parents, selectors[0]);
                        for (let i = 1; i < selectors.length; i++) {
                            array = findForArray(array, selectors[i]);
                        }
                        for (let i = 0; i < array.length; i++) {
                            this._elements.push(array[i]);
                        }
                    }
                } else {
                    this._elements.push(selector);
                }
            }
        }

        get(index) {
            return 0 <= index && index < this._elements.length ? this._elements[index] : undefined;
        }
        each(action) {
            if (!jQuery.isFunction(action))
                throw new Error("invaild param");

            for (let i = 0; i < this._elements.length; i++) {
                let query = new Core(this._elements[i], this);
                action(query, i);
            }
        }
        first() {
            if (this._elements.length > 0) {
                let element = this._elements[0];
                return new Core(element, this);
            } else {
                return new Core();
            }
        }
        last() {
            if (this._elements.length > 0) {
                let element = this._elements[this._elements.length - 1];
                return new Core(element, this);
            } else {
                return new Core();
            }
        }
        eq(index) {
            if (0 <= index && index < this._elements.length) {
                return new Core(this._elements[index], this);
            } else {
                return new Core();
            }
        }
        children() {
            let array = new Array();
            for (let i = 0; i < this._elements.length; i++) {
                let query = new Core(this._elements[i], this);
                array.push(query);
            }
            return array;
        }
        find(selector) {
            return new Core(selector, this);
        }
        length() {
            return this._elements.length;
        }
        append(selector) {
            let child;
            if (selector instanceof Core) {
                child = selector;
            } else {
                child = new Core(selector);
            }
            for (let i = 0; i < child._elements.length; i++) {
                let element = child._elements[i];
                for (let j = 0; j < this._elements.length; j++) {
                    this._elements[j].appendChild(element);
                }
            }
            return this;
        }
        appendTo(selector) {
            let to = new Core(selector);
            to.append(this);
            return this;
        }
        remove() {
            for (let i = 0; i < this._elements.length; i++) {
                let element = this._elements[i];
                let parent = element.parentNode;
                if (parent != null) {
                    parent.removeChild(element);

                    if (this._context != null) {
                        let array = this._context._elements;
                        for (let j = 0; j < array.length; j++) {
                            if (array[j] === element) {
                                this._context._elements.splice(j, 1);
                                break;
                            }
                        }
                    }
                }
            }
        }
        html(value) {
            switch (arguments.length) {
                case 0:
                    if (this._elements.length >= 1) {
                        return this._elements[0].innerHTML;
                    }
                    break;
                case 1:
                    for (let i = 0; i < this._elements.length; i++) {
                        this._elements[i].innerHTML = value;
                    }
                    break;
            }
        }
        val(value) {
            let element;
            switch (arguments.length) {
                case 0:
                    if (this._elements.length >= 1) {
                        element = this._elements[0];
                        if (element.tagName.toLocaleLowerCase() == 'input') {
                            switch (element.type) {
                                case 'checkbox':
                                    return element.checked;
                            }
                        }

                        return element.value;
                    }
                    break;
                case 1:
                    for (let i = 0; i < this._elements.length; i++) {
                        element = this._elements[i];
                        if (element.tagName.toLocaleLowerCase() == 'input') {
                            switch (element.type) {
                                case 'checkbox':
                                    element.checked = value;
                                    continue;
                            }
                        }

                        element.value = value;
                    }
                    break;
            }
        }
        text(value) {
            let element;
            switch (arguments.length) {
                case 0:
                    if (this._elements.length >= 1) {
                        element = this._elements[0];
                        if (element.type == 'select-one') {
                            var index = element.selectedIndex;
                            var option = element.options[index];
                            return option.text;
                        } else {
                            return element.text;
                        }
                    }
                    break;
                case 1:
                    for (let i = 0; i < this._elements.length; i++) {
                        element = this._elements[i];
                        if (element.type == 'select-one') {
                            element.options[element.selectedIndex].text = value;
                        } else {
                            element.text = value;
                        }
                    }
                    break;
            }
        }
        href(value) {
            switch (arguments.length) {
                case 0:
                    if (this._elements.length >= 1) {
                        return this._elements[0].href;
                    }
                    break;
                case 1:
                    for (let i = 0; i < this._elements.length; i++) {
                        this._elements[i].href = value;
                    }
                    break;
            }
        }
        addClass(value) {
            if (value == null) {
                return;
            }
            let element;
            let classList = value.indexOf(' ') >= 0 ? value.split(' ') : undefined;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                if (classList === undefined) {
                    if (!element.classList.contains(value)) {
                        element.classList.add(value);
                    }
                } else {
                    for (let name of classList) {
                        if (!element.classList.contains(name)) {
                            element.classList.add(name);
                        }
                    }
                }
            }

            return this;
        }
        removeClass(value) {
            if (value == null) {
                return;
            }
            let element;
            let classList = value.indexOf(' ') >= 0 ? value.split(' ') : undefined;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                if (classList === undefined) element.classList.remove(value);
                else classList.forEach(p => element.classList.remove(p));
            }
            return this;
        }
        attr(attribute, value) {
            let element;
            let nodeType;
            switch (arguments.length) {
                case 1:
                    if (jQuery.isPlainObject(attribute)) {
                        for (let i = 0; i < this._elements.length; i++) {
                            element = this._elements[i];
                            nodeType = p.nodeType;
                            if (nodeType === 2 || nodeType === 3 || nodeType === 8) {
                                //跳过文本节点
                                continue;
                            }
                            for (let key in attribute) {
                                if (element.setAttribute === undefined) {
                                    element[key] = attribute[key];
                                } else {
                                    element.setAttribute(key, attribute[key]);
                                }
                            }
                        }
                    } else {
                        for (let i = 0; i < this._elements.length; i++) {
                            element = this._elements[i];
                            nodeType = element.nodeType;
                            if (nodeType === 2 || nodeType === 3 || nodeType === 8) {
                                //跳过文本节点
                                continue;
                            }
    
                            return element.getAttribute === undefined ? element[attribute] : element.getAttribute(attribute);
                        }
                    }
                    break;
                case 2:
                    for (let i = 0; i < this._elements.length; i++) {
                        element = this._elements[i];
                        nodeType = element.nodeType;
                        if (nodeType === 2 || nodeType === 3 || nodeType === 8) {
                            //跳过文本节点
                            continue;
                        }
                        if (element.setAttribute === undefined) {
                            element[attribute] = value;
                        } else {
                            element.setAttribute(attribute, value);
                        }
                    }
                    break;
            }
        }
        removeAttr(attribute) {
            if (attribute == null) {
                return;
            }
            let element;
            let nodeType;
            let attributes = attribute.indexOf(' ') >= 0 ? attribute.split(' ') : undefined;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                nodeType = element.nodeType;
                if (nodeType === 2 || nodeType === 3 || nodeType === 8) {
                    //跳过文本节点
                    continue;
                }
                if (element.removeAttribute === undefined) {
                    if (attributes === undefined) element[attribute] = null;
                    else attributes.forEach(p => element[p] = null);
                } else {
                    if (attributes === undefined) element.removeAttribute(attribute);
                    else attributes.forEach(p => element.removeAttribute(p));
                }
            }
        }
        css(lh, rh) {
            switch (arguments.length) {
                case 1:
                    if (typeof (lh) === 'object') {
                        for (let element of this._elements) {
                            for (let key in lh) {
                                element.style[key] = lh[key];
                            }
                        }
                    } else if (this._elements.length > 0) {
                        let element = this._elements[0];
                        return element.style[lh];
                    }
                    break;
                case 2:
                    for (let element of this._elements) {
                        element.style[lh] = rh;
                    }
                    break;
            }
            return this;
        }
        prop(key, value) {
            switch (arguments.length) {
                case 1:
                    if (this._elements.length >= 1) {
                        return this._elements[0].style[key];
                    }
                    break;
                case 2:
                    for (let i = 0; i < this._elements.length; i++) {
                        this._elements[i].style[key] = value;
                    }
                    break;
            }
            return this;
        }
        hide() {
            for (let i = 0; i < this._elements.length; i++) {
                this._elements[i].style.display = 'none';
            }
            return this;
        }
        show() {
            for (let i = 0; i < this._elements.length; i++) {
                this._elements[i].style.display = 'block';
            }
            return this;
        }
        click(callback) {
            let element;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                switch (arguments.length) {
                    case 0:
                        element.click();
                        break;
                    case 1:
                        if ('addEventListener' in element) {
                            element.addEventListener('click', callback);
                        } else {
                            element.onclick = callback;
                        }
                        break;
                }
            }
            return this;
        }
        submit() {
            let element;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                if ('submit' in element) {
                    element.submit();
                }
            }
            return this;
        }
        change(callback) {
            let element;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                if ('onchange' in element) {
                    switch (arguments.length) {
                        case 0:
                            element.change();
                            break;
                        case 1:
                            element.onchange = callback;
                            break;
                    }
                }
            }
            return this;
        }
        drop(option) {
            if (option == null)
                throw 'argument null exception: option';

            let element;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                if (option.dragEnter && 'ondragenter' in element) {
                    element.ondragenter = option.dragEnter;
                }
                if (option.dragLeave && 'ondragleave' in element) {
                    element.ondragleave = option.dragLeave;
                }
                if (option.dragOver && 'ondragover' in element) {
                    element.ondragover = option.dragOver;
                }
                if (option.drop && 'ondrop' in element) {
                    element.ondrop = option.drop;
                }
            }
            return this;
        }
        bind(type, handler, target) {
            let eventObject;
            for (let element of this._elements) {
                eventObject = EventManager.gain(element, true);
                eventObject.addEventListener(type, handler, target);
                //element.addEventListener(type, handler);
            }
            return this;
        }
        unbind(type, handler) {
            if (arguments.length === 0) {
                for (let element of this._elements) {
                    EventManager.dispose(element);
                }
            } else {
                let eventObject;
                for (let element of this._elements) {
                    eventObject = EventManager.gain(element, false);
                    if (eventObject !== undefined) {
                        switch (arguments.length) {
                            case 1:
                                eventObject.clearEventListener(type);
                                break;
                            case 2:
                                eventObject.removeEventListener(type, handler);
                                break;
                        }
                    }
                    //element.removeEventListener(type, handler);
                }
            }

            return this;
        }
        trigger(type, data) {
            let eventObject;
            for (let element of this._elements) {
                eventObject = EventManager.gain(element, false);
                if (eventObject !== undefined) {
                    let e = new Event(type, data);
                    eventObject.invoke(type, e);
                }
            }
            return this;
        }
        clear() {
            for (let element of this._elements) {
                if (element.type == 'select-one') {
                    element.options.length = 0;
                }
            }
        }
        animate(config) {
            if (!this.animates) {
                this.animates = jQuery._animates = [];
            }
            let i = 0, time, tween, ease, callback;
            while (arguments[++i]) {
                if (typeof arguments[i] == 'number') {
                    time = arguments[i];
                } else if (typeof arguments[i] == 'string') {
                    if (/^ease*/.test(arguments[i])) ease = arguments[i];
                    else tween = arguments[i];
                } else if (jQuery.isFunction(arguments[i])) {
                    callback = arguments[i];
                }
            }
            this.animates.push({
                config: config,
                time: time,
                tween: tween,
                ease: ease,
                callback: callback
            });
            if (this.animates.length == 1) {
                this.execute(this.animates);
            }
            return this;
        }
        stop(animates) {
            if (animates) {
                jQuery._animates.length = 0;
            }
            let el;
            for (let i = 0; i < this._elements.length; i++) {
                el = this._elements[i];
                if (!!jQuery.timers[el.id]) {
                    for (let i = 0; i < jQuery.timers[el.id].length; i++) {
                        clearTimeout(jQuery.timers[el.id][i]);
                    }
                }
            }
            return this;
        }
        execute() {
            let _this = this, m = 0, n = 0;
            let _anim = function (el, key, from, to, at, tw, ease, cb) {
                let isOP = (key == 'opacity' && !jQuery.support.opacity), _key = key;
                if (isOP) {
                    to = to * 100;
                    _key = 'filter';
                }
                let s = +new Date(),
                    d = at,
                    b = parseFloat(from) || 0,
                    c = to - b;
                let render = function () {
                    let t = +new Date() - s;
                    if (t >= d) {
                        n++;
                        t = d;
                        el.style[_key] = (isOP ? 'alpha(opacity=' : '') + Tween.Linear(t, b, c, d) + (key != 'opacity' ? 'px' : '') + (isOP ? ')' : '');
                        !!cb && cb.apply(el);
                        if (m == n && _this.animates.length > 1) {
                            _this.animates.shift();
                            _this.execute(_this.animates);
                        }

                        return;
                    }

                    el.style[_key] = (isOP ? 'alpha(opacity=' : '') + Tween[tw][ease](t, b, c, d) + (key != 'opacity' ? 'px' : '') + (isOP ? ')' : '');
                    if (!jQuery.timers[el.id]) jQuery.timers[el.id] = [];
                    jQuery.timers[el.id].push(setTimeout(render, 16));
                };
                render();
            };

            let el;
            let _q = this.animates[0];
            for (let i = 0; i < this._elements.length; i++) {
                el = this._elements[i];
                for (let key in _q.config) {
                    m++;
                    _anim(el, key,
                        key == 'opacity' && !jQuery.support.opacity ? jQuery.getStyle('filter', el) == '' ? 100 : parseInt(jQuery.getStyle('filter', el).match(/\d{1,3}/g)[0]) : jQuery.getStyle(key, el),
                        _q.config[key],
                        typeof _q.time == 'number' ? _q.time : 1000,
                        typeof _q.tween == 'string' && !/^ease*/.test(_q.tween) ? _q.tween : 'Quart',
                        typeof _q.ease == 'string' && /^ease*/.test(_q.ease) ? _q.ease : 'easeOut',
                        _q.callback)
                }
            }
            return this;
        }
        merge() {
            let next;
            let result = new Core();
            for (let i = 0; i < this._elements.length; i++) {
                result._elements.push(this._elements[i]);
            }
            for (let i = 0; i < arguments.length; i++) {
                next = arguments[i];
                for (let j = 0; j < next.elements.length; j++) {
                    result._elements.push(next.elements[j]);
                }
            }
            return result;
        }
        enable() {
            let element;
            let nodeType;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                nodeType = element.nodeType;
                if (nodeType === 2 || nodeType === 3 || nodeType === 8) {
                    //跳过文本节点
                    continue;
                }
                element.removeAttribute('disabled');
                if (element.tagName.toLocaleLowerCase() == 'a') {
                    element.style['pointer-events'] = null;
                }
            }
            return this;
        }
        disable() {
            let element;
            let nodeType;
            for (let i = 0; i < this._elements.length; i++) {
                element = this._elements[i];
                nodeType = element.nodeType;
                if (nodeType === 2 || nodeType === 3 || nodeType === 8) {
                    //跳过文本节点
                    continue;
                }
                element.setAttribute('disabled', true);
                if (element.tagName.toLocaleLowerCase() == 'a') {
                    element.style['pointer-events'] = 'none';
                }
            }
            return this;
        }
    }

    let jQuery = function (selector, context) {
        return new Core(selector, context);
    };
    jQuery.extend = function(destination, source, override) {
        if (override === undefined) {
            override = true;
        }
        for (let property in source) {
            if (override || !(property in destination)) {
                destination[property] = source[property];
            }
        }
        return destination;
    };
    jQuery.extend(jQuery, {
        timers: {},
        events: [],
        class2type: {
            "[object Boolean]": "boolean",
            "[object Number]": "number",
            "[object String]": "string",
            "[object Function]": "function",
            "[object Array]": "array",
            "[object Date]": "date",
            "[object RegExp]": "regexp",
            "[object Object]": "object",
            "[object Error]": "error",
            "[object Symbol]": "symbol",
            "[object Set]": "set",
            "[object Map]": "map"
        },
        each: function(array, action) {
            if (array == null)
                throw 'argument null exception: array';
            if (action == null)
                throw 'argument null exception: action';
            
            for (let key in array) {
                action(key, array[key]);
            }
        },
        support: (function() {
            if (jQuery._support === undefined) {
                try {
                    let d = document.createElement('div');
                    d.style['display'] = 'none';
                    d.innerHTML = '<a style="float:left; opacity:.5;"></a>';
                    let a = d.getElementsByTagName('a')[0];
                    jQuery._support = {
                        opacity: a.style.opacity === '0.5'
                    }
                } finally {
                    d = null;
                }
            }
            return jQuery._support;
        })(),
        getStyle: function (key, element) {
            return element.currentStyle ? element.currentStyle[key] : document.defaultView.getComputedStyle(element, null).getPropertyValue(key);
        },
        type: function(obj) {
            if (obj == null) {
                return obj + '';
            }
            return typeof obj === 'object' || typeof obj === 'function' 
                ? jQuery.class2type[toString.call(obj)] || 'object'
                : typeof obj;
        },
        isString: function(obj) {
            return typeof(obj) == 'string';
        },
        isJson: function (obj) {
            if (obj === null) {
                return false;
            }
            return typeof (obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
        },
        isWindow: function(obj) {
            return obj != null && obj === obj.window;
        },
        isFunction: function (obj) {
            return typeof obj == 'function';
        },
        isPlainObject: function(obj) {
            if(!obj || jQuery.type(obj) !== 'object' || jQuery.isWindow(obj) || obj.nodeType){
                return false;
            }
            try{
                if(obj.constructor && !jQuery.class2type.hasOwnProperty.call(obj, 'constructor') 
                    && !jQuery.class2type.hasOwnProperty.call(obj.constructor.prototype, 'isPrototypeOf')){
                    return false;
                }
            }catch(e) {
                return false
            }
            let key;
            for(key in obj) { }
            return key === undefined || jQuery.class2type.hasOwnProperty.call(obj, key)
        },
        isEmptyObject: function(obj) {
            for (let name in obj) {
                return false;
            }
            return true;
        },
        joinParam: function (obj) {
            if (obj == null) {
                return null;
            }
            let result = "";
            if (typeof obj === "string") {
                result = obj;
            } else if (typeof obj === "object" || jQuery.isJson(obj)) {
                for (let key in obj) {
                    if (result !== "") {
                        result += "&";
                    }
                    let value = obj[key];
                    result += key + "=" + encodeURIComponent(value);
                }
            }
            return result;
        },
        join: function (array, spearator) {
            let result = "";
            if (array == null) {
                return result;
            }
            if (array.length > 0) {
                result = array[0];
            }
            for (let i = 1; i < array.length; i++) {
                result += spearator;
                result += array[i];
            }
    
            return result;
        },
        eval: function (obj) {
            return eval('(' + obj + ')');
        },
        ready: function (callback) {
            if (!jQuery.isFunction(callback)) {
                throw "invaild param";
            }
            jQuery.events.push(callback);
        },
        ajax: function (obj) {
            obj = obj || {};
            obj.type = obj.type || "GET";
            obj.async = obj.hasOwnProperty("async") ? obj.async : true;
            obj.timeout = obj.hasOwnProperty("timeout") ? obj.timeout : 15000;
            //obj.contentType = obj.contentType || 'application/x-www-form-urlencoded; charset=utf-8';
            let xhr;
            if (window.XMLHttpRequest) {
                // code for IE7+, Firefox, Chrome, Opera, Safari 
                xhr = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                try {
                    xhr = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (ex) {
                    xhr = new ActiveXObject("Msxml2.XMLHTTP");
                }
            }
    
            xhr.open(obj.type, obj.url, obj.async);
            xhr.setRequestHeader("Cache-Control", "no-cache");
            xhr.onerror = e => obj.error && obj.error(e);
            if ('crossorigin' in obj) {
                xhr.setRequestHeader('crossorigin', obj.crossorigin);
            }
            if (obj.contentType != false) {
                let contentType = obj.contentType || "application/x-www-form-urlencoded";
                xhr.setRequestHeader("Content-type", contentType);
            }
            if (obj.async) {
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        obj.complete && obj.complete(xhr, xhr.status, xhr.responseText);
                        if (xhr.status === 200) {
                            obj.success && obj.success(xhr.response);
                        }
                    }
                };
            }
            if (obj.type.toUpperCase() === "GET") {
                xhr.send(null);
            } else {
                xhr.send(obj.data);
            }
            if (!obj.async) {
                obj.complete && obj.complete(xhr, xhr.status, xhr.responseText);
                return xhr.responseText;
            }
        },
        get: function (url, data, callback) {
            if (data != null) {
                let param = jQuery.joinParam(data);
                if (url.indexOf('?') === -1) {
                    url += "?";
                } else if (url.substr(-1, 1) !== '?') {
                    url += "&";
                }
                url += param;
            }
            jQuery.ajax({
                url: url,
                type: "GET",
                async: true,
                contentType: 'application/x-www-form-urlencoded; charset=utf-8',
                complete: function (xhr, status, responseText) {
                    if (status == 200) {
                        callback(responseText);
                    }
                },
            });
        },
        post: function (url, data, callback) {
            jQuery.ajax({
                url: url,
                type: "POST",
                async: true,
                contentType: 'application/x-www-form-urlencoded; charset=utf-8',
                data: jQuery.joinParam(data),
                complete: function (xhr, status, responseText) {
                    if (status == 200) {
                        callback(responseText);
                    }
                },
            });
        },
        merge: function() {
            let array;
            let result = new Array();
            for (let i = 0; i < arguments.length; i++) {
                array = arguments[i];
                for (let j = 0; j < array.length; j++) {
                    result.push(array[j]);
                }
            }
            return result;
        }
    });
    
    function IEContentLoaded(w, fn) {
        let d = w.document;
        let done = false;
        let init = function () {
            if (!done) {
                done = true;
                fn();
            }
        };
        (function () {
            try {
                d.documentElement.doScroll('left');
            } catch (e) {
                setTimeout(arguments.callee, 50);
                return;
            }
            init();
        })();
        d.onreadystatechange = function () {
            if (d.readyState == 'complete') {
                d.onreadystatechange = null;
                init();
            }
        };
    };
    function readyEventCompleted() {
        for (let i = 0; i < jQuery.events.length; i++) {
            jQuery.events[i]();
        }
    }
    if (document.addEventListener) { //兼容非IE
        document.addEventListener("DOMContentLoaded", readyEventCompleted, false);
    } else if (document.attachEvent) { //兼容IE
        IEContentLoaded(window, readyEventCompleted);
    }

    return jQuery;
});