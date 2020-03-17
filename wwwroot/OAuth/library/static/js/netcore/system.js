define((require) => {
    let generic = require('./system.collections.generic');
    let List = generic.List;
    let Dictionary = generic.Dictionary;
    class NObject {
        static memberwiseClone(obj) {
            if (obj == null)
                throw new ArgumentNullException('obj');
            let newobj = {};
            for (let key in obj) {
                newobj[key] = obj[key];
            }
            return newobj;
        }
        equals(obj) {
            return obj === this;
        }
        getType() {
            return Type.fromObject(this);
        }
    }
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
    class SystemException extends Exception {
        constructor(message = null) {
            super(message);
        }
    }
    class InvalidCastException extends SystemException {
        constructor(message = null) {
            super(message);
        }
    }
    class InvalidOperationException extends SystemException {
        constructor(message = null) {
            super(message);
        }
    }
    class ArithmeticException extends SystemException {
        constructor(message = null) {
            super(message);
        }
    }
    class OverflowException extends ArithmeticException {
        constructor(message = null) {
            super(message);
        }
    }
    class NotImplementedException extends SystemException {
        constructor(message = null) {
            super(message);
        }
    }
    class NotSupportedException extends SystemException {
        constructor(message = null) {
            super(message);
        }
    }
    class Type {
        get fullName() {
            return this._fullName;
        }
        get name() {
            let index = this._fullName.lastIndexOf('.');
            if (index >= 0) {
                return this._fullName.substring(index + 1, this._fullName.length);
            }
            return this._fullName;
        }
        get default() {
            switch (this.name) {
                case 'Number':
                    return 0;
                case 'Boolean':
                    return false;
                default:
                    return null;
            }
        }
        get isValueType() {
            return this.name === 'Number';
        }
        static isType(obj, name) {
            return Object.toString.call(obj) == '[object ' + name + ']';
        }
        static isUndefined(obj) {
            return typeof (obj) === 'undefined';
        }
        static isNull(obj) {
            return new String(obj).toString() === 'null';
        }
        static isNumber(obj) {
            return typeof (obj) === 'number';
        }
        static isBoolean(obj) {
            return typeof (obj) === 'boolean';
        }
        static isString(obj) {
            return typeof (obj) === 'string';
        }
        static isFunction(obj) {
            return typeof (obj) === 'function';
        }
        static isObject(obj) {
            return Type.isType(obj, 'Object');
        }
        static isArray(obj) {
            return Type.isType(obj, 'Array');
        }
        static fromType(constructor) {
            if (constructor == null)
                throw new ArgumentNullException('constructor');
            let type;
            let key = constructor.prototype.constructor.name;
            if (Type._types.containsKey(key)) {
                type = Type._types.get(key);
            }
            else {
                type = new Type();
                type._fullName = key;
                Type._types.add(key, type);
            }
            return type;
        }
        static fromObject(obj) {
            if (obj == null)
                throw new ArgumentNullException('obj');
            let type;
            let key = obj.__proto__.__class__ || obj.__proto__.constructor.name;
            if (Type._types.containsKey(key)) {
                type = Type._types.get(key);
            }
            else {
                type = new Type();
                type._fullName = key;
                Type._types.add(key, type);
            }
            return type;
        }
        static getType(name) {
            if (name == null)
                throw new ArgumentNullException('name');
            let type;
            if (Type._types.containsKey(name)) {
                type = Type._types.get(name);
            }
            else {
                type = new Type();
                type._fullName = name;
                Type._types.add(name, type);
            }
            return type;
        }
        equals(obj) {
            if (obj instanceof Type) {
                let other = obj;
                return other._fullName === this._fullName;
            }
            return false;
        }
    }
    Type._types = new Dictionary();
    class Event {
        constructor(type, data) {
            this._type = type;
            this._data = data;
        }
        get type() {
            return this._type;
        }
        get target() {
            return this._target;
        }
        get currentTarget() {
            return this._target;
        }
        get data() {
            return this._data;
        }
        setTarget(target) {
            this._target = target;
        }
    }
    class KeyEvent extends Event {
        constructor(type, key, keyCode, repeat = false, altKey = false, ctrlKey = false, metaKey = false, shiftKey = false) {
            super(type);
            this._key = key;
            this._keyCode = keyCode;
            this._repeat = repeat;
            this._altKey = altKey;
            this._ctrlKey = ctrlKey;
            this._metaKey = metaKey;
            this._shiftKey = shiftKey;
        }
        get key() {
            return this._key;
        }
        get keyCode() {
            return this._keyCode;
        }
        get repeat() {
            return this._repeat;
        }
        get altKey() {
            return this._altKey;
        }
        get ctrlKey() {
            return this._ctrlKey;
        }
        get metaKey() {
            return this._metaKey;
        }
        get shiftKey() {
            return this._shiftKey;
        }
    }
    class EventListener {
        constructor(handler, callTarget) {
            this._handler = handler;
            this._callTarget = callTarget;
        }
        get handler() {
            return this._handler;
        }
        get callTarget() {
            return this._callTarget;
        }
        invoke(e) {
            this._handler.call(this._callTarget, e);
        }
    }
    class EventDispatcher {
        addEventListener(key, handler, obj = null) {
            if (key == null)
                throw new ArgumentNullException('key');
            if (handler == null)
                throw new ArgumentNullException('handler');
            let listeners;
            if (this._eventListeners === undefined) {
                listeners = new List();
                this._eventListeners = new Dictionary();
                this._eventListeners.add(key, listeners);
            }
            else if (this._eventListeners.containsKey(key)) {
                listeners = this._eventListeners.get(key);
            }
            else {
                listeners = new List();
                this._eventListeners.add(key, listeners);
            }
            listeners.add(new EventListener(handler, obj));
        }
        removeEventListener(key, handler) {
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
        clearEventListener(key) {
            if (this._eventListeners !== undefined) {
                this._eventListeners.remove(key);
            }
        }
        dispatchEvent(e) {
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
        dispatchEventWith(type, data) {
            if (type == null)
                throw new ArgumentNullException('type');
            this.dispatchEvent(new Event(type, data));
        }
    }
    class Convert {
        static toInt32(value) {
            if (Type.isNumber(value))
                return value >= 0 ? Math.floor(value) : Math.ceil(value);
            if (Type.isString(value))
                return parseInt(value);
            throw new InvalidCastException('value');
        }
        static toInt64(value) {
            if (Type.isNumber(value))
                return value >= 0 ? Math.floor(value) : Math.ceil(value);
            if (Type.isString(value))
                return parseInt(value);
            throw new InvalidCastException('value');
        }
    }
    class BitConverter {
        static getInt16(array, offset = 0) {
            if (array == null)
                throw new ArgumentNullException('array');
            return array[offset + 0] << 0 +
                array[offset + 1] << 8;
        }
        static getInt32(array, offset = 0) {
            if (array == null)
                throw new ArgumentNullException('array');
            return array[offset] +
                array[offset + 1] << 8 +
                array[offset + 2] << 16 +
                array[offset + 3] << 24;
        }
        static getInt64(array, offset = 0) {
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
            }
            else {
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
        static int16ConvertTo(array, offset, value) {
            if (array == null)
                throw new ArgumentNullException('array');
            array[offset + 0] = (value >> 0) & 0xFF;
            array[offset + 1] = (value >> 8) & 0xFF;
        }
        static int32ConvertTo(array, offset, value) {
            if (array == null)
                throw new ArgumentNullException('array');
            array[offset] = (value) & 0xFF;
            array[offset + 1] = (value >> 8) & 0xFF;
            array[offset + 2] = (value >> 16) & 0xFF;
            array[offset + 3] = (value >> 24) & 0xFF;
        }
        static int64ConvertTo(array, offset, value) {
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
            }
            else {
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
    }
    Int64.MaxValue = 0x7fffffffffffffff;
    Int64.MinValue = -0x8000000000000000;
    class Char {
        static isNumber(ch) {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';
            let num = ch.charCodeAt(0);
            return Char._0CharNumber <= num && num <= Char._9CharNumber;
        }
        static isLetter(ch) {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';
            let num = ch.charCodeAt(0);
            return (Char._aCharNumber <= num && num <= Char._zCharNumber) || (Char._ACharNumber <= num && num <= Char._ZCharNumber);
        }
        static isWhiteSpace(ch) {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';
            return ch.charCodeAt(0) === Char._spaceCharNumber;
        }
        static isUnderline(ch) {
            if (ch == null)
                throw 'argument null exception: ch';
            if (ch.length !== 1)
                throw 'argument exception: ch length error.';
            return ch.charCodeAt(0) === Char._underlineCharNumber;
        }
    }
    Char._0CharNumber = '0'.charCodeAt(0);
    Char._9CharNumber = '9'.charCodeAt(0);
    Char._aCharNumber = 'a'.charCodeAt(0);
    Char._zCharNumber = 'z'.charCodeAt(0);
    Char._ACharNumber = 'A'.charCodeAt(0);
    Char._ZCharNumber = 'Z'.charCodeAt(0);
    Char._spaceCharNumber = ' '.charCodeAt(0);
    Char._underlineCharNumber = '_'.charCodeAt(0);
    class String {
        constructor(value, count) {
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
        get length() {
            return this._text.length;
        }
        static join(separator, collection) {
            if (collection == null)
                throw new ArgumentNullException('collection');
            let text = '';
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
        padLeft(totalWidth, paddingChar) {
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
        padRight(totalWidth, paddingChar) {
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
        toString() {
            return this._text;
        }
    }
    class Guid {
        static newGuid() {
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
        toNormalizeString() {
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
        toByteArray() {
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
        toString(format) {
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
        constructor(days, hours, minutes, seconds, milliseconds) {
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
        static get zero() {
            return new TimeSpan(0);
        }
        static get maxValue() {
            return new TimeSpan(Int64.MaxValue);
        }
        static get minValue() {
            return new TimeSpan(Int64.MinValue);
        }
        get ticks() {
            return this._ticks;
        }
        get days() {
            return Convert.toInt32(this._ticks / TimeSpan.TicksPerDay);
        }
        get hours() {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerHour) % 24);
        }
        get minutes() {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerMinute) % 60);
        }
        get seconds() {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerSecond) % 60);
        }
        get milliseconds() {
            return Convert.toInt32((this._ticks / TimeSpan.TicksPerMillisecond) % 1000);
        }
        get totalDays() {
            return this._ticks * TimeSpan.DaysPerTick;
        }
        get totalHours() {
            return this._ticks * TimeSpan.HoursPerTick;
        }
        get totalMinutes() {
            return this._ticks * TimeSpan.MinutesPerTick;
        }
        get totalSeconds() {
            return this._ticks * TimeSpan.SecondsPerTick;
        }
        get totalMilliseconds() {
            let temp = this._ticks * TimeSpan.MillisecondsPerTick;
            if (temp > TimeSpan.MaxMilliSeconds)
                return TimeSpan.MaxMilliSeconds;
            if (temp < TimeSpan.MinMilliSeconds)
                return TimeSpan.MinMilliSeconds;
            return temp;
        }
        static interval(value, scale) {
            let tmp = value * scale;
            let millis = tmp + (value >= 0 ? 0.5 : -0.5);
            if ((millis > Int64.MaxValue / TimeSpan.TicksPerMillisecond) || (millis < Int64.MinValue / TimeSpan.TicksPerMillisecond))
                throw new OverflowException('overflow time span too long.');
            return new TimeSpan(Convert.toInt64(millis) * TimeSpan.TicksPerMillisecond);
        }
        static timeToTicks(hour, minute, second) {
            let totalSeconds = Convert.toInt64(hour) * 3600 + Convert.toInt64(minute) * 60 + Convert.toInt64(second);
            if (totalSeconds > TimeSpan.MaxSeconds || totalSeconds < TimeSpan.MinSeconds)
                throw new ArgumentOutOfRangeException('overflow time span too long.');
            return Convert.toInt64(totalSeconds * TimeSpan.TicksPerSecond);
        }
        initialize(days, hours, minutes, seconds, milliseconds) {
            let totalMilliSeconds = Convert.toInt64(Convert.toInt64(days) * TimeSpan.MillisPerDay) +
                Convert.toInt64(Convert.toInt64(hours) * TimeSpan.MillisPerHour) +
                Convert.toInt64(Convert.toInt64(minutes) * TimeSpan.MillisPerMinute) +
                Convert.toInt64(Convert.toInt64(seconds) * TimeSpan.MillisPerSecond) +
                Convert.toInt64(milliseconds);
            if (totalMilliSeconds > TimeSpan.MaxMilliSeconds || totalMilliSeconds < TimeSpan.MinMilliSeconds)
                throw new ArgumentOutOfRangeException('overflow time span too long.');
            this._ticks = Convert.toInt64(totalMilliSeconds) * TimeSpan.TicksPerMillisecond;
        }
        revisal(value) {
            return value <= 9 ? '0' + value : value.toString();
        }
        static fromDays(value) {
            return TimeSpan.interval(value, TimeSpan.MillisPerDay);
        }
        static fromHours(value) {
            return TimeSpan.interval(value, TimeSpan.MillisPerHour);
        }
        static fromMinutes(value) {
            return TimeSpan.interval(value, TimeSpan.MillisPerMinute);
        }
        static fromSeconds(value) {
            return TimeSpan.interval(value, TimeSpan.MillisPerSecond);
        }
        static fromMilliseconds(value) {
            return TimeSpan.interval(value, 1);
        }
        static fromTicks(value) {
            return new TimeSpan(value);
        }
        static parse(value) {
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
        add(ts) {
            if (!(ts instanceof TimeSpan))
                throw new ArgumentNullException('ts not type of "TimeSpan"');
            let result = this._ticks + ts._ticks;
            if (((this._ticks >> 63) === (ts._ticks >> 63)) && ((this._ticks >> 63) !== (result >> 63)))
                throw new OverflowException('overflow time span too long.');
            return new TimeSpan(result);
        }
        subtract(ts) {
            if (!(ts instanceof TimeSpan))
                throw new ArgumentNullException('ts not type of "TimeSpan"');
            let result = this._ticks - ts._ticks;
            if (((this._ticks >> 63) !== (ts._ticks >> 63)) && ((this._ticks >> 63) !== (result >> 63)))
                throw new OverflowException('overflow time span too long.');
            return new TimeSpan(result);
        }
        negate() {
            if (this._ticks === TimeSpan.minValue._ticks)
                throw new OverflowException('overflow negate twos comp num.');
            return new TimeSpan(-this._ticks);
        }
        duration() {
            if (this._ticks === TimeSpan.minValue._ticks)
                throw new OverflowException('overflow duration.');
            return new TimeSpan(this._ticks >= 0 ? this._ticks : -this._ticks);
        }
        toString(format) {
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
            }
            else {
                format = format.replace('dd', day.toString());
                format = format.replace('HH', this.revisal(hour));
                format = format.replace('mm', this.revisal(minute));
                format = format.replace('ss', this.revisal(second));
                format = format.replace('fff', millisecond.toString());
                return format;
            }
        }
    }
    TimeSpan.TicksPerMillisecond = 10000;
    TimeSpan.TicksPerSecond = TimeSpan.TicksPerMillisecond * 1000;
    TimeSpan.TicksPerMinute = TimeSpan.TicksPerSecond * 60;
    TimeSpan.TicksPerHour = TimeSpan.TicksPerMinute * 60;
    TimeSpan.TicksPerDay = TimeSpan.TicksPerHour * 24;
    TimeSpan.DaysPerTick = 1.0 / TimeSpan.TicksPerDay;
    TimeSpan.HoursPerTick = 1.0 / TimeSpan.TicksPerHour;
    TimeSpan.MinutesPerTick = 1.0 / TimeSpan.TicksPerMinute;
    TimeSpan.SecondsPerTick = 1.0 / TimeSpan.TicksPerSecond;
    TimeSpan.MillisecondsPerTick = 1.0 / TimeSpan.TicksPerMillisecond;
    TimeSpan.MillisPerSecond = 1000;
    TimeSpan.MillisPerMinute = TimeSpan.MillisPerSecond * 60;
    TimeSpan.MillisPerHour = TimeSpan.MillisPerMinute * 60;
    TimeSpan.MillisPerDay = TimeSpan.MillisPerHour * 24;
    TimeSpan.MaxSeconds = Convert.toInt64(Int64.MaxValue / TimeSpan.TicksPerSecond);
    TimeSpan.MinSeconds = Convert.toInt64(Int64.MinValue / TimeSpan.TicksPerSecond);
    TimeSpan.MaxMilliSeconds = Int64.MaxValue / TimeSpan.TicksPerMillisecond;
    TimeSpan.MinMilliSeconds = Int64.MinValue / TimeSpan.TicksPerMillisecond;
    let DateTimeKind;
    (function (DateTimeKind) {
        DateTimeKind[DateTimeKind["unspecified"] = 0] = "unspecified";
        DateTimeKind[DateTimeKind["utc"] = 1] = "utc";
        DateTimeKind[DateTimeKind["local"] = 2] = "local";
    })(DateTimeKind || (DateTimeKind = {}));
    let DayOfWeek;
    (function (DayOfWeek) {
        DayOfWeek[DayOfWeek["sunday"] = 0] = "sunday";
        DayOfWeek[DayOfWeek["monday"] = 1] = "monday";
        DayOfWeek[DayOfWeek["tuesday"] = 2] = "tuesday";
        DayOfWeek[DayOfWeek["wednesday"] = 3] = "wednesday";
        DayOfWeek[DayOfWeek["thursday"] = 4] = "thursday";
        DayOfWeek[DayOfWeek["friday"] = 5] = "friday";
        DayOfWeek[DayOfWeek["saturday"] = 6] = "saturday";
    })(DayOfWeek || (DayOfWeek = {}));
    class DateTime {
        constructor(year, month, day, hour, minute, second, millisecond, kind) {
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
                    this._kind = month;
                    break;
                case 3:
                    kind = DateTimeKind.unspecified;
                    this.initialize(year, month, day, 0, 0, 0, 0, kind);
                    break;
                case 4:
                    kind = hour;
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
        static get utcNow() {
            let date = new Date();
            let milliseconds = date.getTime();
            let ticks = milliseconds * DateTime.TicksPerMillisecond;
            let offset = date.getTimezoneOffset() * DateTime.TicksPerMinute;
            return new DateTime(621355968000000000 + ticks + offset, DateTimeKind.utc);
        }
        static get now() {
            let date = new Date();
            let milliseconds = date.getTime();
            let ticks = milliseconds * DateTime.TicksPerMillisecond;
            return new DateTime(621355968000000000 + ticks, DateTimeKind.local);
        }
        static get today() {
            return DateTime.now.date;
        }
        get kind() {
            return this._kind;
        }
        get date() {
            let ticks = this._ticks;
            return new DateTime((ticks - ticks % DateTime.TicksPerDay), this._kind);
        }
        get timeOfDay() {
            return new TimeSpan(this._ticks % DateTime.TicksPerDay);
        }
        get dayOfWeek() {
            return ((this._ticks / DateTime.TicksPerDay + 1) % 7);
        }
        get dayOfYear() {
            return this.getDatePart(DateTime.DatePartDayOfYear);
        }
        get ticks() {
            return this._ticks;
        }
        get year() {
            return this.getDatePart(DateTime.DatePartYear);
        }
        get month() {
            return this.getDatePart(DateTime.DatePartMonth);
        }
        get day() {
            return this.getDatePart(DateTime.DatePartDay);
        }
        get hour() {
            return Convert.toInt32((this._ticks / DateTime.TicksPerHour) % 24);
        }
        get minute() {
            return Convert.toInt32((this._ticks / DateTime.TicksPerMinute) % 60);
        }
        get second() {
            return Convert.toInt32((this._ticks / DateTime.TicksPerSecond) % 60);
        }
        get millisecond() {
            return Convert.toInt32((this._ticks / DateTime.TicksPerMillisecond) % 1000);
        }
        get timestamp() {
            return Math.floor((this._ticks - 621355968000000000) / DateTime.TicksPerSecond);
        }
        static isLeapYear(year) {
            if (year < 1 || year > 9999)
                throw new Error("argument out of range year");
            return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        }
        static daysInMonth(year, month) {
            if (month < 1 || month > 12)
                throw new Error("argument out of range month");
            let days = DateTime.isLeapYear(year) ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
            return days[month] - days[month - 1];
        }
        static dateToTicks(year, month, day) {
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
        static timeToTicks(hour, minute, second) {
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60) {
                let totalSeconds = hour * 3600 + minute * 60 + second;
                if (totalSeconds > DateTime.MaxSeconds || totalSeconds < DateTime.MinSeconds)
                    throw new Error("overflow time span too long");
                return totalSeconds * DateTime.TicksPerSecond;
            }
            throw new Error("argument out of range bad hour minute second");
        }
        static fromTimestamp(timestamp, kind = DateTimeKind.unspecified) {
            let ticks = timestamp * DateTime.TicksPerSecond + 621355968000000000;
            return new DateTime(ticks, kind);
        }
        initialize(year, month, days, hour, minute, second, millisecond, kind) {
            this._ticks = DateTime.dateToTicks(year, month, days);
            this._ticks += DateTime.timeToTicks(hour, minute, second);
            this._ticks += millisecond * TimeSpan.TicksPerMillisecond;
            this._kind = kind;
        }
        getDatePart(part) {
            let ticks = this._ticks;
            let n = Convert.toInt32(ticks / DateTime.TicksPerDay);
            let y400 = Convert.toInt32(n / DateTime.DaysPer400Years);
            n -= y400 * DateTime.DaysPer400Years;
            let y100 = Convert.toInt32(n / DateTime.DaysPer100Years);
            if (y100 == 4)
                y100 = 3;
            n -= y100 * DateTime.DaysPer100Years;
            let y4 = Convert.toInt32(n / DateTime.DaysPer4Years);
            n -= y4 * DateTime.DaysPer4Years;
            let y1 = Convert.toInt32(n / DateTime.DaysPerYear);
            if (y1 == 4)
                y1 = 3;
            if (part == DateTime.DatePartYear) {
                return y400 * 400 + y100 * 100 + y4 * 4 + y1 + 1;
            }
            n -= y1 * DateTime.DaysPerYear;
            if (part == DateTime.DatePartDayOfYear)
                return n + 1;
            let leapYear = y1 == 3 && (y4 != 24 || y100 == 3);
            let days = leapYear ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
            let m = n >> 5 + 1;
            while (n >= days[m])
                m++;
            if (part == DateTime.DatePartMonth)
                return m;
            return n - days[m - 1] + 1;
        }
        getDateParts() {
            let ticks = this._ticks;
            let n = Convert.toInt32(ticks / DateTime.TicksPerDay);
            let y400 = Convert.toInt32(n / DateTime.DaysPer400Years);
            n -= y400 * DateTime.DaysPer400Years;
            let y100 = Convert.toInt32(n / DateTime.DaysPer100Years);
            if (y100 == 4)
                y100 = 3;
            n -= y100 * DateTime.DaysPer100Years;
            let y4 = Convert.toInt32(n / DateTime.DaysPer4Years);
            n -= y4 * DateTime.DaysPer4Years;
            let y1 = Convert.toInt32(n / DateTime.DaysPerYear);
            if (y1 == 4)
                y1 = 3;
            let year = y400 * 400 + y100 * 100 + y4 * 4 + y1 + 1;
            n -= y1 * DateTime.DaysPerYear;
            let leapYear = y1 == 3 && (y4 != 24 || y100 == 3);
            let days = leapYear ? DateTime.DaysToMonth366 : DateTime.DaysToMonth365;
            let m = (n >> 5) + 1;
            while (n >= days[m])
                m++;
            let day = n - days[m - 1] + 1;
            return { year: year, month: m, day: day };
        }
        addDatePart(value, scale) {
            let millis = Math.floor(value * scale + (value >= 0 ? 0.5 : -0.5));
            if (millis <= -DateTime.MaxMillis || millis >= DateTime.MaxMillis)
                throw new Error("argument out of range add value");
            return this.addTicks(millis * DateTime.TicksPerMillisecond);
        }
        revisal(value) {
            return value <= 9 ? '0' + value : value.toString();
        }
        toLocalTime() {
            switch (this._kind) {
                case DateTimeKind.unspecified:
                case DateTimeKind.utc:
                    let offset = new Date().getTimezoneOffset() * DateTime.TicksPerMinute;
                    return new DateTime(this.ticks - offset, DateTimeKind.local);
                default:
                    return this;
                    ;
            }
        }
        addTicks(value) {
            let ticks = this._ticks;
            if (value > DateTime.MaxTicks - ticks || value < DateTime.MinTicks - ticks) {
                throw new Error("argument out of range date arithmetic");
            }
            return new DateTime(ticks + value, this._kind);
        }
        addMilliseconds(value) {
            return this.addDatePart(value, 1);
        }
        addSeconds(value) {
            return this.addDatePart(value, DateTime.MillisPerSecond);
        }
        addMinutes(value) {
            return this.addDatePart(value, DateTime.MillisPerMinute);
        }
        addHours(value) {
            return this.addDatePart(value, DateTime.MillisPerHour);
        }
        addDays(value) {
            return this.addDatePart(value, DateTime.MillisPerDay);
        }
        addMonths(months) {
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
            }
            else {
                m = 12 + (i + 1) % 12;
                y = y + Convert.toInt32((i - 11) / 12);
            }
            if (y < 1 || y > 9999)
                throw new Error("argument out of range date arithmetic");
            let days = DateTime.daysInMonth(y, m);
            if (d > days)
                d = days;
            let dateTicks = DateTime.dateToTicks(y, m, d);
            let timeTicks = this._ticks % DateTime.TicksPerDay;
            return new DateTime(dateTicks + timeTicks, this._kind);
        }
        addYears(value) {
            if (value < -10000 || value > 10000)
                throw new Error("argument out of range date time bad years");
            return this.addMonths(value * 12);
        }
        add(value) {
            if (!(value instanceof TimeSpan))
                throw new ArgumentException('value type error.');
            return this.addTicks(value.ticks);
        }
        subtract(value) {
            if (value instanceof DateTime)
                return new TimeSpan(this._ticks - value._ticks);
            if (value instanceof TimeSpan)
                return new DateTime(this._ticks - value.ticks, this._kind);
            throw new Error('type error!');
        }
        toString(format) {
            if (format == null) {
                return `${this.year}-${this.revisal(this.month)}-${this.revisal(this.day)} ${this.revisal(this.hour)}:${this.revisal(this.minute)}:${this.revisal(this.second)}`;
            }
            else {
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
    DateTime.TicksPerMillisecond = 10000;
    DateTime.TicksPerSecond = DateTime.TicksPerMillisecond * 1000;
    DateTime.TicksPerMinute = DateTime.TicksPerSecond * 60;
    DateTime.TicksPerHour = DateTime.TicksPerMinute * 60;
    DateTime.TicksPerDay = DateTime.TicksPerHour * 24;
    DateTime.MaxSeconds = 0x7fffffffffffffff / DateTime.TicksPerSecond;
    DateTime.MinSeconds = 0x8000000000000000 / DateTime.TicksPerSecond;
    DateTime.DaysPerYear = 365;
    DateTime.DaysPer4Years = DateTime.DaysPerYear * 4 + 1; // 1461
    DateTime.DaysPer100Years = DateTime.DaysPer4Years * 25 - 1; // 36524
    DateTime.DaysPer400Years = DateTime.DaysPer100Years * 4 + 1; // 146097
    DateTime.DaysTo1601 = DateTime.DaysPer400Years * 4; // 584388
    DateTime.DaysTo1899 = DateTime.DaysPer400Years * 4 + DateTime.DaysPer100Years * 3 - 367;
    DateTime.DaysTo1970 = DateTime.DaysPer400Years * 4 + DateTime.DaysPer100Years * 3 + DateTime.DaysPer4Years * 17 + DateTime.DaysPerYear; // 719,162
    DateTime.DaysTo10000 = DateTime.DaysPer400Years * 25 - 366; // 3652059
    DateTime.DatePartYear = 0;
    DateTime.DatePartDayOfYear = 1;
    DateTime.DatePartMonth = 2;
    DateTime.DatePartDay = 3;
    DateTime.MillisPerSecond = 1000;
    DateTime.MillisPerMinute = DateTime.MillisPerSecond * 60;
    DateTime.MillisPerHour = DateTime.MillisPerMinute * 60;
    DateTime.MillisPerDay = DateTime.MillisPerHour * 24;
    DateTime.MinTicks = 0;
    DateTime.MaxTicks = DateTime.DaysTo10000 * DateTime.TicksPerDay - 1;
    DateTime.MaxMillis = Convert.toInt32(DateTime.DaysTo10000) * DateTime.MillisPerDay;
    DateTime.DaysToMonth365 = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    DateTime.DaysToMonth366 = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    DateTime.TicksMask = 0x3FFFFFFFFFFFFFFF;
    DateTime.FlagsMask = 0xC000000000000000;
    DateTime.LocalMask = 0x8000000000000000;
    DateTime.TicksCeiling = 0x4000000000000000;
    DateTime.KindUnspecified = 0x0000000000000000;
    DateTime.KindUtc = 0x4000000000000000;
    DateTime.KindLocal = 0x8000000000000000;
    DateTime.KindLocalAmbiguousDst = 0xC000000000000000;
    DateTime.KindShift = 62;
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
//# sourceMappingURL=system.js.map