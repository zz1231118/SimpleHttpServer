define((require) => {
    let system = require('./netcore/system');
    let drawing = require('./netcore/system.drawing');
    let generic = require('./netcore/system.collections.generic');
    let Event = system.Event;
    let EventDispatcher = system.EventDispatcher;
    let Point = drawing.Point;
    let Vector = drawing.Vector;
    let List = generic.List;
    class GridPoint {
        constructor(row = 0, column = 0) {
            this._row = row;
            this._column = column;
        }
        get row() {
            return this._row;
        }
        get column() {
            return this._column;
        }
    }
    class Setting {
        static get default() {
            if (Setting._default === undefined) {
                let setting = new Setting();
                setting._default = { width: 800, height: 600 };
                setting._point = { center: [0, 0] };
                setting._width = { serial: 50, scroll: 20, right: 40, cell: 80 };
                setting._height = { row: 20, nav: 60, toolbar: 30, fx: 30, columns: 20, bottom: 40, sheet: 30 };
                Setting._default = setting;
            }
            return Setting._default;
        }
        get default() {
            return this._default;
        }
        get point() {
            return this._point;
        }
        get width() {
            return this._width;
        }
        get height() {
            return this._height;
        }
    }
    class DrawingContext {
        constructor(workbook, ctx) {
            this._workbook = workbook;
            this._ctx = ctx;
        }
        get ratio() {
            return this._workbook.ratio;
        }
        set fillStyle(value) {
            this._ctx.fillStyle = value;
        }
        set strokeStyle(value) {
            this._ctx.strokeStyle = value;
        }
        set font(value) {
            this._ctx.font = value;
        }
        set textBaseline(value) {
            this._ctx.textBaseline = value;
        }
        set lineWidth(value) {
            this._ctx.lineWidth = value;
        }
        set textAlign(value) {
            this._ctx.textAlign = value;
        }
        convert(value, fix) {
            return fix ? (value + 0.5) * this._workbook.ratio : value * this._workbook.ratio;
        }
        getTextLine(text, width) {
            if (!text) {
                return null;
            }
            let temp = '';
            let array = `${text}`.split('');
            let row = new Array();
            for (let i = 0; i < array.length; i++) {
                if (this._ctx.measureText(temp).width >= width - 8) {
                    row.push(temp);
                    temp = '';
                }
                temp += array[i];
            }
            row.push(temp);
            return row;
        }
        drawText(x, y, row, maxWidth) {
            if (row.length > 1) {
                for (let i = 0; i < row.length; i++) {
                    this._ctx.fillText(row[i], x, y + (i * 15));
                }
            }
            else if (maxWidth) {
                let array = this.getTextLine(row[0], maxWidth);
                if (array) {
                    this._ctx.fillText(array[0], x, y, maxWidth);
                }
            }
            else {
                this._ctx.fillText(row[0], x, y);
            }
        }
        beginPath() {
            this._ctx.beginPath();
        }
        closePath() {
            this._ctx.closePath();
        }
        stroke() {
            this._ctx.stroke();
        }
        fill() {
            this._ctx.fill();
        }
        clearRect(x, y, width, height) {
            x = this.convert(x);
            y = this.convert(y);
            width = this.convert(width);
            height = this.convert(height);
            this._ctx.clearRect(x, y, width, height);
        }
        fillRect(x, y, width, height, fix) {
            x = this.convert(x, fix);
            y = this.convert(y, fix);
            width = this.convert(width, fix);
            height = this.convert(height, fix);
            this._ctx.fillRect(x, y, width, height);
        }
        strokeRect(x, y, width, height) {
            x = this.convert(x);
            y = this.convert(y);
            width = this.convert(width);
            height = this.convert(height);
            this._ctx.strokeRect(x, y, width, height);
        }
        moveTo(x, y, fix) {
            x = this.convert(x, fix);
            y = this.convert(y, fix);
            this._ctx.moveTo(x, y);
        }
        lineTo(x, y, fix) {
            x = this.convert(x, fix);
            y = this.convert(y, fix);
            this._ctx.lineTo(x, y);
        }
    }
    let Orientation;
    (function (Orientation) {
        Orientation[Orientation["horizontal"] = 0] = "horizontal";
        Orientation[Orientation["vertical"] = 1] = "vertical";
    })(Orientation || (Orientation = {}));
    class ScrollBar extends EventDispatcher {
        constructor(orientation) {
            super();
            this._viewport = 0;
            this._minimum = 0;
            this._maximum = 1;
            this._value = 0;
            this._orientation = orientation;
            this._dom = document.createElement('div');
            this._slider = document.createElement('div');
            this._slider.addEventListener('mousedown', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                let valueStart = this.scroll;
                let mouseStart = this._orientation === Orientation.horizontal ? e.screenX : e.screenY;
                let maxScroll = this.maxScroll;
                let mouseMoveFunction = (e) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    let changedvalue = (this._orientation === Orientation.horizontal ? e.screenX : e.screenY) - mouseStart;
                    let scroll = valueStart + changedvalue;
                    let value = scroll < 0 ? 0 : scroll > maxScroll ? maxScroll : scroll;
                    this.value = (this._maximum - this._minimum) * (value / maxScroll);
                };
                let mouseUpFunction = (e) => {
                    document.removeEventListener('mousemove', mouseMoveFunction);
                    document.removeEventListener('mouseup', mouseUpFunction);
                };
                document.addEventListener('mousemove', mouseMoveFunction);
                document.addEventListener('mouseup', mouseUpFunction);
            });
            this._dom.appendChild(this._slider);
            this._answer = document.createElement('div');
            this._slider.appendChild(this._answer);
            switch (orientation) {
                case Orientation.horizontal:
                    this._dom.className = 'excel-scroll-bar excel-scroll-bar-horizontal';
                    this._slider.className = 'excel-scroll-bar-slider';
                    this._answer.className = 'excel-scroll-bar-answer';
                    break;
                case Orientation.vertical:
                    this._dom.className = 'excel-scroll-bar excel-scroll-bar-vertical';
                    this._slider.className = 'excel-scroll-bar-slider';
                    this._answer.className = 'excel-scroll-bar-answer';
                    break;
            }
        }
        get slider() {
            let viewport = this._viewport === 0 ? this._maximum : this._viewport;
            let length = this._maximum - this._minimum + viewport;
            switch (this._orientation) {
                case Orientation.horizontal:
                    return length !== 0 ? this.width * (viewport / length) : 0;
                case Orientation.vertical:
                    return length !== 0 ? this.height * (viewport / length) : 0;
                default:
                    throw 'unknown orientation: ' + this._orientation;
            }
        }
        get scroll() {
            return this.maxScroll * (this._value - this._minimum) / (this._maximum - this._minimum);
        }
        get maxScroll() {
            switch (this._orientation) {
                case Orientation.horizontal:
                    return this.width - this.slider;
                case Orientation.vertical:
                    return this.height - this.slider;
                default:
                    throw 'unknown orientation: ' + this._orientation;
            }
        }
        get dom() {
            return this._dom;
        }
        get width() {
            return this._dom.clientWidth;
        }
        set width(value) {
            this._dom.style.width = value + 'px';
        }
        get height() {
            return this._dom.clientHeight;
        }
        set height(value) {
            this._dom.style.height = value + 'px';
        }
        get viewport() {
            return this._viewport;
        }
        set viewport(value) {
            this._viewport = value;
            switch (this._orientation) {
                case Orientation.horizontal:
                    this._dom.style.width = value + 'px';
                    break;
                case Orientation.vertical:
                    this._dom.style.height = value + 'px';
                    break;
            }
            this.render();
        }
        get minimum() {
            return this._minimum;
        }
        set minimum(value) {
            this._minimum = value;
            this.render();
        }
        get maximum() {
            return this._maximum;
        }
        set maximum(value) {
            this._maximum = value;
            this.render();
        }
        get value() {
            return this._value;
        }
        set value(value) {
            this._value = value < this._minimum ? this._minimum : value > this._maximum ? this._maximum : value;
            this.dispatchEventWith(ScrollBar.Scroll);
            this.render();
        }
        render() {
            switch (this._orientation) {
                case Orientation.horizontal:
                    this._slider.style.width = this.slider + 'px';
                    this._slider.style.left = this.scroll + 'px';
                    break;
                case Orientation.vertical:
                    this._slider.style.height = this.slider + 'px';
                    this._slider.style.top = this.scroll + 'px';
                    break;
            }
        }
    }
    ScrollBar.Scroll = 'scroll';
    class Workbook {
        constructor(setting) {
            if (setting === undefined) {
                setting = Setting.default;
            }
            this._setting = setting;
            this._sheets = new Worksheets(this);
            this._dom = document.createElement('div');
            this._dom.className = 'excel-container';
            this._dom.addEventListener('wheel', (e) => this.onMouseWheel(e));
            this._headContainer = document.createElement('div');
            this._headContainer.className = 'excel-head-container';
            this._dom.appendChild(this._headContainer);
            this._inputContainer = document.createElement('div');
            this._inputContainer.className = 'excel-input-container';
            this._headContainer.appendChild(this._inputContainer);
            this._cellHead = document.createElement('span');
            this._cellHead.className = 'excel-input-cell-head';
            this._inputContainer.appendChild(this._cellHead);
            this._cellInput = document.createElement('div');
            this._cellInput.className = 'excel-input-cell-input';
            this._cellInput.style.whiteSpace = 'pre-wrap';
            this._cellInput.contentEditable = "true";
            this._inputContainer.appendChild(this._cellInput);
            this._inputResize = document.createElement('div');
            this._inputResize.className = 'excel-input-resize';
            this._headContainer.appendChild(this._inputResize);
            this._bodyContainer = document.createElement('div');
            this._bodyContainer.className = 'excel-body-container';
            this._dom.appendChild(this._bodyContainer);
            this._canvas = document.createElement('canvas');
            this._canvas.className = 'excel-canvas';
            this._canvas.addEventListener('mousedown', (e) => {
                e.stopImmediatePropagation();
                e.stopPropagation();
                let sheet = this._current;
                if (sheet != null) {
                    let mx = e.clientX - this._canvasBounds.left;
                    let my = e.clientY - this._canvasBounds.top;
                    if (mx <= sheet.rows.width && my <= sheet.columns.height) {
                        sheet.selector.clear();
                        sheet.selector.width = Infinity;
                        sheet.selector.height = Infinity;
                        this.render();
                    }
                    else {
                        sheet.selector.clear();
                        sheet.selector.start = sheet.getGridPoint(new Point(mx, my));
                        if (mx <= sheet.rows.width) {
                            sheet.selector.width = Infinity;
                        }
                        if (my <= sheet.columns.height) {
                            sheet.selector.height = Infinity;
                        }
                        this.render();
                    }
                }
            });
            this._canvas.addEventListener('mousemove', (e) => {
                //e.stopImmediatePropagation();
                //e.stopPropagation();
                let sheet = this._current;
                if (sheet != null) {
                    let mx = e.clientX - this._canvasBounds.left;
                    let my = e.clientY - this._canvasBounds.top;
                    if (mx > sheet.rows.width && my <= sheet.columns.height) {
                        this.setCursor('default');
                    }
                    else if (mx <= sheet.rows.width && my > sheet.columns.height) {
                        this.setCursor('default');
                    }
                    else if (mx <= sheet.rows.width && my <= sheet.columns.height) {
                        this.setCursor('cell');
                    }
                    else {
                        this.setCursor('cell');
                    }
                }
            });
            this._canvas.addEventListener('mouseup', (e) => {
                //e.stopImmediatePropagation();
                //e.stopPropagation();
            });
            this._ctx = this._canvas.getContext('2d');
            let backingStore = 1;
            this._ratio = (window.devicePixelRatio || 1) / backingStore;
            this._ctx.lineWidth = 1;
            this._ctx.font = `normal ${12 * this._ratio}px PingFang SC`;
            this._ctx.textBaseline = 'middle';
            this._ctx.save();
            this._drawingContext = new DrawingContext(this, this._ctx);
            this._bodyContainer.appendChild(this._canvas);
            this._horizontalScrollBar = new ScrollBar(Orientation.horizontal);
            this._horizontalScrollBar.addEventListener(ScrollBar.Scroll, this.onHorizontalScroll, this);
            this._verticalScrollBar = new ScrollBar(Orientation.vertical);
            this._verticalScrollBar.addEventListener(ScrollBar.Scroll, this.onVerticalScroll, this);
            this._bodyContainer.appendChild(this._horizontalScrollBar.dom);
            this._bodyContainer.appendChild(this._verticalScrollBar.dom);
            document.addEventListener('mousemove', (e) => {
                let sheet = this._current;
                if (sheet != null) {
                    let mx = e.clientX - this._canvasBounds.left;
                    let my = e.clientY - this._canvasBounds.top;
                }
            });
            window.addEventListener('resize', (e) => this.resize());
            window.addEventListener('keydown', (e) => {
            });
        }
        get dom() {
            return this._dom;
        }
        get setting() {
            return this._setting;
        }
        get sheets() {
            return this._sheets;
        }
        get current() {
            return this._current;
        }
        get width() {
            return this._dom.clientWidth;
        }
        get height() {
            return this._dom.clientHeight;
        }
        get ratio() {
            return this._ratio;
        }
        onHorizontalScroll(e) {
            if (this._current != null) {
                this._current.offset = new Vector(this._horizontalScrollBar.value, this._current.offset.y);
                this.render();
            }
        }
        onVerticalScroll(e) {
            if (this._current != null) {
                this._current.offset = new Vector(this._current.offset.x, this._verticalScrollBar.value);
                this.render();
            }
        }
        onMouseWheel(e) {
            e.stopImmediatePropagation();
            e.stopPropagation();
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                this._horizontalScrollBar.value += e.deltaX;
            }
            else {
                this._verticalScrollBar.value += e.deltaY;
            }
        }
        setCursor(cursor) {
            if (this._canvas.style.cursor != cursor) {
                this._canvas.style.cursor = cursor;
            }
        }
        resize() {
            this._canvas.width = this._bodyContainer.clientWidth - this._setting.width.scroll;
            this._canvas.height = this._bodyContainer.clientHeight - this._setting.width.scroll;
            this._canvasBounds = this._canvas.getBoundingClientRect();
            this._horizontalScrollBar.width = this._bodyContainer.clientWidth - 18;
            this._verticalScrollBar.height = this._bodyContainer.clientHeight - 18;
            if (this._current != null) {
                this._horizontalScrollBar.viewport = this._horizontalScrollBar.width;
                this._horizontalScrollBar.maximum = this._current.width - this._horizontalScrollBar.width;
                this._verticalScrollBar.viewport = this._verticalScrollBar.height;
                this._verticalScrollBar.maximum = this._current.height - this._verticalScrollBar.viewport;
            }
            this.render();
        }
        initialize() {
            this.resize();
        }
        select(sheet) {
            if (sheet == null)
                throw 'argument null exception: sheet';
            this._current = sheet;
            this.resize();
        }
        render() {
            if (this._current !== undefined) {
                requestAnimationFrame(() => {
                    this._current.render(this._drawingContext);
                });
            }
        }
    }
    class Selector {
        constructor() {
            this.clear();
        }
        clear() {
            this.start = new GridPoint();
            this.width = undefined;
            this.height = undefined;
            this.isDragging = undefined;
        }
    }
    class Worksheet {
        constructor(workbook) {
            this._width = 0;
            this._height = 0;
            this._bodyWidth = 0;
            this._bodyHeight = 0;
            if (workbook === undefined)
                throw 'argument null exception: workbook';
            let setting = workbook.setting;
            this._workbook = workbook;
            this._columns = new Columns();
            this._columns.height = setting.height.columns;
            this._rows = new Rows();
            this._rows.width = setting.width.serial;
            this._offset = new Vector();
            this._selector = new Selector();
            let column;
            let startx = this._rows.width;
            for (let i = 0; i < 26; i++) {
                column = new Column();
                column.width = setting.width.cell;
                column.title = this.getColumnName(i);
                column.index = i;
                column.hidden = false;
                column.x = startx;
                this._columns.add(column);
                startx += column.width;
                this._bodyWidth += column.width;
            }
            this._width = startx;
            let starty = this._columns.height;
            for (let i = 0; i < 200; i++) {
                let row = new Row(this);
                row.index = i;
                row.height = setting.height.row;
                row.style = '';
                row.y = starty;
                startx = this._rows.width;
                for (let j = 0; j < this._columns.count; j++) {
                    column = this._columns[j];
                    let cell = new Cell();
                    cell.row = row;
                    cell.column = column;
                    cell.type = 'text';
                    cell.text = null;
                    cell.font = null;
                    cell.style = null;
                    row.cells.add(cell);
                    startx += column.width;
                }
                this._rows.add(row);
                starty += row.height;
                this._bodyHeight += row.height;
            }
            this._height = starty;
        }
        get name() {
            return this._name;
        }
        set name(value) {
            this._name = value;
        }
        get columns() {
            return this._columns;
        }
        get rows() {
            return this._rows;
        }
        get width() {
            return this._width;
        }
        get height() {
            return this._height;
        }
        get offset() {
            return this._offset;
        }
        set offset(value) {
            this._offset = value;
        }
        get selector() {
            return this._selector;
        }
        set selector(value) {
            this._selector = value;
        }
        getColumnName(index) {
            const charForArray = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
            let value = index % 26;
            let name = charForArray[value];
            index = Math.floor(index / 26);
            while (index > 0) {
                value = (index - 1) % 26;
                index = Math.floor((index - 1) / 26);
                name = charForArray[value] + name;
            }
            return name;
        }
        drawSelector(drawingContext) {
            drawingContext.beginPath();
            drawingContext.lineWidth = 2 * drawingContext.ratio;
            drawingContext.strokeStyle = '#237245';
            let start = this.getCell(this._selector.start);
            let row = start.row;
            let column = start.column;
            let height = this._selector.height === Infinity ? this._bodyHeight : row.height;
            let width = this._selector.width === Infinity ? this._bodyWidth : column.width;
            let p = this.getPosition(start);
            let right = p.x + width + 2;
            let bottom = p.y + height + 2;
            if (right > this._rows.width) {
                drawingContext.moveTo(p.x, this._columns.height);
                drawingContext.lineTo(p.x + width, this._columns.height);
            }
            if (bottom > this._columns.height) {
                drawingContext.moveTo(this._rows.width, p.y);
                drawingContext.lineTo(this._rows.width, p.y + height);
            }
            drawingContext.stroke();
        }
        drawGrid(drawingContext) {
            let width = this._workbook.width;
            let height = this._workbook.height;
            drawingContext.beginPath();
            drawingContext.lineWidth = 1 * drawingContext.ratio;
            drawingContext.strokeStyle = '#cecece';
            let column;
            let startx = this._rows.width - this._offset.x;
            for (let i = 0; i < this._columns.count; i++) {
                column = this._columns[i];
                if (startx + column.width >= this._rows.width) {
                    if (startx > width) {
                        break;
                    }
                    if (column.width !== 0) {
                        drawingContext.moveTo(startx + column.width, this._columns.height, true);
                        drawingContext.lineTo(startx + column.width, height, true);
                    }
                }
                startx += column.width;
            }
            let row;
            let starty = this._columns.height - this._offset.y;
            for (let i = 0; i < this._rows.count; i++) {
                row = this._rows[i];
                if (starty + row.height >= this._columns.height) {
                    if (starty > height) {
                        break;
                    }
                    if (row.height !== 0) {
                        drawingContext.moveTo(this._rows.width, starty + row.height, true);
                        drawingContext.lineTo(width, starty + row.height, true);
                    }
                }
                starty += row.height;
            }
            drawingContext.stroke();
        }
        drawBorder(drawingContext) {
            let width = this._workbook.width;
            let height = this._workbook.height;
            drawingContext.fillStyle = '#f5f5f5';
            drawingContext.fillRect(0, 0, this._workbook.width, this._columns.height);
            drawingContext.fillRect(0, 0, this._rows.width, this._workbook.height);
            drawingContext.fillStyle = '#e0e0e0';
            var cell = this.getCell(this._selector.start);
            drawingContext.fillRect(0, cell.row.y - this._offset.y, this._rows.width, cell.row.height);
            drawingContext.fillRect(cell.column.x - this._offset.x, 0, cell.column.width, this._columns.height);
            drawingContext.beginPath();
            drawingContext.lineWidth = 1 * drawingContext.ratio;
            drawingContext.textAlign = 'center';
            drawingContext.strokeStyle = '#cecece';
            drawingContext.fillStyle = '#333333';
            drawingContext.font = `normal ${12 * drawingContext.ratio}px PingFang SC`;
            drawingContext.textBaseline = 'middle';
            let column;
            let startx = this._rows.width - this._offset.x;
            for (let i = 0; i < this._columns.count; i++) {
                column = this._columns[i];
                if (startx + column.width >= this._rows.width) {
                    if (startx > width) {
                        break;
                    }
                    drawingContext.moveTo(startx + column.width, 0, true);
                    drawingContext.lineTo(startx + column.width, this._columns.height, true);
                    if (column.width > 0) {
                        drawingContext.drawText(startx + column.width / 2, 12, [column.title]);
                    }
                    else if (column.width > 0) {
                        drawingContext.drawText(startx + column.width / 2, 12, ['.']);
                    }
                }
                startx += column.width;
            }
            drawingContext.stroke();
            let row;
            let starty = this._columns.height - this._offset.y;
            for (let i = 0; i < this._rows.count; i++) {
                row = this._rows[i];
                if (starty + row.height >= this._columns.height) {
                    if (starty > height) {
                        break;
                    }
                    drawingContext.moveTo(0, starty + row.height, true);
                    drawingContext.lineTo(this._rows.width, starty + row.height, true);
                    if (row.height > 10) {
                        drawingContext.drawText(this._rows.width / 2, starty + 11, [(i + 1).toString()]);
                    }
                    else if (row.height > 0) {
                        drawingContext.drawText(this._rows.width / 2, starty + 11, ['.']);
                    }
                }
                starty += row.height;
            }
            drawingContext.stroke();
            drawingContext.beginPath();
            drawingContext.strokeStyle = '#bdbbbc';
            drawingContext.moveTo(this._rows.width, this._columns.height, true);
            drawingContext.lineTo(this._workbook.width, this._columns.height, true);
            drawingContext.moveTo(this._rows.width, this._columns.height, true);
            drawingContext.lineTo(this._rows.width, this._workbook.height, true);
            drawingContext.stroke();
            this.drawSelector(drawingContext);
            drawingContext.fillStyle = '#fbfbfb';
            drawingContext.fillRect(0, 0, this._rows.width, this._columns.height);
            drawingContext.beginPath();
            drawingContext.lineWidth = 1 * drawingContext.ratio;
            drawingContext.strokeStyle = '#cecece';
            drawingContext.moveTo(this._rows.width, 0, true);
            drawingContext.lineTo(this._rows.width, this._columns.height, true);
            drawingContext.lineTo(0, this._columns.height, true);
            drawingContext.stroke();
            let sideOffset = 3.5;
            let sideLength = Math.min(this._rows.width, this._columns.height) * 4 / 5 - sideOffset;
            drawingContext.beginPath();
            drawingContext.moveTo(this._rows.width - sideOffset, this._columns.height - sideOffset - sideLength);
            drawingContext.lineTo(this._rows.width - sideOffset, this._columns.height - sideOffset);
            drawingContext.lineTo(this._rows.width - sideOffset - sideLength, this._columns.height - sideOffset);
            drawingContext.closePath();
            if (this._selector.width === Infinity && this._selector.height === Infinity) {
                drawingContext.fillStyle = '#237245';
                drawingContext.strokeStyle = '#237245';
            }
            else {
                drawingContext.strokeStyle = '#dfdfdf';
                drawingContext.fillStyle = '#dfdfdf';
            }
            drawingContext.fill();
            drawingContext.stroke();
        }
        drawData(drawingContext) {
            drawingContext.beginPath();
            drawingContext.font = `normal ${12 * drawingContext.ratio}px PingFang SC`;
            drawingContext.textAlign = 'center';
            drawingContext.textBaseline = 'middle';
        }
        render(drawingContext) {
            let width = this._workbook.width;
            let height = this._workbook.height;
            drawingContext.clearRect(0, 0, width, height);
            this.drawGrid(drawingContext);
            this.drawData(drawingContext);
            if (this._selector.width === undefined && this._selector.height === undefined) {
                let start = this.getCell(this._selector.start);
                let p = this.getPosition(this._selector.start);
                let width = start.column.width;
                let height = start.row.height;
                if (p.x + width > this._rows.width && p.x < this._width &&
                    p.y + height > this._columns.height && p.y < this._height) {
                    drawingContext.beginPath();
                    drawingContext.lineWidth = 2 * drawingContext.ratio;
                    drawingContext.strokeStyle = '#237245';
                    drawingContext.strokeRect(p.x, p.y, width, height);
                    drawingContext.fillStyle = '#ffffff';
                    drawingContext.lineWidth = 1 * drawingContext.ratio;
                    drawingContext.fillRect(p.x + width - 4, p.y + height - 4, 7, 7);
                    drawingContext.fillStyle = '#237245';
                    drawingContext.fillRect(p.x + width - 3, p.y + height - 3, 6, 6);
                    drawingContext.stroke();
                }
            }
            this.drawBorder(drawingContext);
        }
        getRow(index) {
            return this._rows[index];
        }
        getColumn(index) {
            return this._columns[index];
        }
        getCell(p) {
            let row = this._rows[p.row];
            return row.cells[p.column];
        }
        getGridPoint(p) {
            let top;
            let left;
            let right;
            let bottom;
            let x = this._offset.x + p.x;
            let y = this._offset.y + p.y;
            for (let row of this._rows) {
                top = row.y;
                bottom = row.y + row.height;
                if (top <= y && y <= bottom) {
                    for (let column of this._columns) {
                        left = column.x;
                        right = column.x + column.width;
                        if (left <= x && x <= right) {
                            return new GridPoint(row.index, column.index);
                        }
                    }
                }
            }
            return null;
        }
        getPosition(p) {
            let cell = p instanceof GridPoint ? this.getCell(p) : p;
            return new Point(cell.column.x - this._offset.x, cell.row.y - this._offset.y);
        }
    }
    class Worksheets {
        constructor(workbook) {
            this._size = 0;
            this._version = 0;
            this._workbook = workbook;
        }
        get count() {
            return this._size;
        }
        add(name) {
            let worksheet = new Worksheet(this._workbook);
            worksheet.name = name;
            this[this._size++] = worksheet;
            this._version++;
            return worksheet;
        }
        [Symbol.iterator]() {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator() {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== version)
                        throw 'invalid operation exception: version error.';
                    yield enumerable[i];
                }
            }
            return anotherGenerator();
        }
    }
    class Column {
        get x() {
            return this._x;
        }
        set x(value) {
            this._x = value;
        }
        get width() {
            return this._width;
        }
        set width(value) {
            this._width = value;
        }
        get title() {
            return this._title;
        }
        set title(value) {
            this._title = value;
        }
        get index() {
            return this._index;
        }
        set index(value) {
            this._index = value;
        }
        get hidden() {
            return this._hidden;
        }
        set hidden(value) {
            this._hidden = value;
        }
    }
    class Columns {
        constructor() {
            this._size = 0;
            this._version = 0;
        }
        get count() {
            return this._size;
        }
        get height() {
            return this._height;
        }
        set height(value) {
            this._height = value;
        }
        add(column) {
            this[this._size++] = column;
            this._version++;
        }
        [Symbol.iterator]() {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator() {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== version)
                        throw 'invalid operation exception: version error.';
                    yield enumerable[i];
                }
            }
            return anotherGenerator();
        }
    }
    class Row {
        constructor(sheet) {
            this._cells = new List();
            if (sheet === undefined)
                throw 'argument null exception: sheet';
            this._sheet = sheet;
        }
        get cells() {
            return this._cells;
        }
        get index() {
            return this._index;
        }
        set index(value) {
            this._index = value;
        }
        get height() {
            return this._height;
        }
        set height(value) {
            this._height = value;
        }
        get style() {
            return this._style;
        }
        set style(value) {
            this._style = value;
        }
        get y() {
            return this._y;
        }
        set y(value) {
            this._y = value;
        }
    }
    class Rows {
        constructor() {
            this._size = 0;
            this._version = 0;
        }
        get count() {
            return this._size;
        }
        get width() {
            return this._width;
        }
        set width(value) {
            this._width = value;
        }
        add(row) {
            this[this._size++] = row;
            this._version++;
        }
        [Symbol.iterator]() {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator() {
                for (let i = 0; i < count; i++) {
                    if (enumerable._version !== version)
                        throw 'invalid operation exception: version error.';
                    yield enumerable[i];
                }
            }
            return anotherGenerator();
        }
    }
    class Cell {
        get row() {
            return this._row;
        }
        set row(value) {
            this._row = value;
        }
        get column() {
            return this._column;
        }
        set column(value) {
            this._column = value;
        }
        get text() {
            return this._text;
        }
        set text(value) {
            this._text = value;
        }
        get font() {
            return this._font;
        }
        set font(value) {
            this._font = value;
        }
        get type() {
            return this._type;
        }
        set type(value) {
            this._type = value;
        }
        get style() {
            return this._style;
        }
        set style(value) {
            this._style = value;
        }
    }
    return {
        Workbook: Workbook,
    };
});
//# sourceMappingURL=ui-workbook.js.map