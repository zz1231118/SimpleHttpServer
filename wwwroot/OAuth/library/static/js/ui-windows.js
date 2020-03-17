define((require) => {
    let system = require('./netcore/system');
    let Event = system.Event;
    let EventDispatcher = system.EventDispatcher;
    let NotifyListItemChangedCategory;
    (function (NotifyListItemChangedCategory) {
        NotifyListItemChangedCategory[NotifyListItemChangedCategory["add"] = 0] = "add";
        NotifyListItemChangedCategory[NotifyListItemChangedCategory["remove"] = 1] = "remove";
    })(NotifyListItemChangedCategory || (NotifyListItemChangedCategory = {}));
    class NotifyListEvent extends Event {
        constructor(type, item, category) {
            super(type);
            this._item = item;
            this._category = category;
        }
        get item() {
            return this._item;
        }
        get category() {
            return this._category;
        }
    }
    class NotifyList extends EventDispatcher {
        constructor(collection) {
            super();
            this._size = 0;
            this._version = 0;
            if (collection !== undefined) {
                this.addRange(collection);
            }
        }
        get count() {
            return this._size;
        }
        charAt(index) {
            if (index < 0 || index >= this._size)
                throw "argument out rangof exception: index";
            return this[index];
        }
        add(value) {
            this[this._size++] = value;
            this._version++;
            this.dispatchEvent(new NotifyListEvent(NotifyList.ItemChanged, value, NotifyListItemChangedCategory.add));
        }
        addRange(collection) {
            if (collection == null)
                throw 'argument null exception: collection';
            for (let element of collection) {
                this.add(element);
            }
        }
        insert(value, index) {
            if (index < 0 || index > this._size)
                throw 'argument out of range exception: index';
            if (index < this._size) {
                for (let i = this._size - 1; i >= index; i--) {
                    this[i + 1] = this[i];
                }
            }
            this[index] = value;
            this._size++;
            this._version++;
            this.dispatchEvent(new NotifyListEvent(NotifyList.ItemChanged, value, NotifyListItemChangedCategory.add));
        }
        contains(value) {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    return true;
                }
            }
            return false;
        }
        remove(value) {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    this.removeAt(i);
                    return true;
                }
            }
            return false;
        }
        removeAt(index) {
            if (index < 0 || index >= this._size)
                throw "argument out rangof exception: index";
            let value = this[index];
            let count = this._size - 1;
            for (let i = index; i < count; i++) {
                this[i] = this[i + 1];
            }
            this._size--;
            this._version++;
            this.dispatchEvent(new NotifyListEvent(NotifyList.ItemChanged, value, NotifyListItemChangedCategory.remove));
        }
        removeAll(predicate) {
            if (predicate == null)
                throw 'argument null exception: predicate';
            let count = 0;
            for (let i = 0; i < this._size; i++) {
                if (predicate(this[i])) {
                    this.removeAt(i);
                    i--;
                    count++;
                }
            }
            return count;
        }
        clear() {
            let item;
            while (this._size > 0) {
                item = this[--this._size];
                this[this._size] = undefined;
                this._version++;
                this.dispatchEvent(new NotifyListEvent(NotifyList.ItemChanged, item, NotifyListItemChangedCategory.remove));
            }
        }
        [Symbol.iterator]() {
            let enumerable = this;
            let count = this._size;
            let oldver = this._version;
            function* anotherGenerator() {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== oldver)
                        throw 'invalid operation exception';
                    yield enumerable[i];
                }
            }
            return anotherGenerator();
        }
    }
    NotifyList.ItemChanged = 'item-changed';
    class UIEvent extends Event {
        constructor(type, source, data) {
            super(type, data);
            this._source = source;
        }
        get source() {
            return this._source;
        }
    }
    class FrameworkElement extends EventDispatcher {
        get parent() {
            return this._parent;
        }
        set parent(value) {
            this._parent = value;
        }
        get contextMenu() {
            return this._contextMenu;
        }
        set contextMenu(value) {
            if (this._contextMenu !== undefined) {
                ContextMenuManager.current.unregister(this._contextMenu);
                this._contextMenu.parent = undefined;
                this._contextMenu = undefined;
            }
            this._contextMenu = value;
            if (value !== undefined) {
                value.parent = this;
                ContextMenuManager.current.register(value);
            }
        }
        get dataContext() {
            return this._dataContext;
        }
        set dataContext(value) {
            this._dataContext = value;
        }
        get tag() {
            return this._tag;
        }
        set tag(value) {
            this._tag = value;
        }
    }
    class ContextMenuManager {
        constructor() {
            this._contextMenus = new Array();
            window.addEventListener('contextmenu', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                let hasTriggered = false;
                let srcElement = e.srcElement;
                let contextMenu;
                if (srcElement instanceof Element) {
                    for (let i = 0; i < this._contextMenus.length; i++) {
                        contextMenu = this._contextMenus[i];
                        if (contextMenu.collide(e)) {
                            hasTriggered = true;
                            contextMenu.open(e);
                        }
                        else {
                            contextMenu.close();
                        }
                    }
                }
                if (hasTriggered) {
                    e.returnValue = false;
                }
            });
            document.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                let contextMenu;
                for (let i = 0; i < this._contextMenus.length; i++) {
                    contextMenu = this._contextMenus[i];
                    contextMenu.close();
                }
            });
        }
        static get current() {
            if (ContextMenuManager._current === undefined) {
                ContextMenuManager._current = new ContextMenuManager();
            }
            return ContextMenuManager._current;
        }
        register(contextMenu) {
            if (contextMenu == null)
                throw 'argument null exception: contextMenu';
            this._contextMenus.push(contextMenu);
        }
        unregister(contextMenu) {
            if (contextMenu == null)
                throw 'argument null exception: contextMenu';
            let index = this._contextMenus.indexOf(contextMenu);
            if (index >= 0)
                this._contextMenus.splice(index, 1);
        }
    }
    class ContextMenu extends EventDispatcher {
        constructor() {
            super();
            this.Opened = 'opened';
            this.Closed = 'closed';
            this._isOpened = false;
            this._dom = document.createElement('ul');
            this._dom.className = 'aui-context-menu aui-menu-container';
            this._items = new NotifyList();
            this._items.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        e.item.contextMenu = this;
                        this._dom.appendChild(e.item.dom);
                        break;
                    case NotifyListItemChangedCategory.remove:
                        e.item.contextMenu = null;
                        this._dom.removeChild(e.item.dom);
                        break;
                }
            });
        }
        get dom() {
            return this._dom;
        }
        get items() {
            return this._items;
        }
        get parent() {
            return this._parent;
        }
        set parent(value) {
            this._parent = value;
        }
        collide(e) {
            if (this._parent !== undefined) {
                let tgeElement = this._parent.dom;
                let srcElement = e.srcElement;
                while (srcElement instanceof Element) {
                    if (srcElement === tgeElement) {
                        return true;
                    }
                    srcElement = srcElement.parentElement;
                }
            }
            return false;
        }
        open(e) {
            if (!this._isOpened) {
                this._isOpened = true;
                document.body.appendChild(this._dom);
            }
            let offset = 30;
            let width = this._dom.clientWidth;
            let height = this._dom.clientHeight;
            let viewport_width = document.documentElement.clientWidth;
            let viewport_height = document.documentElement.clientHeight;
            let rect = this._dom.getBoundingClientRect();
            let left = e.clientX + width + offset >= viewport_width ? e.clientX - rect.width : e.clientX;
            let top = e.clientY + height + offset >= viewport_height ? e.clientY - rect.height : e.clientY;
            this._dom.style.left = left + 'px';
            this._dom.style.top = top + 'px';
        }
        close() {
            if (this._isOpened) {
                this._isOpened = false;
                document.body.removeChild(this._dom);
            }
        }
    }
    class MenuItem extends EventDispatcher {
        constructor() {
            super();
            this._dom = document.createElement('li');
            this._dom.className = 'aui-menu-item';
            this._dom.addEventListener('click', (e) => {
                //e.stopImmediatePropagation();
                //e.stopPropagation();
                let source;
                let contextMenu = this.contextMenu;
                if (contextMenu !== undefined) {
                    source = contextMenu.parent;
                }
                this.dispatchEvent(new UIEvent(MenuItem.Click, source));
            });
            this._head = document.createElement('div');
            this._head.className = 'aui-menu-item-head';
            this._dom.appendChild(this._head);
            this._header = document.createElement('span');
            this._header.className = 'aui-menu-item-header';
            this._head.appendChild(this._header);
            this._items = new NotifyList();
            this._items.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        if (this._container === undefined) {
                            this._container = document.createElement('ul');
                            this._container.className = 'aui-menu-item aui-menu-container';
                        }
                        if (this._items.count === 1) {
                            this._dom.appendChild(this._container);
                        }
                        e.item.parent = this;
                        this._container.appendChild(e.item.dom);
                        break;
                    case NotifyListItemChangedCategory.remove:
                        this._container.removeChild(e.item.dom);
                        e.item.parent = undefined;
                        if (this._items.count === 0) {
                            this._dom.removeChild(this._container);
                        }
                        break;
                }
            });
        }
        get dom() {
            return this._dom;
        }
        get items() {
            return this._items;
        }
        get parent() {
            return this._parent;
        }
        set parent(value) {
            this._parent = value;
        }
        get header() {
            return this._header.innerHTML;
        }
        set header(value) {
            this._header.innerHTML = value;
        }
        get contextMenu() {
            if (this._parent !== undefined) {
                return this._parent.contextMenu;
            }
            return this._contextMenu;
        }
        set contextMenu(value) {
            this._contextMenu = value;
        }
        get tag() {
            return this._tag;
        }
        set tag(value) {
            this._tag = value;
        }
    }
    MenuItem.Click = 'click';
    class TreeViewItem extends FrameworkElement {
        constructor() {
            super();
            this._isSpread = true;
            this._isSelected = false;
            this._dom = document.createElement('li');
            this._dom.className = 'aui-tree-item';
            this._dom.addEventListener('mousedown', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                switch (e.button) {
                    case 0: //鼠标左键
                    case 2: //鼠标右键
                        this.view.select(this);
                        this.dispatchEventWith(TreeViewItem.Selected);
                        break;
                }
            });
            this._head = document.createElement('div');
            this._head.className = 'aui-tree-item-head';
            this._dom.appendChild(this._head);
            this._toggle = document.createElement('a');
            this._toggle.style.visibility = 'hidden';
            this._toggle.className = 'aui-tree-item-toggle aui-tree-item-toggle-close';
            this._toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                if (this._isSpread) {
                    this._isSpread = false;
                    this._toggle.classList.remove('aui-tree-item-toggle-close');
                    this._toggle.classList.add('aui-tree-item-toggle-open');
                    this._container.style.display = 'none';
                }
                else {
                    this._isSpread = true;
                    this._toggle.classList.remove('aui-tree-item-toggle-open');
                    this._toggle.classList.add('aui-tree-item-toggle-close');
                    this._container.style.display = null;
                }
            });
            this._head.appendChild(this._toggle);
            this._header = document.createElement('span');
            this._header.className = 'aui-tree-item-header';
            this._head.appendChild(this._header);
            this._items = new NotifyList();
            this._items.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        if (this._container === undefined) {
                            this._container = document.createElement('ul');
                            this._container.className = 'aui-tree-item aui-tree-view';
                        }
                        if (this._items.count === 1) {
                            this._toggle.style.visibility = '';
                            this._dom.appendChild(this._container);
                        }
                        e.item.parent = this;
                        this._container.appendChild(e.item.dom);
                        break;
                    case NotifyListItemChangedCategory.remove:
                        e.item.parent = null;
                        this._container.removeChild(e.item.dom);
                        if (this._items.count === 0) {
                            this._toggle.style.visibility = 'hidden';
                            this._dom.removeChild(this._container);
                        }
                        break;
                }
            }, this);
        }
        get dom() {
            return this._dom;
        }
        get items() {
            return this._items;
        }
        get header() {
            return this._header.innerHTML;
        }
        set header(value) {
            this._header.innerHTML = value;
        }
        get isSelected() {
            return this._isSelected;
        }
        set isSelected(value) {
            this._isSelected = value;
            if (value) {
                this._header.classList.add('aui-tree-item-header-selected');
            }
            else {
                this._header.classList.remove('aui-tree-item-header-selected');
            }
        }
        get view() {
            let parent = this.parent;
            while (parent !== undefined) {
                if (parent instanceof TreeView) {
                    return parent;
                }
                parent = parent.parent;
            }
            return null;
        }
    }
    TreeViewItem.Selected = 'selected';
    TreeViewItem.Unselected = 'unselected';
    class TreeView extends FrameworkElement {
        constructor() {
            super();
            this._dom = document.createElement('ul');
            this._dom.className = 'aui-tree-view aui-tree-view-container';
            this._items = new NotifyList();
            this._items.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        e.item.parent = this;
                        this._dom.appendChild(e.item.dom);
                        break;
                    case NotifyListItemChangedCategory.remove:
                        e.item.parent = null;
                        this._dom.removeChild(e.item.dom);
                        break;
                }
            }, this);
        }
        get dom() {
            return this._dom;
        }
        get items() {
            return this._items;
        }
        get selectedItem() {
            return this._selectedItem;
        }
        select(item) {
            if (item == null)
                throw 'argument null exception: item';
            if (this._selectedItem != null) {
                this._selectedItem.isSelected = false;
            }
            this._selectedItem = item;
            this._selectedItem.isSelected = true;
            this.dispatchEventWith(TreeView.SelectedItemChanged, item);
        }
    }
    TreeView.SelectedItemChanged = 'selected-item-changed';
    class Separator extends FrameworkElement {
        constructor() {
            super();
            this._hr = document.createElement('hr');
            this._hr.className = 'ui-separator';
        }
        get dom() {
            return this._hr;
        }
    }
    return {
        NotifyListItemChangedCategory: NotifyListItemChangedCategory,
        NotifyListEventArgs: NotifyListEvent,
        NotifyList: NotifyList,
        UIEvent: UIEvent,
        FrameworkElement: FrameworkElement,
        ContextMenu: ContextMenu,
        MenuItem: MenuItem,
        Separator: Separator,
        TreeView: TreeView,
        TreeViewItem: TreeViewItem,
    };
});
//# sourceMappingURL=ui-windows.js.map