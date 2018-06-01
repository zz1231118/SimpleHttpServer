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
class DataView {

    constructor(key, valueFactory) {
        let table = document.getElementById(key);
        if (table == null)
            throw new Error('table not found. key:' + key);

        this._valueFactory = valueFactory;
        this._columns = new Array();
        this._primary = null;
        this._order = null;

        let head = table.getElementsByTagName('thead')[0];
        let body = table.getElementsByTagName('tbody')[0];
        let row = head.getElementsByTagName('tr')[0];
        let cells = row.getElementsByTagName('th');
        for (let cell of cells) {
            if (!cell.hasAttribute('property'))
                throw new Error('cell property not found!');

            let property = cell.getAttribute('property');
            let primary = cell.hasAttribute('primary') ? Boolean(cell.getAttribute('primary')) : false;
            let order = cell.hasAttribute('order') ? Boolean(cell.getAttribute('order')) : false;
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

            this._columns.push(column);
        }

        this._body = body;
    }

    get count() {
        let rows = this._body.getElementsByTagName('tr');
        return rows.length;
    }

    _refresh() {
        if (this._order != null) {
            let index = this._columns.indexOf(this._order);
            let rows = this._body.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                let cells = row.getElementsByTagName('td');
                let cell = cells[index];
                cell.innerHTML = i + 1;
            }
        }
    }
    _find(key) {
        if (this._primary != null) {
            let index = this._columns.indexOf(this._primary);
            let rows = this._body.getElementsByTagName('tr');
            for (let row of rows) {
                let cells = row.getElementsByTagName('td');
                let cell = cells[index];
                if (cell.innerHTML == key) {
                    return row;
                }
            }
        }
    }
    append(obj) {
        if (obj == null)
            throw new Error('argument null exception: obj');

        let row = document.createElement('tr');
        for (let column of this._columns) {
            let cell = document.createElement('td');
            if (column.order) {
                let rows = this._body.getElementsByTagName('tr');
                cell.innerHTML = rows.length + 1;
            } else {
                if (obj.hasOwnProperty(column.property)) {
                    cell.innerHTML = obj[column.property];
                } else if (this._valueFactory != null) {
                    let rows = this._body.getElementsByTagName('tr');
                    let result = this._valueFactory(column, obj, rows.length);
                    if (result != null) {
                        if (typeof(result) == 'string') {
                            cell.innerHTML = result;
                        } else if (result.constructor == Array) {
                            for (let element of result) {
                                cell.appendChild(element);
                            }
                        } else {
                            cell.appendChild(result);
                        }
                    }
                }
            }

            row.appendChild(cell);
        }

        this._body.appendChild(row);
    }
    update(obj) {
        if (obj == null)
            throw new Error('argument null exception: obj');
        if (this._primary == null)
            throw new Error('primary column not found!');
        if (!obj.hasOwnProperty(this._primary.property))
            throw new Error('primary property not found!');
        
        let key = obj[this._primary.property];
        let row = this._find(key);
        if (row != null) {
            let cells = row.getElementsByTagName('td');
            for (let i = 0; i < this._columns.length; i++) {
                let column = this._columns[i];
                if (!column.primary && !column.order) {
                    let cell = cells[i];
                    if (obj.hasOwnProperty(column.property)) {
                        cell.innerHTML = obj[column.property];
                    } else if (this._valueFactory != null) {
                        let rows = this._body.getElementsByTagName('tr');
                        let result = this._valueFactory(column, obj, rows.length);
                        if (result != null) {
                            if (typeof(result) == 'string') {
                                cell.innerHTML = result;
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
        }
    }
    remove(obj) {
        if (obj == null)
            throw new Error('argument null exception: obj');
        if (this._primary == null)
            throw new Error('primary column not found!');
        if (!obj.hasOwnProperty(this._primary.property))
            throw new Error('primary property not found!');

        let key = obj[this._primary.property];
        let row = this._find(key);
        if (row != null) {
            let parent = row.parentNode;
            parent.removeChild(row);

            this._refresh();
        }
    }
    removeAt(index) {
        if (index < 0) 
            throw new Error('argument of range exception: index');

        let rows = this._body.getElementsByTagName('tr');
        if (index < rows.length) {
            let row = rows[index];
            let parent = row.parentNode;
            parent.removeChild(row);

            this._refresh();
        }
    }
    clear() {
        this._body.innerHTML = '';
    }
    find(key) {
        if (this._primary == null)
            throw new Error('primary column not found!');

        let row = this._find(key);
        if (row != null) {
            let result = {};
            let cells = row.getElementsByTagName('td');
            for (let i = 0; i < this._columns.length; i++) {
                let column = this._columns[i];
                if (column.order)
                    continue;

                let cell = cells[i];
                result[column.property] = cell.innerHTML;
            }
            
            return result;
        }
    }
    filter(property, value) {
        if (property == null)
            throw new Error('argument null exception: property');
        if (value == null)
            throw new Error('argument null exception: value');

        let index = -1;
        for (let i = 0; i < this._columns.length; i++) {
            let column = this._columns[i];
            if (column.property == property) {
                index = i;
                break;
            }
        }

        let count = 0;
        let order = this._order != null ? this._columns.indexOf(this._order) : -1;
        let rows = this._body.getElementsByTagName('tr');
        for (let row of rows) {
            if (index >= 0) {
                let cells = row.getElementsByTagName('td');
                let cell = cells[index];
                if (cell.innerHTML.toLowerCase().indexOf(value.toLowerCase()) >= 0) {
                    row.style.display = '';
                    if (order >= 0) {
                        cell = cells[order];
                        cell.innerHTML = ++count;
                        continue;
                    }
                }
            }

            row.style.display = 'none';
        }
    }
}