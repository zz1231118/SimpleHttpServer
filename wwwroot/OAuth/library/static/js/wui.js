define((require) => {
    let system = require('./netcore/system');
    let linq = require('./netcore/system.linq');
    let generic = require('./netcore/system.collections.generic');
    let Type = system.Type;
    let EventArgs = system.Event;
    let KeyEventArgs = system.KeyEvent;
    let EventDispatcher = system.EventDispatcher;
    let Enumerable = linq.Enumerable;
    let List = generic.List;
    class UIElement extends EventDispatcher {
    }
    let select = document.createElement('select');
    select.options;
    class SelectCombox extends UIElement {
        constructor(obj) {
            if (obj == null)
                throw new Error('argument null exception: obj');
            if (!obj.hasOwnProperty('id'))
                throw new Error('argument exception: id not found!');
            if (!obj.hasOwnProperty('options'))
                throw new Error('argument exception: options not found!');
            super();
            let body = Type.isString(obj.id) ? document.getElementById(obj.id) : obj.id;
            if (body == null)
                throw new Error('element: ' + obj.id + ' not found!');
            if (!body.classList.contains('wui-combo-box-input')) {
                body.classList.add('wui-combo-box-input');
            }
            body.innerHTML = '';
            let container = document.createElement('div');
            container.className = 'wui-combo-box-input-container';
            let select = document.createElement('select');
            select.onchange = p => this.doChanged();
            let input = document.createElement('input');
            input.type = 'text';
            input.oninput = p => this.doChanged();
            input.onkeydown = e => {
                super.dispatchEvent(new KeyEventArgs(SelectCombox.KeyDown, e.key, e.keyCode, e.repeat, e.altKey, e.ctrlKey, e.metaKey, e.shiftKey));
            };
            input.onkeypress = e => {
                super.dispatchEvent(new KeyEventArgs(SelectCombox.KeyPress, e.key, e.keyCode, e.repeat, e.altKey, e.ctrlKey, e.metaKey, e.shiftKey));
            };
            input.onkeyup = e => {
                super.dispatchEvent(new KeyEventArgs(SelectCombox.KeyUp, e.key, e.keyCode, e.repeat, e.altKey, e.ctrlKey, e.metaKey, e.shiftKey));
            };
            for (let op of obj.options) {
                let option = document.createElement('option');
                option.value = op.value;
                option.innerHTML = op.key;
                select.appendChild(option);
            }
            container.appendChild(select);
            container.appendChild(input);
            body.appendChild(container);
            this._select = select;
            this._input = input;
            if (obj.hasOwnProperty(SelectCombox.Changed)) {
                super.addEventListener(SelectCombox.Changed, obj.change);
            }
            if (obj.hasOwnProperty(SelectCombox.KeyDown)) {
                super.addEventListener(SelectCombox.KeyDown, obj.keyDown);
            }
            if (obj.hasOwnProperty(SelectCombox.KeyUp)) {
                super.addEventListener(SelectCombox.KeyDown, obj.keyUp);
            }
            if (obj.hasOwnProperty(SelectCombox.KeyPress)) {
                super.addEventListener(SelectCombox.KeyDown, obj.keyPress);
            }
            if (obj.hasOwnProperty('key')) {
                this.key = obj.key;
            }
            if (obj.hasOwnProperty('value')) {
                this.value = obj.value;
            }
        }
        get key() {
            let index = this._select.selectedIndex;
            let option = this._select.options[index];
            return option.value;
        }
        set key(value) {
            let index = -1;
            let options = this._select.options;
            for (let i = 0; i < options.length; i++) {
                let option = options[i];
                if (option.value == value) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                this._select.selectedIndex = index;
                this.doChanged();
            }
        }
        get value() {
            return this._input.value;
        }
        set value(value) {
            this._input.value = value;
            this.doChanged();
        }
        doChanged() {
            super.dispatchEventWith(SelectCombox.Changed);
        }
    }
    SelectCombox.Changed = "change";
    SelectCombox.KeyDown = 'keyDown';
    SelectCombox.KeyPress = 'keyPress';
    SelectCombox.KeyUp = 'keyUp';
    class Column {
        constructor(property, primary, order) {
            this._property = property;
            this._primary = primary;
            this._order = order;
        }
        get property() {
            return this._property;
        }
        get primary() {
            return this._primary;
        }
        get order() {
            return this._order;
        }
    }
    class Row {
        constructor(view, value) {
            if (view == null)
                throw new Error('argument null exception: view');
            this._view = view;
            this._value = value;
            this._element = document.createElement('tr');
            this._disabled = false;
        }
        get element() {
            return this._element;
        }
        get disabled() {
            return this._disabled;
        }
        set disabled(value) {
            this._disabled = value;
            this._element.style.display = value ? 'none' : '';
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value;
        }
        cell(index, value = null) {
            if (index < 0 || index >= this._view.columns.count)
                throw new Error('argument out of range exception: index');
            let cells = this._element.getElementsByTagName('td');
            if (arguments.length == 1) {
                return cells[index].innerHTML;
            }
            else {
                cells[index].innerHTML = value;
            }
        }
        update(value) {
            for (let name in value) {
                this._value[name] = value[name];
            }
        }
    }
    let DataViewChangedType;
    (function (DataViewChangedType) {
        DataViewChangedType[DataViewChangedType["Add"] = 0] = "Add";
        DataViewChangedType[DataViewChangedType["Update"] = 1] = "Update";
        DataViewChangedType[DataViewChangedType["Remove"] = 2] = "Remove";
    })(DataViewChangedType || (DataViewChangedType = {}));
    class DataViewItemChangedEventArgs extends EventArgs {
        constructor(type, changedType, row, value) {
            super(type, value);
            this._changedType = changedType;
            this._row = row;
            this._value = value;
        }
        get changedType() {
            return this._changedType;
        }
        get row() {
            return this._row;
        }
        get value() {
            return this._value;
        }
    }
    class DataView extends UIElement {
        constructor(key, valueFactory, updateFactory) {
            if (key == null)
                throw new Error('argument null exception: key');
            let table = Type.isString(key) ? document.getElementById(key) : key;
            if (table == null)
                throw new Error('argument exception: key');
            super();
            this._valueFactory = valueFactory;
            this._updateFactory = updateFactory;
            this._columns = new List();
            this._rows = new List();
            let head = table.getElementsByTagName('thead')[0];
            let body = table.getElementsByTagName('tbody')[0];
            let tr = head.getElementsByTagName('tr')[0];
            let ths = tr.getElementsByTagName('th');
            for (let th of ths) {
                if (!th.hasAttribute('property'))
                    throw new Error('cell property not found!');
                let property = th.getAttribute('property');
                let primary = th.hasAttribute('primary') ? Boolean(th.getAttribute('primary')) : false;
                let order = th.hasAttribute('order') ? Boolean(th.getAttribute('order')) : false;
                let column = new Column(property, primary, order);
                if (primary) {
                    if (this._primary != null)
                        throw new Error('column primary repetition!');
                    this._primary = column;
                }
                if (order) {
                    if (this._order != null)
                        throw new Error('column order repetition!');
                    this._order = column;
                }
                this._columns.add(column);
            }
            this._body = body;
            this.showEmpty();
        }
        get columns() {
            return this._columns;
        }
        get rows() {
            return this._rows;
        }
        get values() {
            let array = new List();
            for (let row of this._rows) {
                array.add(row.value);
            }
            return array;
        }
        get count() {
            return Enumerable.count(this._rows, p => !p.disabled);
        }
        refresh() {
            if (this._order != null) {
                let count = 0;
                let index = this._columns.indexOf(this._order);
                for (let row of this._rows) {
                    if (!row.disabled) {
                        row.cell(index, (++count).toString());
                    }
                }
            }
        }
        showEmpty() {
            let row = document.createElement('tr');
            let cell = document.createElement('td');
            cell.colSpan = this._columns.count;
            cell.innerHTML = '没有相关数据';
            cell.style.textAlign = 'center';
            cell.style.backgroundColor = '#fefefe';
            row.appendChild(cell);
            this._body.innerHTML = '';
            this._body.appendChild(row);
        }
        find(key) {
            if (this._primary != null) {
                let index = this._columns.indexOf(this._primary);
                for (let row of this._rows) {
                    if (row.cell(index) == key) {
                        return row;
                    }
                }
            }
        }
        append(value) {
            if (value == null)
                throw new Error('argument null exception: value');
            let row = new Row(this, value);
            let index = this.count;
            for (let column of this._columns) {
                let cell = document.createElement('td');
                if (column.order) {
                    cell.innerHTML = (index + 1).toString();
                }
                else {
                    if (value.hasOwnProperty(column.property)) {
                        cell.innerHTML = value[column.property];
                    }
                    else if (this._valueFactory != null) {
                        let result = this._valueFactory(cell, column, value, index);
                        if (result != null) {
                            if (typeof (result) == 'string' || typeof (result) == 'number' || typeof (result) == 'boolean') {
                                cell.innerHTML = result.toString();
                            }
                            else if (result.constructor == Array) {
                                cell.innerHTML = '';
                                for (let element of result) {
                                    cell.appendChild(element);
                                }
                            }
                            else {
                                cell.innerHTML = '';
                                cell.appendChild(result);
                            }
                        }
                    }
                }
                row.element.appendChild(cell);
            }
            if (this._rows.count == 0) {
                this._body.innerHTML = '';
            }
            this._body.appendChild(row.element);
            this._rows.add(row);
            this.dispatchEvent(new DataViewItemChangedEventArgs(DataView.ItemChanged, DataViewChangedType.Add, row, value));
        }
        update(value) {
            if (value == null)
                throw new Error('argument null exception: value');
            if (this._primary == null)
                throw new Error('primary column not found!');
            if (!value.hasOwnProperty(this._primary.property))
                throw new Error('primary property not found!');
            let index = -1;
            let row = null;
            let cells = null;
            let key = value[this._primary.property];
            let pIndex = this._columns.indexOf(this._primary);
            for (let frow of this._rows) {
                if (!frow.disabled) {
                    index++;
                    cells = frow.element.getElementsByTagName('td');
                    if (cells[pIndex].innerHTML == key) {
                        row = frow;
                        break;
                    }
                }
            }
            if (row != null) {
                let column;
                let cell;
                for (let i = 0; i < this._columns.count; i++) {
                    column = this._columns.charAt(i);
                    if (!column.primary && !column.order) {
                        if (value.hasOwnProperty(column.property)) {
                            cell = cells[i];
                            cell.innerHTML = value[column.property];
                        }
                        else if (this._updateFactory != null) {
                            cell = cells[i];
                            let result = this._updateFactory(cell, column, value, index);
                            if (result != null) {
                                if (typeof (result) == 'string' || typeof (result) == 'number' || typeof (result) == 'boolean') {
                                    cell.innerHTML = result.toString();
                                }
                                else if (result.constructor == Array) {
                                    cell.innerHTML = '';
                                    for (let element of result) {
                                        cell.appendChild(element);
                                    }
                                }
                                else {
                                    cell.innerHTML = '';
                                    cell.appendChild(result);
                                }
                            }
                        }
                    }
                }
                row.update(value);
                this.dispatchEvent(new DataViewItemChangedEventArgs(DataView.ItemChanged, DataViewChangedType.Update, row, value));
            }
        }
        remove(value) {
            if (value == null)
                throw new Error('argument null exception: obj');
            if (this._primary == null)
                throw new Error('primary column not found!');
            if (!value.hasOwnProperty(this._primary.property))
                throw new Error('primary property not found!');
            let key = value[this._primary.property];
            let row = this.find(key);
            if (row != null) {
                this._body.removeChild(row.element);
                this._rows.remove(row);
                this.dispatchEvent(new DataViewItemChangedEventArgs(DataView.ItemChanged, DataViewChangedType.Remove, row, value));
                this.refresh();
                if (this._rows.count == 0) {
                    this.showEmpty();
                }
                return true;
            }
            return false;
        }
        removeAt(index) {
            if (index < 0 || index >= this._rows.count)
                throw new Error('argument of range exception: index');
            let row = this._rows.charAt(index);
            this._body.removeChild(row.element);
            this._rows.removeAt(index);
            this.dispatchEvent(new DataViewItemChangedEventArgs(DataView.ItemChanged, DataViewChangedType.Update, row, row.value));
            this.refresh();
            if (this._rows.count == 0) {
                this.showEmpty();
            }
        }
        filter(property, value) {
            if (property == null)
                throw new Error('argument null exception: property');
            if (value == null)
                throw new Error('argument null exception: value');
            let count = 0;
            let index = this._columns.findIndex(p => p.property == property);
            let order = this._order != null ? this._columns.indexOf(this._order) : -1;
            for (let row of this._rows) {
                if (index >= 0) {
                    if (row.cell(index).toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                        row.disabled = false;
                        if (order >= 0) {
                            row.cell(order, (++count).toString());
                        }
                        continue;
                    }
                }
                row.disabled = true;
            }
        }
        filters(properties) {
            if (properties == null || properties.length == 0) {
                for (let row of this._rows) {
                    row.disabled = false;
                }
                this.refresh();
                return;
            }
            let count = 0;
            let order = this._order != null ? this._columns.indexOf(this._order) : -1;
            let indices = new Array();
            for (let property of properties) {
                let index = this._columns.findIndex(p => p.property == property.property);
                if (index < 0)
                    throw new Error('property:' + property.property + ' not found!');
                indices.push(index);
            }
            for (let row of this._rows) {
                let disabled = false;
                for (let i = 0; i < properties.length; i++) {
                    let property = properties[i];
                    let index = indices[i];
                    if (row.cell(index).toLowerCase().indexOf(property.value.toLowerCase()) < 0) {
                        disabled = true;
                        break;
                    }
                }
                row.disabled = disabled;
                if (!disabled && order >= 0) {
                    row.cell(order, (++count).toString());
                }
            }
        }
        clear() {
            let rows = new List();
            rows.addRange(this._rows);
            this._body.innerHTML = '';
            this._rows.clear();
            this.showEmpty();
            for (let row of rows) {
                this.dispatchEvent(new DataViewItemChangedEventArgs(DataView.ItemChanged, DataViewChangedType.Remove, row, row.value));
            }
        }
    }
    DataView.ItemChanged = 'ItemChanged';
    class HTMLSelectComboxOption extends HTMLElement {
        constructor() {
            super();
        }
        get value() {
            return this.getAttribute('value');
        }
        set value(value) {
            this.setAttribute('value', value);
        }
    }
    class HTMLSelectCombox extends HTMLElement {
        constructor() {
            super();
            let shadow = this.attachShadow({ mode: 'open' });
        }
    }
    class HTMLComboBox extends HTMLElement {
        constructor() {
            super();
        }
    }
    customElements.define('select-combox-option', HTMLSelectComboxOption);
    customElements.define('select-combox', HTMLSelectCombox);
    customElements.define('wui-combox', HTMLComboBox);
    return {
        SelectCombox: SelectCombox,
        DataViewChangedType: DataViewChangedType,
        DataView: DataView,
    };
});
//# sourceMappingURL=wui.js.map