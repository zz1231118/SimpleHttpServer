define((require) => {

    abstract class Comparer<T> implements system.collections.generic.IComparer<T> {
        public static default<T>(): Comparer<T> {
            return new DefaultComparer<T>();
        }

        public abstract comparer(x: T, y: T): number;
    }
    class DefaultComparer<T> extends Comparer<T> {
        private comparerCore(x: any, y: any): number {
            let xtype = typeof (x);
            let ytype = typeof (y);
            if (xtype !== ytype)
                throw new Error('argument type error!');

            if (xtype == 'boolean') {
                return (x === true ? 1 : 0) - (y === true ? 1 : 0);
            } else if (xtype == 'number') {
                return x - y;
            }

            throw new Error('invalid comparer type. x: ' + xtype + ' y: ' + ytype);
        }

        public comparer(x: T, y: T): number {
            return this.comparerCore(x, y);
        }
    }
    abstract class EqualityComparer<T> implements system.collections.generic.IEqualityComparer<T> {
        public static default<T>(): EqualityComparer<T> {
            return new DefaultEqualityComparer<T>();
        }

        public abstract equals(x: T, y: T): boolean;
    }
    class DefaultEqualityComparer<T> extends EqualityComparer<T> {
        private equalsCore(x: any, y: any): boolean {
            return x == y;
        }

        public equals(x: T, y: T): boolean {
            return this.equalsCore(x, y);
        }
    }

    class List<T> implements system.collections.generic.IList<T>, system.collections.generic.IReadOnlyList<T> {

        private _size: number = 0;
        private _version: number = 0;

        public constructor(collection: Iterable<T> = null) {
            if (collection != null) {
                for (let value of collection) {
                    this.add(value);
                }
            }
        }

        [index: number]: T;
        public get count(): number {
            return this._size;
        }

        public charAt(index: number): T {
            if (index < 0 || index >= this._size)
                throw 'argument out rangof exception: index';

            return this[index];
        }
        public add(value: T): void {
            this[this._size++] = value;
            this._version++;
        }
        public addRange(collection: Iterable<T>): void {
            if (collection == null)
                throw 'argument null exception: collection';

            for (let value of collection) {
                this.add(value);
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
        }
        public remove(value: T): boolean {
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
        public removeAt(index: number): void {
            if (index < 0 || index >= this._size)
                throw "argument out rangof exception: index";

            for (let i = index + 1; i < this._size; i++) {
                this[i - 1] = this[i];
            }

            delete this[--this._size];
            this._version++;
        }
        public removeAll(predicate: (value: T) => boolean): number {
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
        public removeRange(index: number, count: number): void {
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
        public contains(value: T): boolean {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    return true;
                }
            }
            return false;
        }
        public clear(): void {
            for (let i = 0; i < this._size; i++) {
                delete this[i];
            }
            this._size = 0;
            this._version++;
        }
        public indexOf(value: T): number {
            for (let i = 0; i < this._size; i++) {
                if (this[i] === value) {
                    return i;
                }
            }
            return -1;
        }
        public forEach(action: (value: T) => void): void {
            if (action == null)
                throw 'argument null exception: action';

            for (let i = 0; i < this._size; i++) {
                action(this[i]);
            }
        }
        public find(predicate: (value: T) => boolean): T {
            if (predicate == null)
                throw 'argument null exception: predicate';

            for (let i = 0; i < this._size; i++) {
                if (predicate(this[i])) {
                    return this[i];
                }
            }

            return null;
        }
        public findIndex(match: (value: T) => boolean): number {
            if (match == null)
                throw 'argument null exception: match';

            for (let i = 0; i < this._size; i++) {
                if (match(this[i])) {
                    return i;
                }
            }

            return -1;
        }

        [Symbol.iterator](): Iterator<T> {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator(): IterableIterator<T> {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== version)
                        throw 'invalid operation exception: version error.';

                    yield enumerable[i];
                }
            }

            return anotherGenerator();
        }
    }

    class KeyValuePair<TKey, TValue> {

        private _key: TKey;
        private _value: TValue;

        public constructor(key: TKey, value: TValue) {
            this._key = key;
            this._value = value;
        }

        public get key(): TKey {
            return this._key;
        }
        public get value(): TValue {
            return this._value;
        }
    }

    class DictionaryEntity<TKey, TValue> {

        private _key: TKey;
        private _value: TValue;

        public constructor(key: TKey, value: TValue) {
            this._key = key;
            this._value = value;
        }

        public get key(): TKey {
            return this._key;
        }
        public get value(): TValue {
            return this._value;
        }
        public set value(value: TValue) {
            this._value = value;
        }
    }
    class Dictionary<TKey, TValue> implements system.collections.generic.IDictionary<TKey, TValue>, system.collections.generic.IReadOnlyDictionary<TKey, TValue> {

        private _size: number = 0;
        private _version: number = 0;

        public constructor() {
        }

        public get count(): number {
            return this._size;
        }
        public get keys(): system.collections.generic.IReadOnlyCollection<TKey> {
            let keys = new List<TKey>();
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                keys.add(entity.key);
            }
            return keys;
        }
        public get values(): system.collections.generic.IReadOnlyCollection<TValue> {
            let values = new List<TValue>();
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                values.add(entity.value);
            }
            return values;
        }

        public add(key: TKey, value: TValue): void {
            if (this.containsKey(key))
                throw "repeating key: " + key;

            let entity = new DictionaryEntity<TKey, TValue>(key, value);
            this[this._size++] = entity;
            this._version++;
        }
        public remove(key: TKey): boolean {
            let entity: DictionaryEntity<TKey, TValue>;
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
        public update(key: TKey, value: TValue): void {
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    entity.value = value;
                    return;
                }
            }

            throw 'specify that the key does not exist.';
        }
        public addOrUpdate(key: TKey, value: TValue): void {
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    entity.value = value;
                    return;
                }
            }

            this.add(key, value);
        }
        public tryGetValue(key: TKey): TValue {
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    return entity.value;
                }
            }
        }
        public containsKey(key: TKey): boolean {
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    return true;
                }
            }
            return false;
        }
        public containsValue(value: TValue): boolean {
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.value === value) {
                    return true;
                }
            }
            return false;
        }
        public get(key: TKey): TValue {
            let entity: DictionaryEntity<TKey, TValue>;
            for (let i = 0; i < this._size; i++) {
                entity = this[i];
                if (entity.key === key) {
                    return entity.value;
                }
            }

            throw 'specify that the key does not exist.';
        }
        public clear(): void {
            for (let i = 0; i < this._size; i++) {
                delete this[i];
            }

            this._size = 0;
            this._version++;
        }

        [Symbol.iterator](): Iterator<KeyValuePair<TKey, TValue>> {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator(): IterableIterator<KeyValuePair<TKey, TValue>> {
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