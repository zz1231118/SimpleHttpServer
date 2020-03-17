define((require) => {
    let system = require('./netcore/system');

    let Type = system.Type;
    let EventDispatcher = system.EventDispatcher;

    class Sidebar extends EventDispatcher {
        constructor(option) {
            super();
            
            if (option == null)
                throw new Error('argument null exception: option');
            if (option.id == null)
                throw new Error('argument exception: id not found!');
    
            let frame = Type.isString(option.id) ? document.getElementById(option.id) : option.id;
            if (frame == null)
                throw new Error('argument exception: id:' + option.id + ' element not found!');
            
            let maskings = frame.getElementsByClassName('wui-sidebar-masking');
            let models = frame.getElementsByClassName('wui-sidebar-model');
            if (maskings.length != 1)
                throw new Error('argument exception: masking count error!');
            if (models.length != 1)
                throw new Error('argument exception: body count error!');
    
            option.offset = option.offset || 300;
            option.top = option.top || 50;
            option.bottom = option.bottom || 0;
            option.duration = option.duration || 100;
            if (option.width) {
                option.offset = 0;
            }

            this._option = option;
            this._frame = frame;
            this._masking = maskings[0];
            this._body = models[0];
    
            this._masking.onmouseup = (e) => {
                e.stopPropagation();
                e.stopImmediatePropagation();
                this.close();
            };
            for (let btn of this._body.getElementsByClassName('wui-sidebar-model-close')) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    this.close();
                };
            }
        }
    
        show() {
            if (this._timer != null) {
                clearInterval(this._timer);
                this._timer = null;
            }
    
            let element = this._body;
            let offset = this._option.offset;
            let duration = this._option.duration;
            let width = this._option.width || document.documentElement.clientWidth;
            let speed = (width - offset) / duration;
            
            element.style.top = this._option.top + 'px';
            element.style.bottom = this._option.bottom + 'px';
            element.style.right = -(width - offset) + 'px';
            element.style.width = (width - offset) + 'px';
            this._frame.style.display = 'unset';
    
            this._timer = setInterval(() => {
                let xw = parseFloat(element.style.right.replace('px', '')) + speed;
                element.style.right = xw + 'px';
                if(xw >= 0) {
                    element.style.right = '0px';
                    clearInterval(this._timer);
                    this._timer = null;
                }
            });

            this.dispatchEventWith(Sidebar.Showed);
        }
        close() {
            if (this._timer != null) {
                clearInterval(this._timer);
                this._timer = null;
            }
            
            let element = this._body;
            let offset = this._option.offset;
            let duration = this._option.duration;
            let width = this._option.width || document.documentElement.clientWidth;
            let speed = (width - offset) / duration;
    
            this._timer = setInterval(() => {
                let xw = parseFloat(element.style.right.replace('px', '')) - speed;
                element.style.right = xw + 'px';
                if(parseFloat(element.style.right) <= -width){
                    element.style.right = (-width) + 'px';
                    this._frame.style.display = 'none';
                    window.clearInterval(this._timer);
                    this._timer = null;
                }
            });

            this.dispatchEventWith(Sidebar.Closed);
        }
    }
    Sidebar.Showed = 'showed';
    Sidebar.Closed = 'closed';

    return {
        Sidebar: Sidebar,
    };
});