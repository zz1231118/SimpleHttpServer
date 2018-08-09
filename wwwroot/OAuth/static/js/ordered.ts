namespace Sort {
    interface IComparer<T> {
        Comparer(x: T, y: T): number;
    }
    interface IOrderedEnumerable<TElement> extends Iterable<TElement> {
        CreateOrderedEnumerable<TKey>(keySelector: (element: TElement) => TKey, comparer: IComparer<TKey>, descending: boolean): IOrderedEnumerable<TElement>;
    }

    abstract class Comparer<T> implements IComparer<T> {
        public static Default<T>(): Comparer<T> {
            return new DefaultComparer<T>();
        }

        public abstract Comparer(x: T, y: T): number;
    }
    class DefaultComparer<T> extends Comparer<T> {
        public Comparer(x: T, y: T): number {
            if (typeof (x) != typeof (y))
                throw new Error('argument error!');

            if (typeof (x) == 'boolean') {
                let lx: any = x;
                let ly: any = y;
                return (lx === true ? 1 : 0) - (ly === true ? 1 : 0);
            } else if (typeof(x) == 'number') {
                let lx: any = x;
                let ly: any = y;
                return lx - ly;
            }

            throw new Error('invalid ordered type');
        }
    }

    class Buffer<TElement> {
        public items: Array<TElement>;
        public count: number;

        public constructor(source: Iterable<TElement>) {
            this.items = new Array();
            for (let element of source) {
                this.items.push(element);
            }

            this.count = this.items.length;
        }

        public ToArray(): Array<TElement> {
            let array = new Array<TElement>();
            for (let element of this.items) {
                array.push(element);
            }

            return array;
        }
    }
    abstract class EnumerableSorter<TElement> {
        public abstract ComputeKeys1(elements: Array<TElement>, count: number): void;
        public abstract ComputeKeys2(index1: number, index2: number): number;
        public Sort(elements: Array<TElement>, count: number): Array<number> {
            this.ComputeKeys1(elements, count);
            let map = new Array<number>(count);
            for (let i = 0; i < count; i++)
                map[i] = i;

            this.QuickSort(map, 0, count - 1);
            return map;
        }
        private QuickSort(map: Array<number>, left: number, right: number): void {
            do {
                let i = left;
                let j = right;
                let x = map[i + ((j - i) >> 1)];
                do {
                    while (i < map.length && this.ComputeKeys2(x, map[i]) > 0) i++;
                    while (j >= 0 && this.ComputeKeys2(x, map[j]) < 0) j--;
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
                } else {
                    if (i < right)
                        this.QuickSort(map, i, right);

                    right = j;
                }
            } while (left < right);
        }
    }
    class EnumerableKeySorter<TElement, TKey> extends EnumerableSorter<TElement> {
        public keySelector: (element: TElement) => TKey;
        public comparer: IComparer<TKey>;
        public descending: boolean;
        public next: EnumerableSorter<TElement>;
        public keys: Array<TKey>;

        public constructor(keySelector: (element: TElement) => TKey, comparer: IComparer<TKey>, descending: boolean, next: EnumerableSorter<TElement>) {
            super();
            this.keySelector = keySelector;
            this.comparer = comparer;
            this.descending = descending;
            this.next = next;
        }

        public ComputeKeys1(elements: Array<TElement>, count: number): void {
            this.keys = new Array(count);
            for (let i = 0; i < count; i++)
                this.keys[i] = this.keySelector(elements[i]);

            if (this.next != null)
                this.next.ComputeKeys1(elements, count);
        }
        public ComputeKeys2(index1: number, index2: number): number {
            let c = this.comparer.Comparer(this.keys[index1], this.keys[index2]);
            if (c == 0) {
                return this.next == null
                    ? index1 - index2
                    : this.next.ComputeKeys2(index1, index2);
            }
            return this.descending ? -c : c;
        }
    }
    abstract class OrderedEnumerable<TElement> implements IOrderedEnumerable<TElement> {
        public source: Iterable<TElement>;

        public GetEnumerator(): Iterator<TElement> {
            let self = this;
            function* anotherGenerator(): IterableIterator<TElement> {
                let buffer = new Buffer<TElement>(self.source);
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

        public abstract GetEnumerableSorter(next: EnumerableSorter<TElement>): EnumerableSorter<TElement>;
        public CreateOrderedEnumerable<TKey>(keySelector: (element: TElement) => TKey, comparer: IComparer<TKey>, descending: boolean): IOrderedEnumerable<TElement> {
            let result = new OrderedKeyEnumerable<TElement, TKey>(this.source, keySelector, comparer, descending);
            result.parent = this;
            return result;
        }

        [Symbol.iterator](): Iterator<TElement> {
            return this.GetEnumerator();
        }
    }
    class OrderedKeyEnumerable<TElement, TKey> extends OrderedEnumerable<TElement> {
        public parent: OrderedEnumerable<TElement>;
        public keySelector: (element: TElement) => TKey;
        public comparer: IComparer<TKey>;
        public descending: boolean;

        public constructor(source: Iterable<TElement>, keySelector: (element: TElement) => TKey, comparer: IComparer<TKey>, descending: boolean) {
            if (source == null)
                throw new ArgumentNullException('source');
            if (keySelector == null)
                throw new ArgumentNullException('keySelector');

            super();
            super.source = source;
            this.parent = null;
            this.keySelector = keySelector;
            this.comparer = comparer != null ? comparer : Comparer.Default<TKey>();
            this.descending = descending;
        }

        public GetEnumerableSorter(next: EnumerableSorter<TElement>): EnumerableSorter<TElement> {
            let sorter: EnumerableSorter<TElement> = new EnumerableKeySorter<TElement, TKey>(this.keySelector, this.comparer, this.descending, next);
            if (this.parent != null) {
                sorter = this.parent.GetEnumerableSorter(sorter);
            }
            return sorter;
        }
    }

    class Ordered<TElement> implements Iterable<TElement> {
        private source: IOrderedEnumerable<TElement>;

        public constructor(source: IOrderedEnumerable<TElement>) {
            this.source = source;
        }

        public orderBy<TKey>(keySelector: (source: TElement) => TKey, comparer: IComparer<TKey> = null): Ordered<TElement> {
            return new Ordered<TElement>(new OrderedKeyEnumerable<TElement, TKey>(this.source, keySelector, comparer, false));
        }
        public orderByDescending<TKey>(keySelector: (source: TElement) => TKey, comparer: IComparer<TKey> = null): Ordered<TElement> {
            return new Ordered<TElement>(new OrderedKeyEnumerable<TElement, TKey>(this.source, keySelector, comparer, true));
        }

        [Symbol.iterator](): Iterator<TElement> {
            return this.source[Symbol.iterator]();
        }
    }
    export function orderBy<TSource, TKey>(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, comparer: IComparer<TKey> = null): Ordered<TSource> {
        return new Ordered<TSource>(new OrderedKeyEnumerable<TSource, TKey>(source, keySelector, comparer, false));
    }
    export function orderByDescending<TSource, TKey>(source: Iterable<TSource>, keySelector: (source: TSource) => TKey, comparer: IComparer<TKey> = null): Ordered<TSource> {
        return new Ordered<TSource>(new OrderedKeyEnumerable<TSource, TKey>(source, keySelector, comparer, true));
    }
}