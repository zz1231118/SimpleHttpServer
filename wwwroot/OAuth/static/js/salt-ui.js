var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var SaltUI;
(function (SaltUI) {
    var EventArgs = /** @class */ (function () {
        function EventArgs() {
        }
        EventArgs.Empty = new EventArgs();
        return EventArgs;
    }());
    var Dictionary = /** @class */ (function () {
        function Dictionary() {
            this._keys = new Array();
            this._values = new Array();
        }
        Dictionary.prototype.add = function (key, value) {
            if (this.containsKey(key))
                throw new Error("key exists");
            this._keys.push(key);
            this._values.push(value);
        };
        Dictionary.prototype.remove = function (key) {
            var index = this._keys.indexOf(key);
            if (index < 0) {
                return false;
            }
            this._keys.splice(index, 1);
            this._values.splice(index, 1);
            return true;
        };
        Dictionary.prototype.containsKey = function (key) {
            return this._keys.indexOf(key) >= 0;
        };
        Dictionary.prototype.get = function (key) {
            var index = this._keys.indexOf(key);
            if (index < 0)
                throw new Error("key not found!");
            return this._values[index];
        };
        return Dictionary;
    }());
    var UIElement = /** @class */ (function () {
        function UIElement() {
            this._events = new Dictionary();
        }
        UIElement.prototype.addEventListener = function (key, handler) {
            var array;
            if (this._events.containsKey(key)) {
                array = this._events.get(key);
            }
            else {
                array = new Array();
                this._events.add(key, array);
            }
            array.push(handler);
        };
        UIElement.prototype.removeEventListener = function (key, handler) {
            if (this._events.containsKey(key)) {
                var events = this._events.get(key);
                var index = events.indexOf(handler);
                if (index >= 0) {
                    events.splice(index, 1);
                    return true;
                }
            }
            return false;
        };
        UIElement.prototype.dispatchEvent = function (key, e) {
            if (this._events.containsKey(key)) {
                var array = this._events.get(key);
                for (var i = 0; i < array.length; i++) {
                    var handler = array[i];
                    handler(this, e);
                }
            }
        };
        return UIElement;
    }());
    var SelectCombox = /** @class */ (function (_super) {
        __extends(SelectCombox, _super);
        function SelectCombox(obj) {
            var _this = this;
            if (obj == null)
                throw new Error('obj is null');
            _this = _super.call(this) || this;

            var box = document.getElementById(obj.key);
            box.className = 'form-horizontal';

            var select = document.createElement('select');
            select.className = 'combox-header';
            select.onchange = function(p) { return _this.selectChanged(); };

            var input = document.createElement('input');
            input.className = 'control-input combox-input';
            input.type = 'text';
            input.oninput = function(p) { return _this.selectChanged(); };

            for (var i = 0; i < obj.options.length; i++) {
                var op = obj.options[i];
                var option = document.createElement('option');
                option.value = op.value;
                option.innerHTML = op.key;
                select.appendChild(option);
            }
        
            box.appendChild(select);
            box.appendChild(input);

            _this._select = select;
            _this._input = input;
            if (obj.hasOwnProperty("change")) {
                _super.prototype.addEventListener.call(_this, SelectCombox.Changed, obj.change);
            }
            return _this;
        }
        Object.defineProperty(SelectCombox.prototype, "value", {
            get: function () {
                return this._input.value;
            },
            set: function (value) {
                this._input.value = value;
                this.selectChanged();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SelectCombox.prototype, 'key', {
            get: function() {
                var index = this._select.selectedIndex;
                var option = this._select.options[index];
                return option.value;
            },
            set: function(value) {
                var index = -1;
                var options = this._select.options;
                for (var i = 0; i < options.length; i++) {
                    var option = options[i];
                    if (option.value == value) {
                        index = i;
                        break;
                    }
                }
                if (index >= 0) {
                    this._select.selectedIndex = index;
                    this.selectChanged();
                }
            },
            enumerable: true,
            configurable: true
        });
        SelectCombox.prototype.selectChanged = function () {
            _super.prototype.dispatchEvent.call(this, SelectCombox.Changed, EventArgs.Empty);
        };
        SelectCombox.Changed = "Changed";
        return SelectCombox;
    }(UIElement));
    SaltUI.SelectCombox = SelectCombox;
})(SaltUI || (SaltUI = {}));