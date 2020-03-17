define((require) => {
    let system = require('./netcore/system');
    let linq = require('./netcore/system.linq');
    let generic = require('./netcore/system.collections.generic');

    let Type: system.TypeConstructor = system.Type;
    let EventArgs: system.EventConstructor = system.Event;
    let KeyEventArgs: system.KeyEventConstructor = system.KeyEvent;
    let EventDispatcher: system.EventDispatcherConstructor = system.EventDispatcher;
    let Enumerable: system.linq.EnumerableConstructor = linq.Enumerable;
    let List: system.collections.generic.ListConstructor = generic.List;

    abstract class UIElement extends EventDispatcher {

    }

    let select = document.createElement('select');
    select.options
    interface ISelectComboxParam {
        readonly id: string | HTMLElement;
        readonly options: Array<system.collections.generic.KeyValuePair<string, string>>;
        readonly change: system.EventHandler;
        readonly keyDown: system.KeyEventHandler;
        readonly keyUp: system.KeyEventHandler;
        readonly keyPress: system.KeyEventHandler;
        readonly key: any;
        readonly value: any;
    }
    class SelectCombox extends UIElement {

        public static readonly Changed: string = "change";
        public static readonly KeyDown: string = 'keyDown';
        public static readonly KeyPress: string = 'keyPress';
        public static readonly KeyUp: string = 'keyUp';

        private _select: HTMLSelectElement;
        private _input: HTMLInputElement;

        public constructor(obj: ISelectComboxParam) {
            if (obj == null)
                throw new Error('argument null exception: obj');
            if (!obj.hasOwnProperty('id'))
                throw new Error('argument exception: id not found!');
            if (!obj.hasOwnProperty('options'))
                throw new Error('argument exception: options not found!');

            super();

            let body = Type.isString(obj.id) ? document.getElementById(<string>obj.id) : <HTMLElement>obj.id;
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

        public get key(): string {
            let index = this._select.selectedIndex;
            let option = this._select.options[index];
            return option.value;
        }
        public set key(value: string) {
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
        public get value(): string {
            return this._input.value;
        }
        public set value(value: string) {
            this._input.value = value;
            this.doChanged();
        }

        private doChanged(): void {
            super.dispatchEventWith(SelectCombox.Changed);
        }
    }

    class Column {

        private _property: string;
        private _primary: boolean;
        private _order: boolean;

        public constructor(property: string, primary: boolean, order: boolean) {
            this._property = property;
            this._primary = primary;
            this._order = order;
        }

        public get property(): string {
            return this._property;
        }
        public get primary(): boolean {
            return this._primary;
        }
        public get order(): boolean {
            return this._order;
        }
    }
    class Row<T> {

        private _view: DataView<T>;
        private _element: HTMLTableRowElement;
        private _disabled: boolean;
        private _value: T;

        public constructor(view: DataView<T>, value: T) {
            if (view == null)
                throw new Error('argument null exception: view');

            this._view = view;
            this._value = value;
            this._element = document.createElement('tr');
            this._disabled = false;
        }

        public get element(): HTMLTableRowElement {
            return this._element;
        }
        public get disabled(): boolean {
            return this._disabled;
        }
        public set disabled(value: boolean) {
            this._disabled = value;
            this._element.style.display = value ? 'none' : '';
        }
        public get value(): T {
            return this._value;
        }
        public set value(value: T) {
            this._value = value;
        }

        public cell(index: number, value: string = null): string {
            if (index < 0 || index >= this._view.columns.count)
                throw new Error('argument out of range exception: index');

            let cells = this._element.getElementsByTagName('td');
            if (arguments.length == 1) {
                return cells[index].innerHTML;
            } else {
                cells[index].innerHTML = value;
            }
        }
        public update(value: T): void {
            for (let name in value) {
                this._value[name] = value[name];
            }
        }
    }
    interface IProperty {
        readonly property: string;
        readonly value: any;
    }

    enum DataViewChangedType {
        Add,
        Update,
        Remove,
    }
    class DataViewItemChangedEventArgs<T> extends EventArgs {

        private _changedType: DataViewChangedType;
        private _row: Row<T>;
        private _value: T;

        public constructor(type: string, changedType: DataViewChangedType, row: Row<T>, value: T) {
            super(type, value);
            this._changedType = changedType;
            this._row = row;
            this._value = value;
        }

        public get changedType(): DataViewChangedType {
            return this._changedType;
        }
        public get row(): Row<T> {
            return this._row;
        }
        public get value(): T {
            return this._value;
        }
    }
    class DataView<T> extends UIElement {

        public static readonly ItemChanged: string = 'ItemChanged';

        private _columns: system.collections.generic.List<Column>;
        private _rows: system.collections.generic.List<Row<T>>;
        private _valueFactory: (cell: HTMLTableCellElement, column: Column, obj: T, index: number) => any;
        private _updateFactory: (cell: HTMLTableCellElement, column: Column, obj: T, index: number) => any;
        private _primary: Column;
        private _order: Column;
        private _body: HTMLTableSectionElement;

        public constructor(key: string | HTMLTableElement, valueFactory: (cell: HTMLTableCellElement, column: Column, obj: T, index: number) => any, updateFactory: (cell: HTMLTableCellElement, column: Column, obj: T, index: number) => any) {
            if (key == null)
                throw new Error('argument null exception: key');

            let table = Type.isString(key) ? <HTMLTableElement>document.getElementById(<string>key) : <HTMLTableElement>key;
            if (table == null)
                throw new Error('argument exception: key');

            super();
            this._valueFactory = valueFactory;
            this._updateFactory = updateFactory;
            this._columns = new List<Column>();
            this._rows = new List<Row<T>>();

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

        public get columns(): system.collections.generic.IReadOnlyCollection<Column> {
            return this._columns;
        }
        public get rows(): system.collections.generic.IReadOnlyCollection<Row<T>> {
            return this._rows;
        }
        public get values(): system.collections.generic.IReadOnlyCollection<T> {
            let array = new List<T>();
            for (let row of this._rows) {
                array.add(row.value);
            }
            return array;
        }
        public get count(): number {
            return Enumerable.count(this._rows, p => !p.disabled);
        }

        private refresh(): void {
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
        private showEmpty(): void {
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

        public find(key: any): Row<T> {
            if (this._primary != null) {
                let index = this._columns.indexOf(this._primary);
                for (let row of this._rows) {
                    if (row.cell(index) == key) {
                        return row;
                    }
                }
            }
        }
        public append(value: T): void {
            if (value == null)
                throw new Error('argument null exception: value');

            let row = new Row<T>(this, value);
            let index = this.count;
            for (let column of this._columns) {
                let cell = document.createElement('td');
                if (column.order) {
                    cell.innerHTML = (index + 1).toString();
                } else {
                    if (value.hasOwnProperty(column.property)) {
                        cell.innerHTML = value[column.property];
                    } else if (this._valueFactory != null) {
                        let result = this._valueFactory(cell, column, value, index);
                        if (result != null) {
                            if (typeof (result) == 'string' || typeof (result) == 'number' || typeof (result) == 'boolean') {
                                cell.innerHTML = result.toString();
                            } else if (result.constructor == Array) {
                                cell.innerHTML = '';
                                for (let element of result) {
                                    cell.appendChild(element);
                                }
                            } else {
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
            this.dispatchEvent(new DataViewItemChangedEventArgs<T>(DataView.ItemChanged, DataViewChangedType.Add, row, value));
        }
        public update(value: T): void {
            if (value == null)
                throw new Error('argument null exception: value');
            if (this._primary == null)
                throw new Error('primary column not found!');
            if (!value.hasOwnProperty(this._primary.property))
                throw new Error('primary property not found!');

            let index = -1;
            let row: Row<T> = null;
            let cells: HTMLCollectionOf<HTMLTableDataCellElement> = null;
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
                let column: Column;
                let cell: HTMLTableDataCellElement;
                for (let i = 0; i < this._columns.count; i++) {
                    column = this._columns.charAt(i);
                    if (!column.primary && !column.order) {
                        if (value.hasOwnProperty(column.property)) {
                            cell = cells[i];
                            cell.innerHTML = value[column.property];
                        } else if (this._updateFactory != null) {
                            cell = cells[i];
                            let result = this._updateFactory(cell, column, value, index);
                            if (result != null) {
                                if (typeof (result) == 'string' || typeof (result) == 'number' || typeof (result) == 'boolean') {
                                    cell.innerHTML = result.toString();
                                } else if (result.constructor == Array) {
                                    cell.innerHTML = '';
                                    for (let element of result) {
                                        cell.appendChild(element);
                                    }
                                } else {
                                    cell.innerHTML = '';
                                    cell.appendChild(result);
                                }
                            }
                        }
                    }
                }

                row.update(value);
                this.dispatchEvent(new DataViewItemChangedEventArgs<T>(DataView.ItemChanged, DataViewChangedType.Update, row, value));
            }
        }
        public remove(value: T): boolean {
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
                this.dispatchEvent(new DataViewItemChangedEventArgs<T>(DataView.ItemChanged, DataViewChangedType.Remove, row, value));
                this.refresh();
                if (this._rows.count == 0) {
                    this.showEmpty();
                }
                return true;
            }

            return false;
        }
        public removeAt(index: number): void {
            if (index < 0 || index >= this._rows.count)
                throw new Error('argument of range exception: index');

            let row = this._rows.charAt(index);
            this._body.removeChild(row.element);

            this._rows.removeAt(index);
            this.dispatchEvent(new DataViewItemChangedEventArgs<T>(DataView.ItemChanged, DataViewChangedType.Update, row, row.value));
            this.refresh();
            if (this._rows.count == 0) {
                this.showEmpty();
            }
        }
        public filter(property: string, value: any): void {
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
        public filters(properties: Array<IProperty>): void {
            if (properties == null || properties.length == 0) {
                for (let row of this._rows) {
                    row.disabled = false;
                }

                this.refresh();
                return;
            }
            let count = 0;
            let order = this._order != null ? this._columns.indexOf(this._order) : -1;
            let indices = new Array<number>();
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
        public clear(): void {
            let rows = new List<Row<T>>();
            rows.addRange(this._rows);

            this._body.innerHTML = '';
            this._rows.clear();
            this.showEmpty();
            for (let row of rows) {
                this.dispatchEvent(new DataViewItemChangedEventArgs<T>(DataView.ItemChanged, DataViewChangedType.Remove, row, row.value));
            }
        }
    }

    interface ICheckBoxOptions {

    }
    class CheckBox extends UIElement {
        public constructor(options: ICheckBoxOptions) {
            super();
            
        }
    }

    class HTMLSelectComboxOption extends HTMLElement {
        public constructor() {
            super();
        }

        public get value(): string {
            return this.getAttribute('value');
        }
        public set value(value: string) {
            this.setAttribute('value', value);
        }
    }

    class HTMLSelectCombox extends HTMLElement {
        public constructor() {
            super();
            let shadow = this.attachShadow({ mode: 'open' });
        }
    }

    class HTMLComboBox extends HTMLElement {
        public constructor() {
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

        CheckBox: CheckBox,
    };
});