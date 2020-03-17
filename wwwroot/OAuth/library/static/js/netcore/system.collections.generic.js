define((require) => {
    class Comparer {
        static default() {
            return new DefaultComparer();
        }
    }
    class DefaultComparer extends Comparer {
        comparerCore(x, y) {
            let xtype = typeof (x);
            let ytype = typeof (y);
            if (xtype !== ytype)
                throw new Error('argument type error!');
            if (xtype == 'boolean') {
                return (x === true ? 1 : 0) - (y === true ? 1 : 0);
            }
            else if (xtype == 'number') {
                return x - y;
            }
            throw new Error('invalid comparer type. x: ' + xtype + ' y: ' + ytype);
        }
        comparer(x, y) {
            return this.comparerCore(x, y);
        }
    }
    class EqualityComparer {
        static default() {
            return new DefaultEqualityComparer();
        }
    }
    class DefaultEqualityComparer extends EqualityComparer {
        equalsCore(x, y) {
            return x == y;
        }
        equals(x, y) {
            return this.equalsCore(x, y);
        }
    }
    class List {
        constructor(collection = null) {
            this._size = 0;
            this._version = 0;
            if (collection != null) {
                for (let value of collection) {
                    this.add(value);
                }
            }
        }
        get count() {
            return this._size;
        }
        charAt(index) {
            if (index < 0 || index >= this._size)
                throw 'argument out rangof exception: index';
            return this[index];
        }
        add(value) {
            this[this._size++] = value;
            this._version++;
        }
        addRange(collection) {
            if (collection == null)
                throw 'argument null exception: collection';
            for (let value of collection) {
                this.add(value);
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
        }
        remove(value) {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    for (let j = i + 1; j < this._size; j++) {
                        this[j - 1] = this[j];
                    }
                    delete this[--this._size];
                    this._version++;
                    return true;
                }
            }
            return false;
        }
        removeAt(index) {
            if (index < 0 || index >= this._size)
                throw "argument out rangof exception: index";
            for (let i = index + 1; i < this._size; i++) {
                this[i - 1] = this[i];
            }
            delete this[--this._size];
            this._version++;
        }
        removeAll(predicate) {
            if (predicate == null)
                throw 'argument null exception: predicate';
            let count = 0;
            for (let i = 0; i < this._size; i++) {
                if (predicate(this[i])) {
                    for (let j = i + 1; j < this._size; j++) {
                        this[j - 1] = this[j];
                    }
                    i--;
                    count++;
                    delete this[--this._size];
                }
            }
            this._version++;
            return count;
        }
        removeRange(index, count) {
            if (index < 0)
                throw "argument out rangof exception: index";
            if (count < 0 || this._size - index < count)
                throw "argument out rangof exception: count";
            if (count > 0) {
                this._size -= count;
                if (index < this._size) {
                    let length = this._size - index;
                    for (let i = 0; i < length; i++) {
                        this[index + i] = this[index + count + i];
                    }
                }
                for (let i = 0; i < count; i++) {
                    delete this[this._size + i];
                }
                this._version++;
            }
        }
        contains(value) {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    return true;
                }
            }
            return false;
        }
        clear() {
            for (let i = 0; i < this._size; i++) {
                delete this[i];
            }
            this._size = 0;
            this._version++;
        }
        indexOf(value) {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    return i;
                }
            }
            return -1;
        }
        forEach(action) {
            if (action == null)
                throw 'argument null exception: action';
            for (let i = 0; i < this._size; i++) {
                action(this[i]);
            }
        }
        find(predicate) {
            if (predicate == null)
                throw 'argument null exception: predicate';
            for (let i = 0; i < this._size; i++) {
                if (predicate(this[i])) {
                    return this[i];
                }
            }
            return null;
        }
        findIndex(match) {
            if (match == null)
                throw 'argument null exception: match';
            for (let i = 0; i < this._size; i++) {
                if (match(this[i])) {
                    return i;
                }
            }
            return -1;
        }
        [Symbol.iterator]() {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator() {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== version)
                        throw 'invalid operation exception: version error.';
                    yield enumerable[i];
                }
            }
            return anotherGenerator();
        }
    }
    class KeyValuePair {
        constructor(key, value) {
            this._key = key;
            this._value = value;
        }
        get key() {
            return this._key;
        }
        get value() {
            return this._value;
        }
    }
    class DictionaryEntity {
        constructor(key, value) {
            this._key = key;
            this._value = value;
        }
        get key() {
            return this._key;
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value;
        }
    }
    class Dictionary {
        constructor() {
            this._size = 0;
            this._version = 0;
        }
        get count() {
            return this._size;
        }
        get keys() {
            let keys = new List();
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                keys.add(entity.key);
            }
            return keys;
        }
        get values() {
            let values = new List();
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                values.add(entity.value);
            }
            return values;
        }
        add(key, value) {
            if (this.containsKey(key))
                throw "repeating key: " + key;
            let entity = new DictionaryEntity(key, value);
            this[this._size++] = entity;
            this._version++;
        }
        remove(key) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    for (let j = i + 1; j < this._size; j++) {
                        this[j - 1] = this[j];
                    }
                    delete this[--this._size];
                    return true;
                }
            }
            return false;
        }
        update(key, value) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    entity.value = value;
                    return;
                }
            }
            throw 'specify that the key does not exist.';
        }
        addOrUpdate(key, value) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    entity.value = value;
                    return;
                }
            }
            this.add(key, value);
        }
        tryGetValue(key) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    return entity.value;
                }
            }
        }
        containsKey(key) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    return true;
                }
            }
            return false;
        }
        containsValue(value) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.value === value) {
                    return true;
                }
            }
            return false;
        }
        get(key) {
            let entity;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    return entity.value;
                }
            }
            throw 'specify that the key does not exist.';
        }
        clear() {
            for (let i = 0; i < this._size; i++) {
                delete this[i];
            }
            this._size = 0;
            this._version++;
        }
        [Symbol.iterator]() {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator() {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== version)
                        throw 'invalid operation exception: version error.';
                    yield enumerable[i];
                }
            }
            return anotherGenerator();
        }
    }
    return {
        Comparer: Comparer,
        EqualityComparer: EqualityComparer,
        List: List,
        Dictionary: Dictionary,
    };
});
//# sourceMappingURL=system.collections.generic.js.map