var Linq;
(function (Linq) {
    class Exception extends Error {
        constructor(message = null) {
            super(message);
        }
    }
    class ArgumentException extends Exception {
        constructor(message = null) {
            super(message);
        }
    }
    class ArgumentNullException extends ArgumentException {
        constructor(message = null) {
            super(message);
        }
    }
    class ArgumentOutOfRangeException extends ArgumentException {
        constructor(message = null) {
            super(message);
        }
    }
    class InvalidOperationException extends Exception {
        constructor(message = null) {
            super(message);
        }
    }
    class Comparer {
        static default() {
            return new DefaultComparer();
        }
    }
    class DefaultComparer extends Comparer {
        internalComparer(x, y) {
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
            return this.internalComparer(x, y);
        }
    }
    class EqualityComparer {
        static default() {
            return new DefaultEqualityComparer();
        }
    }
    class DefaultEqualityComparer extends EqualityComparer {
        internalEquals(x, y) {
            return x == y;
        }
        equals(x, y) {
            return this.internalEquals(x, y);
        }
    }
    class Buffer {
        constructor(source) {
            this.items = new Array();
            for (let element of source) {
                this.items.push(element);
            }
            this.count = this.items.length;
        }
        toArray() {
            let array = new Array();
            for (let element of this.items) {
                array.push(element);
            }
            return array;
        }
    }
    class IdentityFunction {
        static instance() {
            return (p) => p;
        }
    }
    class EnumerableSorter {
        sort(elements, count) {
            this.computeKeys1(elements, count);
            let map = new Array(count);
            for (let i = 0; i < count; i++)
                map[i] = i;
            this.quickSort(map, 0, count - 1);
            return map;
        }
        quickSort(map, left, right) {
            do {
                let i = left;
                let j = right;
                let x = map[i + ((j - i) >> 1)];
                do {
                    while (i < map.length && this.computeKeys2(x, map[i]) > 0)
                        i++;
                    while (j >= 0 && this.computeKeys2(x, map[j]) < 0)
                        j--;
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
                }
                else {
                    if (i < right)
                        this.quickSort(map, i, right);
                    right = j;
                }
            } while (left < right);
        }
    }
    class EnumerableKeySorter extends EnumerableSorter {
        constructor(keySelector, comparer, descending, next) {
            super();
            this.keySelector = keySelector;
            this.comparer = comparer;
            this.descending = descending;
            this.next = next;
        }
        computeKeys1(elements, count) {
            this.keys = new Array(count);
            for (let i = 0; i < count; i++)
                this.keys[i] = this.keySelector(elements[i]);
            if (this.next != null)
                this.next.computeKeys1(elements, count);
        }
        computeKeys2(index1, index2) {
            let c = this.comparer.comparer(this.keys[index1], this.keys[index2]);
            if (c == 0) {
                return this.next == null
                    ? index1 - index2
                    : this.next.computeKeys2(index1, index2);
            }
            return this.descending ? -c : c;
        }
    }
    class OrderedEnumerable {
        createOrderedEnumerable(keySelector, comparer, descending) {
            let result = new OrderedKeyEnumerable(this.source, keySelector, comparer, descending);
            result.parent = this;
            return result;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
                let buffer = new Buffer(self.source);
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
    class OrderedKeyEnumerable extends OrderedEnumerable {
        constructor(source, keySelector, comparer, descending) {
            if (source == null)
                throw new ArgumentNullException('source');
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');
            super();
            super.source = source;
            this.parent = null;
            this.keySelector = keySelector;
            this.comparer = comparer != null ? comparer : Comparer.default();
            this.descending = descending;
        }
        getEnumerableSorter(next) {
            let sorter = new EnumerableKeySorter(this.keySelector, this.comparer, this.descending, next);
            if (this.parent != null) {
                sorter = this.parent.getEnumerableSorter(sorter);
            }
            return sorter;
        }
    }
    class Grouping {
        constructor(key) {
            this._key = key;
            this._array = new Array();
        }
        get key() {
            return this._key;
        }
        add(element) {
            this._array.push(element);
        }
        [Symbol.iterator]() {
            return this._array[Symbol.iterator]();
        }
    }
    class Lookup {
        constructor(comparer) {
            this.comparer = comparer != null ? comparer : EqualityComparer.default();
            this.groupings = new Array(7);
        }
        get count() {
            return this.groupings.length;
        }
        static create(source, keySelector, elementSelector, comparer) {
            let lookup = new Lookup(comparer);
            for (let element of source) {
                lookup.getGrouping(keySelector(element), true).add(elementSelector(element));
            }
            return lookup;
        }
        getGrouping(key, create) {
            for (let grouping of this.groupings) {
                if (this.comparer.equals(grouping.key, key)) {
                    return grouping;
                }
            }
            if (create) {
                let grouping = new Grouping(key);
                this.groupings.push(grouping);
                this.lastGrouping = grouping;
                return grouping;
            }
            return null;
        }
        contains(key) {
            for (let grouping of this.groupings) {
                if (this.comparer.equals(grouping.key, key)) {
                    return true;
                }
            }
            return false;
        }
        [Symbol.iterator]() {
            return this.groupings[Symbol.iterator]();
        }
    }
    class GroupedKeyEnumerable {
        constructor(source, keySelector, elementSelector, comparer) {
            this.source = source;
            this.keySelector = keySelector;
            this.elementSelector = elementSelector;
            this.comparer = comparer;
        }
        [Symbol.iterator]() {
            return Lookup.create(this.source, this.keySelector, this.elementSelector, this.comparer)[Symbol.iterator]();
        }
    }
    class WhereEnumerableIterable {
        constructor(source, predicate) {
            this.source = source;
            this.predicate = predicate;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
                for (let element of self.source) {
                    if (self.predicate(element)) {
                        yield element;
                    }
                }
            }
            return anotherGenerator();
        }
    }
    class WhereSelectEnumerableIterable {
        constructor(source, selector) {
            this.source = source;
            this.selector = selector;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
                for (let element of self.source) {
                    yield self.selector(element);
                }
            }
            return anotherGenerator();
        }
    }
    class WhereConcatEnumerableIterable {
        constructor(first, second) {
            this.first = first;
            this.second = second;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
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
    class WhereTakeEnumerableIterable {
        constructor(source, count) {
            this.source = source;
            this.count = count;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
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
    class WhereSkipEnumerableIterable {
        constructor(source, count) {
            this.source = source;
            this.count = count;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
                let e = self.source[Symbol.iterator]();
                while (self.count > 0 && e.next().done)
                    self.count--;
                if (self.count <= 0) {
                    let r;
                    while ((r = e.next()).done) {
                        yield r.value;
                    }
                }
            }
            return anotherGenerator();
        }
    }
    class WhereRangeEnumerableIterable {
        constructor(source, index, count) {
            this.source = source;
            this.index = index;
            this.count = count;
        }
        [Symbol.iterator]() {
            let self = this;
            function* anotherGenerator() {
                if (self.count > 0) {
                    let e = self.source[Symbol.iterator]();
                    while (self.index > 0 && e.next().done)
                        self.index--;
                    if (self.index <= 0) {
                        let r;
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
    class LinqEnumerable {
        constructor(source) {
            this.source = source;
        }
        orderBy(keySelector, comparer = null) {
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');
            return new OrderedLineEnumerable(new OrderedKeyEnumerable(this.source, keySelector, comparer, false));
        }
        orderByDescending(keySelector, comparer = null) {
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');
            return new OrderedLineEnumerable(new OrderedKeyEnumerable(this.source, keySelector, comparer, true));
        }
        groupBy(keySelector, comparer = null) {
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');
            return new LinqEnumerable(new GroupedKeyEnumerable(this.source, keySelector, IdentityFunction.instance(), comparer));
        }
        select(selector) {
            return new LinqEnumerable(new WhereSelectEnumerableIterable(this.source, selector));
        }
        where(predicate) {
            if (predicate == null)
                throw new ArgumentNullException('predicate');
            return new LinqEnumerable(new WhereEnumerableIterable(this.source, predicate));
        }
        concat(second) {
            if (second == null)
                throw new ArgumentNullException('second');
            return new LinqEnumerable(new WhereConcatEnumerableIterable(this.source, second));
        }
        take(count) {
            return new LinqEnumerable(new WhereTakeEnumerableIterable(this.source, count));
        }
        skip(count) {
            return new LinqEnumerable(new WhereSkipEnumerableIterable(this.source, count));
        }
        range(index, count) {
            if (index < 0)
                throw new ArgumentOutOfRangeException('index');
            if (count < 0)
                throw new ArgumentOutOfRangeException('count');
            return new LinqEnumerable(new WhereRangeEnumerableIterable(this.source, index, count));
        }
        toArray() {
            return Linq.toArray(this.source);
        }
        forEach(action) {
            return Linq.forEach(this.source, action);
        }
        count() {
            return Linq.count(this.source);
        }
        any(predicate = null) {
            return Linq.any(this.source, predicate);
        }
        all(predicate) {
            return Linq.all(this.source, predicate);
        }
        first(predicate = null) {
            return Linq.first(this.source, predicate);
        }
        firstOrDefault(predicate = null) {
            return Linq.firstOrDefault(this.source, predicate);
        }
        last(predicate = null) {
            return Linq.last(this.source, predicate);
        }
        lastOrDefault(predicate = null) {
            return Linq.lastOrDefault(this.source, predicate);
        }
        single(predicate = null) {
            return Linq.single(this.source, predicate);
        }
        singleOrDefault(predicate = null) {
            return Linq.singleOrDefault(this.source, predicate);
        }
        elementAt(index) {
            return Linq.elementAt(this.source, index);
        }
        elementAtOrDefault(index) {
            return Linq.elementAtOrDefault(this.source, index);
        }
        contains(value, comparer = null) {
            return Linq.contains(this.source, value, comparer);
        }
        sum(selector) {
            return Linq.sum(this.source, selector);
        }
        max(selector) {
            return Linq.max(this.source, selector);
        }
        min(selector) {
            return Linq.min(this.source, selector);
        }
        average(selector) {
            return Linq.average(this.source, selector);
        }
        [Symbol.iterator]() {
            return this.source[Symbol.iterator]();
        }
    }
    class OrderedLineEnumerable extends LinqEnumerable {
        constructor(source) {
            super(source);
            this.orderedSource = source;
        }
        thenBy(keySelector, comparer = null) {
            return new OrderedLineEnumerable(this.orderedSource.createOrderedEnumerable(keySelector, comparer, false));
        }
        thenByDescending(keySelector, comparer = null) {
            return new OrderedLineEnumerable(this.orderedSource.createOrderedEnumerable(keySelector, comparer, true));
        }
    }
    function orderBy(source, keySelector, comparer = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (keySelector == null)
            throw new ArgumentNullException('keySelector');
        return new OrderedLineEnumerable(new OrderedKeyEnumerable(source, keySelector, comparer, false));
    }
    Linq.orderBy = orderBy;
    function orderByDescending(source, keySelector, comparer = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (keySelector == null)
            throw new ArgumentNullException('keySelector');
        return new OrderedLineEnumerable(new OrderedKeyEnumerable(source, keySelector, comparer, true));
    }
    Linq.orderByDescending = orderByDescending;
    function groupBy(source, keySelector, comparer = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (keySelector == null)
            throw new ArgumentNullException('keySelector');
        return new LinqEnumerable(new GroupedKeyEnumerable(source, keySelector, IdentityFunction.instance(), comparer));
    }
    Linq.groupBy = groupBy;
    function select(source, selector) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (selector == null)
            throw new ArgumentNullException('selector');
        return new LinqEnumerable(new WhereSelectEnumerableIterable(source, selector));
    }
    Linq.select = select;
    function where(source, predicate) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (predicate == null)
            throw new ArgumentNullException('predicate');
        return new LinqEnumerable(new WhereEnumerableIterable(source, predicate));
    }
    Linq.where = where;
    function concat(first, second) {
        if (first == null)
            throw new ArgumentNullException('first');
        if (second == null)
            throw new ArgumentNullException('second');
        return new LinqEnumerable(new WhereConcatEnumerableIterable(first, second));
    }
    Linq.concat = concat;
    function take(source, count) {
        if (source == null)
            throw new ArgumentNullException('source');
        return new LinqEnumerable(new WhereTakeEnumerableIterable(source, count));
    }
    Linq.take = take;
    function skip(source, count) {
        if (source == null)
            throw new ArgumentNullException('source');
        return new LinqEnumerable(new WhereSkipEnumerableIterable(source, count));
    }
    Linq.skip = skip;
    function range(source, index, count) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (index < 0)
            throw new ArgumentOutOfRangeException('index');
        if (count < 0)
            throw new ArgumentOutOfRangeException('count');
        return new LinqEnumerable(new WhereRangeEnumerableIterable(source, index, count));
    }
    Linq.range = range;
    function toArray(source) {
        if (source == null)
            throw new ArgumentNullException('source');
        let array = new Array();
        for (let element of source) {
            array.push(element);
        }
        return array;
    }
    Linq.toArray = toArray;
    function forEach(source, action) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (action == null)
            throw new ArgumentNullException('action');
        for (let element of source) {
            action(element);
        }
    }
    Linq.forEach = forEach;
    function count(source) {
        if (source == null)
            throw new ArgumentNullException('source');
        let count = 0;
        for (let element of source) {
            count++;
        }
        return count;
    }
    Linq.count = count;
    function any(source, predicate = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (predicate == null) {
            let e = source[Symbol.iterator]();
            return e.next().done;
        }
        else {
            for (let element of source) {
                if (predicate(element))
                    return true;
            }
            return false;
        }
    }
    Linq.any = any;
    function all(source, predicate) {
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
    Linq.all = all;
    function first(source, predicate = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (predicate == null) {
            let e = source[Symbol.iterator]();
            let result = e.next();
            if (result.done) {
                return result.value;
            }
        }
        else {
            for (let element of source) {
                if (predicate(element)) {
                    return element;
                }
            }
        }
        throw new InvalidOperationException('no match was found');
    }
    Linq.first = first;
    function firstOrDefault(source, predicate = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (predicate == null) {
            let e = source[Symbol.iterator]();
            let result = e.next();
            if (result.done) {
                return result.value;
            }
        }
        else {
            for (let element of source) {
                if (predicate(element)) {
                    return element;
                }
            }
        }
    }
    Linq.firstOrDefault = firstOrDefault;
    function last(source, predicate = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (predicate == null) {
            let e = source[Symbol.iterator]();
            let result = e.next();
            if (result.done) {
                let element;
                do {
                    element = result.value;
                } while ((result = e.next()).done);
                return element;
            }
        }
        else {
            let found = false;
            let result;
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
    Linq.last = last;
    function lastOrDefault(source, predicate = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (predicate == null) {
            let e = source[Symbol.iterator]();
            let result = e.next();
            if (result.done) {
                let element;
                do {
                    element = result.value;
                } while ((result = e.next()).done);
                return element;
            }
        }
        else {
            let found = false;
            let result;
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
    Linq.lastOrDefault = lastOrDefault;
    function single(source, predicate = null) {
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
        }
        else {
            let count = 0;
            let result;
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
    Linq.single = single;
    function singleOrDefault(source, predicate = null) {
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
        }
        else {
            let count = 0;
            let result;
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
    Linq.singleOrDefault = singleOrDefault;
    function elementAt(source, index) {
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
    Linq.elementAt = elementAt;
    function elementAtOrDefault(source, index) {
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
    Linq.elementAtOrDefault = elementAtOrDefault;
    function contains(source, value, comparer = null) {
        if (source == null)
            throw new ArgumentNullException('source');
        if (comparer == null)
            comparer = EqualityComparer.default();
        for (let element of source) {
            if (comparer.equals(element, value)) {
                return true;
            }
        }
        return false;
    }
    Linq.contains = contains;
    function sum(source, selector) {
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
    Linq.sum = sum;
    function max(source, selector) {
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
    Linq.max = max;
    function min(source, selector) {
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
    Linq.min = min;
    function average(source, selector) {
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
    Linq.average = average;
})(Linq || (Linq = {}));
//# sourceMappingURL=linq.js.map