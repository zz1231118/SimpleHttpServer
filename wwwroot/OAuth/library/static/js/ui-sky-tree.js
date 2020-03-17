var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
define((require) => {
    let system = require('./netcore/system');
    let generic = require('./netcore/system.collections.generic');
    let $ = require('./jquery');
    let ArgumentException = system.ArgumentException;
    let ArgumentNullException = system.ArgumentNullException;
    let Guid = system.Guid;
    let String = system.String;
    let TimeSpan = system.TimeSpan;
    let List = generic.List;
    let Dictionary = generic.Dictionary;
    class SearchResult {
        constructor(key, name) {
            this._key = key;
            this._name = name;
        }
        get Key() {
            return this._key;
        }
        get Name() {
            return this._name;
        }
    }
    class SearchWindow {
        constructor(loader) {
            this._events = new List();
            let window = document.createElement('div');
            window.className = 'sky-search-window';
            window.style.display = 'none';
            window.onblur = p => console.log(p);
            let head = document.createElement('div');
            head.className = 'sky-search-window-head';
            let headLeft = document.createElement('div');
            headLeft.className = 'sky-search-window-head-left';
            let headRight = document.createElement('div');
            headRight.className = 'sky-search-window-head-right';
            let input = document.createElement('input');
            input.type = 'text';
            input.placeholder = 'Search';
            input.className = 'wui-input sky-search-window-head-input';
            input.onkeydown = p => {
                if (p.key == 'Enter') {
                    if (this._timer != null) {
                        clearTimeout(this._timer);
                        this._timer = null;
                    }
                    this.Filtration();
                    input.focus();
                }
                else if (p.key == 'Escape') {
                    this.Hide();
                }
                else {
                    if (this._timer != null) {
                        clearTimeout(this._timer);
                        this._timer = null;
                    }
                    this._timer = setTimeout(() => {
                        this.Filtration();
                        input.focus();
                    }, 500);
                }
            };
            //input.oninput = p => this.Filtration();
            let button = document.createElement('input');
            button.type = 'button';
            button.className = 'wui-btn sky-search-window-head-button';
            button.value = '搜';
            button.onclick = p => {
                p.preventDefault();
                this.Filtration();
            };
            let select = document.createElement('select');
            select.className = 'wui-select sky-search-window-body-select';
            select.multiple = true;
            select.ondblclick = p => this.ItemSelected();
            headLeft.appendChild(input);
            headRight.appendChild(button);
            head.appendChild(headLeft);
            head.appendChild(headRight);
            window.appendChild(head);
            window.appendChild(select);
            this._win = window;
            this._input = input;
            this._button = button;
            this._select = select;
            loader(p => {
                this._options = new Dictionary();
                let value;
                for (let key of p.keys) {
                    value = '[' + key + '] ' + p.get(key);
                    this._options.add(key, value);
                    let option = document.createElement('option');
                    option.value = key.toString();
                    option.innerHTML = value;
                    this._select.options.add(option);
                }
                for (let callback of this._events) {
                    callback(this._options);
                }
                this._events.clear();
                document.body.appendChild(this._win);
            });
        }
        Filtration() {
            return __awaiter(this, void 0, void 0, function* () {
                this._input.disabled = true;
                this._button.disabled = true;
                let value = this._input.value.toLowerCase();
                let option;
                for (let i = 0; i < this._select.length; i++) {
                    option = this._select.options[i];
                    if (option.innerHTML.toLowerCase().indexOf(value) == -1) {
                        option.style.display = 'none';
                    }
                    else {
                        option.style.display = '';
                    }
                }
                this._input.disabled = false;
                this._button.disabled = false;
            });
        }
        ItemSelected() {
            let index = this._select.selectedIndex;
            let option = this._select.options[index];
            if (this._callback != null) {
                let key = Number(this._select.value);
                let name = option.innerHTML;
                this._callback(new SearchResult(key, name));
            }
            this.Hide();
        }
        GetOrLoadOptions(callback) {
            if (this._options == null) {
                this._events.add(callback);
            }
            else {
                callback(this._options);
            }
        }
        Show(element, callback) {
            this._callback = callback;
            let bound = element.getBoundingClientRect();
            let bottom = bound.bottom + 2;
            let left = bound.left;
            this._win.style.left = left + 'px';
            this._win.style.top = bottom + 'px';
            this._win.style.width = (element.clientWidth - 6) + 'px';
            this._win.style.display = '';
            this._input.focus();
            this._win.onscroll = e => {
                console.log(e);
            };
            window.onresize = p => {
                let bound = element.getBoundingClientRect();
                let bottom = bound.bottom + 2;
                let left = bound.left;
                this._win.style.left = left + 'px';
                this._win.style.top = bottom + 'px';
                this._win.style.width = (element.clientWidth - 6) + 'px';
            };
            document.onclick = p => {
                if (p.srcElement != element) {
                    let left = this._win.offsetLeft;
                    let top = this._win.offsetTop;
                    let right = left + this._win.clientWidth;
                    let bottom = top + this._win.clientHeight;
                    if (p.pageX < left || p.pageX > right || p.pageY < top || p.pageY > bottom) {
                        this.Hide();
                    }
                }
            };
        }
        Hide() {
            this._win.style.display = 'none';
            document.onclick = null;
            window.onresize = null;
        }
    }
    let ButtonType;
    (function (ButtonType) {
        ButtonType[ButtonType["Info"] = 0] = "Info";
        ButtonType[ButtonType["Danger"] = 1] = "Danger";
    })(ButtonType || (ButtonType = {}));
    class StyleManager {
        static GetButtonStyle(type) {
            switch (type) {
                case ButtonType.Info:
                    return 'wui-btn wui-btn-small wui-btn-default sky-button';
                case ButtonType.Danger:
                    return 'wui-btn wui-btn-small wui-btn-danger sky-button';
                default:
                    throw new ArgumentException('unknown ButtonType:' + type);
            }
        }
    }
    class InternalContext {
        static get Locator() {
            return InternalContext._locator;
        }
        static set Locator(value) {
            InternalContext._locator = value;
        }
        static get EntitySearch() {
            let name = 'EntityType';
            let kv = InternalContext._kvSearch;
            if (!kv.containsKey(name)) {
                kv.add(name, new SearchWindow(callback => {
                    InternalContext.Locator.LoadEntities(p => {
                        let kv = new Dictionary();
                        for (let item of p) {
                            kv.add(item.ID, item.Name);
                        }
                        callback(kv);
                    });
                }));
            }
            return kv.get(name);
        }
        static get VirtualCurrencySearch() {
            return InternalContext.Search('VirtualCurrencyType');
        }
        static get VirtualObjectSearch() {
            return InternalContext.Search('VirtualObjectType');
        }
        static get SceneSearch() {
            return InternalContext.Search('Scene');
        }
        static Search(name, properties = ['ID', 'Name']) {
            let kv = InternalContext._kvSearch;
            if (!kv.containsKey(name)) {
                kv.add(name, new SearchWindow(callback => {
                    InternalContext.Locator.LoadEntityProperties(name, properties, p => {
                        let kv = new Dictionary();
                        for (let item of p) {
                            kv.add(item.ID, item.Name);
                        }
                        callback(kv);
                    });
                }));
            }
            return kv.get(name);
        }
    }
    InternalContext._kvSearch = new Dictionary();
    class FrameworkContext {
    }
    class FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            this._isExpanded = true;
            if (context === null)
                throw new Error("argument null exception: context");
            if (metadata === null)
                throw new Error("argument null exception: metadata");
            this._context = context;
            this._metadata = metadata;
            this._name = name;
            this._parent = parent;
            this._dataset = new Map();
        }
        get Context() {
            return this._context;
        }
        get Metadata() {
            return this._metadata;
        }
        get Name() {
            return this._name || this._metadata['_name'];
        }
        get Display() {
            return this._metadata.hasOwnProperty('_display') ? this._metadata['_display'] : this.Name;
        }
        get Parent() {
            return this._parent;
        }
        set Parent(parent) {
            this._parent = parent;
        }
        get HasDefaultValue() {
            return this._metadata.hasOwnProperty('_data');
        }
        get IsReadOnly() {
            if (this._parent != null && this._parent.IsReadOnly) {
                return true;
            }
            else if (!this._metadata.hasOwnProperty('_readonly')) {
                return false;
            }
            return this._metadata["_readonly"];
        }
        get Tooltip() {
            if (this._metadata.hasOwnProperty('_tooltip')) {
                return this._metadata['_tooltip'];
            }
        }
        get Format() {
            return this._metadata.hasOwnProperty('_format') ? this._metadata["_format"] : null;
        }
        get Group() {
            return this._metadata.hasOwnProperty('_group') ? this._metadata["_group"] : null;
        }
        get DataSet() {
            return this._dataset;
        }
        get IsExpanded() {
            return this._isExpanded;
        }
        set IsExpanded(value) {
            this._isExpanded = value;
        }
        static Create(constructor) {
            let obj = new constructor();
            obj.Initialize();
            return obj;
        }
        static Clone(obj) {
            if (obj == null)
                throw new ArgumentNullException('obj');
            let clone = obj.clone();
            clone.Initialize();
            let value = obj.GetValue();
            clone.SetValue(value);
            return clone;
        }
        ExpandAll() {
        }
        CollapseAll() {
        }
        GetDefaultValue() {
            if (this._metadata.hasOwnProperty('_data')) {
                return this._metadata['_data'];
            }
            throw new Error("not supported exception：" + JSON.stringify(this._metadata));
        }
        clone() {
            let obj = Object.create(this);
            obj._context = this._context;
            obj._metadata = this._metadata;
            obj._name = this._name;
            obj._parent = this._parent;
            obj._dataset = new Map();
            obj._isExpanded = this._isExpanded;
            for (let key in this._dataset) {
                obj._dataset[key] = this._dataset[key];
            }
            return obj;
        }
    }
    class InputControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._input;
        }
        get Input() {
            return this._input;
        }
        Initialize() {
            let input = document.createElement('input');
            input.readOnly = this.IsReadOnly;
            this._input = input;
            this.SetValue(this.GetDefaultValue());
        }
        SetValue(value) {
            this._input.value = value;
        }
        GetValue() {
            return this._input.value;
        }
    }
    class ItemsControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            this._children = new Array();
            this._members = metadata['_members'];
        }
        get Members() {
            return this._members;
        }
        get Children() {
            return this._children;
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return null;
            }
            return super.GetDefaultValue();
        }
        IndexOf(control) {
            return this._children.indexOf(control);
        }
        AppendChild(control) {
            if (control === null)
                throw new Error("argument null exception: control");
            if (!(control instanceof ItemControl))
                throw new Error("param: control type error!");
            this._children.push(control);
            this.OnAppend(control.Element);
        }
        RemoveChild(control) {
            if (control === null)
                throw new Error("argument null exception: control");
            if (!(control instanceof ItemControl))
                throw new Error("param: control type error!");
            let index = this._children.indexOf(control);
            if (index >= 0) {
                this._children.splice(index, 1);
                this.OnRemoved(control.Element);
                return true;
            }
            return false;
        }
        ExpandAll() {
            super.ExpandAll();
            this.IsExpanded = true;
            for (let element of this._children) {
                element.ExpandAll();
            }
        }
        CollapseAll() {
            super.CollapseAll();
            if (this._children.length > 0) {
                this.IsExpanded = false;
            }
            for (let element of this._children) {
                element.CollapseAll();
            }
        }
        Clear() {
            let child;
            while (this._children.length > 0) {
                child = this._children[0];
                this._children.splice(0, 1);
                this.OnRemoved(child.Element);
            }
        }
        clone() {
            let obj = super.clone();
            obj._members = this._members;
            return obj;
        }
    }
    class ItemControl extends FrameworkElement {
        constructor(content) {
            if (content == null)
                throw new ArgumentNullException('content');
            super(content.Context, content.Metadata, content.Name, content.Parent);
            this._content = content;
        }
        get Element() {
            return this._element;
        }
        get Content() {
            return this._content;
        }
        get Name() {
            return this._content.Name;
        }
        get Parent() {
            return this._content.Parent;
        }
        get IsReadOnly() {
            return this._content.IsReadOnly;
        }
        get IsExpanded() {
            return this._content.IsExpanded;
        }
        set IsExpanded(value) {
            this._content.IsExpanded = value;
        }
        CreateButton(value, type, click) {
            let button = document.createElement('input');
            button.className = StyleManager.GetButtonStyle(type);
            button.type = 'button';
            button.value = value;
            button.onclick = click;
            return button;
        }
        Initialize() {
            let panel = document.createElement('div');
            panel.className = "sky-panel";
            let head = document.createElement('div');
            head.className = "sky-panel-head";
            let btnCopy = this.CreateButton("拷贝", ButtonType.Info, (ev) => {
                let owner = super.Parent;
                if (owner == null)
                    throw new Error("parent type error!");
                let clone = FrameworkElement.Clone(this);
                owner.AppendChild(clone);
            });
            let btnDelete = this.CreateButton("删除", ButtonType.Danger, (ev) => {
                let owner = super.Parent;
                if (owner == null)
                    throw new Error("parent type error!");
                owner.RemoveChild(this);
            });
            btnCopy.disabled = this.IsReadOnly;
            btnDelete.disabled = this.IsReadOnly;
            head.appendChild(btnCopy);
            head.appendChild(btnDelete);
            panel.appendChild(head);
            this._element = panel;
            if (this._content != null) {
                this._element.appendChild(this._content.Element);
            }
        }
        SetValue(value) {
            if (this._content == null)
                throw new Error("content is null!");
            this._content.SetValue(value);
        }
        GetValue() {
            if (this._content == null)
                throw new Error("content is null!");
            return this._content.GetValue();
        }
        ExpandAll() {
            this._content.ExpandAll();
        }
        CollapseAll() {
            this._content.CollapseAll();
        }
        clone() {
            let obj = super.clone();
            obj._content = FrameworkElement.Clone(this._content);
            return obj;
        }
    }
    class ContentControl extends FrameworkElement {
        constructor(name, content) {
            if (name === null)
                throw new Error("argument null exception: name");
            if (content === null)
                throw new Error("argument null exception: content");
            super(content.Context, content.Metadata, name);
            this._content = content;
        }
        get Element() {
            return this._element;
        }
        get Parent() {
            return this._content.Parent;
        }
        get Content() {
            return this._content;
        }
        get IsReadOnly() {
            return this._content.IsReadOnly;
        }
        get Group() {
            return this._content.Group;
        }
        get IsExpanded() {
            return this._content.IsExpanded;
        }
        set IsExpanded(value) {
            this._content.IsExpanded = value;
        }
        Initialize() {
            let div = document.createElement('div');
            div.className = 'sky-block';
            let label = document.createElement('span');
            label.className = 'sky-span';
            label.innerHTML = this.Display + ":";
            if (this.Metadata.hasOwnProperty('_tooltip')) {
                label.title = this.Metadata['_tooltip'];
            }
            let content = this._content.Element;
            if (content.className == null || content.className == '') {
                content.className = 'sky-content';
            }
            else {
                content.className += ' sky-content';
            }
            div.appendChild(label);
            div.appendChild(content);
            this._label = label;
            this._element = div;
        }
        GetDefaultValue() {
            return this._content.GetDefaultValue();
        }
        SetValue(value) {
            this._content.SetValue(value);
        }
        GetValue() {
            return this._content.GetValue();
        }
        ExpandAll() {
            this._content.ExpandAll();
        }
        CollapseAll() {
            this._content.CollapseAll();
        }
        clone() {
            let obj = super.clone();
            obj._content = FrameworkElement.Clone(this._content);
            return obj;
        }
    }
    class SelectControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._select;
        }
        Initialize() {
            this._select = document.createElement('select');
            this._select.className = "wui-select";
            this._select.disabled = true;
            this.LoadOptions(p => {
                this._options = p;
                let member;
                let option;
                for (let key of p.keys) {
                    let value = p.get(key);
                    option = document.createElement('option');
                    option.value = key;
                    option.innerHTML = value;
                    this._select.appendChild(option);
                }
                this.SetValue(this._value || this.GetDefaultValue());
                if (!super.IsReadOnly) {
                    this._select.removeAttribute('disabled');
                }
            });
        }
        GetDefaultValue() {
            if (this._options == null) {
                return -1;
            }
            else if (this._options.count == 0) {
                return -1;
            }
            else if (!this.HasDefaultValue) {
                return -1;
            }
            return super.GetDefaultValue();
        }
        GetValue() {
            if (this._options == null) {
                return this._value;
            }
            else {
                let index = this._select.selectedIndex;
                if (index == -1) {
                    return this.GetDefaultValue();
                }
                return this._options.keys[index];
            }
        }
        SetValue(value) {
            if (this._options == null) {
                this._value = value;
            }
            else {
                let options = this._options;
                for (let i = 0; i < options.count; i++) {
                    let key = options.keys[i];
                    if (value == key) {
                        this._select.selectedIndex = i;
                        return;
                    }
                }
                this._select.selectedIndex = -1;
            }
        }
        clone() {
            let element = super.clone();
            element._options = this._options;
            element._value = this._value;
            return element;
        }
    }
    class EnumControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            this._members = metadata["_members"];
        }
        get Element() {
            return this._select;
        }
        Initialize() {
            this._select = document.createElement('select');
            this._select.className = "wui-select";
            this._select.disabled = super.IsReadOnly;
            let member;
            let option;
            for (let i = 0; i < this._members.length; i++) {
                member = this._members[i];
                option = document.createElement('option');
                option.value = member.value;
                option.innerHTML = member.name;
                this._select.appendChild(option);
            }
            this.SetValue(this.GetDefaultValue());
        }
        GetDefaultValue() {
            if (this._members.length == 0) {
                return -1;
            }
            else if (!this.HasDefaultValue) {
                return 0;
            }
            return super.GetDefaultValue();
        }
        GetValue() {
            let index = this._select.selectedIndex;
            if (index == -1) {
                return this.GetDefaultValue();
            }
            let option = this._select.options.item(index);
            return Number(option.value);
        }
        SetValue(value) {
            let member;
            for (let i = 0; i < this._members.length; i++) {
                member = this._members[i];
                if (value == member.value) {
                    this._select.selectedIndex = i;
                    return;
                }
            }
            this._select.selectedIndex = -1;
        }
        clone() {
            let obj = super.clone();
            obj._members = this._members;
            return obj;
        }
    }
    class NumberControl extends InputControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        Initialize() {
            super.Initialize();
            super.Input.className = "wui-input";
            super.Input.type = "number";
            if (super.Tooltip != null) {
                super.Input.placeholder = super.Tooltip;
            }
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return 0;
            }
            return super.GetDefaultValue();
        }
        GetValue() {
            return Number(super.GetValue());
        }
    }
    class StringControl extends InputControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        Initialize() {
            super.Initialize();
            super.Input.className = "wui-input";
            super.Input.spellcheck = false; //拼写检查
            if (super.Tooltip != null) {
                super.Input.placeholder = super.Tooltip;
            }
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return "";
            }
            return super.GetDefaultValue();
        }
    }
    class BooleanControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        Initialize() {
            let div = document.createElement('div');
            div.className = 'wui-checkbox';
            let input = document.createElement('input');
            input.id = 'checkbox-' + Guid.newGuid().toString();
            input.type = "checkbox";
            input.readOnly = this.IsReadOnly;
            input.disabled = this.IsReadOnly;
            let label = document.createElement('label');
            label.htmlFor = input.id;
            div.appendChild(input);
            div.appendChild(label);
            this._input = input;
            this._element = div;
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return false;
            }
            return super.GetDefaultValue();
        }
        GetValue() {
            return Boolean(this._input.checked);
        }
        SetValue(value) {
            this._input.checked = Boolean(value);
        }
    }
    class UTCDateTimeFormat {
        completion(value) {
            return value <= 9 ? "0" + value.toString() : value.toString();
        }
        Convert(value) {
            //var date = new Date(value);
            //return date.getUTCSeconds();
            return Date.parse(value) / 1000;
        }
        ConvertBack(value) {
            let date = new Date();
            date.setTime(value * 1000);
            let year = this.completion(date.getFullYear());
            let month = this.completion(date.getMonth() + 1);
            let day = this.completion(date.getDate());
            let hour = this.completion(date.getHours());
            let minute = this.completion(date.getMinutes());
            return year + "-" + month + "-" + day + "T" + hour + ":" + minute;
            //return year + "-" + month + "-" + day;
        }
    }
    class DateTimeControl extends InputControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            if (super.Format === "UTCDateTimeFormat") {
                this._dataFormat = new UTCDateTimeFormat();
            }
        }
        Initialize() {
            super.Initialize();
            this.Input.className = "wui-input";
            this.Input.type = "datetime-local";
            //this.Input.type = "date";
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                if (this._dataFormat == null) {
                    return "1970-01-01T08:00";
                }
                else {
                    return Date.parse("1970-1-1 8:00:00") / 1000;
                }
            }
            return super.GetDefaultValue();
        }
        GetValue() {
            let value = super.GetValue();
            if (this._dataFormat != null) {
                value = this._dataFormat.Convert(value);
            }
            else {
                let str = value;
                value = str.replace('T', ' ');
            }
            return value;
        }
        SetValue(value) {
            if (this._dataFormat != null) {
                value = this._dataFormat.ConvertBack(value);
            }
            else {
                let str = value;
                value = str.replace(' ', 'T');
            }
            super.SetValue(value);
        }
    }
    class TimeSpanControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        get IsTime() {
            return super.Format == 'Time';
        }
        OnFocus(e) {
            if (!this._element.classList.contains('sky-timespan-focus')) {
                this._element.classList.add('sky-timespan-focus');
            }
            let element = e.srcElement;
            element.select();
        }
        OnBlur(e, isday) {
            this._element.classList.remove('sky-timespan-focus');
            let element = e.srcElement;
            if (isday) {
                element.value = parseInt(element.value).toString();
            }
            else {
                let maxlength = element.maxLength;
                if (element.value == '') {
                    element.value = new String('0', maxlength).toString();
                }
                else {
                    element.value = new String(element.value).padLeft(maxlength, '0');
                }
            }
        }
        OnInput(e, min, max) {
            let element = e.srcElement;
            let value = parseInt(element.value);
            if (value < min || value > max) {
                let maxlength = element.maxLength;
                element.value = new String('0', maxlength).toString();
                element.select();
            }
        }
        Initialize() {
            let div = document.createElement('div');
            let day = document.createElement('input');
            let hour = document.createElement('input');
            let minute = document.createElement('input');
            let second = document.createElement('input');
            let daySeparator = document.createElement('label');
            let hourSeparator = document.createElement('label');
            let minuteSeparator = document.createElement('label');
            div.className = 'sky-timespan';
            div.onclick = p => this.IsTime ? hour.focus() : day.focus();
            daySeparator.innerHTML = '';
            hourSeparator.innerHTML = ':';
            minuteSeparator.innerHTML = ':';
            if (!this.IsTime) {
                day.value = '0';
                day.type = 'text';
                day.className = 'sky-timespan-h3';
                day.maxLength = 3;
                day.ondragstart = p => false;
                day.onclick = p => p.stopPropagation();
                day.onkeypress = p => 48 <= p.keyCode && p.keyCode <= 57;
                day.onfocus = p => this.OnFocus(p);
                day.onblur = p => this.OnBlur(p, true);
                day.oninput = p => this.OnInput(p, 0, 999);
            }
            hour.value = '00';
            hour.type = 'text';
            hour.className = 'sky-timespan-h2';
            hour.maxLength = 2;
            hour.ondragstart = p => false;
            hour.onclick = p => p.stopPropagation();
            hour.onkeypress = p => 48 <= p.keyCode && p.keyCode <= 57;
            hour.onfocus = p => this.OnFocus(p);
            hour.onblur = p => this.OnBlur(p, false);
            hour.oninput = p => this.OnInput(p, 0, 23);
            minute.value = '00';
            minute.type = 'text';
            minute.className = 'sky-timespan-h2';
            minute.maxLength = 2;
            minute.ondragstart = p => false;
            minute.onclick = p => p.stopPropagation();
            minute.onkeypress = p => 48 <= p.keyCode && p.keyCode <= 57;
            minute.onfocus = p => this.OnFocus(p);
            minute.onblur = p => this.OnBlur(p, false);
            minute.oninput = p => this.OnInput(p, 0, 59);
            second.value = '00';
            second.type = 'text';
            second.className = 'sky-timespan-h2';
            second.maxLength = 2;
            second.ondragstart = p => false;
            second.onclick = p => p.stopPropagation();
            second.onkeypress = p => 48 <= p.keyCode && p.keyCode <= 57;
            second.onfocus = p => this.OnFocus(p);
            second.onblur = p => this.OnBlur(p, false);
            second.oninput = p => this.OnInput(p, 0, 59);
            if (!this.IsTime) {
                div.appendChild(day);
                div.appendChild(daySeparator);
            }
            div.appendChild(hour);
            div.appendChild(hourSeparator);
            div.appendChild(minute);
            div.appendChild(minuteSeparator);
            div.appendChild(second);
            this._element = div;
            this._day = day;
            this._hour = hour;
            this._minute = minute;
            this._second = second;
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return false;
            }
            return super.GetDefaultValue();
        }
        GetValue() {
            let day = parseInt(this._day.value);
            let hour = parseInt(this._hour.value);
            let minutes = parseInt(this._minute.value);
            let seconds = parseInt(this._second.value);
            let format = this.IsTime ? 'HH:mm:ss' : 'dd.HH:mm:ss';
            console.log(day + ' ' + hour + ':' + minutes + ':' + seconds);
            return new TimeSpan(day, hour, minutes, seconds).toString(format);
        }
        SetValue(value) {
            if (value != null) {
                let blur = (v) => v <= 9 ? ('0' + v.toString()) : v.toString();
                let ts;
                try {
                    ts = TimeSpan.parse(value);
                }
                catch (ex) {
                    ts = TimeSpan.zero;
                    console.error(ex);
                }
                this._day.value = ts.days.toString();
                this._hour.value = blur(ts.hours);
                this._minute.value = blur(ts.minutes);
                this._second.value = blur(ts.seconds);
            }
        }
    }
    class ArrayControl extends ItemsControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            if (!metadata.hasOwnProperty("_children"))
                throw new Error("not found key: _members, object:" + JSON.stringify(metadata));
            this._childMetadata = metadata["_children"];
        }
        get Element() {
            return this._element;
        }
        get IsExpanded() {
            return super.IsExpanded;
        }
        set IsExpanded(value) {
            super.IsExpanded = value;
            if (value) {
                this._btnToggleAnchor.className = "fa-chevron-down";
                if (this._body != null && this._body.style.display == "none") {
                    this._body.style.display = "block";
                }
            }
            else {
                this._btnToggleAnchor.className = "fa-chevron-up";
                if (this._body != null) {
                    this._body.style.display = "none";
                }
            }
        }
        OnAppend(element) {
            if (this._body == null) {
                this._body = this.CreateBody();
                this._element.appendChild(this._body);
                this._btnToggleSpan.style.display = '';
            }
            this._body.appendChild(element);
        }
        OnRemoved(element) {
            this._body.removeChild(element);
            if (super.Children.length == 0 && this._body != null) {
                this._element.removeChild(this._body);
                this._body = null;
                this._btnToggleSpan.style.display = 'none';
            }
        }
        CreateButton(value, type, click) {
            let button = document.createElement('input');
            button.className = StyleManager.GetButtonStyle(type);
            button.type = "button";
            button.value = value;
            button.onclick = click;
            return button;
        }
        CreateBody() {
            let body = document.createElement('div');
            body.className = "sky-array-panel-body";
            return body;
        }
        Initialize() {
            let panel = document.createElement('div');
            panel.className = "sky-panel sky-array-panel";
            let head = document.createElement('div');
            head.className = "sky-array-panel-head";
            let btnCreate = this.CreateButton("创建", ButtonType.Info, (ev) => {
                let content = Sky.Create(super.Context, this._childMetadata, null, this);
                let item = new ItemControl(content);
                item.Initialize();
                this.AppendChild(item);
                return true;
            });
            let btnClear = this.CreateButton("清空", ButtonType.Danger, (ev) => {
                //if (!confirm("Confirm clear?")) {
                //    return false;
                //}
                this.Clear();
                return true;
            });
            btnCreate.disabled = this.IsReadOnly;
            btnClear.disabled = this.IsReadOnly;
            let btnToggleSpan = document.createElement('span');
            btnToggleSpan.className = "fa-chevron";
            btnToggleSpan.style.display = 'none';
            let btnToggleAnchor = document.createElement('a');
            btnToggleAnchor.className = "fa-chevron-down";
            btnToggleAnchor.onclick = (ev) => {
                this.IsExpanded = !this.IsExpanded;
            };
            btnToggleSpan.appendChild(btnToggleAnchor);
            head.appendChild(btnCreate);
            head.appendChild(btnClear);
            head.appendChild(btnToggleSpan);
            panel.appendChild(head);
            this._element = panel;
            this._head = head;
            this._btnToggleSpan = btnToggleSpan;
            this._btnToggleAnchor = btnToggleAnchor;
            let value = this.GetDefaultValue();
            this.SetValue(value);
        }
        SetValue(value) {
            this.Clear();
            if (value != null) {
                let array = value;
                let control;
                let item;
                for (let i = 0; i < array.length; i++) {
                    let content = Sky.Create(super.Context, this._childMetadata, null, this);
                    item = new ItemControl(content);
                    item.Initialize();
                    item.SetValue(array[i]);
                    this.AppendChild(item);
                }
            }
        }
        GetValue() {
            let array = new Array();
            let control, value;
            for (let i = 0; i < this.Children.length; i++) {
                control = this.Children[i];
                value = control.GetValue();
                array.push(value);
            }
            return array;
        }
        clone() {
            let obj = super.clone();
            obj._childMetadata = this._childMetadata;
            return obj;
        }
    }
    class GroupInfo {
        constructor(name, order, display) {
            this._name = name;
            this._order = order;
            this._display = display;
        }
        get Name() {
            return this._name;
        }
        get Order() {
            return this._order;
        }
        get Display() {
            return this._display;
        }
        static Parse(json) {
            if (json == null)
                throw new Error("argument null exception!");
            let name = json["_name"];
            let order = 0;
            let display;
            if (json.hasOwnProperty("_order")) {
                order = json["_order"];
            }
            if (json.hasOwnProperty("_display")) {
                display = json["_display"];
            }
            else {
                display = name;
            }
            return new GroupInfo(name, order, display);
        }
    }
    class GroupControl {
        constructor(group) {
            this._group = group;
            this._controls = new Array();
        }
        get Element() {
            return this._element;
        }
        get Name() {
            return this._group.Name;
        }
        Initialize() {
            let div = document.createElement('div');
            div.className = 'fieldset mb20 pb15';
            let legend = document.createElement('div');
            legend.className = 'legend';
            legend.innerHTML = this._group.Display;
            div.appendChild(legend);
            this._element = div;
        }
        Add(control) {
            this._controls.push(control);
            this._element.appendChild(control.Element);
        }
    }
    class TypeControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            this._value = false;
            this._members = metadata["_members"];
        }
        get Element() {
            return this._element;
        }
        CreateButton(value, click) {
            let button = document.createElement('input');
            button.className = StyleManager.GetButtonStyle(ButtonType.Info);
            button.type = 'button';
            button.value = value;
            button.onclick = click;
            button.disabled = this.IsReadOnly;
            return button;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            if (!(super.Parent instanceof ItemsControl) && !(super.Parent instanceof DynamicClassControl)) {
                let head = document.createElement('div');
                head.className = 'sky-panel-head';
                let button = this.CreateButton("创建", e => {
                    if (!this._value) {
                        this.SetValue({});
                    }
                    else {
                        this.SetValue(null);
                    }
                });
                head.appendChild(button);
                layout.appendChild(head);
                this._button = button;
                if (!this._value) {
                    body.style.display = 'none';
                }
            }
            else {
                let head = document.createElement('div');
                head.className = 'sky-panel-head';
                head.style.background = '#fbfbfb';
                let span = document.createElement('span');
                span.style.fontSize = '15px';
                span.style.fontWeight = 'bold';
                span.innerHTML = this.Display;
                head.appendChild(span);
                layout.appendChild(head);
            }
            this._children = Sky.Creates(super.Context, this._members, this);
            if (super.Metadata.hasOwnProperty("_groups")) {
                let arrayForGroupInfos = new Array();
                arrayForGroupInfos.push(new GroupInfo(null, 100000000, "其它"));
                for (let gmdata of super.Metadata["_groups"]) {
                    arrayForGroupInfos.push(GroupInfo.Parse(gmdata));
                }
                arrayForGroupInfos = arrayForGroupInfos.sort((a, b) => a.Order - b.Order);
                let arrayForGroups = new Array();
                let find = (name) => {
                    for (let group of arrayForGroups) {
                        if (group.Name == name) {
                            return group;
                        }
                    }
                    return null;
                };
                let group;
                for (let info of arrayForGroupInfos) {
                    group = new GroupControl(info);
                    group.Initialize();
                    arrayForGroups.push(group);
                    body.appendChild(group.Element);
                }
                for (let control of this._children) {
                    group = find(control.Group);
                    if (group != null) {
                        group.Add(control);
                    }
                    else {
                        body.appendChild(control.Element);
                    }
                }
            }
            else {
                for (let control of this._children) {
                    body.appendChild(control.Element);
                }
            }
            layout.appendChild(body);
            this._element = layout;
            this._body = body;
            let value = this.GetDefaultValue();
            if (value != null) {
                this.SetValue(value);
            }
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return null;
            }
            return super.GetDefaultValue();
        }
        SetValue(value) {
            if (value == null) {
                if (this._button != null) {
                    this._value = false;
                    this._button.value = '创建';
                    this._button.className = StyleManager.GetButtonStyle(ButtonType.Info);
                    this._body.style.display = 'none';
                }
            }
            else {
                if (this._button != null && !this._value) {
                    this._value = true;
                    this._button.value = '删除';
                    this._button.className = StyleManager.GetButtonStyle(ButtonType.Danger);
                    this._body.style.display = '';
                }
                let val;
                for (let element of this._children) {
                    if (value.hasOwnProperty(element.Name)) {
                        val = value[element.Name];
                    }
                    else {
                        val = element.GetDefaultValue();
                    }
                    element.SetValue(val);
                }
            }
        }
        GetValue() {
            if (this._button != null) {
                if (!this._value) {
                    return null;
                }
            }
            let obj = {};
            let control;
            for (let i = 0; i < this._children.length; i++) {
                control = this._children[i];
                if (!control.IsReadOnly) {
                    obj[control.Name] = control.GetValue();
                }
            }
            return obj;
        }
        ExpandAll() {
            super.ExpandAll();
            for (let element of this._children) {
                element.ExpandAll();
            }
        }
        CollapseAll() {
            super.CollapseAll();
            for (let element of this._children) {
                element.CollapseAll();
            }
        }
        clone() {
            let obj = super.clone();
            obj._members = this._members;
            obj._value = this._value;
            return obj;
        }
    }
    class Subclass {
        constructor(metadata) {
            if (!metadata.hasOwnProperty("_name")) {
                throw new Error("not found key: _name");
            }
            this._name = metadata["_name"];
            this._metadata = metadata;
        }
        get name() {
            return this._name;
        }
        get display() {
            if (this._metadata.hasOwnProperty("_display")) {
                return this._metadata["_display"];
            }
            else {
                return this._name;
            }
        }
        get metadata() {
            return this._metadata;
        }
        Clone() {
            let obj = Object.create(this);
            obj._name = this._name;
            obj._metadata = this._metadata;
            return obj;
        }
    }
    class DynamicClassControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            let selector = metadata["_selector"];
            this._selector = new Array();
            let subclass;
            for (let key in selector) {
                subclass = new Subclass(selector[key]);
                this._selector.push(subclass);
            }
        }
        get Element() {
            return this._element;
        }
        get IsExpanded() {
            return super.IsExpanded;
        }
        set IsExpanded(value) {
            super.IsExpanded = value;
            if (this._subClass != null) {
                this._subClass.IsExpanded = value;
            }
        }
        findSubclass(name) {
            let subclass;
            for (let i = 0; i < this._selector.length; i++) {
                subclass = this._selector[i];
                if (subclass.name == name) {
                    return subclass;
                }
            }
            return null;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = 'sky-panel';
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            let subclass;
            let element;
            for (let subclass of this._selector) {
                element = document.createElement('input');
                element.className = StyleManager.GetButtonStyle(ButtonType.Info);
                element.type = 'button';
                element.value = subclass.display;
                element.dataset["name"] = subclass.name;
                element.onclick = (ev) => {
                    if (this._subClass != null) {
                        this._element.removeChild(this._subClass.Element);
                    }
                    let name = ev.srcElement.dataset['name'];
                    let subclass = this.findSubclass(name);
                    this._subClass = Sky.Create(super.Context, subclass.metadata, name, this);
                    this._subClass.IsExpanded = this.IsExpanded;
                    this._element.appendChild(this._subClass.Element);
                };
                head.appendChild(element);
            }
            element = document.createElement('input');
            element.className = StyleManager.GetButtonStyle(ButtonType.Danger);
            element.type = "button";
            element.value = "删除";
            element.onclick = (ev) => {
                if (this._subClass != null) {
                    this._element.removeChild(this._subClass.Element);
                    this._subClass = null;
                }
            };
            head.appendChild(element);
            layout.appendChild(head);
            this._element = layout;
        }
        GetDefaultValue() {
            if (!super.HasDefaultValue) {
                return null;
            }
            return super.GetDefaultValue();
        }
        SetValue(value) {
            if (value == null) {
                if (this._subClass != null) {
                    this._element.removeChild(this._subClass.Element);
                    this._subClass = null;
                }
            }
            else {
                if (!value.hasOwnProperty("ClassName"))
                    throw new Error("not found key: ClassName");
                let name = value["ClassName"];
                if (this._subClass == null || this._subClass.Name != name) {
                    if (this._subClass != null) {
                        this._element.removeChild(this._subClass.Element);
                    }
                    let subclass = this.findSubclass(name);
                    this._subClass = Sky.Create(super.Context, subclass.metadata, name, this);
                    this._subClass.IsExpanded = this.IsExpanded;
                    this._element.appendChild(this._subClass.Element);
                }
                this._subClass.SetValue(value);
            }
        }
        GetValue() {
            if (this._subClass == null) {
                return null;
            }
            let obj = this._subClass.GetValue();
            obj["ClassName"] = this._subClass.Name;
            return obj;
        }
        ExpandAll() {
            super.ExpandAll();
            if (this._subClass != null) {
                this._subClass.ExpandAll();
            }
        }
        CollapseAll() {
            super.CollapseAll();
            if (this._subClass != null) {
                this._subClass.CollapseAll();
            }
        }
        clone() {
            let obj = super.clone();
            obj._subClass = this._subClass;
            return obj;
        }
    }
    class DynamicArrayControl extends ItemsControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            if (!metadata.hasOwnProperty("_selector"))
                throw new Error("not found key: _selector, object:" + JSON.stringify(metadata));
            let selector = metadata["_selector"];
            this._selector = new Array();
            let subclass;
            for (let key in selector) {
                subclass = new Subclass(selector[key]);
                this._selector.push(subclass);
            }
        }
        get Element() {
            return this._element;
        }
        get Active() {
            return !(this._body != null && this._body.style.display == "none");
        }
        get IsExpanded() {
            return super.IsExpanded;
        }
        set IsExpanded(value) {
            super.IsExpanded = value;
            if (value) {
                this._btnToggleAnchor.className = "fa-chevron-down";
                if (this._body != null && this._body.style.display == "none") {
                    this._body.style.display = "block";
                }
            }
            else {
                this._btnToggleAnchor.className = "fa-chevron-up";
                if (this._body != null) {
                    this._body.style.display = "none";
                }
            }
        }
        findSubclass(name) {
            let subclass;
            for (let i = 0; i < this._selector.length; i++) {
                subclass = this._selector[i];
                if (subclass.name == name) {
                    return subclass;
                }
            }
            return null;
        }
        CreateBody() {
            let body = document.createElement('div');
            body.className = "sky-dynamic-array-panel-body";
            return body;
        }
        OnAppend(element) {
            if (this._body == null) {
                this._body = this.CreateBody();
                this._element.appendChild(this._body);
                this._btnToggleSpan.style.display = '';
            }
            this._body.appendChild(element);
        }
        OnRemoved(element) {
            this._body.removeChild(element);
            if (this._body.children.length == 0) {
                this._element.removeChild(this._body);
                this._body = null;
                this._btnToggleSpan.style.display = 'none';
            }
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-dynamic-array-panel";
            let head = document.createElement('div');
            head.className = 'sky-dynamic-array-panel-head';
            //head.style.height = '25px';
            let element;
            for (let i = 0; i < this._selector.length; i++) {
                element = document.createElement('input');
                element.className = StyleManager.GetButtonStyle(ButtonType.Info);
                element.type = "button";
                element.value = this._selector[i].display;
                element.dataset["name"] = this._selector[i].name;
                element.onclick = (ev) => {
                    let name = ev.srcElement.dataset['name'];
                    let subclass = this.findSubclass(name);
                    let content = Sky.Create(super.Context, subclass.metadata, subclass.name, this);
                    content.DataSet["name"] = name;
                    let item = new ItemControl(content);
                    item.Initialize();
                    this.AppendChild(item);
                    return true;
                };
                head.appendChild(element);
            }
            element = document.createElement('input');
            element.className = StyleManager.GetButtonStyle(ButtonType.Danger);
            element.type = "button";
            element.value = "清空";
            element.onclick = (ev) => {
                //if (!confirm("Confirm clear?")) {
                //    return false;
                //}
                this.Clear();
                return true;
            };
            head.appendChild(element);
            let btnToggleSpan = document.createElement('span');
            btnToggleSpan.className = "fa-chevron";
            btnToggleSpan.style.display = 'none';
            let btnToggleAnchor = document.createElement('a');
            btnToggleAnchor.className = "fa-chevron-down";
            btnToggleAnchor.onclick = (ev) => {
                this.IsExpanded = !this.IsExpanded;
            };
            btnToggleSpan.appendChild(btnToggleAnchor);
            head.appendChild(btnToggleSpan);
            layout.appendChild(head);
            this._element = layout;
            this._head = head;
            this._btnToggleSpan = btnToggleSpan;
            this._btnToggleAnchor = btnToggleAnchor;
        }
        SetValue(value) {
            this.Clear();
            if (value != null) {
                let array = value;
                for (let i = 0; i < array.length; i++) {
                    let arrayItem = array[i];
                    if (!arrayItem.hasOwnProperty("ClassName"))
                        throw new Error("not found key: ClassName");
                    let subclass = this.findSubclass(arrayItem["ClassName"]);
                    let control = Sky.Create(super.Context, subclass.metadata, subclass.name, this);
                    control.DataSet['name'] = subclass.name;
                    let item = new ItemControl(control);
                    item.Initialize();
                    item.SetValue(arrayItem);
                    this.AppendChild(item);
                }
            }
        }
        GetValue() {
            let array = new Array();
            for (let i = 0; i < this.Children.length; i++) {
                let control = this.Children[i];
                let value = control.GetValue();
                value["ClassName"] = control.Content.DataSet['name'];
                array.push(value);
            }
            return array;
        }
        clone() {
            let obj = super.clone();
            obj._childrenMetadata = this._childrenMetadata;
            return obj;
        }
    }
    class ExtendControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            if (name == null)
                throw new Error("argument null exception: name");
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateButton(value, click) {
            let button = document.createElement('input');
            button.readOnly = super.IsReadOnly;
            button.style.height = "25px";
            button.style.width = "auto";
            button.style.minWidth = "60px";
            button.style.marginRight = "5px";
            button.style.verticalAlign = "middle";
            button.className = "wui-btn wui-btn-small wui-btn-default";
            button.type = "button";
            button.value = value;
            button.onclick = click;
            return button;
        }
        CreateBody() {
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            return body;
        }
        Initialize() {
            let panel = document.createElement('div');
            panel.className = "sky-panel";
            let head = document.createElement('div');
            head.className = "sky-panel-head";
            let button = this.CreateButton("加载", (ev) => {
                button.readOnly = true;
                InternalContext.Locator.Load(super.Name, (val) => {
                    panel.removeChild(head);
                    let body = this.CreateBody();
                    this._element.appendChild(body);
                    let control = Sky.Create(super.Context, val, super.Name, this);
                    body.appendChild(control.Element);
                });
            });
            head.appendChild(button);
            panel.appendChild(head);
            this._element = panel;
        }
        SetValue(value) {
            throw new Error("Method not implemented.");
        }
        GetValue() {
            throw new Error("Method not implemented.");
        }
    }
    class PropertyControl extends FrameworkElement {
        constructor(category, context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            this._initialized = false;
            this._category = category;
        }
        get Element() {
            return this._select;
        }
        Initialize() {
            let select = document.createElement('select');
            select.className = "wui-select";
            select.disabled = this.IsReadOnly;
            InternalContext.Locator.LoadCharacterProperties(this._category, p => {
                for (let q of p) {
                    let option = document.createElement('option');
                    option.value = q.Property;
                    option.innerHTML = q.Name;
                    select.options.add(option);
                }
                this._initialized = true;
                if (this._value != null) {
                    this.SetValue(this._value);
                }
            });
            this._select = select;
        }
        GetDefaultValue() {
            if (this._select.options.length == 0) {
                return null;
            }
            return this._select.value;
        }
        SetValue(value) {
            //throw new Error("Method not implemented.");
            if (this._initialized) {
                this._select.value = value;
            }
            else {
                this._value = value;
            }
        }
        GetValue() {
            if (!this._initialized) {
                if (this._value != null) {
                    return this._value;
                }
                throw new Error("not initialized");
            }
            //throw new Error("Method not implemented.");
            return this._select.value;
        }
        clone() {
            let obj = super.clone();
            obj._category = this._category;
            obj._value = this._value;
            return obj;
        }
    }
    class SearchControl extends FrameworkElement {
        constructor(defaultType, search, context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            if (search == null)
                throw new ArgumentNullException('search');
            this._defaultType = defaultType;
            this._search = search;
        }
        get Element() {
            return this._span;
        }
        get Type() {
            return this._type;
        }
        set Type(value) {
            this._type = value;
            this._search.GetOrLoadOptions(p => {
                if (p.containsKey(value)) {
                    this._span.innerHTML = p.get(value);
                }
            });
        }
        Initialize() {
            let span = document.createElement('span');
            span.className = 'sky-search-input-type';
            span.addEventListener('click', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this._search.Show(span, q => {
                    this._type = q.Key;
                    span.innerHTML = q.Name;
                });
            });
            this._span = span;
            this.Type = this._defaultType;
        }
        GetDefaultValue() {
            return this._defaultType;
        }
        SetValue(value) {
            this.Type = Number(value);
        }
        GetValue() {
            return this._type;
        }
        clone() {
            let obj = super.clone();
            obj._defaultType = this._defaultType;
            return obj;
        }
    }
    class AwardCountControl {
        constructor() {
            this._randomCount = false;
            let containerLine = document.createElement('div');
            containerLine.className = 'sky-search-count-container-line';
            let swap = document.createElement('a');
            swap.className = 'sky-search-count-swap';
            swap.onclick = e => {
                this.RandomCount = !this.RandomCount;
            };
            let container = document.createElement('div');
            container.className = 'sky-search-count-container';
            let count = document.createElement('input');
            count.className = 'wui-input sky-search-input-count';
            count.type = 'number';
            count.min = "1";
            count.value = "1";
            let minCount = document.createElement('input');
            minCount.className = 'wui-input sky-search-input-min-count';
            minCount.type = 'number';
            minCount.min = "1";
            minCount.value = "1";
            let maxCount = document.createElement('input');
            maxCount.className = 'wui-input sky-search-input-max-count';
            maxCount.type = 'number';
            maxCount.min = "1";
            maxCount.value = "1";
            container.appendChild(count);
            containerLine.appendChild(swap);
            containerLine.appendChild(container);
            this._element = containerLine;
            this._count = count;
            this._container = container;
            this._minCount = minCount;
            this._maxCount = maxCount;
        }
        get Element() {
            return this._element;
        }
        get Count() {
            return Number(this._count.value);
        }
        set Count(value) {
            this._count.value = value.toString();
        }
        get MinCount() {
            return Number(this._minCount.value);
        }
        set MinCount(value) {
            this._minCount.value = value.toString();
        }
        get MaxCount() {
            return Number(this._maxCount.value);
        }
        set MaxCount(value) {
            this._maxCount.value = value.toString();
        }
        get RandomCount() {
            return this._randomCount;
        }
        set RandomCount(value) {
            if (this._randomCount != value) {
                this._randomCount = value;
                if (value) {
                    this._container.removeChild(this._count);
                    this._container.appendChild(this._minCount);
                    this._container.appendChild(this._maxCount);
                }
                else {
                    this._container.removeChild(this._minCount);
                    this._container.removeChild(this._maxCount);
                    this._container.appendChild(this._count);
                }
            }
        }
    }
    AwardCountControl.CountProperty = "Count";
    AwardCountControl.MinCountProperty = "MinCount";
    AwardCountControl.MaxCountProperty = "MaxCount";
    class ObjectAwardControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateLine(members) {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = 'sky-object-line sky-content';
            let search = Sky.Create(super.Context, members[ObjectAwardControl.TypeProperty], ObjectAwardControl.TypeProperty, this);
            let count = new AwardCountControl();
            div.appendChild(search.Element);
            div.appendChild(count.Element);
            line.appendChild(span);
            line.appendChild(div);
            this._search = search;
            this._count = count;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            let control = Sky.Create(super.Context, members[ObjectAwardControl.ConditionsProperty], ObjectAwardControl.ConditionsProperty, this);
            let conditions = new ContentControl(ObjectAwardControl.ConditionsProperty, control);
            conditions.Initialize();
            control = Sky.Create(super.Context, members[ObjectAwardControl.PropertiesProperty], ObjectAwardControl.PropertiesProperty, this);
            let properties = new ContentControl(ObjectAwardControl.PropertiesProperty, control);
            properties.Initialize();
            body.appendChild(this.CreateLine(members));
            body.appendChild(conditions.Element);
            body.appendChild(properties.Element);
            this._element = layout;
            this._conditions = conditions;
            this._properties = properties;
        }
        SetValue(value) {
            if (value == null) {
                this._search.Type = 0;
                this._count.RandomCount = false;
                this._count.Count = 0;
            }
            else {
                this._search.Type = value.Type;
                if (value[AwardCountControl.MinCountProperty] && value[AwardCountControl.MinCountProperty] > 0) {
                    this._count.RandomCount = true;
                    this._count.MinCount = value[AwardCountControl.MinCountProperty];
                    this._count.MaxCount = value[AwardCountControl.MaxCountProperty];
                }
                else {
                    this._count.Count = value.Count;
                }
                if (value.hasOwnProperty(ObjectAwardControl.ConditionsProperty)) {
                    this._conditions.SetValue(value[ObjectAwardControl.ConditionsProperty]);
                }
                if (value.hasOwnProperty(ObjectAwardControl.PropertiesProperty)) {
                    this._properties.SetValue(value[ObjectAwardControl.PropertiesProperty]);
                }
            }
        }
        GetValue() {
            let json = {
                Type: this._search.Type,
            };
            if (this._count.RandomCount) {
                json[AwardCountControl.MinCountProperty] = this._count.MinCount;
                json[AwardCountControl.MaxCountProperty] = this._count.MaxCount;
            }
            else {
                json[AwardCountControl.CountProperty] = this._count.Count;
            }
            json[ObjectAwardControl.ConditionsProperty] = this._conditions.GetValue();
            json[ObjectAwardControl.PropertiesProperty] = this._properties.GetValue();
            return json;
        }
        ExpandAll() {
            super.ExpandAll();
            this._conditions.ExpandAll();
            this._properties.ExpandAll();
        }
        CollapseAll() {
            super.CollapseAll();
            this._conditions.CollapseAll();
            this._properties.CollapseAll();
        }
    }
    ObjectAwardControl.TypeProperty = 'Type';
    ObjectAwardControl.ConditionsProperty = 'Conditions';
    ObjectAwardControl.PropertiesProperty = 'Properties';
    class AwardValueControl {
        constructor() {
            this._randomValue = false;
            let containerLine = document.createElement('div');
            containerLine.className = 'sky-object-line';
            let swap = document.createElement('a');
            swap.className = 'sky-search-count-swap';
            swap.onclick = e => {
                this.RandomValue = !this.RandomValue;
            };
            let container = document.createElement('div');
            container.className = 'sky-object-line';
            let count = document.createElement('input');
            count.className = 'wui-input';
            count.type = 'number';
            count.min = "1";
            count.value = "1";
            let minCount = document.createElement('input');
            minCount.className = 'wui-input sky-object-left';
            minCount.type = 'number';
            minCount.min = "1";
            minCount.value = "1";
            let maxCount = document.createElement('input');
            maxCount.className = 'wui-input sky-object-right';
            maxCount.type = 'number';
            maxCount.min = "1";
            maxCount.value = "1";
            container.appendChild(count);
            containerLine.appendChild(swap);
            containerLine.appendChild(container);
            this._element = containerLine;
            this._value = count;
            this._container = container;
            this._minValue = minCount;
            this._maxValue = maxCount;
        }
        get Element() {
            return this._element;
        }
        get Value() {
            return Number(this._value.value);
        }
        set Value(value) {
            this._value.value = value.toString();
        }
        get MinValue() {
            return Number(this._minValue.value);
        }
        set MinValue(value) {
            this._minValue.value = value.toString();
        }
        get MaxValue() {
            return Number(this._maxValue.value);
        }
        set MaxValue(value) {
            this._maxValue.value = value.toString();
        }
        get RandomValue() {
            return this._randomValue;
        }
        set RandomValue(value) {
            if (this._randomValue != value) {
                this._randomValue = value;
                if (value) {
                    this._container.removeChild(this._value);
                    this._container.appendChild(this._minValue);
                    this._container.appendChild(this._maxValue);
                }
                else {
                    this._container.removeChild(this._minValue);
                    this._container.removeChild(this._maxValue);
                    this._container.appendChild(this._value);
                }
            }
        }
    }
    AwardValueControl.ValueProperty = "Value";
    AwardValueControl.MinValueProperty = "MinValue";
    AwardValueControl.MaxValueProperty = "MaxValue";
    class PropertyAwardControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateLine() {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = "sky-content sky-object-line";
            let left = document.createElement('div');
            left.className = 'sky-object-line sky-object-left';
            let members = super.Metadata['_members'];
            let property = Sky.Create(super.Context, members[PropertyAwardControl.PropertyNameProperty], PropertyAwardControl.PropertyNameProperty, this);
            $(property.Element).addClass('sky-object-left');
            let changeType = Sky.Create(super.Context, members[PropertyAwardControl.PropertyChangeTypeProperty], PropertyAwardControl.PropertyChangeTypeProperty, this);
            $(changeType.Element).addClass('sky-object-right');
            let value = new AwardValueControl();
            $(value.Element).addClass('sky-object-right');
            left.appendChild(property.Element);
            left.appendChild(changeType.Element);
            div.appendChild(left);
            div.appendChild(value.Element);
            line.appendChild(span);
            line.appendChild(div);
            this._property = property;
            this._changeType = changeType;
            this._value = value;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            let control = Sky.Create(super.Context, members[PropertyAwardControl.ConditionsProperty], PropertyAwardControl.ConditionsProperty, this);
            let conditions = new ContentControl(PropertyAwardControl.ConditionsProperty, control);
            conditions.Initialize();
            body.appendChild(this.CreateLine());
            body.appendChild(conditions.Element);
            this._element = layout;
            this._conditions = conditions;
        }
        SetValue(value) {
            if (value == null) {
                this._conditions.SetValue(null);
                this._value.RandomValue = false;
                this._value.Value = 0;
            }
            else {
                this._property.SetValue(value[PropertyAwardControl.PropertyNameProperty]);
                this._changeType.SetValue(value[PropertyAwardControl.PropertyChangeTypeProperty]);
                if (value[AwardValueControl.MinValueProperty] && value[AwardValueControl.MinValueProperty] > 0) {
                    this._value.RandomValue = true;
                    this._value.MinValue = value[AwardValueControl.MinValueProperty];
                    this._value.MaxValue = value[AwardValueControl.MaxValueProperty];
                }
                else {
                    this._value.Value = value[AwardValueControl.ValueProperty];
                }
                if (value.hasOwnProperty(PropertyAwardControl.ConditionsProperty)) {
                    this._conditions.SetValue(value[PropertyAwardControl.ConditionsProperty]);
                }
            }
        }
        GetValue() {
            let json = {};
            json[PropertyAwardControl.PropertyNameProperty] = this._property.GetValue();
            json[PropertyAwardControl.PropertyChangeTypeProperty] = this._changeType.GetValue();
            if (this._value.RandomValue) {
                json[AwardValueControl.MinValueProperty] = this._value.MinValue;
                json[AwardValueControl.MaxValueProperty] = this._value.MaxValue;
            }
            else {
                json[AwardValueControl.ValueProperty] = this._value.Value;
            }
            json[PropertyAwardControl.ConditionsProperty] = this._conditions.GetValue();
            return json;
        }
        ExpandAll() {
            super.ExpandAll();
            this._property.ExpandAll();
            this._changeType.ExpandAll();
            this._conditions.ExpandAll();
        }
        CollapseAll() {
            super.CollapseAll();
            this._property.CollapseAll();
            this._changeType.CollapseAll();
            this._conditions.CollapseAll();
        }
    }
    PropertyAwardControl.PropertyNameProperty = "PropertyName";
    PropertyAwardControl.PropertyChangeTypeProperty = "PropertyChangeType";
    PropertyAwardControl.ConditionsProperty = 'Conditions';
    class VirtualCurrencyAwardControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateLine(members) {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = "sky-content sky-object-line";
            let search = Sky.Create(super.Context, members[VirtualCurrencyAwardControl.TypeProperty], VirtualCurrencyAwardControl.TypeProperty, this);
            $(search.Element).addClass('sky-object-left');
            let value = document.createElement('input');
            value.className = 'wui-input sky-object-right';
            div.appendChild(search.Element);
            div.appendChild(value);
            line.appendChild(span);
            line.appendChild(div);
            this._search = search;
            this._value = value;
            this._element = div;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            let control = Sky.Create(super.Context, members[VirtualCurrencyAwardControl.ConditionsProperty], VirtualCurrencyAwardControl.ConditionsProperty, this);
            let conditions = new ContentControl(VirtualCurrencyAwardControl.ConditionsProperty, control);
            conditions.Initialize();
            body.appendChild(this.CreateLine(members));
            body.appendChild(conditions.Element);
            this._element = layout;
            this._conditions = conditions;
        }
        SetValue(value) {
            if (value == null) {
                this._conditions.SetValue(null);
                this._search.Type = this._search.GetDefaultValue();
                this._value.value = '0';
            }
            else {
                this._search.SetValue(value[VirtualCurrencyAwardControl.TypeProperty]);
                this._value.value = value[VirtualCurrencyAwardControl.ValueProperty];
                if (value.hasOwnProperty(VirtualCurrencyAwardControl.ConditionsProperty)) {
                    this._conditions.SetValue(value[VirtualCurrencyAwardControl.ConditionsProperty]);
                }
            }
        }
        GetValue() {
            let json = {};
            json[VirtualCurrencyAwardControl.TypeProperty] = this._search.GetValue();
            json[VirtualCurrencyAwardControl.ValueProperty] = Number(this._value.value);
            json[VirtualCurrencyAwardControl.ConditionsProperty] = this._conditions.GetValue();
            return json;
        }
        ExpandAll() {
            super.ExpandAll();
            this._search.ExpandAll();
            this._conditions.ExpandAll();
        }
        CollapseAll() {
            super.CollapseAll();
            this._search.CollapseAll();
            this._conditions.CollapseAll();
        }
    }
    VirtualCurrencyAwardControl.TypeProperty = "Type";
    VirtualCurrencyAwardControl.ValueProperty = "Value";
    VirtualCurrencyAwardControl.ConditionsProperty = 'Conditions';
    class VirtualObjectAwardControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateLine(members) {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = 'sky-object-line sky-content';
            let search = Sky.Create(super.Context, members[VirtualObjectAwardControl.TypeProperty], VirtualObjectAwardControl.TypeProperty, this);
            let count = new AwardCountControl();
            div.appendChild(search.Element);
            div.appendChild(count.Element);
            line.appendChild(span);
            line.appendChild(div);
            this._search = search;
            this._count = count;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            body.appendChild(this.CreateLine(members));
            this._element = layout;
        }
        SetValue(value) {
            if (value == null) {
                this._search.Type = 0;
                this._count.RandomCount = false;
                this._count.Count = 0;
            }
            else {
                this._search.Type = value.Type;
                if (value[AwardCountControl.MinCountProperty] && value[AwardCountControl.MinCountProperty] > 0) {
                    this._count.RandomCount = true;
                    this._count.MinCount = value[AwardCountControl.MinCountProperty];
                    this._count.MaxCount = value[AwardCountControl.MaxCountProperty];
                }
                else {
                    this._count.Count = value.Count;
                }
            }
        }
        GetValue() {
            let json = {
                Type: this._search.Type,
            };
            if (this._count.RandomCount) {
                json[AwardCountControl.MinCountProperty] = this._count.MinCount;
                json[AwardCountControl.MaxCountProperty] = this._count.MaxCount;
            }
            else {
                json[AwardCountControl.CountProperty] = this._count.Count;
            }
            return json;
        }
    }
    VirtualObjectAwardControl.TypeProperty = 'Type';
    class AutoPrimaryControl extends NumberControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        Initialize() {
            super.Initialize();
            super.Input.readOnly = true;
            super.Input.value = (++AutoPrimaryControl._max).toString();
        }
        SetValue(value) {
        }
    }
    AutoPrimaryControl._max = 0;
    class TextareaControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._textaea;
        }
        get Textaea() {
            return this._textaea;
        }
        Initialize() {
            let element = document.createElement('textarea');
            element.className = 'wui-textarea';
            element.readOnly = this.IsReadOnly;
            element.spellcheck = false; //拼写检查
            if (super.Tooltip != null) {
                element.placeholder = super.Tooltip;
            }
            this._textaea = element;
            this.SetValue(this.GetDefaultValue());
        }
        GetDefaultValue() {
            if (!this.HasDefaultValue) {
                return "";
            }
            return super.GetDefaultValue();
        }
        SetValue(value) {
            this._textaea.value = value;
        }
        GetValue() {
            return this._textaea.value;
        }
    }
    class Condition extends FrameworkElement {
    }
    Condition.ValueProperty = 'Value';
    Condition.ReduceProperty = 'Reduce';
    class ObjectConditionControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateSearchLine(members) {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = 'sky-content sky-object-line';
            let search = Sky.Create(super.Context, members[ObjectConditionControl.TypeProperty], ObjectConditionControl.TypeProperty, this);
            $(search.Element).addClass('sky-object-left');
            let value = document.createElement('input');
            value.className = 'wui-input sky-object-right';
            value.type = 'number';
            value.value = '0';
            div.appendChild(search.Element);
            div.appendChild(value);
            line.appendChild(span);
            line.appendChild(div);
            this._search = search;
            this._value = value;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            let control = Sky.Create(super.Context, members[ObjectConditionControl.ReduceProperty], ObjectConditionControl.ReduceProperty, this);
            let reduce = new ContentControl(ObjectConditionControl.ReduceProperty, control);
            reduce.Initialize();
            body.appendChild(reduce.Element);
            body.appendChild(this.CreateSearchLine(members));
            this._element = layout;
            this._reduce = reduce;
        }
        GetDefaultValue() {
            if (super.HasDefaultValue) {
                return super.GetDefaultValue();
            }
            return null;
        }
        SetValue(value) {
            if (value != null) {
                this._search.Type = value.Type;
                this._value.value = value.Value;
                if (value.hasOwnProperty(ObjectConditionControl.ReduceProperty)) {
                    this._reduce.SetValue(value[ObjectConditionControl.ReduceProperty]);
                }
            }
        }
        GetValue() {
            let json = {
                Type: this._search.Type,
                Value: Number(this._value.value),
            };
            json[ObjectConditionControl.ReduceProperty] = this._reduce.GetValue();
            return json;
        }
        ExpandAll() {
            super.ExpandAll();
            this._reduce.ExpandAll();
        }
        CollapseAll() {
            super.CollapseAll();
            this._reduce.CollapseAll();
        }
    }
    ObjectConditionControl.TypeProperty = 'Type';
    ObjectConditionControl.ValueProperty = 'Value';
    ObjectConditionControl.ReduceProperty = 'Reduce';
    class PropertyConditionControl extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateLine() {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = "sky-property-line sky-content";
            let members = super.Metadata['_members'];
            let property = Sky.Create(super.Context, members[PropertyConditionControl.PropertyNameProperty], PropertyConditionControl.PropertyNameProperty, this);
            property.Element.className += ' sky-property-input-property';
            let changeType = Sky.Create(super.Context, members[PropertyConditionControl.CompareTypeProperty], PropertyConditionControl.CompareTypeProperty, this);
            changeType.Element.className += ' sky-property-condition-input-change';
            let count = Sky.Create(super.Context, members[PropertyConditionControl.ValueProperty], PropertyConditionControl.ValueProperty, this);
            count.Element.className += ' sky-property-input-count';
            div.appendChild(property.Element);
            div.appendChild(changeType.Element);
            div.appendChild(count.Element);
            line.appendChild(span);
            line.appendChild(div);
            this._property = property;
            this._compareType = changeType;
            this._value = count;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            let control = Sky.Create(super.Context, members[PropertyConditionControl.ReduceProperty], PropertyConditionControl.ReduceProperty, this);
            let reduce = new ContentControl(PropertyConditionControl.ReduceProperty, control);
            reduce.Initialize();
            body.appendChild(reduce.Element);
            body.appendChild(this.CreateLine());
            this._element = layout;
            this._reduce = reduce;
        }
        SetValue(value) {
            if (value == null) {
                this._reduce.SetValue(false);
            }
            else {
                this._property.SetValue(value[PropertyConditionControl.PropertyNameProperty]);
                this._compareType.SetValue(value[PropertyConditionControl.CompareTypeProperty]);
                this._value.SetValue(value[PropertyConditionControl.ValueProperty]);
                this._reduce.SetValue(value[PropertyConditionControl.ReduceProperty]);
            }
        }
        GetValue() {
            let json = {};
            json[PropertyConditionControl.PropertyNameProperty] = this._property.GetValue();
            json[PropertyConditionControl.CompareTypeProperty] = this._compareType.GetValue();
            json[PropertyConditionControl.ValueProperty] = this._value.GetValue();
            json[PropertyConditionControl.ReduceProperty] = this._reduce.GetValue();
            return json;
        }
        ExpandAll() {
            super.ExpandAll();
            this._property.ExpandAll();
            this._compareType.ExpandAll();
            this._value.ExpandAll();
            this._reduce.ExpandAll();
        }
        CollapseAll() {
            super.CollapseAll();
            this._property.CollapseAll();
            this._compareType.CollapseAll();
            this._value.CollapseAll();
            this._reduce.CollapseAll();
        }
    }
    PropertyConditionControl.PropertyNameProperty = "PropertyName";
    PropertyConditionControl.CompareTypeProperty = "CompareType";
    PropertyConditionControl.ValueProperty = "Value";
    PropertyConditionControl.ReduceProperty = 'Reduce';
    class VirtualCurrencyCondition extends FrameworkElement {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
        }
        get Element() {
            return this._element;
        }
        CreateSearchLine(members) {
            let line = document.createElement('div');
            line.className = 'sky-block';
            let span = document.createElement('span');
            span.className = 'sky-span';
            span.innerHTML = '类型与数量:';
            let div = document.createElement('div');
            div.className = 'sky-object-line sky-content';
            let search = Sky.Create(super.Context, members[VirtualCurrencyCondition.TypeProperty], VirtualCurrencyCondition.TypeProperty, this);
            $(search.Element).addClass('sky-object-left');
            let value = document.createElement('input');
            value.className = 'wui-input sky-object-right';
            value.type = 'number';
            value.value = '0';
            div.appendChild(search.Element);
            div.appendChild(value);
            line.appendChild(span);
            line.appendChild(div);
            this._search = search;
            this._value = value;
            return line;
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-type-panel";
            let head = document.createElement('div');
            head.className = 'sky-panel-head';
            head.style.background = '#fbfbfb';
            let body = document.createElement('div');
            body.className = "sky-panel-body";
            let span = document.createElement('span');
            span.style.fontSize = '15px';
            span.style.fontWeight = 'bold';
            span.innerHTML = this.Display;
            head.appendChild(span);
            layout.appendChild(head);
            layout.appendChild(body);
            let members = super.Metadata['_members'];
            let control = Sky.Create(super.Context, members[VirtualCurrencyCondition.ReduceProperty], VirtualCurrencyCondition.ReduceProperty, this);
            let reduce = new ContentControl(VirtualCurrencyCondition.ReduceProperty, control);
            reduce.Initialize();
            body.appendChild(reduce.Element);
            body.appendChild(this.CreateSearchLine(members));
            this._element = layout;
            this._reduce = reduce;
        }
        GetDefaultValue() {
            if (super.HasDefaultValue) {
                return super.GetDefaultValue();
            }
            return null;
        }
        SetValue(value) {
            if (value != null) {
                this._search.Type = value.Type;
                this._value.value = value.Value;
                if (value.hasOwnProperty(VirtualCurrencyCondition.ReduceProperty)) {
                    this._reduce.SetValue(value[VirtualCurrencyCondition.ReduceProperty]);
                }
            }
        }
        GetValue() {
            let json = {
                Type: this._search.Type,
                Value: Number(this._value.value),
            };
            json[VirtualCurrencyCondition.ReduceProperty] = this._reduce.GetValue();
            return json;
        }
        ExpandAll() {
            super.ExpandAll();
            this._reduce.ExpandAll();
        }
        CollapseAll() {
            super.CollapseAll();
            this._reduce.CollapseAll();
        }
    }
    VirtualCurrencyCondition.TypeProperty = 'Type';
    VirtualCurrencyCondition.ValueProperty = 'Value';
    VirtualCurrencyCondition.ReduceProperty = 'Reduce';
    class DynamicObjectArrayControl extends ItemsControl {
        constructor(context, metadata, name = null, parent = null) {
            super(context, metadata, name, parent);
            if (!metadata.hasOwnProperty("_selector"))
                throw new Error("not found key: _selector, object:" + JSON.stringify(metadata));
            let selector = metadata["_selector"];
            this._selector = new Array();
            let subclass;
            for (let key in selector) {
                subclass = new Subclass(selector[key]);
                this._selector.push(subclass);
            }
        }
        get Element() {
            return this._element;
        }
        get Active() {
            return !(this._body != null && this._body.style.display == "none");
        }
        get IsExpanded() {
            return super.IsExpanded;
        }
        set IsExpanded(value) {
            super.IsExpanded = value;
            if (value) {
                this._btnToggleAnchor.className = "fa-chevron-down";
                if (this._body != null && this._body.style.display == "none") {
                    this._body.style.display = "block";
                }
            }
            else {
                this._btnToggleAnchor.className = "fa-chevron-up";
                if (this._body != null) {
                    this._body.style.display = "none";
                }
            }
        }
        findSubclass(name) {
            let subclass;
            for (let i = 0; i < this._selector.length; i++) {
                subclass = this._selector[i];
                if (subclass.name == name) {
                    return subclass;
                }
            }
            return null;
        }
        CreateBody() {
            let body = document.createElement('div');
            body.className = "sky-dynamic-array-panel-body";
            return body;
        }
        OnAppend(element) {
            if (this._body == null) {
                this._body = this.CreateBody();
                this._element.appendChild(this._body);
                this._btnToggleSpan.style.display = '';
            }
            this._body.appendChild(element);
        }
        OnRemoved(element) {
            this._body.removeChild(element);
            if (this._body.children.length == 0) {
                this._element.removeChild(this._body);
                this._body = null;
                this._btnToggleSpan.style.display = 'none';
            }
        }
        Initialize() {
            let layout = document.createElement('div');
            layout.className = "sky-panel sky-dynamic-array-panel";
            let head = document.createElement('div');
            head.className = 'sky-dynamic-array-panel-head';
            //head.style.height = '25px';
            /* margin-left: 0px;
            margin-right: 5px;
            width: 200px;
            display: inline-block;
            height: 25px;
            vertical-align: middle;
             */
            let select = document.createElement('select');
            select.className = 'wui-select';
            select.style.marginRight = '5px';
            select.style.width = '200px';
            select.style.display = 'inline-block';
            select.style.height = '25px';
            select.style.verticalAlign = 'middle';
            for (let i = 0; i < this._selector.length; i++) {
                let selector = this._selector[i];
                let option = document.createElement('option');
                option.innerHTML = selector.display;
                option.value = selector.name;
                select.options.add(option);
            }
            let btnCreate = document.createElement('input');
            btnCreate.className = StyleManager.GetButtonStyle(ButtonType.Info);
            btnCreate.type = "button";
            btnCreate.value = '创建';
            btnCreate.onclick = (ev) => {
                let name = select.value;
                let subclass = this.findSubclass(name);
                let content = Sky.Create(super.Context, subclass.metadata, subclass.name, this);
                content.DataSet["name"] = name;
                let item = new ItemControl(content);
                item.Initialize();
                this.AppendChild(item);
                return true;
            };
            let btnClear = document.createElement('input');
            btnClear.className = StyleManager.GetButtonStyle(ButtonType.Danger);
            btnClear.type = "button";
            btnClear.value = "清空";
            btnClear.onclick = (ev) => {
                //if (!confirm("Confirm clear?")) {
                //    return false;
                //}
                this.Clear();
                return true;
            };
            head.appendChild(select);
            head.appendChild(btnCreate);
            head.appendChild(btnClear);
            let btnToggleSpan = document.createElement('span');
            btnToggleSpan.className = "fa-chevron";
            btnToggleSpan.style.display = 'none';
            let btnToggleAnchor = document.createElement('a');
            btnToggleAnchor.className = "fa-chevron-down";
            btnToggleAnchor.onclick = (ev) => {
                this.IsExpanded = !this.IsExpanded;
            };
            btnToggleSpan.appendChild(btnToggleAnchor);
            head.appendChild(btnToggleSpan);
            layout.appendChild(head);
            this._element = layout;
            this._head = head;
            this._btnToggleSpan = btnToggleSpan;
            this._btnToggleAnchor = btnToggleAnchor;
        }
        SetValue(value) {
            this.Clear();
            if (value != null) {
                let array = value;
                for (let i = 0; i < array.length; i++) {
                    let arrayItem = array[i];
                    if (!arrayItem.hasOwnProperty("ClassName"))
                        throw new Error("not found key: ClassName");
                    let subclass = this.findSubclass(arrayItem["ClassName"]);
                    let control = Sky.Create(super.Context, subclass.metadata, subclass.name, this);
                    control.DataSet['name'] = subclass.name;
                    let item = new ItemControl(control);
                    item.Initialize();
                    item.SetValue(arrayItem);
                    this.AppendChild(item);
                }
            }
        }
        GetValue() {
            let array = new Array();
            for (let i = 0; i < this.Children.length; i++) {
                let control = this.Children[i];
                let value = control.GetValue();
                value["ClassName"] = control.Content.DataSet['name'];
                array.push(value);
            }
            return array;
        }
        clone() {
            let obj = super.clone();
            obj._childrenMetadata = this._childrenMetadata;
            return obj;
        }
    }
    class EditorContext extends FrameworkContext {
    }
    class ReadOnlyContext extends FrameworkContext {
    }
    class Sky {
        constructor(element, metadata, context) {
            if (element == null)
                throw new ArgumentNullException('element');
            if (metadata == null)
                throw new ArgumentNullException('metadata');
            if (context == null)
                throw new ArgumentNullException('context');
            this._element = element;
            this._metadata = metadata;
            this._name = metadata["_name"];
            this._children = Sky.Creates(context, metadata["_members"]);
            if (metadata.hasOwnProperty("_groups")) {
                let arrayForGroupInfo = new Array();
                arrayForGroupInfo.push(new GroupInfo(null, 100000000, "其它"));
                for (let gmdata of metadata["_groups"]) {
                    arrayForGroupInfo.push(GroupInfo.Parse(gmdata));
                }
                arrayForGroupInfo = arrayForGroupInfo.sort((a, b) => a.Order - b.Order);
                let arrayForGroup = new Array();
                let find = (name) => {
                    for (let group of arrayForGroup) {
                        if (group.Name == name) {
                            return group;
                        }
                    }
                    return null;
                };
                let group;
                for (let groupInfo of arrayForGroupInfo) {
                    group = new GroupControl(groupInfo);
                    group.Initialize();
                    this._element.appendChild(group.Element);
                    arrayForGroup.push(group);
                }
                for (let element of this._children) {
                    group = find(element.Group);
                    if (group != null) {
                        group.Add(element);
                    }
                    else {
                        this._element.appendChild(element.Element);
                    }
                }
            }
            else {
                let element;
                for (let i = 0; i < this._children.length; i++) {
                    element = this._children[i];
                    this._element.appendChild(element.Element);
                }
            }
            if (metadata.hasOwnProperty("_data")) {
                let value = metadata["_data"];
                this.SetValue(value);
            }
        }
        get Element() {
            return this._element;
        }
        get Name() {
            return this._name;
        }
        static Create(context, metadata, name = null, parent = null) {
            if (metadata === null)
                throw new Error("argument null exception: metadata");
            if (!metadata.hasOwnProperty("_type"))
                throw new Error("not found key: _type, object: " + JSON.stringify(metadata));
            let control;
            let type = metadata["_type"];
            switch (type) {
                case "Boolean":
                    control = new BooleanControl(context, metadata, name, parent);
                    break;
                case "Byte":
                case "SByte":
                case "Int16":
                case "UInt16":
                case "Int32":
                case "UInt32":
                case "Int64":
                case "UInt64":
                case "Single":
                case "Double":
                    control = new NumberControl(context, metadata, name, parent);
                    break;
                case "String":
                    control = new StringControl(context, metadata, name, parent);
                    break;
                case "Array":
                    control = metadata.hasOwnProperty("_selector")
                        ? new DynamicArrayControl(context, metadata, name, parent)
                        : new ArrayControl(context, metadata, name, parent);
                    break;
                case "Enum":
                    control = new EnumControl(context, metadata, name, parent);
                    break;
                case "TimeSpan":
                    control = new TimeSpanControl(context, metadata, name, parent);
                    break;
                case "DateTime":
                    control = new DateTimeControl(context, metadata, name, parent);
                    break;
                case "Class":
                    if (metadata.hasOwnProperty('_name')) {
                        let name = metadata['_name'];
                        switch (name) {
                            case 'ObjectAward':
                                control = new ObjectAwardControl(context, metadata, name, parent);
                                break;
                            case 'PropertyAward':
                                control = new PropertyAwardControl(context, metadata, name, parent);
                                break;
                            case 'VirtualCurrencyAward':
                                control = new VirtualCurrencyAwardControl(context, metadata, name, parent);
                                break;
                            case 'VirtualObjectAward':
                                control = new VirtualObjectAwardControl(context, metadata, name, parent);
                                break;
                            case 'ObjectCondition':
                                control = new ObjectConditionControl(context, metadata, name, parent);
                                break;
                            case 'PropertyCondition':
                                control = new PropertyConditionControl(context, metadata, name, parent);
                                break;
                            case 'VirtualCurrencyCondition':
                                control = new VirtualCurrencyCondition(context, metadata, name, parent);
                                break;
                        }
                    }
                    if (control == null) {
                        control = metadata.hasOwnProperty("_selector")
                            ? new DynamicClassControl(context, metadata, name, parent)
                            : new TypeControl(context, metadata, name, parent);
                    }
                    break;
                case "Expand":
                    control = new ExtendControl(context, metadata, name, parent);
                    break;
                case "AwardProperty":
                    control = new PropertyControl(1, context, metadata, name, parent);
                    break;
                case "ConditionProperty":
                    control = new PropertyControl(2, context, metadata, name, parent);
                    break;
                case "AutoPrimaryControl":
                    control = new AutoPrimaryControl(context, metadata, name, parent);
                    break;
                case "TextareaControl":
                    control = new TextareaControl(context, metadata, name, parent);
                    break;
                case 'EntitySearch':
                    control = new SearchControl(20001, InternalContext.EntitySearch, context, metadata, name, parent);
                    break;
                case 'VirtualCurrencySearch':
                    control = new SearchControl(1001, InternalContext.VirtualCurrencySearch, context, metadata, name, parent);
                    break;
                case 'VirtualObjectSearch':
                    control = new SearchControl(1001, InternalContext.VirtualObjectSearch, context, metadata, name, parent);
                    break;
                case 'SceneSearch':
                    control = new SearchControl(1001, InternalContext.SceneSearch, context, metadata, name, parent);
                    break;
                case 'ObjectArray':
                    control = new DynamicObjectArrayControl(context, metadata, name, parent);
                    break;
                default:
                    throw new Error("Unknown type:" + type);
            }
            control.Initialize();
            return control;
        }
        static Creates(context, metadata, parent = null) {
            if (metadata === null)
                throw new Error("argument null exception: metadata");
            let value;
            let control;
            let element;
            let array = new Array();
            for (let key in metadata) {
                value = metadata[key];
                element = Sky.Create(context, value, key, parent);
                control = new ContentControl(key, element);
                control.Initialize();
                array.push(control);
            }
            return array;
        }
        GetValue() {
            let obj = {};
            let element;
            for (let i = 0; i < this._children.length; i++) {
                element = this._children[i];
                if (element.Content instanceof ExtendControl) {
                    continue;
                }
                if (!element.IsReadOnly) {
                    obj[element.Name] = element.GetValue();
                }
            }
            return obj;
        }
        SetValue(value) {
            if (value != null) {
                let element, val;
                for (let i = 0; i < this._children.length; i++) {
                    element = this._children[i];
                    if (element.Content instanceof ExtendControl) {
                        continue;
                    }
                    if (value.hasOwnProperty(element.Name)) {
                        val = value[element.Name];
                    }
                    else {
                        val = element.GetDefaultValue();
                    }
                    element.SetValue(val);
                }
            }
        }
        ExpandAll() {
            for (let control of this._children) {
                control.ExpandAll();
            }
        }
        CollapseAll() {
            for (let control of this._children) {
                control.CollapseAll();
            }
        }
    }
    return {
        InternalContext: InternalContext,
        Sky: Sky,
        EditorContext: EditorContext,
        ReadOnlyContext: ReadOnlyContext,
    };
});
//# sourceMappingURL=ui-sky-tree.js.map