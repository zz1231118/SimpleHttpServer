define((require) => {
    let system = require('./netcore/system');

    class MenuItem {

        constructor(context, obj, depth = 0, parent = null) {
            this._context = context;
            this._metadata = obj;
            this._depth = depth;
            this._parent = parent;
            this._children = new Array();
            this._isSelected = false;
            this._selectable = obj.hasOwnProperty('selectable') ? obj.selectable : true;
            this._isSpread = obj.spread ? obj.spread : false;

            let li = document.createElement('li');
            let a = document.createElement('a');
            let span = document.createElement('span');

            if (obj.hide) {
                li.style.display = 'none';
            }

            span.innerHTML = obj.header;

            a.className = 'aside-level-' + depth;
            a.onclick = (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (this._children.length > 0) {
                    this._isSpread = !this._isSpread;
                    this.render();
                }
                if (!this.selectable) {
                    return;
                }
                /*
                if (this._isSelected) {
                    return;
                }
                */

                this._context.select(this);
            };
            a.appendChild(span);

            li.appendChild(a);
            if (obj.hasOwnProperty('children')) {
                let i = document.createElement('i');
                i.className = 'aside-up-icon';
                a.appendChild(i);

                let ul = document.createElement('ul');
                ul.className = 'aside-subitem';
                for (let key in obj.children) {
                    let menu = new MenuItem(context, obj.children[key], depth + 1, this);
                    ul.appendChild(menu.element);

                    this._children.push(menu);
                }

                this._ul = ul;
                this._icon = i;
                this._selectable = false;
                li.appendChild(ul);
            }

            this._anchor = a;
            this._element = li;
        }

        get element() {
            return this._element;
        }
        get context() {
            return this._context;
        }
        get parent() {
            return this._parent;
        }
        get children() {
            return this._children;
        }
        get metadata() {
            return this._metadata;
        }
        get name() {
            return this._metadata.name;
        }
        get header() {
            return this._metadata.header;
        }
        get url() {
            return this._metadata.url;
        }
        get selectable() {
            return this._selectable;
        }
        get isSelected() {
            return this._isSelected;
        }
        get isSpread() {
            return this._isSpread;
        }
        set isSpread(value) {
            this._isSpread = value;
            if (value && this._parent != null && !this._parent.isSpread) {
                this._parent.isSpread = value;
            }

            this.render();
        }

        initialize() {
            if (!this._context.option.forbidAutoSelect) {
                if (this._metadata.hasOwnProperty('selected') && this._metadata.selected) {
                    this._context.select(this);
                }
            }
            for (let key in this._children) {
                this._children[key].initialize();
            }

            this.render();
        }
        render() {
            if (this._ul != null) {
                if (this._isSpread) {
                    this._ul.style.display = '';
                    //this._icon.className = 'aside-up-icon';
                } else {
                    this._ul.style.display = 'none';
                    //this._icon.className = 'aside-down-icon';
                }
            }
            this._anchor.className = 'aside-level-' + this._depth;
            if (this._isSelected) {
                this._anchor.className += ' aside-select';
            }
        }

        select() {
            this._isSelected = true;
            if (this._parent != null && !this._parent.isSpread) {
                this._parent.isSpread = true;
            }
            this.render();
        }
        unselect() {
            this._isSelected = false;
            for (let i = 0; i < this._children.length; i++) {
                this._children[i].unselect();
            }

            this.render();
        }
    }
    class ContextMenu extends system.EventDispatcher {
        
        constructor(key, array, option = null) {
            super();
            this._option = option || {};
            this._children = new Array();
            this._element = document.getElementById(key);
            for (let k in array) {
                let menu = new MenuItem(this, array[k], 1);
                this._children.push(menu);
                this._element.appendChild(menu.element);
            }
        }

        get children() {
            return this._children;
        }
        get option() {
            return this._option;
        }

        static findForChild(children, predicate) {
            let child;
            for (let i = 0; i < children.length; i++) {
                child = children[i];
                if (predicate(child)) {
                    return child;
                } else if (child.children && child.children.length > 0) {
                    child = ContextMenu.findForChild(child.children, predicate);
                    if (child != null) {
                        return child;
                    }
                }
            }
            return null;
        }
        static findAllForChild(children, predicate) {
            let child;
            let array = new Array();
            for (let i = 0; i < children.length; i++) {
                child = children[i];
                if (predicate(child)) {
                    array.push(child);
                }
                if (child.children && child.children.length > 0) {
                    let arr = ContextMenu.findAllForChild(child.children, predicate);
                    for (let j = 0; j < arr.length; j++) {
                        array.push(arr[j]);
                    }
                }
            }
            return array;
        }

        initialize() {
            for (let key in this._children) {
                this._children[key].initialize();
            }
        }
        select(menu, notify = true) {
            for (let key in this._children) {
                this._children[key].unselect();
            }

            menu.select();
            if (notify) {
                this.dispatchEventWith(ContextMenu.ItemSelectedChanged, menu);
            }
        }
        unselect(notify = true) {
            for (let key in this._children) {
                this._children[key].unselect();
            }
            if (notify) {
                this.dispatchEventWith(ContextMenu.ItemSelectedChanged);
            }
        }
        find(predicate) {
            if (predicate == null)
                throw 'argument null exception: predicate';
            
            return ContextMenu.findForChild(this._children, predicate);
        }
        findAll(predicate) {
            if (predicate == null)
                throw 'argument null exception: predicate';

            return ContextMenu.findAllForChild(this._children, predicate);
        }
    }

    ContextMenu.ItemSelectedChanged = 'item_selected_changed';

    return {
        ContextMenu: ContextMenu
    };
});