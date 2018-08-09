var Sort;
(function (Sort) {
    class Comparer {
        static Default() {
            return new DefaultComparer();
        }
    }
    class DefaultComparer extends Comparer {
        Comparer(x, y) {
            if (typeof (x) != typeof (y))
                throw new Error('argument error!');
            if (typeof (x) == 'boolean') {
                let lx = x;
                let ly = y;
                return (lx === true ? 1 : 0) - (ly === true ? 1 : 0);
            }
            else if (typeof (x) == 'number') {
                let lx = x;
                let ly = y;
                return lx - ly;
            }
            throw new Error('invalid ordered type');
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
        ToArray() {
            let array = new Array();
            for (let element of this.items) {
                array.push(element);
            }
            return array;
        }
    }
    class EnumerableSorter {
        Sort(elements, count) {
            this.ComputeKeys1(elements, count);
            let map = new Array(count);
            for (let i = 0; i < count; i++)
                map[i] = i;
            this.QuickSort(map, 0, count - 1);
            return map;
        }
        QuickSort(map, left, right) {
            do {
                let i = left;
                let j = right;
                let x = map[i + ((j - i) >> 1)];
                do {
                    while (i < map.length && this.ComputeKeys2(x, map[i]) > 0)
                        i++;
                    while (j >= 0 && this.ComputeKeys2(x, map[j]) < 0)
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
                        this.QuickSort(map, left, j);
                    left = i;
                }
                else {
                    if (i < right)
                        this.QuickSort(map, i, right);
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
        ComputeKeys1(elements, count) {
            this.keys = new Array(count);
            for (let i = 0; i < count; i++)
                this.keys[i] = this.keySelector(elements[i]);
            if (this.next != null)
                this.next.ComputeKeys1(elements, count);
        }
        ComputeKeys2(index1, index2) {
            let c = this.comparer.Comparer(this.keys[index1], this.keys[index2]);
            if (c == 0) {
                return this.next == null
                    ? index1 - index2
                    : this.next.ComputeKeys2(index1, index2);
            }
            return this.descending ? -c : c;
        }
    }
    class OrderedEnumerable {
        GetEnumerator() {
            let self = this;
            function* anotherGenerator() {
                let buffer = new Buffer(self.source);
                if (buffer.count > 0) {
                    let sorter = self.GetEnumerableSorter(null);
                    let map = sorter.Sort(buffer.items, buffer.count);
                    sorter = null;
                    for (let i = 0; i < buffer.count; i++)
                        yield buffer.items[map[i]];
                }
            }
            return anotherGenerator();
        }
        CreateOrderedEnumerable(keySelector, comparer, descending) {
            let result = new OrderedKeyEnumerable(this.source, keySelector, comparer, descending);
            result.parent = this;
            return result;
        }
        [Symbol.iterator]() {
            return this.GetEnumerator();
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
            this.comparer = comparer != null ? comparer : Comparer.Default();
            this.descending = descending;
        }
        GetEnumerableSorter(next) {
            let sorter = new EnumerableKeySorter(this.keySelector, this.comparer, this.descending, next);
            if (this.parent != null) {
                sorter = this.parent.GetEnumerableSorter(sorter);
            }
            return sorter;
        }
    }
    class Ordered {
        constructor(source) {
            this.source = source;
        }
        orderBy(keySelector, comparer = null) {
            return new Ordered(new OrderedKeyEnumerable(this.source, keySelector, comparer, false));
        }
        orderByDescending(keySelector, comparer = null) {
            return new Ordered(new OrderedKeyEnumerable(this.source, keySelector, comparer, true));
        }
        [Symbol.iterator]() {
            return this.source[Symbol.iterator]();
        }
    }
    function orderBy(source, keySelector, comparer = null) {
        return new Ordered(new OrderedKeyEnumerable(source, keySelector, comparer, false));
    }
    Sort.orderBy = orderBy;
    function orderByDescending(source, keySelector, comparer = null) {
        return new Ordered(new OrderedKeyEnumerable(source, keySelector, comparer, true));
    }
    Sort.orderByDescending = orderByDescending;
})(Sort || (Sort = {}));
//# sourceMappingURL=ordered.js.map