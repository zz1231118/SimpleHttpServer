define((require) => {
    let system = require('./netcore/system');
    let linq = require('./netcore/system.linq');
    let drawing = require('./netcore/system.drawing');
    let generic = require('./netcore/system.collections.generic');
    let windows = require('./ui-windows');
    let Event = system.Event;
    let EventDispatcher = system.EventDispatcher;
    let Enumerable = linq.Enumerable;
    let Point = drawing.Point;
    let Vector = drawing.Vector;
    let Rectangle = drawing.Rectangle;
    let List = generic.List;
    let NotifyList = windows.NotifyList;
    let NotifyListItemChangedCategory = windows.NotifyListItemChangedCategory;
    let FrameworkElement = windows.FrameworkElement;
    class LinkingEvent extends Event {
        constructor(type, anchor, activity) {
            super(type);
            this._anchor = anchor;
            this._activity = activity;
        }
        get anchor() {
            return this._anchor;
        }
        get activity() {
            return this._activity;
        }
    }
    let Themes;
    (function (Themes) {
        Themes[Themes["black"] = 0] = "black";
        Themes[Themes["gray"] = 1] = "gray";
    })(Themes || (Themes = {}));
    class Canvas extends FrameworkElement {
        constructor(theme = Themes.black) {
            super();
            this._selectedItems = new List();
            this._movingContainers = new Array();
            this._dom = document.createElement('div');
            switch (theme) {
                case Themes.black:
                    this._dom.className = 'wf-theme-black';
                    break;
                case Themes.gray:
                    this._dom.className = 'wf-theme-gray';
                    break;
                default:
                    throw 'unknown theme:' + theme;
            }
            this._dom.classList.add('wf-canvas');
            this._dom.addEventListener('mousedown', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.onMouseDown(e);
            });
            this._dom.addEventListener('mouseup', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.onMouseUp(e);
            });
            this._dom.addEventListener('mousemove', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                this.onMouseMove(e);
            });
            this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            this._svg.classList.add('wf-svg');
            this._dom.appendChild(this._svg);
            this._defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            this._svg.appendChild(this._defs);
            for (let marker of this.createDefaultMarkers()) {
                this._defs.appendChild(marker);
            }
            this._activities = new NotifyList();
            this._activities.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        e.item.parent = this;
                        this._dom.appendChild(e.item.dom);
                        this.resize();
                        break;
                    case NotifyListItemChangedCategory.remove:
                        e.item.parent = null;
                        this._dom.removeChild(e.item.dom);
                        this.resize();
                        break;
                }
            });
            this._links = new NotifyList();
            this._links.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        this._svg.appendChild(e.item.dom);
                        break;
                    case NotifyListItemChangedCategory.remove:
                        this._svg.removeChild(e.item.dom);
                        break;
                }
            });
            this._dragLinks = new NotifyList();
            this._dragLinks.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        this._svg.appendChild(e.item.dom);
                        break;
                    case NotifyListItemChangedCategory.remove:
                        this._svg.removeChild(e.item.dom);
                        break;
                }
            });
            this.addEventListener(Canvas.Moving, this.onActivityMove, this);
        }
        get dom() {
            return this._dom;
        }
        get activities() {
            return this._activities;
        }
        get links() {
            return this._links;
        }
        get dragLinks() {
            return this._dragLinks;
        }
        get selectedItems() {
            return this._selectedItems;
        }
        get theme() {
            return this._theme;
        }
        get width() {
            return this._dom.clientWidth;
        }
        get height() {
            return this._dom.clientHeight;
        }
        onMouseDown(e) {
            if (e.srcElement === this._svg) {
                this.select(null);
                let mp = this.getMousePosition(e);
                if (this._selectContainer === undefined) {
                    this._selectContainer = new SelectContainer();
                }
                this._selectContainer.start(mp);
                this._svg.appendChild(this._selectContainer.dom);
            }
            else if (this._movingContainer === undefined) {
                let mp = this.getMousePosition(e);
                this._movingContainer = new MovingContainer(this, mp);
            }
        }
        onMouseUp(e) {
            let mp = this.getMousePosition(e);
            if (this._selectContainer !== undefined && this._selectContainer.isDragging) {
                this._selectContainer.stop();
                this._svg.removeChild(this._selectContainer.dom);
            }
            for (let movingContainer of this._movingContainers) {
                movingContainer.completed(mp);
            }
            this._movingContainers.splice(0, this._movingContainers.length);
            this._movingContainer = undefined;
        }
        onMouseMove(e) {
            let p = this.getMousePosition(e);
            if (this._selectContainer !== undefined && this._selectContainer.isDragging) {
                this._selectContainer.endPoint = p;
                this._selectContainer.render();
                let bounds = this._selectContainer.getBounds();
                let selectedItems = Enumerable.where(this._activities, p => bounds.intersectsWith(p.getBounds())).toArray();
                for (let activity of Enumerable.toArray(this._selectedItems)) {
                    if (selectedItems.indexOf(activity) === -1) {
                        activity.isSelected = false;
                        this._selectedItems.remove(activity);
                    }
                }
                for (let activity of selectedItems) {
                    if (!this._selectedItems.contains(activity)) {
                        activity.isSelected = true;
                        this._selectedItems.add(activity);
                    }
                }
            }
            else if (this._movingContainer !== undefined) {
                if (!this._movingContainer.isDragging) {
                    if (Math.abs(p.x - this._movingContainer.startPoint.x) >= 5 || Math.abs(p.y - this._movingContainer.startPoint.y) >= 5) {
                        this._movingContainer.start();
                    }
                }
                if (this._movingContainer.isDragging) {
                    let horizontal = p.x - this._movingContainer.startPoint.x;
                    let vertical = p.y - this._movingContainer.startPoint.y;
                    for (let activity of this._selectedItems) {
                        activity.x += horizontal;
                        activity.y += vertical;
                        activity.render();
                        activity.dispatchEventWith(Activity.Moving);
                        this.dispatchEventWith(Canvas.Moving, activity);
                    }
                    this._movingContainer.startPoint = p;
                }
            }
            for (let movingContainer of this._movingContainers) {
                if (!movingContainer.isDragging) {
                    if (Math.abs(p.x - movingContainer.startPoint.x) >= 5 || Math.abs(p.y - movingContainer.startPoint.y) >= 5) {
                        movingContainer.start();
                    }
                }
                if (movingContainer.isDragging) {
                    movingContainer.moveTo(p);
                }
            }
        }
        onActivityMove(e) {
            this.resize();
        }
        createDefaultMarkers() {
            let array = new Array();
            let marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.id = 'markerArrow1';
            marker.setAttribute('refX', '0');
            marker.setAttribute('refY', '3');
            let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.classList.add('wf-arrow-brush');
            path.setAttribute('d', 'M0,1 L0,5 L3,3 z');
            //path.setAttribute('fill', '#606060');
            marker.appendChild(path);
            array.push(marker);
            marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.id = 'markerArrow2';
            marker.setAttribute('refX', '0');
            marker.setAttribute('refY', '3');
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'M0,1 L0,5 L3,3 z');
            path.setAttribute('fill', '#66afe9');
            marker.appendChild(path);
            array.push(marker);
            marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
            marker.id = 'markerArrow3';
            marker.setAttribute('refX', '3');
            marker.setAttribute('refY', '2.6');
            path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', 'm6.75848,4.22161c-0.13193,0.12924 -0.3468,0.12924 -0.47903,0l-3.03436,-2.97252c-0.13193,-0.12953 -0.13223,-0.33974 0,-0.46927c0.13163,-0.12953 0.3465,-0.12953 0.47933,0l3.03406,2.97223c0.13193,0.13012 0.13253,0.34003 0,0.46956l0,0l0,0zm-0.00361,-2.974l-3.03406,2.97223c-0.13253,0.12983 -0.3471,0.12983 -0.47933,0c-0.13223,-0.12924 -0.13223,-0.33915 0.0003,-0.46927l3.03406,-2.97193c0.13253,-0.12953 0.3474,-0.12953 0.47903,-0.0003c0.13253,0.12953 0.13193,0.33974 0,0.46927l0,0l0,0z');
            path.setAttribute('fill', '#f00');
            marker.appendChild(path);
            array.push(marker);
            for (let marker of array) {
                marker.setAttribute('markerWidth', '10');
                marker.setAttribute('markerHeight', '10');
                marker.setAttribute('orient', 'auto');
                marker.setAttribute('markerUnits', 'strokeWidth');
            }
            return array;
        }
        resize() {
            const offset = 150;
            let bounds = this.getBounds();
            if (this.width < bounds.width + offset) {
                this._dom.style.width = (bounds.width + offset) + 'px';
            }
            if (this.height < bounds.height + offset) {
                this._dom.style.height = (bounds.height + offset) + 'px';
            }
        }
        select(p) {
            for (let item of this._selectedItems) {
                item.isSelected = false;
                this.dispatchEventWith(Canvas.Unselected, item);
            }
            this._selectedItems.clear();
            if (p != null) {
                if (p instanceof Activity) {
                    p.isSelected = true;
                    this._selectedItems.add(p);
                    this.dispatchEventWith(Canvas.Selected, p);
                }
                else {
                    for (let item of p) {
                        item.isSelected = true;
                        this._selectedItems.add(item);
                        this.dispatchEventWith(Canvas.Selected, item);
                    }
                }
            }
        }
        clear() {
            this._activities.clear();
            this._links.clear();
        }
        getPosition(clientx, clienty) {
            let rect = this._dom.getBoundingClientRect();
            return new Point(clientx - rect.left, clienty - rect.top);
        }
        getMousePosition(e) {
            if (e == null)
                throw 'argument null exception: e';
            let rect = this._dom.getBoundingClientRect();
            return new Point(e.clientX - rect.left, e.clientY - rect.top);
        }
        getBounds() {
            let right;
            let bottom;
            let maxx = 1000;
            let maxy = 800;
            for (let activity of this._activities) {
                right = activity.x + activity.width;
                bottom = activity.y + activity.height;
                if (right > maxx) {
                    maxx = right;
                }
                if (bottom > maxy) {
                    maxy = bottom;
                }
            }
            return new Rectangle(0, 0, maxx, maxy);
        }
        drag(movingContainer) {
            if (movingContainer == null)
                throw 'argument null exception: movingContainer';
            this._movingContainers.push(movingContainer);
        }
        link(anchor, activity) {
            if (anchor == null)
                throw 'argument null exception: anchor';
            if (activity == null)
                throw 'argument null exception: activity';
            this.dispatchEvent(new LinkingEvent(Canvas.Linking, anchor, activity));
        }
        render() {
            for (let activity of this._activities) {
                activity.render();
            }
            for (let link of this._links) {
                link.render();
            }
        }
    }
    Canvas.Selected = 'selected';
    Canvas.Unselected = 'unselected';
    Canvas.Moving = 'moving';
    Canvas.Linking = 'linking';
    class SelectContainer {
        constructor() {
            this._isDragging = false;
            this._dom = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this._rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            this._rect.setAttribute('width', '0');
            this._rect.setAttribute('height', '0');
            this._rect.setAttribute('stroke', '#888');
            this._rect.setAttribute('fill', 'none');
            this._rect.setAttribute('stroke-width', '1');
            this._rect.setAttribute('stroke-dasharray', '2,5');
            this._dom.appendChild(this._rect);
        }
        get dom() {
            return this._dom;
        }
        get startPoint() {
            return this._startPoint;
        }
        get endPoint() {
            return this._endPoint;
        }
        set endPoint(value) {
            this._endPoint = value;
        }
        get isDragging() {
            return this._isDragging;
        }
        start(startPoint) {
            this._startPoint = startPoint;
            this._endPoint = startPoint;
            this._isDragging = true;
            this.render();
        }
        stop() {
            this._isDragging = false;
        }
        render() {
            let bounds = this.getBounds();
            this._rect.setAttribute('x', bounds.left.toString());
            this._rect.setAttribute('y', bounds.top.toString());
            this._rect.setAttribute('width', bounds.width.toString());
            this._rect.setAttribute('height', bounds.height.toString());
        }
        getBounds() {
            let minx, maxx, miny, maxy;
            if (this._startPoint.x > this._endPoint.x) {
                maxx = this._startPoint.x;
                minx = this._endPoint.x;
            }
            else {
                maxx = this._endPoint.x;
                minx = this._startPoint.x;
            }
            if (this._startPoint.y > this._endPoint.y) {
                maxy = this._startPoint.y;
                miny = this._endPoint.y;
            }
            else {
                maxy = this._endPoint.y;
                miny = this._startPoint.y;
            }
            return new Rectangle(minx, miny, maxx - minx, maxy - miny);
        }
    }
    class MovingEventArgs extends Event {
        constructor(type, position) {
            super(type);
            this._position = position;
        }
        get position() {
            return this._position;
        }
    }
    class MovingContainer extends EventDispatcher {
        constructor(target, startPoint) {
            super();
            this._isDragging = false;
            this._target = target;
            this._startPoint = startPoint;
        }
        get target() {
            return this._target;
        }
        get startPoint() {
            return this._startPoint;
        }
        set startPoint(value) {
            this._startPoint = value;
        }
        get isDragging() {
            return this._isDragging;
        }
        start() {
            this._isDragging = true;
            this.dispatchEventWith(MovingContainer.Started);
        }
        moveTo(p) {
            this.dispatchEvent(new MovingEventArgs(MovingContainer.Moving, p));
        }
        completed(p) {
            this.dispatchEvent(new MovingEventArgs(MovingContainer.Completed, p));
        }
    }
    MovingContainer.Started = 'started';
    MovingContainer.Moving = 'moving';
    MovingContainer.Completed = 'completed';
    class Activity extends FrameworkElement {
        constructor() {
            super();
            this._x = 0;
            this._y = 0;
            this._isSelected = false;
            this._id = ++Activity._maxid;
            this._dom = document.createElement('div');
            this._dom.className = 'wf-activity';
            this._dom.addEventListener('mousedown', (e) => {
                //e.stopImmediatePropagation();
                //e.stopPropagation();
                if (!this._isSelected) {
                    let wfCanvas = this.parent;
                    //let startx = this._x;
                    //let starty = this._y;
                    //let mousePoint = wfCanvas.getMousePosition(e);
                    //let movingContainer = new MovingContainer(this, mousePoint);
                    //movingContainer.addEventListener(MovingContainer.Moving, (e: MovingEventArgs) => {
                    //    let horizontal = e.position.x - movingContainer.startPoint.x;
                    //    let vertical = e.position.y - movingContainer.startPoint.y;
                    //    this._x = startx + horizontal;
                    //    this._y = starty + vertical;
                    //    this.render();
                    //    this.dispatchEventWith(Activity.Moving);
                    //    wfCanvas.dispatchEventWith(Canvas.Moving, this);
                    //});
                    //wfCanvas.drag(movingContainer);
                    wfCanvas.select(this);
                }
            });
            this._title = document.createElement('div');
            this._title.className = 'wf-activity-title';
            this._dom.appendChild(this._title);
            this._content = document.createElement('div');
            this._content.className = 'wf-activity-content';
            this._dom.appendChild(this._content);
            this._anchorContainer = document.createElement('div');
            this._anchorContainer.className = 'wf-anchor-container';
            this._dom.appendChild(this._anchorContainer);
            this._anchors = new NotifyList();
            this._anchors.addEventListener(NotifyList.ItemChanged, (e) => {
                switch (e.category) {
                    case NotifyListItemChangedCategory.add:
                        if (this._anchors.count >= 2) {
                            let lastIndex = this._anchors.count - 2;
                            let last = this._anchors.charAt(lastIndex);
                            if (last.dom instanceof HTMLElement) {
                                last.dom.style.marginRight = '5px';
                            }
                        }
                        e.item.parent = this;
                        this._anchorContainer.appendChild(e.item.dom);
                        this.render();
                        break;
                    case NotifyListItemChangedCategory.remove:
                        if (this._anchors.count > 0) {
                            let lastIndex = this._anchors.count - 1;
                            let last = this._anchors.charAt(lastIndex);
                            if (last.dom instanceof HTMLElement) {
                                last.dom.style.marginRight = null;
                            }
                        }
                        e.item.parent = null;
                        this._anchorContainer.removeChild(e.item.dom);
                        this.render();
                        break;
                }
            });
        }
        get id() {
            return this._id;
        }
        get dom() {
            return this._dom;
        }
        get title() {
            return this._title.innerHTML;
        }
        set title(value) {
            this._title.innerHTML = value;
        }
        get content() {
            return this._content.innerHTML;
        }
        set content(value) {
            this._content.innerHTML = value;
        }
        get x() {
            return this._x;
        }
        set x(value) {
            this._x = isNaN(value) ? 0 : value;
            this.render();
        }
        get y() {
            return this._y;
        }
        set y(value) {
            this._y = isNaN(value) ? 0 : value;
            this.render();
        }
        get width() {
            return this._dom.clientWidth;
        }
        get height() {
            return this._dom.clientHeight;
        }
        get isSelected() {
            return this._isSelected;
        }
        set isSelected(value) {
            this._isSelected = value;
            if (value) {
                this._dom.classList.add('wf-activity-selected');
                this.dispatchEventWith(Activity.Selected);
            }
            else {
                this._dom.classList.remove('wf-activity-selected');
                this.dispatchEventWith(Activity.Unselected);
            }
        }
        get anchors() {
            return this._anchors;
        }
        get entryPoint() {
            return new Point(this._x + this.width / 2, this._y - 12);
        }
        render() {
            this._dom.style.transform = 'translate(' + this._x + 'px, ' + this._y + 'px)';
            let wfCanvas = this.parent;
            if (wfCanvas !== undefined) {
                for (let link of wfCanvas.links) {
                    if (link.source.parent === this || link.target === this) {
                        link.render();
                    }
                }
            }
        }
        getBounds() {
            return new Rectangle(this._x, this._y, this.width, this.height);
        }
    }
    Activity.Selected = 'selected';
    Activity.Unselected = 'unselected';
    Activity.Moving = 'moving';
    Activity._maxid = 0;
    class Anchor extends FrameworkElement {
        constructor() {
            super();
            this._dom = document.createElement('span');
            this._dom.className = 'wf-anchor';
            this._dom.addEventListener('mousedown', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                let activity = this.parent;
                let wfCanvas = activity.parent;
                if (!Enumerable.any(wfCanvas.links, p => p.source == this)) {
                    let link;
                    let mousePoint = wfCanvas.getMousePosition(e);
                    let movingContainer = new MovingContainer(this, mousePoint);
                    movingContainer.addEventListener(MovingContainer.Started, (e) => {
                        link = new DragLink(this.exitPoint);
                        link.isActivated = false;
                        link.activate();
                        wfCanvas.dragLinks.add(link);
                    });
                    movingContainer.addEventListener(MovingContainer.Moving, (e) => {
                        link.target = e.position.subtract(new Vector(0, 12));
                        link.render();
                    });
                    movingContainer.addEventListener(MovingContainer.Completed, (e) => {
                        if (link !== undefined) {
                            wfCanvas.dragLinks.remove(link);
                            let point = e.position.subtract(new Vector(0, 12));
                            let target = Enumerable.firstOrDefault(wfCanvas.activities, p => p.getBounds().contains(point));
                            if (target != null) {
                                wfCanvas.link(this, target);
                            }
                        }
                    });
                    wfCanvas.drag(movingContainer);
                }
            });
        }
        get dom() {
            return this._dom;
        }
        get exitPoint() {
            let canvas = this.parent.parent;
            let prect = canvas.dom.getBoundingClientRect();
            let srect = this._dom.getBoundingClientRect();
            let width = this._dom.clientWidth;
            let height = this._dom.clientHeight;
            return new Point(srect.left - prect.left + width / 2, srect.top - prect.top + height);
        }
    }
    class Curve extends FrameworkElement {
        constructor() {
            super();
            this._isActivated = true;
            this._dom = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            this._dom.addEventListener('mouseenter', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                if (this._isActivated) {
                    this.activate();
                }
            });
            this._dom.addEventListener('mouseleave', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                if (this._isActivated) {
                    this.unactivate();
                }
            });
            this._path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            this._path.classList.add('wf-link-brush');
            //this._path.setAttribute('stroke', '#606060');
            this._path.setAttribute('fill', 'none');
            this._path.setAttribute('stroke-width', '4');
            this._path.setAttribute('marker-end', 'url(#markerArrow1)');
            this._dom.appendChild(this._path);
        }
        get dom() {
            return this._dom;
        }
        get isActivated() {
            return this._isActivated;
        }
        set isActivated(value) {
            this._isActivated = value;
        }
        activate() {
            this._path.classList.add('wf-link-selected-brush');
            //this._path.setAttribute('stroke', '#66afe9');
            this._path.setAttribute('marker-end', 'url(#markerArrow2)');
        }
        unactivate() {
            this._path.classList.remove('wf-link-selected-brush');
            //this._path.setAttribute('stroke', '#606060');
            this._path.setAttribute('marker-end', 'url(#markerArrow1)');
        }
        render() {
            let exit = this.sourcePoint;
            let entry = this.targetPoint;
            let m1x = exit.x;
            let m1y = entry.y > exit.y ? exit.y + (entry.y - exit.y) / 3 : exit.y - (entry.y - exit.y) / 3;
            let m2x = exit.x + (entry.x - exit.x) / 2;
            let m2y = exit.y + (entry.y - exit.y) / 2;
            this._path.setAttribute('d', 'M' + exit.x + ' ' + exit.y + ' Q' + m1x + ' ' + m1y + ' ' + m2x + ' ' + m2y + ' T' + entry.x + ' ' + entry.y);
        }
    }
    class Link extends Curve {
        constructor(source, target) {
            if (source == null)
                throw 'argument null exception: source';
            if (target == null)
                throw 'argument null exception: target';
            super();
            this._source = source;
            this._target = target;
            this.render();
        }
        get sourcePoint() {
            return this._source.exitPoint;
        }
        get targetPoint() {
            return this._target.entryPoint;
        }
        get source() {
            return this._source;
        }
        get target() {
            return this._target;
        }
    }
    class DragLink extends Curve {
        constructor(source) {
            super();
            this._source = source;
            this._target = this.target;
        }
        set target(value) {
            this._target = value;
        }
        get sourcePoint() {
            return this._source;
        }
        get targetPoint() {
            return this._target;
        }
    }
    return {
        LinkingEvent: LinkingEvent,
        Themes: Themes,
        Canvas: Canvas,
        Activity: Activity,
        Anchor: Anchor,
        Link: Link,
    };
});
//# sourceMappingURL=ui-work-flow.js.map