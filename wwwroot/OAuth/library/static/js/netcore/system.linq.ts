define((require) => {

    let system = require('./system');
    let generic = require('./system.collections.generic');
    let ArgumentNullException: system.ArgumentNullExceptionConstructor = system.ArgumentNullException;
    let ArgumentOutOfRangeException: system.ArgumentOutOfRangeExceptionConstructor = system.ArgumentOutOfRangeException;
    let InvalidOperationException: system.InvalidOperationExceptionConstructor = system.InvalidOperationException;
    let Comparer: system.collections.generic.ComparerConstructor = generic.Comparer;
    let EqualityComparer: system.collections.generic.EqualityComparerConstructor = generic.EqualityComparer;

    class Buffer<T> {
        public items: Array<T>;
        public count: number;

        public constructor(source: Iterable<T>) {
            this.items = new Array();
            for (let element of source) {
                this.items.push(element);
            }

            this.count = this.items.length;
        }

        public toArray(): Array<T> {
            let array = new Array<T>();
            for (let element of this.items) {
                array.push(element);
            }

            return array;
        }
    }
    class IdentityFunction {
        public static instance<T>(): (element: T) => T {
            return (p) => p;
        }
    }

    abstract class EnumerableSorter<TElement> {
        public abstract computeKeys1(elements: Array<TElement>, count: number): void;
        public abstract computeKeys2(index1: number, index2: number): number;
        public sort(elements: Array<TElement>, count: number): Array<number> {
            this.computeKeys1(elements, count);
            let map = new Array<number>(count);
            for (let i = 0; i < count; i++)
                map[i] = i;

            this.quickSort(map, 0, count - 1);
            return map;
        }
        private quickSort(map: Array<number>, left: number, right: number): void {
            do {
                let i = left;
                let j = right;
                let x = map[i + ((j - i) >> 1)];
                do {
                    while (i < map.length && this.computeKeys2(x, map[i]) > 0) i++;
                    while (j >= 0 && this.computeKeys2(x, map[j]) < 0) j--;
                    if (i > j)
                        break;
                    if (i < j) {
                        let temp = map[i];
                        map[i] = map[j];
                        map[j] = temp;
                    }
                    i++;
                    j--;
                } while (i <= j);
                if (j - left <= right - i) {
                    if (left < j)
                        this.quickSort(map, left, j);

                    left = i;
                } else {
                    if (i < right)
                        this.quickSort(map, i, right);

                    right = j;
                }
            } while (left < right);
        }
    }
    class EnumerableKeySorter<TElement, TKey> extends EnumerableSorter<TElement> {
        public keySelector: (element: TElement) => TKey;
        public comparer: system.collections.generic.IComparer<TKey>;
        public descending: boolean;
        public next: EnumerableSorter<TElement>;
        public keys: Array<TKey>;

        public constructor(keySelector: (element: TElement) => TKey, comparer: system.collections.generic.IComparer<TKey>, descending: boolean, next: EnumerableSorter<TElement>) {
            super();
            this.keySelector = keySelector;
            this.comparer = comparer;
            this.descending = descending;
            this.next = next;
        }

        public computeKeys1(elements: Array<TElement>, count: number): void {
            this.keys = new Array(count);
            for (let i = 0; i < count; i++)
                this.keys[i] = this.keySelector(elements[i]);

            if (this.next != null)
                this.next.computeKeys1(elements, count);
        }
        public computeKeys2(index1: number, index2: number): number {
            let c = this.comparer.comparer(this.keys[index1], this.keys[index2]);
            if (c == 0) {
                return this.next == null
                    ? index1 - index2
                    : this.next.computeKeys2(index1, index2);
            }
            return this.descending ? -c : c;
        }
    }
    abstract class OrderedEnumerable<TElement> implements system.linq.IOrderedEnumerable<TElement> {
        public source: Iterable<TElement>;

        public abstract getEnumerableSorter(next: EnumerableSorter<TElement>): EnumerableSorter<TElement>;
        public createOrderedEnumerable<TKey>(keySelector: (element: TElement) => TKey, comparer: system.collections.generic.IComparer<TKey>, descending: boolean): system.linq.IOrderedEnumerable<TElement> {
            let result = new OrderedKeyEnumerable<TElement, TKey>(this.source, keySelector, comparer, descending);
            result.parent = this;
            return result;
        }

        [Symbol.iterator](): Iterator<TElement> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TElement> {
                let buffer = new Buffer<TElement>(self.source);
                if (buffer.count > 0) {
                    let sorter = self.getEnumerableSorter(null);
                    let map = sorter.sort(buffer.items, buffer.count);
                    sorter = null;
                    for (let i = 0; i < buffer.count; i++)
                        yield buffer.items[map[i]];
                }
            }
            return anotherGenerator();
        }
    }
    class OrderedKeyEnumerable<TElement, TKey> extends OrderedEnumerable<TElement> {
        public parent: OrderedEnumerable<TElement>;
        public keySelector: (element: TElement) => TKey;
        public comparer: system.collections.generic.IComparer<TKey>;
        public descending: boolean;

        public constructor(source: Iterable<TElement>, keySelector: (element: TElement) => TKey, comparer: system.collections.generic.IComparer<TKey>, descending: boolean) {
            if (source == null)
                throw new ArgumentNullException('source');
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            super();
            super.source = source;
            this.parent = null;
            this.keySelector = keySelector;
            this.comparer = comparer != null ? comparer : Comparer.default<TKey>();
            this.descending = descending;
        }

        public getEnumerableSorter(next: EnumerableSorter<TElement>): EnumerableSorter<TElement> {
            let sorter: EnumerableSorter<TElement> = new EnumerableKeySorter<TElement, TKey>(this.keySelector, this.comparer, this.descending, next);
            if (this.parent != null) {
                sorter = this.parent.getEnumerableSorter(sorter);
            }
            return sorter;
        }
    }

    class Grouping<TKey, TElement> implements system.linq.IGrouping<TKey, TElement> {
        private _key: TKey;
        private _array: Array<TElement>;

        public constructor(key: TKey) {
            this._key = key;
            this._array = new Array<TElement>();
        }

        public get key(): TKey {
            return this._key;
        }

        public add(element: TElement): void {
            this._array.push(element);
        }

        [Symbol.iterator](): Iterator<TElement> {
            return this._array[Symbol.iterator]();
        }
    }
    class Lookup<TKey, TElement> implements system.linq.ILookup<TKey, TElement>, Iterable<system.linq.IGrouping<TKey, TElement>> {
        private comparer: system.collections.generic.IEqualityComparer<TKey>;
        private groupings: Array<Grouping<TKey, TElement>>;
        private lastGrouping: Grouping<TKey, TElement>;

        public constructor(comparer: system.collections.generic.IEqualityComparer<TKey>) {
            this.comparer = comparer != null ? comparer : EqualityComparer.default<TKey>();
            this.groupings = new Array<Grouping<TKey, TElement>>(7);
        }

        public get count(): number {
            return this.groupings.length;
        }

        public static create<TSource, TKey, TElement>(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, elementSelector: (source: TSource) => TElement, comparer: system.collections.generic.IEqualityComparer<TKey>): Lookup<TKey, TElement> {
            let lookup = new Lookup<TKey, TElement>(comparer);
            for (let element of source) {
                lookup.getGrouping(keySelector(element), true).add(elementSelector(element));
            }
            return lookup;
        }
        public getGrouping(key: TKey, create: boolean): Grouping<TKey, TElement> {
            for (let grouping of this.groupings) {
                if (this.comparer.equals(grouping.key, key)) {
                    return grouping;
                }
            }
            if (create) {
                let grouping = new Grouping<TKey, TElement>(key);
                this.groupings.push(grouping);
                this.lastGrouping = grouping;
                return grouping;
            }

            return null;
        }
        public contains(key: TKey): boolean {
            for (let grouping of this.groupings) {
                if (this.comparer.equals(grouping.key, key)) {
                    return true;
                }
            }

            return false;
        }

        [Symbol.iterator](): Iterator<system.linq.IGrouping<TKey, TElement>> {
            return this.groupings[Symbol.iterator]();
        }
    }
    class GroupedKeyEnumerable<TSource, TKey, TElement> implements Iterable<system.linq.IGrouping<TKey, TElement>> {
        private source: Iterable<TSource>;
        private keySelector: (source: TSource) => TKey;
        private elementSelector: (source: TSource) => TElement;
        private comparer: system.collections.generic.IEqualityComparer<TKey>;

        public constructor(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, elementSelector: (source: TSource) => TElement, comparer: system.collections.generic.IEqualityComparer<TKey>) {
            this.source = source;
            this.keySelector = keySelector;
            this.elementSelector = elementSelector;
            this.comparer = comparer;
        }

        [Symbol.iterator](): Iterator<system.linq.IGrouping<TKey, TElement>> {
            return Lookup.create(this.source, this.keySelector, this.elementSelector, this.comparer)[Symbol.iterator]();
        }
    }

    class WhereEnumerableIterable<TSource> implements Iterable<TSource> {
        private source: Iterable<TSource>;
        private predicate: (source: TSource) => boolean;

        public constructor(source: Iterable<TSource>, predicate: (source: TSource) => boolean) {
            this.source = source;
            this.predicate = predicate;
        }

        [Symbol.iterator](): Iterator<TSource> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TSource> {
                for (let element of self.source) {
                    if (self.predicate(element)) {
                        yield element;
                    }
                }
            }
            return anotherGenerator();
        }
    }
    class WhereSelectEnumerableIterable<TSource, TResult> implements Iterable<TResult> {
        private source: Iterable<TSource>;
        private selector: (source: TSource) => TResult;

        public constructor(source: Iterable<TSource>, selector: (source: TSource) => TResult) {
            this.source = source;
            this.selector = selector;
        }

        [Symbol.iterator](): Iterator<TResult> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TResult> {
                for (let element of self.source) {
                    yield self.selector(element);
                }
            }
            return anotherGenerator();
        }
    }
    class WhereConcatEnumerableIterable<TSource> implements Iterable<TSource> {
        private first: Iterable<TSource>;
        private second: Iterable<TSource>;

        public constructor(first: Iterable<TSource>, second: Iterable<TSource>) {
            this.first = first;
            this.second = second;
        }

        [Symbol.iterator](): Iterator<TSource> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TSource> {
                for (let element of self.first) {
                    yield element;
                }
                for (let element of self.second) {
                    yield element;
                }
            }
            return anotherGenerator();
        }
    }
    class WhereTakeEnumerableIterable<TSource> implements Iterable<TSource> {
        private source: Iterable<TSource>;
        private count: number;

        public constructor(source: Iterable<TSource>, count: number) {
            this.source = source;
            this.count = count;
        }

        [Symbol.iterator](): Iterator<TSource> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TSource> {
                if (self.count > 0) {
                    for (let element of self.source) {
                        yield element;
                        if (--self.count == 0)
                            break;
                    }
                }
            }
            return anotherGenerator();
        }
    }
    class WhereSkipEnumerableIterable<TSource> implements Iterable<TSource> {
        private source: Iterable<TSource>;
        private count: number;

        public constructor(source: Iterable<TSource>, count: number) {
            this.source = source;
            this.count = count;
        }

        [Symbol.iterator](): Iterator<TSource> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TSource> {
                let e = self.source[Symbol.iterator]();
                while (self.count > 0 && e.next().done) self.count--;
                if (self.count <= 0) {
                    let r: IteratorResult<TSource>;
                    while ((r = e.next()).done) {
                        yield r.value;
                    }
                }
            }
            return anotherGenerator();
        }
    }
    class WhereRangeEnumerableIterable<TSource> implements Iterable<TSource> {
        private source: Iterable<TSource>;
        private index: number;
        private count: number;

        public constructor(source: Iterable<TSource>, index: number, count: number) {
            this.source = source;
            this.index = index;
            this.count = count;
        }

        [Symbol.iterator](): Iterator<TSource> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TSource> {
                if (self.count > 0) {
                    let e = self.source[Symbol.iterator]();
                    while (self.index > 0 && e.next().done) self.index--;
                    if (self.index <= 0) {
                        let r: IteratorResult<TSource>;
                        while ((r = e.next()).done) {
                            yield r.value;
                            if (--self.count == 0) {
                                break;
                            }
                        }
                    }
                }
            }
            return anotherGenerator();
        }
    }

    class LinqEnumerable<TSource> implements Iterable<TSource> {
        private source: Iterable<TSource>;

        public constructor(source: Iterable<TSource>) {
            this.source = source;
        }

        public orderBy<TKey>(keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IComparer<TKey> = null): OrderedLineEnumerable<TSource> {
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            return new OrderedLineEnumerable<TSource>(new OrderedKeyEnumerable<TSource, TKey>(this.source, keySelector, comparer, false));
        }
        public orderByDescending<TKey>(keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IComparer<TKey> = null): OrderedLineEnumerable<TSource> {
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            return new OrderedLineEnumerable<TSource>(new OrderedKeyEnumerable<TSource, TKey>(this.source, keySelector, comparer, true));
        }
        public groupBy<TKey>(keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IEqualityComparer<TKey> = null): LinqEnumerable<system.linq.IGrouping<TKey, TSource>> {
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            return new LinqEnumerable(new GroupedKeyEnumerable<TSource, TKey, TSource>(this.source, keySelector, IdentityFunction.instance<TSource>(), comparer));
        }
        public select<TResult>(selector: (source: TSource) => TResult): LinqEnumerable<TResult> {
            return new LinqEnumerable<TResult>(new WhereSelectEnumerableIterable(this.source, selector));
        }
        public where(predicate: (source: TSource) => boolean): LinqEnumerable<TSource> {
            if (predicate == null)
                throw new ArgumentNullException('predicate');

            return new LinqEnumerable<TSource>(new WhereEnumerableIterable(this.source, predicate));
        }
        public concat(second: Iterable<TSource>): LinqEnumerable<TSource> {
            if (second == null)
                throw new ArgumentNullException('second');

            return new LinqEnumerable<TSource>(new WhereConcatEnumerableIterable<TSource>(this.source, second));
        }
        public take(count: number): LinqEnumerable<TSource> {
            return new LinqEnumerable<TSource>(new WhereTakeEnumerableIterable(this.source, count));
        }
        public skip(count: number): LinqEnumerable<TSource> {
            return new LinqEnumerable<TSource>(new WhereSkipEnumerableIterable(this.source, count));
        }
        public range(index: number, count: number): LinqEnumerable<TSource> {
            if (index < 0)
                throw new ArgumentOutOfRangeException('index');
            if (count < 0)
                throw new ArgumentOutOfRangeException('count');

            return new LinqEnumerable<TSource>(new WhereRangeEnumerableIterable(this.source, index, count));
        }
        public toArray(): Array<TSource> {
            return Enumerable.toArray(this.source);
        }
        public forEach(action: (source: TSource) => void): void {
            return Enumerable.forEach(this.source, action);
        }
        public count(predicate: (source: TSource) => boolean = null): number {
            return Enumerable.count(this.source, predicate);
        }
        public any(predicate: (source: TSource) => boolean = null): boolean {
            return Enumerable.any(this.source, predicate);
        }
        public all(predicate: (source: TSource) => boolean): boolean {
            return Enumerable.all(this.source, predicate);
        }
        public first(predicate: (source: TSource) => boolean = null): TSource {
            return Enumerable.first(this.source, predicate);
        }
        public firstOrDefault(predicate: (source: TSource) => boolean = null): TSource {
            return Enumerable.firstOrDefault(this.source, predicate);
        }
        public last(predicate: (source: TSource) => boolean = null): TSource {
            return Enumerable.last(this.source, predicate);
        }
        public lastOrDefault(predicate: (source: TSource) => boolean = null): TSource {
            return Enumerable.lastOrDefault(this.source, predicate);
        }
        public single(predicate: (source: TSource) => boolean = null): TSource {
            return Enumerable.single(this.source, predicate);
        }
        public singleOrDefault(predicate: (source: TSource) => boolean = null): TSource {
            return Enumerable.singleOrDefault(this.source, predicate);
        }
        public elementAt(index: number): TSource {
            return Enumerable.elementAt(this.source, index);
        }
        public elementAtOrDefault(index: number): TSource {
            return Enumerable.elementAtOrDefault(this.source, index);
        }
        public contains(value: TSource, comparer: system.collections.generic.IEqualityComparer<TSource> = null): boolean {
            return Enumerable.contains(this.source, value, comparer);
        }
        public sum(selector: (source: TSource) => number): number {
            return Enumerable.sum(this.source, selector);
        }
        public max(selector: (source: TSource) => number): number {
            return Enumerable.max(this.source, selector);
        }
        public min(selector: (source: TSource) => number): number {
            return Enumerable.min(this.source, selector);
        }
        public average(selector: (source: TSource) => number): number {
            return Enumerable.average(this.source, selector);
        }

        [Symbol.iterator](): Iterator<TSource> {
            return this.source[Symbol.iterator]();
        }
    }
    class OrderedLineEnumerable<TSource> extends LinqEnumerable<TSource> {
        private orderedSource: system.linq.IOrderedEnumerable<TSource>;

        public constructor(source: system.linq.IOrderedEnumerable<TSource>) {
            super(source);
            this.orderedSource = source;
        }

        public thenBy<TKey>(keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IComparer<TKey> = null): OrderedLineEnumerable<TSource> {
            return new OrderedLineEnumerable<TSource>(this.orderedSource.createOrderedEnumerable<TKey>(keySelector, comparer, false));
        }
        public thenByDescending<TKey>(keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IComparer<TKey> = null): OrderedLineEnumerable<TSource> {
            return new OrderedLineEnumerable<TSource>(this.orderedSource.createOrderedEnumerable<TKey>(keySelector, comparer, true));
        }
    }
    class Enumerable {
        public static orderBy<TSource, TKey>(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IComparer<TKey> = null): OrderedLineEnumerable<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            return new OrderedLineEnumerable<TSource>(new OrderedKeyEnumerable<TSource, TKey>(source, keySelector, comparer, false));
        }
        public static orderByDescending<TSource, TKey>(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IComparer<TKey> = null): OrderedLineEnumerable<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            return new OrderedLineEnumerable<TSource>(new OrderedKeyEnumerable<TSource, TKey>(source, keySelector, comparer, true));
        }
        public static groupBy<TSource, TKey>(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, comparer: system.collections.generic.IEqualityComparer<TKey> = null): LinqEnumerable<system.linq.IGrouping<TKey, TSource>> {
            if (source == null)
                throw new ArgumentNullException('source');
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            return new LinqEnumerable(new GroupedKeyEnumerable<TSource, TKey, TSource>(source, keySelector, IdentityFunction.instance<TSource>(), comparer));
        }
        public static select<TSource, TResult>(source: Iterable<TSource>, selector: (source: TSource) => TResult): LinqEnumerable<TResult> {
            if (source == null)
                throw new ArgumentNullException('source');
            if (selector == null)
                throw new ArgumentNullException('selector');

            return new LinqEnumerable<TResult>(new WhereSelectEnumerableIterable(source, selector));
        }
        public static where<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean): LinqEnumerable<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');
            if (predicate == null)
                throw new ArgumentNullException('predicate');

            return new LinqEnumerable<TSource>(new WhereEnumerableIterable<TSource>(source, predicate));
        }
        public static concat<TSource>(first: Iterable<TSource>, second: Iterable<TSource>): LinqEnumerable<TSource> {
            if (first == null)
                throw new ArgumentNullException('first');
            if (second == null)
                throw new ArgumentNullException('second');

            return new LinqEnumerable<TSource>(new WhereConcatEnumerableIterable<TSource>(first, second));
        }
        public static take<TSource>(source: Iterable<TSource>, count: number): LinqEnumerable<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');

            return new LinqEnumerable<TSource>(new WhereTakeEnumerableIterable(source, count));
        }
        public static skip<TSource>(source: Iterable<TSource>, count: number): LinqEnumerable<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');

            return new LinqEnumerable<TSource>(new WhereSkipEnumerableIterable(source, count));
        }
        public static range<TSource>(source: Iterable<TSource>, index: number, count: number): LinqEnumerable<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');
            if (index < 0)
                throw new ArgumentOutOfRangeException('index');
            if (count < 0)
                throw new ArgumentOutOfRangeException('count');

            return new LinqEnumerable<TSource>(new WhereRangeEnumerableIterable(source, index, count));
        }
        public static toArray<TSource>(source: Iterable<TSource>): Array<TSource> {
            if (source == null)
                throw new ArgumentNullException('source');

            let array = new Array<TSource>();
            for (let element of source) {
                array.push(element);
            }

            return array;
        }
        public static forEach<TSource>(source: Iterable<TSource>, action: (source: TSource) => void): void {
            if (source == null)
                throw new ArgumentNullException('source');
            if (action == null)
                throw new ArgumentNullException('action');

            for (let element of source) {
                action(element);
            }
        }
        public static count<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): number {
            if (source == null)
                throw new ArgumentNullException('source');

            let count = 0;
            if (predicate == null) {
                for (let element of source) {
                    count++;
                }
            } else {
                for (let element of source) {
                    if (predicate(element)) {
                        count++;
                    }
                }
            }
            return count;
        }
        public static any<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): boolean {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                return e.next().done;
            } else {
                for (let element of source) {
                    if (predicate(element))
                        return true;
                }

                return false;
            }
        }
        public static all<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean): boolean {
            if (source == null)
                throw new ArgumentNullException('source');
            if (predicate == null)
                throw new ArgumentNullException('predicate');

            for (let element of source) {
                if (!predicate(element)) {
                    return false;
                }
            }

            return true;
        }
        public static first<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                let result = e.next();
                if (result.done) {
                    return result.value;
                }
            } else {
                for (let element of source) {
                    if (predicate(element)) {
                        return element;
                    }
                }
            }

            throw new InvalidOperationException('no match was found');
        }
        public static firstOrDefault<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                let result = e.next();
                if (result.done) {
                    return result.value;
                }
            } else {
                for (let element of source) {
                    if (predicate(element)) {
                        return element;
                    }
                }
            }
        }
        public static last<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                let result = e.next();
                if (result.done) {
                    let element: TSource;
                    do {
                        element = result.value;
                    } while ((result = e.next()).done);

                    return element;
                }
            } else {
                let found = false;
                let result: TSource;
                for (let element of source) {
                    if (predicate(element)) {
                        result = element;
                        found = true;
                    }
                }
                if (found) {
                    return result;
                }
            }

            throw new InvalidOperationException('no match was found');
        }
        public static lastOrDefault<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                let result = e.next();
                if (result.done) {
                    let element: TSource;
                    do {
                        element = result.value;
                    } while ((result = e.next()).done);

                    return element;
                }
            } else {
                let found = false;
                let result: TSource;
                for (let element of source) {
                    if (predicate(element)) {
                        result = element;
                        found = true;
                    }
                }
                if (found) {
                    return result;
                }
            }
        }
        public static single<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                let r = e.next();
                if (!r.done) {
                    throw new InvalidOperationException('not match');
                }

                let res = r.value;
                r = e.next();
                if (!r.done) {
                    return res;
                }
            } else {
                let count = 0;
                let result: TSource;
                for (let element of source) {
                    if (predicate(element)) {
                        count++;
                        result = element;
                        if (count > 1) {
                            break;
                        }
                    }
                }
                switch (count) {
                    case 0: throw new InvalidOperationException('not match');
                    case 1: return result;
                }
            }

            throw new InvalidOperationException('more than one element');
        }
        public static singleOrDefault<TSource>(source: Iterable<TSource>, predicate: (source: TSource) => boolean = null): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (predicate == null) {
                let e = source[Symbol.iterator]();
                let r = e.next();
                if (r.done) {
                    let res = r.value;
                    r = e.next();
                    if (!r.done) {
                        return res;
                    }
                }
            } else {
                let count = 0;
                let result: TSource;
                for (let element of source) {
                    if (predicate(element)) {
                        count++;
                        result = element;
                        if (count > 1) {
                            break;
                        }
                    }
                }
                if (count == 1) {
                    return result;
                }
            }
        }
        public static elementAt<TSource>(source: Iterable<TSource>, index: number): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (index > 0) {
                for (let element of source) {
                    if (index-- == 0) {
                        return element;
                    }
                }
            }

            throw new ArgumentOutOfRangeException('index');
        }
        public static elementAtOrDefault<TSource>(source: Iterable<TSource>, index: number): TSource {
            if (source == null)
                throw new ArgumentNullException('source');

            if (index > 0) {
                for (let element of source) {
                    if (index-- == 0) {
                        return element;
                    }
                }
            }
        }
        public static contains<TSource>(source: Iterable<TSource>, value: TSource, comparer: system.collections.generic.IEqualityComparer<TSource> = null): boolean {
            if (source == null)
                throw new ArgumentNullException('source');
            if (comparer == null)
                comparer = EqualityComparer.default<TSource>();

            for (let element of source) {
                if (comparer.equals(element, value)) {
                    return true;
                }
            }

            return false;
        }
        public static sum<TSource>(source: Iterable<TSource>, selector: (source: TSource) => number): number {
            if (source == null)
                throw new ArgumentNullException('source');
            if (selector == null)
                throw new ArgumentNullException('selector');

            let sum = 0;
            for (let value of source) {
                sum += selector(value);
            }
            return sum;
        }
        public static max<TSource>(source: Iterable<TSource>, selector: (source: TSource) => number): number {
            if (source == null)
                throw new ArgumentNullException('source');
            if (selector == null)
                throw new ArgumentNullException('selector');

            let count = 0, value, result;
            for (let element of source) {
                count++;
                result = selector(element);
                if (count == 0 || result > value) {
                    value = result;
                }
            }
            if (count === 0) {
                throw new InvalidOperationException('no element');
            }

            return value;
        }
        public static min<TSource>(source: Iterable<TSource>, selector: (source: TSource) => number): number {
            if (source == null)
                throw new ArgumentNullException('source');
            if (selector == null)
                throw new ArgumentNullException('selector');

            let count = 0, value, result;
            for (let element of source) {
                count++;
                result = selector(element);
                if (count == 0 || result < value) {
                    value = result;
                }
            }
            if (count === 0) {
                throw new InvalidOperationException('no element');
            }

            return value;
        }
        public static average<TSource>(source: Iterable<TSource>, selector: (source: TSource) => number): number {
            if (source == null)
                throw new ArgumentNullException('source');
            if (selector == null)
                throw new ArgumentNullException('selector');

            let sum = 0;
            let count = 0;
            for (let element of source) {
                count++;
                sum += selector(element);
            }
            if (count === 0) {
                throw new InvalidOperationException('no element');
            }

            return sum / count;
        }
    }

    return {
        Enumerable: Enumerable,
    };
});