(function(window) {

	let rboolean = /^(?:autofocus|autoplay|async|checked|controls|defer|disabled|hidden|loop|multiple|open|readonly|required|scoped|selected)$/i;
	let Char = function() { }
	Char._0 = '0'.charCodeAt(0);
	Char._9 = '9'.charCodeAt(0);
	Char._la = 'a'.charCodeAt(0);
	Char._lz = 'z'.charCodeAt(0);
	Char._ma = 'A'.charCodeAt(0);
	Char._mz = 'Z'.charCodeAt(0);
	Char.isDigit = function(ch) {
		let val = ch.charCodeAt(0);
		return Char._0 <= val && val <= Char._9;
	};
	Char.isLetter = function(ch) {
		let val = ch.charCodeAt(0);
		return (Char._la <= val && val <= Char._lz) || (Char._ma <= val && val <= Char._mz);
	};

	let Reader = function(str) {
		this._position = 0;
		this._str = str;
	}
	Reader.prototype.read = function() {
		return this._position >= this._str.length ? -1 : this._str.charAt(this._position++);
	};
	Reader.prototype.peek = function(offset = 0) {
		let position = this._position + offset;
		return position >= this._str.length ? -1 : this._str.charAt(position);
	};
	Reader.prototype.getPosition = function() {
		return this._position;
	};

	let HtmlElement = function(str) {
		this._reader = new Reader(str);
		this._name = null;
		this._content = null;
		this._attributes = new Array();

		let start = str.indexOf('>');
		let end = str.lastIndexOf('<');
		if (end >= 0 && end > start) {
			this._content = str.substring(start + 1, end);
		}

		this.init();
	}
	HtmlElement.prototype.readSpace = function() {
		let ch;
		while((ch = this._reader.peek()) != -1) {
			if (ch == ' ') {
				this._reader.read();
			} else {
				break;
			}
		}
	};
	HtmlElement.prototype.readSymbol = function() {
		let ch = this._reader.read();
		if (!Char.isLetter(ch) && ch != '_') {
			throw ("read symbol error: " + ch);
		}

		let name = ch;
		while((ch = this._reader.peek()) != -1) {
			if (Char.isDigit(ch) || Char.isLetter(ch) || ch == '_') {
				name += this._reader.read();
			} else {
				break;
			}
		}
		return name;
	};
	HtmlElement.prototype.readString = function() {
		let ch = this._reader.read();
		if (ch != '"' && ch != "'") {
			throw 'read string error!'
		}

		let value = "";
		while (true) {
			ch = this._reader.read();
			if (ch == -1) {
				throw 'stream of end error!';
			} else if (ch == "\\") {
				ch = this._reader.read();
			} else if (ch == '"' || ch == "'") {
				break;
			}

			value += ch;
		}
		return value;
	};
	HtmlElement.prototype.readAttribute = function() {
		this.readSpace();
		let name = this.readSymbol();
		this.readSpace();
		if (this._reader.read() != '=') {
			throw "attribute '=' symbol error";
		}

		this.readSpace();
		let value = this.readString();
		return {
			name: name,
			value: value
		};
	};
	HtmlElement.prototype.init = function() {
		this.readSpace();
		if (this._reader.read() != '<') {
			throw "'<' symbol error";
		}

		let ch;
		this._name = this.readSymbol();
		this.readSpace();
		while((ch = this._reader.peek()) != -1) {
			if (ch == '/') {
				this._reader.read();
				break;
			} else if (ch == '>') {
				break;
			}

			let attr = this.readAttribute();
			this._attributes.push(attr);
			this.readSpace();
		}
		if (this._reader.read() != '>') {
			throw "'>' symbol error";
		}
	};
	HtmlElement.prototype.getName = function() {
		return this._name;
	};
	HtmlElement.prototype.getContent = function() {
		return this._content;
	};
	HtmlElement.prototype.getAttributes = function() {
		return this._attributes;
	};
	HtmlElement.prototype.toString = function() {
		let sb = "<" + this._name;
		if (this._attributes.length > 0) {
			for (let i = 0; i < this._attributes.length; i++) {
				let att = this._attributes[i];
				sb += ' ' + att.name + '="' + att.value + '"';
			}
		}
		sb += ">";
		if (this._content != null) {
			sb += this._content + "</" + this._name + ">";
		}
		return sb;
	};
	HtmlElement.parse = function(str) {
		return new HtmlElement(str);
	};

	let jQuery = function(selector, context) {
		return new jQuery.fn(selector, context);
	}
	jQuery.fn = function(selector, context) {
		this.context = context;
		this.elements = new Array();
		if (typeof selector === 'string') {
			if (selector.charAt(0) === "<" && selector.charAt(selector.length - 1) === ">" && selector.length >= 3) {
				let element = HtmlElement.parse(selector);
				let root = document.createElement(element.getName());
				root.innerHTML = element.getContent();
				let attributes = element.getAttributes();
				for (let i = 0; i < attributes.length; i++) {
					let attribute = attributes[i];
					root.setAttribute(attribute.name, attribute.value);
				}
				this.elements.push(root);
			} else {
				let finds = function(root, selector) {
					let find = function(root, selector) {
						let result = new Array();
						let ch = selector.charAt(0);
						if (ch === '#') {
							let val = selector.substr(1);
							result.push(document.getElementById(val));
						} else if (ch === ".") {
							let val = selector.substr(1);
							let array = (root || document).getElementsByClassName(val);
							for (let i = 0; i < array.length; i++) {
								result.push(array[i]);
							}
						} else {
							//alert("selector:" + selector + ", " + (root == null ? "null" : root.innerHTML));
							let array = (root || document).getElementsByTagName(selector);
							for (let i = 0; i < array.length; i++) {
								result.push(array[i]);
							}
						}

						return result;
					};

					if (root == null) {
						return find(null, selector);
					} else {
						let result = new Array();
						for (let i = 0; i < root.length; i++) {
							let array = find(root[i], selector);
							for (let j = 0; j < array.length; j++) {
								result.push(array[j]);
							}
						}
						return result;
					}
				};
				let ts = selector.split(' ');
				let root = context != null ? context.elements : null;
				let array = finds(root, ts[0]);
				for (let i = 1; i < ts.length; i++) {
					array = finds(array, ts[i]);
				}
				for (let i = 0; i < array.length; i++) {
					this.elements.push(array[i]);
				}
			}
		} else {
			this.elements.push(selector);
		}
	};
	jQuery.fn.extend = function() {
		var arg = arguments[0];
		for (let key in arg) {
			this.prototype[key] = arg[key];
		}
	};
	jQuery.extend = function() {
		var arg = arguments[0];
		for (let key in arg) {
			this[key] = arg[key];
		}
	};
	
	jQuery.fn.extend({
		get: function(index) {
			return 0 <= index && index < this.elements.length ? this.elements[index] : null;
		},
		each: function(action) {
			if (!jQuery.isFunction(action)) {
				throw "invaild param";
			}
			for (let i = 0; i < this.elements.length; i++) {
				let query = jQuery(this.elements[i], this);
				action(query, i);
			}
		},
		first: function() {
			if (this.elements.length > 0) {
				let element = this.elements[0];
				return jQuery(element, this);
			} else {
				return jQuery();
			}
		},
		last: function() {
			if (this.elements.length > 0) {
				let element = this.elements[this.elements.length - 1];
				return jQuery(element, this);
			} else {
				return jQuery();
			}
		},
		eq: function(index) {
			if (0 <= index && index < this.elements.length) {
				return jQuery(this.elements[index], this);
			} else {
				return jQuery();
			}
		},
		children: function() {
			let array = new Array();
			for (let i = 0; i < this.elements.length; i++) {
				let query = jQuery(this.elements[i], this);
				array.push(query);
			}
			return array;
		},
		find: function(selector) {
			return jQuery(selector, this);
		},
		length: function() {
			return this.elements.length;
		},
		append: function(selector) {
			var jq;
			if (selector instanceof jQuery.fn) {
				jq = selector;
			}
			else if (typeof selector === "string") {
				jq = jQuery(selector);
			}
			if (jq != null) {
				for (let i = 0; i < jq.elements.length; i++) {
					var element = jq.elements[i];
					for (let j = 0; j < this.elements.length; j++) {
						this.elements[j].appendChild(element);
					}
				}
			}
		},
		remove: function() {
			for (let i = 0; i < this.elements.length; i++) {
				var element = this.elements[i];
				var parent = element.parentNode;
				if (parent != null) {
					parent.removeChild(element);

					if (this.context != null) {
						var array = this.context.elements;
						for (let j = 0; j < array.length; j++) {
							if (array[j] === element) {
								this.context.elements.splice(j, 1);
								break;
							}
						}
					}
				}
			}
		},
		html: function(value) {
			if (value === undefined) {
				if (this.elements.length >= 1) {
					return this.elements[0].innerHTML;
				}
			} else {
				for (let i = 0; i < this.elements.length; i++) {
					this.elements[i].innerHTML = value;
				}
			}
		},
		val: function(value) {
			if (value == undefined) {
				if (this.elements.length >= 1) {
					return this.elements[0].value;
				}
			} else {
				for (let i = 0; i < this.elements.length; i++) {
					this.elements[i].value = value;
				}
			}
		},
		text: function(value) {
			if (value == undefined) {
				if (this.elements.length >= 1) {
					var element = this.elements[0];
					if (element.type == 'select-one') {
						var index = element.selectedIndex;
						var option = element.options[index];
						return option.text;
					} else {
						return element.text;
					}
				}
			} else {
				var element;
				for (let i = 0; i < this.elements.length; i++) {
					element = this.elements[i];
					if (element.type == 'select-one') {
						element.options[element.selectedIndex].text = value;
					} else {
						element.text = value;
					}
				}
			}
		},
		href: function(value) {
			if (value == undefined) {
				if (this.elements.length >= 1) {
					return this.elements[0].href;
				}
			} else {
				for (let i = 0; i < this.elements.length; i++) {
					this.elements[i].href = value;
				}
			}
		},
		addClass: function(value) {
			let element, str;
			for (let i = 0; i < this.elements.length; i++) {
				element = this.elements[i];
				if (element.className == null) {
					element.className = value;
				} else {
					if (element.className.indexOf(value) < 0) {
						str = element.className.trim();
						element.className = str + ' ' + value;
					}
				}
			}

			return this;
		},
		removeClass: function(value) {
			let element;
			for (let i = 0; i < this.elements.length; i++) {
				element = this.elements[i];
				if (element.className != null) {
					let ts = element.className.split(' ');
					let newArray = new Array();
					for (let item of ts) {
						if (item != value) {
							newArray.push(item);
						}
					}
					element.className = jQuery.join(newArray, ' ');
				}
			}

			return this;
		},
		attr: function(attribute, value) {
			let element;
			if (value === undefined) {
				if (this.elements.length >= 1) {
					element = this.elements[0];
					if (rboolean.test(attribute)) {
						return element[attribute];
					} else {
						return element.getAttribute(attribute);
					}
				}
			} else {
				if (rboolean.test(attribute)) {
					for (let i = 0; i < this.elements.length; i++) {
						element = this.elements[i];
						element[attribute] = value;
					}
				} else {
					for (let i = 0; i < this.elements.length; i++) {
						element = this.elements[i];
						element.setAttribute(attribute, value);
					}
				}
			}
		},
		removeAttr: function(attribute) {
			for (let i = 0; i < this.elements.length; i++) {
				this.elements[i].removeAttribute(attribute);
			}
		},
		prop: function(key, value) {
			if (value === undefined) {
				if (this.elements.length >= 1) {
					return this.elements[0].style[key];
				}
			} else {
				for (let i = 0; i < this.elements.length; i++) {
					this.elements[i].style[key] = value;
				}
			}
		},
		hide: function() {
			for (let i = 0; i < this.elements.length; i++) {
				this.elements[i].style.display = 'none';
			}
		},
		show: function() {
			for (let i = 0; i < this.elements.length; i++) {
				this.elements[i].style.display = 'block';
			}
		},
		click: function(callback) {
			let element;
			for (let i = 0; i < this.elements.length; i++) {
				element = this.elements[i];
				element.onclick = callback;
			}
		}
	});
	jQuery.extend({
		events: new Array(),
		isJson: function(obj) {
			if (obj === null) {
				return false;
			}
			return typeof(obj) == "object" && Object.prototype.toString.call(obj).toLowerCase() == "[object object]" && !obj.length;
		},
		isFunction: function(obj) {
			return typeof obj == 'function';
		},
		joinParam: function(obj) {
			if (obj == null) {
				return null;
			}
			var result = "";
			if (typeof obj === "string") {
				result = obj;
			} else if (typeof obj === "object" || jQuery.isJson(obj)) {
				for (var key in obj) {
					if (result !== "") {
						result += "&";
					}
					var value = obj[key];
					result += key + "=" + encodeURIComponent(value);
				}
			}
			return result;
		},
		join: function(array, spearator) {
			let result = "";
			if (array == null) {
				return result;
			}
			if (array.length > 0) {
				result = array[0];
			}
			for (let i = 1; i < array.length; i++) {
				result += spearator;
				result += array[i];
			}

			return result;
		},
		eval: function (obj) {
			return eval('(' + obj + ')');
		},
		ready: function(callback) {
			if (!this.isFunction(callback)) {
				throw "invaild param";
			}
			this.events.push(callback);
		},
		ajax: function(obj) {
			obj = obj || {};
			obj.type = obj.type || "GET";
			obj.async = obj.hasOwnProperty("async") ? obj.async : true;
			obj.complete = obj.complete || function() { };
			obj.timeout = obj.hasOwnProperty("timeout") ? obj.timeout : 15000;
			var xhr;
			if (window.XMLHttpRequest) {
		　　　　 // code for IE7+, Firefox, Chrome, Opera, Safari 
				xhr = new XMLHttpRequest(); 
		　　} else if (window.ActiveXObject) {
				// code for IE6, IE5
				try {
					xhr = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (ex) {
					xhr = new ActiveXObject("Msxml2.XMLHTTP");
				}
        　　}

			xhr.open(obj.type, obj.url, obj.async);
            xhr.setRequestHeader("Cache-Control", "no-cache");
            if (obj.contentType != false) {
                let contentType = obj.contentType || "application/x-www-form-urlencoded";
                xhr.setRequestHeader("Content-type", contentType);
            }
			if (obj.async) {
				xhr.onreadystatechange = function() {
					if (xhr.readyState == 4) {
						obj.complete(xhr, xhr.status, xhr.responseText);
					}
				};
			}
			if (obj.type.toUpperCase( ) === "GET") {
				xhr.send(null);
			} else {
				xhr.send(obj.data);
			}
			if (!obj.async) {
				obj.complete(xhr, xhr.status, xhr.responseText);
				return xhr.responseText;
			}
		},
		get: function(url, data, callback) {
			if (data != null) {
				var param = jQuery.joinParam(data);
				if (url.indexOf('?') === -1) {
					url += "?";
				} else if (url.substr(-1, 1) !== '?') {
					url += "&";
				}
				url += param;
			}
			this.ajax({
				url: url,
				type: "GET",
				async: true,
				complete: function(xhr, status, responseText) {
					if (status == 200) {
						callback(responseText);
					}
				},
			});
		},
		post: function(url, data, callback) {
			this.ajax({
				url: url,
				type: 'POST',
				async: true,
                data: jQuery.joinParam(data),
				complete: function(xhr, status, responseText) {
					if (status == 200) {
						callback(responseText);
					}
				},
			});
		}
	});

	function IEContentLoaded(w, fn) {
		var d = w.document, done = false,
		init = function () {
			if (!done) {
				done = true;
				fn();
			}
		};
		(function () {
			try {
				d.documentElement.doScroll('left');
			} catch (e) {
				setTimeout(arguments.callee, 50);
				return;
			}
			init();
		})();
		d.onreadystatechange = function() {
			if (d.readyState == 'complete') {
				d.onreadystatechange = null;
				init();
			}
		};
	};
	function readyEventCompleted() {
		for (var i = 0; i < jQuery.events.length; i++) {
			var callback = jQuery.events[i];
			callback();
		}
	}
	if (document.addEventListener) { //兼容非IE
		document.addEventListener("DOMContentLoaded", readyEventCompleted, false);  
	} else if(document.attachEvent) { //兼容IE
		IEContentLoaded(window, readyEventCompleted);
	}
	
	window.jQuery = window.$ = jQuery;
})(window);