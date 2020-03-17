define((require) => {
    let system = require('./netcore/system');

    let Event: system.EventConstructor = system.Event;
    let EventDispatcher: system.EventDispatcherConstructor = system.EventDispatcher;

    enum NotifyListItemChangedCategory {
        add,
        remove,
    }
    class NotifyListEvent<T> extends Event {
        private _item: T;
        private _category: NotifyListItemChangedCategory;

        public constructor(type: string, item: T, category: NotifyListItemChangedCategory) {
            super(type);
            this._item = item;
            this._category = category;
        }

        public get item(): T {
            return this._item;
        }
        public get category(): NotifyListItemChangedCategory {
            return this._category;
        }
    }
    class NotifyList<T> extends EventDispatcher implements system.collections.generic.IList<T>, system.collections.generic.IReadOnlyList<T> {
        public static readonly ItemChanged = 'item-changed';

        private _size: number = 0;
        private _version: number = 0;

        public constructor(collection?: Iterable<T>) {
            super();
            if (collection !== undefined) {
                this.addRange(collection);
            }
        }

        [index: number]: T;
        public get count(): number {
            return this._size;
        }

        public charAt(index: number): T {
            if (index < 0 || index >= this._size)
                throw "argument out rangof exception: index";

            return this[index];
        }
        public add(value: T): void {
            this[this._size++] = value;
            this._version++;
            this.dispatchEvent(new NotifyListEvent<T>(NotifyList.ItemChanged, value, NotifyListItemChangedCategory.add));
        }
        public addRange(collection: Iterable<T>): void {
            if (collection == null)
                throw 'argument null exception: collection';

            for (let element of collection) {
                this.add(element);
            }
        }
        public insert(value: T, index: number): void {
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
            this.dispatchEvent(new NotifyListEvent<T>(NotifyList.ItemChanged, value, NotifyListItemChangedCategory.add));
        }
        public contains(value: T): boolean {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    return true;
                }
            }
            return false;
        }
        public remove(value: T): boolean {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    this.removeAt(i);
                    return true;
                }
            }
            return false;
        }
        public removeAt(index: number): void {
            if (index < 0 || index >= this._size)
                throw "argument out rangof exception: index";

            let value = this[index];
            let count = this._size - 1;
            for (let i = index; i < count; i++) {
                this[i] = this[i + 1];
            }

            this._size--;
            this._version++;
            this.dispatchEvent(new NotifyListEvent<T>(NotifyList.ItemChanged, value, NotifyListItemChangedCategory.remove));
        }
        public removeAll(predicate: (value: T) => boolean): number {
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
        public clear(): void {
            let item: T;
            while (this._size > 0) {
                item = this[--this._size];
                this[this._size] = undefined;
                this._version++;
                this.dispatchEvent(new NotifyListEvent<T>(NotifyList.ItemChanged, item, NotifyListItemChangedCategory.remove));
            }
        }
        public [Symbol.iterator](): Iterator<T> {
            let enumerable = this;
            let count = this._size;
            let oldver = this._version;
            function* anotherGenerator(): IterableIterator<T> {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== oldver)
                        throw 'invalid operation exception';

                    yield enumerable[i];
                }
            }

            return anotherGenerator();
        }
    }

    class UIEvent extends Event {
        private _source: FrameworkElement;

        public constructor(type: string, source: FrameworkElement, data?: any) {
            super(type, data);
            this._source = source;
        }

        public get source(): FrameworkElement {
            return this._source;
        }
    }

    abstract class FrameworkElement extends EventDispatcher {
        private _parent: FrameworkElement;
        private _contextMenu: ContextMenu;
        private _dataContext: any;
        private _tag: any;

        public abstract get dom(): Element;
        public get parent(): FrameworkElement {
            return this._parent;
        }
        public set parent(value: FrameworkElement) {
            this._parent = value;
        }
        public get contextMenu(): ContextMenu {
            return this._contextMenu;
        }
        public set contextMenu(value: ContextMenu) {
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
        public get dataContext(): any {
            return this._dataContext;
        }
        public set dataContext(value: any) {
            this._dataContext = value;
        }
        public get tag(): any {
            return this._tag;
        }
        public set tag(value: any) {
            this._tag = value;
        }
    }

    class ContextMenuManager {
        private static _current: ContextMenuManager;
        private _contextMenus: Array<ContextMenu> = new Array<ContextMenu>();

        private constructor() {
            window.addEventListener('contextmenu', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                let hasTriggered = false;
                let srcElement = e.srcElement;
                let contextMenu: ContextMenu;
                if (srcElement instanceof Element) {
                    for (let i = 0; i < this._contextMenus.length; i++) {
                        contextMenu = this._contextMenus[i];
                        if (contextMenu.collide(e)) {
                            hasTriggered = true;
                            contextMenu.open(e);
                        } else {
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

                let contextMenu: ContextMenu;
                for (let i = 0; i < this._contextMenus.length; i++) {
                    contextMenu = this._contextMenus[i];
                    contextMenu.close();
                }
            });
        }

        public static get current(): ContextMenuManager {
            if (ContextMenuManager._current === undefined) {
                ContextMenuManager._current = new ContextMenuManager();
            }
            return ContextMenuManager._current;
        }

        public register(contextMenu: ContextMenu): void {
            if (contextMenu == null)
                throw 'argument null exception: contextMenu';

            this._contextMenus.push(contextMenu);
        }
        public unregister(contextMenu: ContextMenu): void {
            if (contextMenu == null)
                throw 'argument null exception: contextMenu';

            let index = this._contextMenus.indexOf(contextMenu);
            if (index >= 0) this._contextMenus.splice(index, 1);
        }
    }

    class ContextMenu extends EventDispatcher {
        public readonly Opened: string = 'opened';
        public readonly Closed: string = 'closed';
        private _dom: HTMLUListElement;
        private _parent: FrameworkElement;
        private _items: NotifyList<MenuItem>;
        private _isOpened: boolean = false;

        public constructor() {
            super();

            this._dom = document.createElement('ul');
            this._dom.className = 'aui-context-menu aui-menu-container';

            this._items = new NotifyList<MenuItem>();
            this._items.addEventListener(NotifyList.ItemChanged, (e: NotifyListEvent<MenuItem>) => {
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

        public get dom(): Element {
            return this._dom;
        }
        public get items(): system.collections.generic.ICollection<MenuItem> {
            return this._items;
        }
        public get parent(): FrameworkElement {
            return this._parent;
        }
        public set parent(value: FrameworkElement) {
            this._parent = value;
        }

        public collide(e: MouseEvent): boolean {
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
        public open(e: MouseEvent): void {
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
        public close(): void {
            if (this._isOpened) {
                this._isOpened = false;
                document.body.removeChild(this._dom);
            }
        }
    }

    class MenuItem extends EventDispatcher {
        public static readonly Click = 'click';

        private _items: NotifyList<MenuItem>;
        private _dom: HTMLLIElement;
        private _container: HTMLUListElement;
        private _parent: MenuItem;
        private _head: HTMLDivElement;
        private _header: HTMLSpanElement;
        private _contextMenu: ContextMenu;
        private _tag: any;

        public constructor() {
            super();
            this._dom = document.createElement('li');
            this._dom.className = 'aui-menu-item';
            this._dom.addEventListener('click', (e) => {
                //e.stopImmediatePropagation();
                //e.stopPropagation();

                let source: FrameworkElement;
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

            this._items = new NotifyList<MenuItem>();
            this._items.addEventListener(NotifyList.ItemChanged, (e: NotifyListEvent<MenuItem>) => {
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

        public get dom(): Element {
            return this._dom;
        }
        public get items(): system.collections.generic.ICollection<MenuItem> {
            return this._items;
        }
        public get parent(): MenuItem {
            return this._parent;
        }
        public set parent(value: MenuItem) {
            this._parent = value;
        }
        public get header(): string {
            return this._header.innerHTML;
        }
        public set header(value: string) {
            this._header.innerHTML = value;
        }
        public get contextMenu(): ContextMenu {
            if (this._parent !== undefined) {
                return this._parent.contextMenu;
            }
            return this._contextMenu;
        }
        public set contextMenu(value: ContextMenu) {
            this._contextMenu = value;
        }
        public get tag(): any {
            return this._tag;
        }
        public set tag(value: any) {
            this._tag = value;
        }
    }

    class TreeViewItem extends FrameworkElement {
        public static readonly Selected = 'selected';
        public static readonly Unselected = 'unselected';

        private _dom: HTMLElement;
        private _items: system.windows.NotifyList<TreeViewItem>;
        private _toggle: HTMLAnchorElement;
        private _head: HTMLDivElement;
        private _header: HTMLSpanElement;
        private _container: HTMLUListElement;
        private _isSpread: boolean = true;
        private _isSelected: boolean = false;
        
        public constructor() {
            super();
            this._dom = document.createElement('li');
            this._dom.className = 'aui-tree-item';
            this._dom.addEventListener('mousedown', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                switch (e.button) {
                    case 0://鼠标左键
                    case 2://鼠标右键
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
                } else {
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

            this._items = new NotifyList<TreeViewItem>();
            this._items.addEventListener(NotifyList.ItemChanged, (e: system.windows.NotifyListEvent<TreeViewItem>) => {
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

        public get dom(): Element {
            return this._dom;
        }
        public get items(): system.collections.generic.ICollection<TreeViewItem> {
            return this._items;
        }
        public get header(): string {
            return this._header.innerHTML;
        }
        public set header(value: string) {
            this._header.innerHTML = value;
        }
        public get isSelected(): boolean {
            return this._isSelected;
        }
        public set isSelected(value: boolean) {
            this._isSelected = value;
            if (value) {
                this._header.classList.add('aui-tree-item-header-selected');
            } else {
                this._header.classList.remove('aui-tree-item-header-selected');
            }
        }
        public get view(): TreeView {
            let parent = this.parent;
            while (parent !== undefined) {
                if (parent instanceof TreeView) {
                    return <TreeView>parent;
                }

                parent = parent.parent;
            }

            return null;
        }
    }
    class TreeView extends FrameworkElement {
        public static readonly SelectedItemChanged = 'selected-item-changed';

        private _dom: HTMLUListElement;
        private _items: system.windows.NotifyList<TreeViewItem>;
        private _selectedItem: TreeViewItem;

        public constructor() {
            super();

            this._dom = document.createElement('ul');
            this._dom.className = 'aui-tree-view aui-tree-view-container';

            this._items = new NotifyList<TreeViewItem>();
            this._items.addEventListener(NotifyList.ItemChanged, (e: system.windows.NotifyListEvent<TreeViewItem>) => {
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

        public get dom(): Element {
            return this._dom;
        }
        public get items(): system.collections.generic.ICollection<TreeViewItem> {
            return this._items;
        }
        public get selectedItem(): TreeViewItem {
            return this._selectedItem;
        }

        public select(item: TreeViewItem): void {
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

    class Separator extends FrameworkElement {
        private _hr: HTMLHRElement;

        public constructor() {
            super();
            this._hr = document.createElement('hr');
            this._hr.className = 'ui-separator';
        }

        public get dom(): Element {
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