define((require) => {
    let generic = require('./system.collections.generic');
    let List: system.collections.generic.ListConstructor = generic.List;
    let Dictionary: system.collections.generic.DictionaryConstructor = generic.Dictionary;

    class NObject {
        public static memberwiseClone(obj: object): object {
            if (obj == null)
                throw new ArgumentNullException('obj');

            let newobj = {};
            for (let key in obj) {
                newobj[key] = obj[key];
            }
            return newobj;
        }
        public equals(obj: NObject): boolean {
            return obj === this;
        }
        public getType(): Type {
            return Type.fromObject(this);
        }
    }
    class Exception extends Error {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class ArgumentException extends Exception {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class ArgumentNullException extends ArgumentException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class ArgumentOutOfRangeException extends ArgumentException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class SystemException extends Exception {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class InvalidCastException extends SystemException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class InvalidOperationException extends SystemException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class ArithmeticException extends SystemException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class OverflowException extends ArithmeticException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class NotImplementedException extends SystemException {
        public constructor(message: string = null) {
            super(message);
        }
    }
    class NotSupportedException extends SystemException {
        public constructor(message: string = null) {
            super(message);
        }
    }


    class Type {
        private static _types = new Dictionary<string, Type>();

        private _fullName: string;

        public get fullName(): string {
            return this._fullName;
        }
        public get name(): string {
            let index = this._fullName.lastIndexOf('.');
            if (index >= 0) {
                return this._fullName.substring(index + 1, this._fullName.length);
            }
            return this._fullName;
        }
        public get default(): any {
            switch (this.name) {
                case 'Number':
                    return 0;
                case 'Boolean':
                    return false;
                default:
                    return null;
            }
        }
        public get isValueType(): boolean {
            return this.name === 'Number';
        }

        public static isType(obj: any, name: string): boolean {
            return Object.toString.call(obj) == '[object ' + name + ']';
        }
        public static isUndefined(obj: any): boolean {
            return typeof (obj) === 'undefined';
        }
        public static isNull(obj: any): boolean {
            return new String(obj).toString() === 'null';
        }
        public static isNumber(obj: any): boolean {
            return typeof (obj) === 'number';
        }
        public static isBoolean(obj: any): boolean {
            return typeof (obj) === 'boolean';
        }
        public static isString(obj: any): boolean {
            return typeof (obj) === 'string';
        }
        public static isFunction(obj: any): boolean {
            return typeof (obj) === 'function'
        }
        public static isObject(obj: any): boolean {
            return Type.isType(obj, 'Object');
        }
        public static isArray(obj: any): boolean {
            return Type.isType(obj, 'Array');
        }

        public static fromType<T>(constructor: { new(): T }): Type {
            if (constructor == null)
                throw new ArgumentNullException('constructor');

            let type: Type;
            let key = constructor.prototype.constructor.name;
            if (Type._types.containsKey(key)) {
                type = Type._types.get(key);
            } else {
                type = new Type();
                type._fullName = key;
                Type._types.add(key, type);
            }

            return type;
        }
        public static fromObject(obj: any): Type {
            if (obj == null)
                throw new ArgumentNullException('obj');

            let type: Type;
            let key = obj.__proto__.__class__ || obj.__proto__.constructor.name;
            if (Type._types.containsKey(key)) {
                type = Type._types.get(key);
            } else {
                type = new Type();
                type._fullName = key;
                Type._types.add(key, type);
            }

            return type;
        }
        public static getType(name: string): Type {
            if (name == null)
                throw new ArgumentNullException('name');

            let type: Type;
            if (Type._types.containsKey(name)) {
                type = Type._types.get(name);
            } else {
                type = new Type();
                type._fullName = name;
                Type._types.add(name, type);
            }

            return type;
        }

        public equals(obj: object): boolean {
            if (obj instanceof Type) {
                let other = <Type>obj;
                return other._fullName === this._fullName;
            }
            return false;
        }
    }

    class Event {
        private _target: object;
        private _type: string;
        private _data: any;

        public constructor(type: string, data?: any) {
            this._type = type;
            this._data = data;
        }

        public get type(): string {
            return this._type;
        }
        public get target(): object {
            return this._target;
        }
        public get currentTarget(): object {
            return this._target;
        }
        public get data(): any {
            return this._data;
        }

        public setTarget(target: object): void {
            this._target = target;
        }
    }
    class KeyEvent extends Event {
        private _key: string;
        private _keyCode: number;
        private _repeat: boolean;
        private _altKey: boolean;
        private _ctrlKey: boolean;
        private _metaKey: boolean;
        private _shiftKey: boolean;

        public constructor(type: string, key: string, keyCode: number, repeat: boolean = false, altKey: boolean = false, ctrlKey: boolean = false, metaKey: boolean = false, shiftKey: boolean = false) {
            super(type);
            this._key = key;
            this._keyCode = keyCode;
            this._repeat = repeat;
            this._altKey = altKey;
            this._ctrlKey = ctrlKey;
            this._metaKey = metaKey;
            this._shiftKey = shiftKey;
        }

        public get key(): string {
            return this._key;
        }
        public get keyCode(): number {
            return this._keyCode;
        }
        public get repeat(): boolean {
            return this._repeat;
        }
        public get altKey(): boolean {
            return this._altKey;
        }
        public get ctrlKey(): boolean {
            return this._ctrlKey;
        }
        public get metaKey(): boolean {
            return this._metaKey;
        }
        public get shiftKey(): boolean {
            return this._shiftKey;
        }
    }
    class EventListener {
        private _handler: system.EventHandler;
        private _callTarget: object;

        public constructor(handler: system.EventHandler, callTarget: object) {
            this._handler = handler;
            this._callTarget = callTarget;
        }

        public get handler(): system.EventHandler {
            return this._handler;
        }
        public get callTarget(): object {
            return this._callTarget;
        }

        public invoke(e: Event): void {
            this._handler.call(this._callTarget, e);
        }
    }
    abstract class EventDispatcher {
        private _eventListeners: system.collections.generic.Dictionary<string, system.collections.generic.List<EventListener>>;

        public addEventListener(key: string, handler: system.EventHandler, obj: object = null): void {
            if (key == null)
                throw new ArgumentNullException('key');
            if (handler == null)
                throw new ArgumentNullException('handler');

            let listeners: system.collections.generic.List<EventListener>;
            if (this._eventListeners === undefined) {
                listeners = new List<EventListener>();
                this._eventListeners = new Dictionary<string, system.collections.generic.List<EventListener>>();
                this._eventListeners.add(key, listeners);
            } else if (this._eventListeners.containsKey(key)) {
                listeners = this._eventListeners.get(key);
            } else {
                listeners = new List<EventListener>();
                this._eventListeners.add(key, listeners);
            }

            listeners.add(new EventListener(handler, obj));
        }
        public removeEventListener(key: string, handler: system.EventHandler): boolean {
            if (key == null)
                throw new ArgumentNullException('key');
            if (handler == null)
                throw new ArgumentNullException('handler');

            if (this._eventListeners !== undefined && this._eventListeners.containsKey(key)) {
                let listeners = this._eventListeners.get(key);
                if (listeners.removeAll(p => p.handler == handler) >= 0) {
                    return true;
                }
            }

            return false;
        }
        public clearEventListener(key: string): void {
            if (this._eventListeners !== undefined) {
                this._eventListeners.remove(key);
            }
        }
        public dispatchEvent(e: Event): void {
            if (e == null)
                throw new ArgumentNullException('e');

            e.setTarget(this);
            if (this._eventListeners !== undefined && this._eventListeners.containsKey(e.type)) {
                let listeners = this._eventListeners.get(e.type);
                for (let listener of listeners) {
                    listener.invoke(e);
                }
            }
        }
        public dispatchEventWith(type: string, data?: any): void {
            if (type == null)
                throw new ArgumentNullException('type');

            this.dispatchEvent(new Event(type, data));
        }
    }

    class Convert {
        public static toInt32(value: number | string): number {
            if (Type.isNumber(value))
                return value >= 0 ? Math.floor(<number>value) : Math.ceil(<number>value);
            if (Type.isString(value))
                return parseInt(<string>value);

            throw new InvalidCastException('value');
        }

        public static toInt64(value: number | string): number {
            if (Type.isNumber(value))
                return value >= 0 ? Math.floor(<number>value) : Math.ceil(<number>value);
            if (Type.isString(value))
                return parseInt(<string>value);

            throw new InvalidCastException('value');
        }
    }
    class BitConverter {
        public static getInt16(array: Uint8Array, offset: number = 0): number {
            if (array == null)
                throw new ArgumentNullException('array');

            return array[offset + 0] << 0 +
                array[offset + 1] << 8;
        }
        public static getInt32(array: Uint8Array, offset: number = 0): number {
            if (array == null)
                throw new ArgumentNullException('array');

            return array[offset] +
                array[offset + 1] << 8 +
                array[offset + 2] << 16 +
                array[offset + 3] << 24;
        }
        public static getInt64(array: Uint8Array, offset: number = 0): number {
            if (array == null)
                throw new ArgumentNullException('array');

            //位操作，js 只应用 int32
            if (array[offset + 7] === 0xFF) {
                //负数, 补码
                let value = 0xFF - array[offset] + 1;
                value += (0xFF - array[offset + 1]) * 0x100;
                value += (0xFF - array[offset + 2]) * 0x10000;
                value += (0xFF - array[offset + 3]) * 0x1000000;
                value += (0xFF - array[offset + 4]) * 0x100000000;
                value += (0xFF - array[offset + 5]) * 0x10000000000;
                value += (0xFF - array[offset + 6]) * 0x1000000000000;
                value += (0xFF - array[offset + 7]) * 0x100000000000000;
                return -value;
            } else {
                let value = array[offset];
                value += array[offset + 1] * 0x100;
                value += array[offset + 2] * 0x10000;
                value += array[offset + 3] * 0x1000000;
                value += array[offset + 4] * 0x100000000;
                value += array[offset + 5] * 0x10000000000;
                value += array[offset + 6] * 0x1000000000000;
                value += array[offset + 7] * 0x100000000000000;
                return value;
            }
        }

        public static int16ConvertTo(array: Uint8Array, offset: number, value: number): void {
            if (array == null)
                throw new ArgumentNullException('array');

            array[offset + 0] = (value >> 0) & 0xFF;
            array[offset + 1] = (value >> 8) & 0xFF;
        }
        public static int32ConvertTo(array: Uint8Array, offset: number, value: number): void {
            if (array == null)
                throw new ArgumentNullException('array');

            array[offset] = (value) & 0xFF;
            array[offset + 1] = (value >> 8) & 0xFF;
            array[offset + 2] = (value >> 16) & 0xFF;
            array[offset + 3] = (value >> 24) & 0xFF;
        }
        public static int64ConvertTo(array: Uint8Array, offset: number, value: number): void {
            if (array == null)
                throw new ArgumentNullException('array');

            //位操作，js 只应用 int32
            if (value >= 0) {
                array[offset] = (value) & 0xFF;
                array[offset + 1] = (value / 0x100) & 0xFF;
                array[offset + 2] = (value / 0x10000) & 0xFF;
                array[offset + 3] = (value / 0x1000000) & 0xFF;
                array[offset + 4] = (value / 0x100000000) & 0xFF;
                array[offset + 5] = (value / 0x10000000000) & 0xFF;
                array[offset + 6] = (value / 0x1000000000000) & 0xFF;
                array[offset + 7] = (value / 0x100000000000000) & 0xFF;
            } else {
                //负数, 补码
                array[offset] = 0xFF - ((value) & 0xFF) + 1;
                array[offset + 1] = 0xFF - ((value / 0x100) & 0xFF);
                array[offset + 2] = 0xFF - ((value / 0x10000) & 0xFF);
                array[offset + 3] = 0xFF - ((value / 0x1000000) & 0xFF);
                array[offset + 4] = 0xFF - ((value / 0x100000000) & 0xFF);
                array[offset + 5] = 0xFF - ((value / 0x10000000000) & 0xFF);
                array[offset + 6] = 0xFF - ((value / 0x1000000000000) & 0xFF);
                array[offset + 7] = 0xFF - ((value / 0x100000000000000) & 0xFF);
            }
        }
    }
    class Int64 {
        public static readonly MaxValue: number = 0x7fffffffffffffff;
        public static readonly MinValue: number = -0x8000000000000000;
    }
    class Char {
        private static readonly _0CharNumber = '0'.charCodeAt(0);
        private static readonly _9CharNumber = '9'.charCodeAt(0);
        private static readonly _aCharNumber = 'a'.charCodeAt(0);
        private static readonly _zCharNumber = 'z'.charCodeAt(0);
        private static readonly _ACharNumber = 'A'.charCodeAt(0);
        private static readonly _ZCharNumber = 'Z'.charCodeAt(0);
        private static readonly _spaceCharNumber = ' '.charCodeAt(0);
        private static readonly _underlineCharNumber = '_'.charCodeAt(0);

        public static isNumber(ch: string): boolean {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';

            let num = ch.charCodeAt(0);
            return Char._0CharNumber <= num && num <= Char._9CharNumber;
        }
        public static isLetter(ch: string): boolean {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';

            let num = ch.charCodeAt(0);
            return (Char._aCharNumber <= num && num <= Char._zCharNumber) || (Char._ACharNumber <= num && num <= Char._ZCharNumber);
        }
        public static isWhiteSpace(ch: string): boolean {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';

            return ch.charCodeAt(0) === Char._spaceCharNumber;
        }
        public static isUnderline(ch: string): boolean {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';

            return ch.charCodeAt(0) === Char._underlineCharNumber;
        }
    }
    class String {
        private _text: string;

        public constructor(value?: any, count?: number) {
            switch (arguments.length) {
                case 0:
                    this._text = '';
                    break;
                case 1:
                    this._text = value.toString();
                    break;
                case 2:
                    this._text = '';
                    for (let i = 0; i < count; i++) {
                        this._text += value.toString();
                    }
            }
        }

        public get length(): number {
            return this._text.length;
        }

        public static join<T>(separator: string, collection: Iterable<T>): string {
            if (collection == null)
                throw new ArgumentNullException('collection');

            let text: string = '';
            let e = collection[Symbol.iterator]();
            if (e.next().done) {
                text = e.return().value.toString();
                while (e.next().done) {
                    text += separator;
                    text += e.return().value.toString();
                }
            }
            return text;
        }

        public padLeft(totalWidth: number, paddingChar: string): string {
            if (totalWidth <= 0)
                throw new ArgumentOutOfRangeException('totalWidth');
            if (paddingChar == null)
                throw new ArgumentNullException('paddingChar');
            if (paddingChar.length != 1)
                throw new ArgumentException('paddingChar');

            if (totalWidth <= this._text.length) {
                return this._text;
            }

            let lsef = '';
            for (let i = this._text.length; i < totalWidth; i++) {
                lsef += paddingChar;
            }

            return lsef + this._text;
        }
        public padRight(totalWidth: number, paddingChar: string): string {
            if (totalWidth <= 0)
                throw new ArgumentOutOfRangeException('totalWidth');
            if (paddingChar == null)
                throw new ArgumentNullException('paddingChar');
            if (paddingChar.length != 1)
                throw new ArgumentException('paddingChar');

            if (totalWidth <= this._text.length) {
                return this._text;
            }

            let lsef = '';
            for (let i = this._text.length; i < totalWidth; i++) {
                lsef += paddingChar;
            }

            return this._text + lsef;
        }
        public toString(): string {
            return this._text;
        }
    }
    class Guid {
        private _a: number;/** Int32 */
        private _b: number;/** Int16 */
        private _c: number;/** Int16 */
        private _d: number;/** Byte */
        private _e: number;/** Byte */
        private _f: number;/** Byte */
        private _g: number;/** Byte */
        private _h: number;/** Byte */
        private _i: number;/** Byte */
        private _j: number;/** Byte */
        private _k: number;/** Byte */

        public static newGuid(): Guid {
            let guid = new Guid();
            guid._a = (Math.random() * 0xFFFFFFFF) & 0xFFFFFFFF;
            guid._b = (Math.random() * 0xFFFF) & 0xFFFF;
            guid._c = (Math.random() * 0xFFFF) & 0xFFFF;
            guid._d = (Math.random() * 0xFF) & 0xFF;
            guid._e = (Math.random() * 0xFF) & 0xFF;
            guid._f = (Math.random() * 0xFF) & 0xFF;
            guid._g = (Math.random() * 0xFF) & 0xFF;
            guid._h = (Math.random() * 0xFF) & 0xFF;
            guid._i = (Math.random() * 0xFF) & 0xFF;
            guid._j = (Math.random() * 0xFF) & 0xFF;
            guid._k = (Math.random() * 0xFF) & 0xFF;
            return guid;
        }

        private toNormalizeString(): string {
            return new String(this._a.toString(16)).padLeft(8, '0') + '-' +
                new String(this._b.toString(16)).padLeft(4, '0') + '-' +
                new String(this._c.toString(16)).padLeft(4, '0') + '-' +
                this._c.toString(16) +
                this._d.toString(16) +
                this._e.toString(16) +
                this._f.toString(16) +
                this._g.toString(16) +
                this._h.toString(16) +
                this._i.toString(16) +
                this._j.toString(16) +
                this._k.toString(16);
        }

        public toByteArray(): Uint8Array {
            let array = new Uint8Array(16);
            array[0] = this._a & 0xFF;
            array[1] = (this._a >> 8) & 0xFF;
            array[2] = (this._a >> 16) & 0xFF;
            array[3] = (this._a >> 24) & 0xFF;
            array[4] = this._b & 0xFF;
            array[5] = (this._b >> 8) & 0xFF;
            array[6] = (this._c) & 0xFF;
            array[7] = (this._c >> 8) & 0xFF;
            array[8] = this._d;
            array[9] = this._e;
            array[10] = this._f;
            array[11] = this._g;
            array[12] = this._h;
            array[13] = this._i;
            array[14] = this._j;
            array[15] = this._k;
            return array;
        }
        public toString(format?: string): string {
            if (format == null) {
                return this.toNormalizeString();
            }
            switch (format) {
                case 'D':
                    return this.toNormalizeString();
                default:
                    return this.toNormalizeString();
            }
        }
    }
    class TimeSpan {
        public static readonly TicksPerMillisecond: number = 10000;
        public static readonly TicksPerSecond: number = TimeSpan.TicksPerMillisecond * 1000;
        public static readonly TicksPerMinute: number = TimeSpan.TicksPerSecond * 60;
        public static readonly TicksPerHour: number = TimeSpan.TicksPerMinute * 60;
        public static readonly TicksPerDay: number = TimeSpan.TicksPerHour * 24;

        public static readonly DaysPerTick: number = 1.0 / TimeSpan.TicksPerDay;
        public static readonly HoursPerTick: number = 1.0 / TimeSpan.TicksPerHour;
        public static readonly MinutesPerTick: number = 1.0 / TimeSpan.TicksPerMinute;
        public static readonly SecondsPerTick: number = 1.0 / TimeSpan.TicksPerSecond;
        public static readonly MillisecondsPerTick: number = 1.0 / TimeSpan.TicksPerMillisecond;

        public static readonly MillisPerSecond: number = 1000;
        public static readonly MillisPerMinute: number = TimeSpan.MillisPerSecond * 60;
        public static readonly MillisPerHour: number = TimeSpan.MillisPerMinute * 60;
        public static readonly MillisPerDay: number = TimeSpan.MillisPerHour * 24;

        public static readonly MaxSeconds: number = Convert.toInt64(Int64.MaxValue / TimeSpan.TicksPerSecond);
        public static readonly MinSeconds: number = Convert.toInt64(Int64.MinValue / TimeSpan.TicksPerSecond);

        public static readonly MaxMilliSeconds: number = Int64.MaxValue / TimeSpan.TicksPerMillisecond;
        public static readonly MinMilliSeconds: number = Int64.MinValue / TimeSpan.TicksPerMillisecond;

        private _ticks: number;

        public constructor(days?: number, hours?: number, minutes?: number, seconds?: number, milliseconds?: number) {
            switch (arguments.length) {
                case 0:
                    this._ticks = 0;
                    break;
                case 1:
                    this._ticks = days;
                    break;
                case 3:
                    seconds = minutes;
                    minutes = hours;
                    hours = days;
                    this._ticks = TimeSpan.timeToTicks(hours, minutes, seconds);
                    break;
                case 4:
                    this.initialize(days, hours, minutes, seconds, 0);
                    break;
                case 5:
                    this.initialize(days, hours, minutes, seconds, milliseconds);
                    break;
            }
        }

        public static get zero(): TimeSpan {
            return new TimeSpan(0);
        }
        public static get maxValue(): TimeSpan {
            return new TimeSpan(Int64.MaxValue);
        }
        public static get minValue(): TimeSpan {
            return new TimeSpan(Int64.MinValue);
        }

        public get ticks(): number {
            return this._ticks;
        }
        public get days(): number {
            return Convert.toInt32(this._ticks / TimeSpan.TicksPerDay);
        }
        public get hours(): number {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerHour) % 24);
        }
        public get minutes(): number {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerMinute) % 60);
        }
        public get seconds(): number {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerSecond) % 60);
        }
        public get milliseconds(): number {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerMillisecond) % 1000);
        }

        public get totalDays(): number {
            return this._ticks * TimeSpan.DaysPerTick;
        }
        public get totalHours(): number {
            return this._ticks * TimeSpan.HoursPerTick;
        }
        public get totalMinutes(): number {
            return this._ticks * TimeSpan.MinutesPerTick;
        }
        public get totalSeconds(): number {
            return this._ticks * TimeSpan.SecondsPerTick;
        }
        public get totalMilliseconds(): number {
            let temp = this._ticks * TimeSpan.MillisecondsPerTick;
            if (temp > TimeSpan.MaxMilliSeconds)
                return TimeSpan.MaxMilliSeconds;

            if (temp < TimeSpan.MinMilliSeconds)
                return TimeSpan.MinMilliSeconds;

            return temp;
        }

        private static interval(value: number, scale: number): TimeSpan {
            let tmp = value * scale;
            let millis = tmp + (value >= 0 ? 0.5 : -0.5);
            if ((millis > Int64.MaxValue / TimeSpan.TicksPerMillisecond) || (millis < Int64.MinValue / TimeSpan.TicksPerMillisecond))
                throw new OverflowException('overflow time span too long.');

            return new TimeSpan(Convert.toInt64(millis) * TimeSpan.TicksPerMillisecond);
        }
        private static timeToTicks(hour: number, minute: number, second: number): number {
            let totalSeconds = Convert.toInt64(hour) * 3600 + Convert.toInt64(minute) * 60 + Convert.toInt64(second);
            if (totalSeconds > TimeSpan.MaxSeconds || totalSeconds < TimeSpan.MinSeconds)
                throw new ArgumentOutOfRangeException('overflow time span too long.');

            return Convert.toInt64(totalSeconds * TimeSpan.TicksPerSecond);
        }
        private initialize(days: number, hours: number, minutes: number, seconds: number, milliseconds: number): void {
            let totalMilliSeconds = Convert.toInt64(Convert.toInt64(days) * TimeSpan.MillisPerDay) +
                Convert.toInt64(Convert.toInt64(hours) * TimeSpan.MillisPerHour) +
                Convert.toInt64(Convert.toInt64(minutes) * TimeSpan.MillisPerMinute) +
                Convert.toInt64(Convert.toInt64(seconds) * TimeSpan.MillisPerSecond) +
                Convert.toInt64(milliseconds);
            if (totalMilliSeconds > TimeSpan.MaxMilliSeconds || totalMilliSeconds < TimeSpan.MinMilliSeconds)
                throw new ArgumentOutOfRangeException('overflow time span too long.');

            this._ticks = Convert.toInt64(totalMilliSeconds) * TimeSpan.TicksPerMillisecond;
        }
        private revisal(value: number): string {
            return value <= 9 ? '0' + value : value.toString();
        }

        public static fromDays(value: number): TimeSpan {
            return TimeSpan.interval(value, TimeSpan.MillisPerDay);
        }
        public static fromHours(value: number): TimeSpan {
            return TimeSpan.interval(value, TimeSpan.MillisPerHour);
        }
        public static fromMinutes(value: number): TimeSpan {
            return TimeSpan.interval(value, TimeSpan.MillisPerMinute);
        }
        public static fromSeconds(value: number): TimeSpan {
            return TimeSpan.interval(value, TimeSpan.MillisPerSecond);
        }
        public static fromMilliseconds(value: number): TimeSpan {
            return TimeSpan.interval(value, 1);
        }
        public static fromTicks(value: number): TimeSpan {
            return new TimeSpan(value);
        }
        public static parse(value: string): TimeSpan {
            if (value == null)
                throw new ArgumentNullException('str');

            let reg = new RegExp('^((?<day>\\d+)[\\.,\\s])?(?<hour>\\d+):(?<minutes>\\d+)(:(?<seconds>\\d+))?(\\.(?<milliseconds>\\d+))?$');
            let array = reg.exec(value.trim());
            if (array == null)
                throw new ArgumentException('str');

            let days = 0;
            let hours = 0;
            let minutes = 0;
            let seconds = 0;
            let milliseconds = 0;
            array = array['groups'];
            for (let key in array) {
                if (array[key] != null) {
                    switch (key) {
                        case 'day':
                            days = parseInt(array[key]);
                            break;
                        case 'hour':
                            hours = parseInt(array[key]);
                            break;
                        case 'minutes':
                            minutes = parseInt(array[key]);
                            break;
                        case 'seconds':
                            seconds = parseInt(array[key]);
                            break;
                        case 'milliseconds':
                            milliseconds = parseInt(array[key]);
                            break;
                    }
                }
            }

            return new TimeSpan(days, hours, minutes, seconds, milliseconds);
        }

        public add(ts: TimeSpan): TimeSpan {
            if (!(ts instanceof TimeSpan))
                throw new ArgumentNullException('ts not type of "TimeSpan"');

            let result = this._ticks + ts._ticks;
            if (((this._ticks >> 63) === (ts._ticks >> 63)) && ((this._ticks >> 63) !== (result >> 63)))
                throw new OverflowException('overflow time span too long.');

            return new TimeSpan(result);
        }
        public subtract(ts: TimeSpan): TimeSpan {
            if (!(ts instanceof TimeSpan))
                throw new ArgumentNullException('ts not type of "TimeSpan"');

            let result = this._ticks - ts._ticks;
            if (((this._ticks >> 63) !== (ts._ticks >> 63)) && ((this._ticks >> 63) !== (result >> 63)))
                throw new OverflowException('overflow time span too long.');

            return new TimeSpan(result);
        }
        public negate(): TimeSpan {
            if (this._ticks === TimeSpan.minValue._ticks)
                throw new OverflowException('overflow negate twos comp num.');

            return new TimeSpan(-this._ticks);
        }
        public duration(): TimeSpan {
            if (this._ticks === TimeSpan.minValue._ticks)
                throw new OverflowException('overflow duration.');

            return new TimeSpan(this._ticks >= 0 ? this._ticks : -this._ticks);
        }

        public toString(format?: string): string {
            let day = 0;
            let hour = 0;
            let minute = 0;
            let second = 0;
            let millisecond = Convert.toInt32(this._ticks / TimeSpan.TicksPerMillisecond);
            while (millisecond >= 1000) {
                millisecond -= 1000;
                second++;
                if (second >= 60) {
                    second -= 60;
                    minute++;
                    if (minute >= 60) {
                        minute -= 60;
                        hour++;
                        if (hour >= 24) {
                            hour -= 24;
                            day++;
                        }
                    }
                }
            }
            if (format == null) {
                return day + '.' + hour + ":" + minute + ":" + second + '.' + millisecond;
            } else {
                format = format.replace('dd', day.toString());
                format = format.replace('HH', this.revisal(hour));
                format = format.replace('mm', this.revisal(minute));
                format = format.replace('ss', this.revisal(second));
                format = format.replace('fff', millisecond.toString());
                return format;
            }
        }
    }

    interface DataParts {
        year: number;
        month: number;
        day: number;
    }
    enum DateTimeKind {
        unspecified = 0,
        utc = 1,
        local = 2,
    }
    enum DayOfWeek {
        sunday = 0,
        monday = 1,
        tuesday = 2,
        wednesday = 3,
        thursday = 4,
        friday = 5,
        saturday = 6,
    }
    class DateTime {
        public static readonly TicksPerMillisecond: number = 10000;
        public static readonly TicksPerSecond: number = DateTime.TicksPerMillisecond * 1000;
        public static readonly TicksPerMinute: number = DateTime.TicksPerSecond * 60;
        public static readonly TicksPerHour: number = DateTime.TicksPerMinute * 60;
        public static readonly TicksPerDay: number = DateTime.TicksPerHour * 24;

        public static readonly MaxSeconds: number = 0x7fffffffffffffff / DateTime.TicksPerSecond;
        public static readonly MinSeconds: number = 0x8000000000000000 / DateTime.TicksPerSecond;

        public static readonly DaysPerYear: number = 365;
        public static readonly DaysPer4Years: number = DateTime.DaysPerYear * 4 + 1;       // 1461
        public static readonly DaysPer100Years: number = DateTime.DaysPer4Years * 25 - 1;  // 36524
        public static readonly DaysPer400Years: number = DateTime.DaysPer100Years * 4 + 1; // 146097

        public static readonly DaysTo1601: number = DateTime.DaysPer400Years * 4;          // 584388
        public static readonly DaysTo1899: number = DateTime.DaysPer400Years * 4 + DateTime.DaysPer100Years * 3 - 367;
        public static readonly DaysTo1970: number = DateTime.DaysPer400Years * 4 + DateTime.DaysPer100Years * 3 + DateTime.DaysPer4Years * 17 + DateTime.DaysPerYear; // 719,162
        public static readonly DaysTo10000: number = DateTime.DaysPer400Years * 25 - 366;  // 3652059

        public static readonly DatePartYear: number = 0;
        public static readonly DatePartDayOfYear: number = 1;
        public static readonly DatePartMonth: number = 2;
        public static readonly DatePartDay: number = 3;

        public static readonly MillisPerSecond: number = 1000;
        public static readonly MillisPerMinute: number = DateTime.MillisPerSecond * 60;
        public static readonly MillisPerHour: number = DateTime.MillisPerMinute * 60;
        public static readonly MillisPerDay: number = DateTime.MillisPerHour * 24;

        public static readonly MinTicks: number = 0;
        public static readonly MaxTicks: number = DateTime.DaysTo10000 * DateTime.TicksPerDay - 1;
        public static readonly MaxMillis: number = Convert.toInt32(DateTime.DaysTo10000) * DateTime.MillisPerDay;

        public static readonly DaysToMonth365: Array<number> = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
        public static readonly DaysToMonth366: Array<number> = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];

        private static readonly TicksMask = 0x3FFFFFFFFFFFFFFF;
        private static readonly FlagsMask = 0xC000000000000000;
        private static readonly LocalMask = 0x8000000000000000;
        private static readonly TicksCeiling = 0x4000000000000000;
        private static readonly KindUnspecified = 0x0000000000000000;
        private static readonly KindUtc = 0x4000000000000000;
        private static readonly KindLocal = 0x8000000000000000;
        private static readonly KindLocalAmbiguousDst = 0xC000000000000000;
        private static readonly KindShift = 62;

        private _ticks: number;
        private _kind: DateTimeKind;

        public constructor(year?: number, month?: number | DateTimeKind, day?: number, hour?: number | DateTimeKind, minute?: number, second?: number, millisecond?: number, kind?: DateTimeKind) {
            switch (arguments.length) {
                case 0:
                    this._ticks = 0;
                    this._kind = DateTimeKind.unspecified;
                    break;
                case 1:
                    this._ticks = year;
                    this._kind = DateTimeKind.unspecified;
                    break;
                case 2:
                    this._ticks = year;
                    this._kind = <DateTimeKind>month;
                    break;
                case 3:
                    kind = DateTimeKind.unspecified;
                    this.initialize(year, month, day, 0, 0, 0, 0, kind);
                    break;
                case 4:
                    kind = <DateTimeKind>hour;
                    this.initialize(year, month, day, 0, 0, 0, 0, kind);
                    break;
                case 6:
                    kind = DateTimeKind.unspecified;
                    this.initialize(year, month, day, hour, minute, second, 0, kind);
                    break;
                case 7:
                    kind = DateTimeKind.unspecified;
                    this.initialize(year, month, day, hour, minute, second, millisecond, kind);
                    break;
                case 8:
                    this.initialize(year, month, day, hour, minute, second, millisecond, kind);
                    break;
            }
        }

        public static get utcNow(): DateTime {
            let date = new Date();
            let milliseconds = date.getTime();
            let ticks = milliseconds * DateTime.TicksPerMillisecond;
            let offset = date.getTimezoneOffset() * DateTime.TicksPerMinute;
            return new DateTime(621355968000000000 + ticks + offset, DateTimeKind.utc);
        }
        public static get now(): DateTime {
            let date = new Date();
            let milliseconds = date.getTime();
            let ticks = milliseconds * DateTime.TicksPerMillisecond;
            return new DateTime(621355968000000000 + ticks, DateTimeKind.local);
        }
        public static get today(): DateTime {
            return DateTime.now.date;
        }

        public get kind(): DateTimeKind {
            return this._kind;
        }
        public get date(): DateTime {
            let ticks = this._ticks;
            return new DateTime((ticks - ticks % DateTime.TicksPerDay), this._kind);
        }
        public get timeOfDay(): TimeSpan {
            return new TimeSpan(this._ticks % DateTime.TicksPerDay);
        }
        public get dayOfWeek(): DayOfWeek {
            return <DayOfWeek>((this._ticks / DateTime.TicksPerDay + 1) % 7);
        }
        public get dayOfYear(): number {
            return this.getDatePart(DateTime.DatePartDayOfYear);
        }
        public get ticks(): number {
            return this._ticks;
        }
        public get year(): number {
            return this.getDatePart(DateTime.DatePartYear);
        }
        public get month(): number {
            return this.getDatePart(DateTime.DatePartMonth);
        }
        public get day(): number {
            return this.getDatePart(DateTime.DatePartDay);
        }
        public get hour(): number {
            return Convert.toInt32((this._ticks / DateTime.TicksPerHour) % 24);
        }
        public get minute(): number {
            return Convert.toInt32((this._ticks / DateTime.TicksPerMinute) % 60);
        }
        public get second(): number {
            return Convert.toInt32((this._ticks / DateTime.TicksPerSecond) % 60);
        }
        public get millisecond(): number {
            return Convert.toInt32((this._ticks / DateTime.TicksPerMillisecond) % 1000);
        }
        public get timestamp(): number {
            return Math.floor((this._ticks - 621355968000000000) / DateTime.TicksPerSecond);
        }

        private static isLeapYear(year: number): boolean {
            if (year < 1 || year > 9999)
                throw new Error("argument out of range year");

            return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        }
        private static daysInMonth(year: number, month: number): number {
            if (month < 1 || month > 12)
                throw new Error("argument out of range month");

            let days = DateTime.isLeapYear(year) ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
            return days[month] - days[month - 1];
        }
        private static dateToTicks(year: number, month: number, day: number): number {
            if (year >= 1 && year <= 9999 && month >= 1 && month <= 12) {
                let days = DateTime.isLeapYear(year) ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
                if (day >= 1 && day <= days[month] - days[month - 1]) {
                    let y = year - 1;
                    let n = y * 365 + Convert.toInt32(y / 4) - Convert.toInt32(y / 100) + Convert.toInt32(y / 400) + days[month - 1] + day - 1;
                    return n * DateTime.TicksPerDay;
                }
            }
            throw new Error("argument out of range bad year month day");
        }
        private static timeToTicks(hour: number, minute: number, second: number): number {
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60) {
                let totalSeconds = hour * 3600 + minute * 60 + second;
                if (totalSeconds > DateTime.MaxSeconds || totalSeconds < DateTime.MinSeconds)
                    throw new Error("overflow time span too long");

                return totalSeconds * DateTime.TicksPerSecond;
            }

            throw new Error("argument out of range bad hour minute second");
        }

        public static fromTimestamp(timestamp: number, kind: DateTimeKind = DateTimeKind.unspecified): DateTime {
            let ticks = timestamp * DateTime.TicksPerSecond + 621355968000000000;
            return new DateTime(ticks, kind);
        }

        private initialize(year: number, month: number, days: number, hour: number, minute: number, second: number, millisecond: number, kind: DateTimeKind): void {
            this._ticks = DateTime.dateToTicks(year, month, days);
            this._ticks += DateTime.timeToTicks(hour, minute, second);
            this._ticks += millisecond * TimeSpan.TicksPerMillisecond;
            this._kind = kind;
        }
        private getDatePart(part: number): number {
            let ticks = this._ticks;
            let n = Convert.toInt32(ticks / DateTime.TicksPerDay);
            let y400 = Convert.toInt32(n / DateTime.DaysPer400Years);
            n -= y400 * DateTime.DaysPer400Years;
            let y100 = Convert.toInt32(n / DateTime.DaysPer100Years);
            if (y100 == 4) y100 = 3;

            n -= y100 * DateTime.DaysPer100Years;
            let y4 = Convert.toInt32(n / DateTime.DaysPer4Years);
            n -= y4 * DateTime.DaysPer4Years;
            let y1 = Convert.toInt32(n / DateTime.DaysPerYear);
            if (y1 == 4) y1 = 3;
            if (part == DateTime.DatePartYear) {
                return y400 * 400 + y100 * 100 + y4 * 4 + y1 + 1;
            }

            n -= y1 * DateTime.DaysPerYear;
            if (part == DateTime.DatePartDayOfYear) return n + 1;

            let leapYear = y1 == 3 && (y4 != 24 || y100 == 3);
            let days = leapYear ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
            let m = n >> 5 + 1;
            while (n >= days[m]) m++;
            if (part == DateTime.DatePartMonth)
                return m;

            return n - days[m - 1] + 1;
        }
        private getDateParts(): DataParts {
            let ticks = this._ticks;
            let n = Convert.toInt32(ticks / DateTime.TicksPerDay);
            let y400 = Convert.toInt32(n / DateTime.DaysPer400Years);
            n -= y400 * DateTime.DaysPer400Years;
            let y100 = Convert.toInt32(n / DateTime.DaysPer100Years);
            if (y100 == 4) y100 = 3;

            n -= y100 * DateTime.DaysPer100Years;
            let y4 = Convert.toInt32(n / DateTime.DaysPer4Years);
            n -= y4 * DateTime.DaysPer4Years;
            let y1 = Convert.toInt32(n / DateTime.DaysPerYear);
            if (y1 == 4) y1 = 3;

            let year = y400 * 400 + y100 * 100 + y4 * 4 + y1 + 1;
            n -= y1 * DateTime.DaysPerYear;
            let leapYear = y1 == 3 && (y4 != 24 || y100 == 3);
            let days = leapYear ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
            let m = (n >> 5) + 1;
            while (n >= days[m]) m++;

            let day = n - days[m - 1] + 1;
            return { year: year, month: m, day: day };
        }
        private addDatePart(value: number, scale: number): DateTime {
            let millis = Math.floor(value * scale + (value >= 0 ? 0.5 : -0.5));
            if (millis <= -DateTime.MaxMillis || millis >= DateTime.MaxMillis)
                throw new Error("argument out of range add value");

            return this.addTicks(millis * DateTime.TicksPerMillisecond);
        }
        private revisal(value: number): string {
            return value <= 9 ? '0' + value : value.toString();
        }

        public toLocalTime(): DateTime {
            switch (this._kind) {
                case DateTimeKind.unspecified:
                case DateTimeKind.utc:
                    let offset = new Date().getTimezoneOffset() * DateTime.TicksPerMinute;
                    return new DateTime(this.ticks - offset, DateTimeKind.local);
                default:
                    return this;;
            }
        }
        public addTicks(value): DateTime {
            let ticks = this._ticks;
            if (value > DateTime.MaxTicks - ticks || value < DateTime.MinTicks - ticks) {
                throw new Error("argument out of range date arithmetic");
            }

            return new DateTime(ticks + value, this._kind);
        }
        public addMilliseconds(value: number): DateTime {
            return this.addDatePart(value, 1);
        }
        public addSeconds(value: number): DateTime {
            return this.addDatePart(value, DateTime.MillisPerSecond);
        }
        public addMinutes(value: number): DateTime {
            return this.addDatePart(value, DateTime.MillisPerMinute);
        }
        public addHours(value: number): DateTime {
            return this.addDatePart(value, DateTime.MillisPerHour);
        }
        public addDays(value: number): DateTime {
            return this.addDatePart(value, DateTime.MillisPerDay);
        }
        public addMonths(months: number): DateTime {
            if (months < -120000 || months > 120000)
                throw new Error("argument out of range date time bad months");

            let tuple = this.getDateParts();
            let y = tuple.year;
            let m = tuple.month;
            let d = tuple.day;

            let i = m - 1 + months;
            if (i >= 0) {
                m = i % 12 + 1;
                y = y + Convert.toInt32(i / 12);
            } else {
                m = 12 + (i + 1) % 12;
                y = y + Convert.toInt32((i - 11) / 12);
            }
            if (y < 1 || y > 9999)
                throw new Error("argument out of range date arithmetic");

            let days = DateTime.daysInMonth(y, m);
            if (d > days) d = days;

            let dateTicks = DateTime.dateToTicks(y, m, d);
            let timeTicks = this._ticks % DateTime.TicksPerDay;
            return new DateTime(dateTicks + timeTicks, this._kind);
        }
        public addYears(value: number): DateTime {
            if (value < -10000 || value > 10000)
                throw new Error("argument out of range date time bad years");

            return this.addMonths(value * 12);
        }

        public add(value: TimeSpan): DateTime {
            if (!(value instanceof TimeSpan))
                throw new ArgumentException('value type error.');

            return this.addTicks(value.ticks);
        }
        public subtract(value: DateTime | TimeSpan): TimeSpan | DateTime {
            if (value instanceof DateTime)
                return new TimeSpan(this._ticks - value._ticks);
            if (value instanceof TimeSpan)
                return new DateTime(this._ticks - value.ticks, this._kind);

            throw new Error('type error!');
        }

        public toString(format?: string): string {
            if (format == null) {
                return `${this.year}-${this.revisal(this.month)}-${this.revisal(this.day)} ${this.revisal(this.hour)}:${this.revisal(this.minute)}:${this.revisal(this.second)}`
            } else {
                //yyyy-MM-dd HH:mm:ss.fff
                format = format.replace('yyyy', this.year.toString());
                format = format.replace('MM', this.revisal(this.month));
                format = format.replace('dd', this.revisal(this.day));
                format = format.replace('HH', this.revisal(this.hour));
                format = format.replace('mm', this.revisal(this.minute));
                format = format.replace('ss', this.revisal(this.second));
                format = format.replace('fff', this.millisecond.toString());
                return format;
            }
        }
    }

    return {
        Object: NObject,

        Exception: Exception,
        ArgumentException: ArgumentException,
        ArgumentNullException: ArgumentNullException,
        ArgumentOutOfRangeException: ArgumentOutOfRangeException,
        SystemException: SystemException,
        InvalidCastException: InvalidCastException,
        InvalidOperationException: InvalidOperationException,
        NotImplementedException: NotImplementedException,
        NotSupportedException: NotSupportedException,

        Char: Char,
        String: String,
        BitConverter: BitConverter,

        Type: Type,
        Guid: Guid,
        DateTimeKind: DateTimeKind,
        TimeSpan: TimeSpan,
        DateTime: DateTime,

        Event: Event,
        KeyEvent: KeyEvent,
        EventDispatcher: EventDispatcher,
    };
});