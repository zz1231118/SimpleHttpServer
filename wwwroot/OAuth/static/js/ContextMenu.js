class MenuItem {

    constructor(context, obj, depth = 0) {
        this._context = context;
        this._metadata = obj;
        this._depth = depth;
        this._array = new Array();
        this._isSelected = false;
        this._isSpread = true;

        let li = document.createElement('li');
        let a = document.createElement('a');
        let span = document.createElement('span');

        span.innerHTML = obj.name;

        a.className = 'aside-level-' + depth;
        a.onclick = (e) => {
            if (this._array.length > 0) {
                this._isSpread = !this._isSpread;
                this.Render();
            }
            if (!this.Selectable) {
                return;
            }
            if (this._isSelected) {
                return;
            }

            this._context.ItemSelected(this);
        };
        a.appendChild(span);

        li.appendChild(a);
        if (obj.hasOwnProperty('children')) {
            //<i class="qc-aside-up-icon">开</i>
            let i = document.createElement('i');
            i.className = 'aside-up-icon';
            a.appendChild(i);

            let ul = document.createElement('ul');
            ul.className = 'aside-subitem';
            for (let key in obj.children) {
                let menu = new MenuItem(context, obj.children[key], depth + 1);
                ul.appendChild(menu.Element);

                this._array.push(menu);
            }

            this._ul = ul;
            li.appendChild(ul);
        }

        this._anchor = a;
        this._element = li;
    }

    get Element() {
        return this._element;
    }
    get Name() {
        return this._metadata.name;
    }
    get Url() {
        return this._metadata.url;
    }
    get Selectable() {
        return this._metadata.hasOwnProperty('selectable') ? this._metadata.selectable : true;
    }
    set IsSelected(value) {
        this._isSelected = value;
        this.Render();
    }

    Initialize() {
        if (this._metadata.hasOwnProperty('selected') && this._metadata.selected) {
            this._context.ItemSelected(this);
        }
        for (let key in this._array) {
            this._array[key].Initialize();
        }
    }
    Render() {
        if (this._ul != null) {
            this._ul.style.display = this._isSpread ? "" : "none";
        }
        this._anchor.className = 'aside-level-' + this._depth;
        if (this._isSelected) {
            this._anchor.className += ' aside-select';
        }
    }
    Unselect() {
        this._isSelected = false;
        this.Render();

        for (let key in this._array) {
            this._array[key].Unselect();
        }
    }
}
class ContextMenu {
    
    constructor(key, array) {
        this._array = new Array();
        this._element = document.getElementById(key);
        this._title = document.getElementById('main-title');
        this._content = document.getElementById('main-content');

        for (let k in array) {
            let menu = new MenuItem(this, array[k], 1);
            this._array.push(menu);
            this._element.appendChild(menu.Element);
        }
        for (let k in this._array) {
            this._array[k].Initialize();
        }
    }

    ItemSelected(menu) {
        for (let key in this._array) {
            this._array[key].Unselect();
        }

        menu.IsSelected = true;

        this._title.innerHTML = menu.Name;
        this._content.src = menu.Url;
    }
    UnknownSelect(title, url) {
        for (let key in this._array) {
            this._array[key].Unselect();
        }

        this._title.innerHTML = title;
        this._content.src = url;
    }
}