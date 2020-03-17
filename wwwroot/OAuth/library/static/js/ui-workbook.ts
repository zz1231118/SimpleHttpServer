define((require) => {
    let system = require('./netcore/system');
    let drawing = require('./netcore/system.drawing');
    let generic = require('./netcore/system.collections.generic');

    let Event: system.EventConstructor = system.Event;
    let EventDispatcher: system.EventDispatcherConstructor = system.EventDispatcher;
    let Point: system.drawing.PointConstructor = drawing.Point;
    let Vector: system.drawing.VectorConstructor = drawing.Vector;
    let List: system.collections.generic.ListConstructor = generic.List;

    interface IDefault {
        width: number;
        height: number;
    }
    interface IPoint {
        center: Array<number>;
    }
    interface IWidth {
        serial: number;
        scroll: number;
        right: number;
        cell: number;
    }
    interface IHeight {
        row: number;
        nav: number;
        toolbar: number;
        fx: number;
        columns: number;
        bottom: number;
        sheet: number;
    }
    class GridPoint {
        private _row: number;
        private _column: number;

        public constructor(row: number = 0, column: number = 0) {
            this._row = row;
            this._column = column;
        }

        public get row(): number {
            return this._row;
        }
        public get column(): number {
            return this._column;
        }
    }
    class Setting {
        private static _default: Setting;
        private _default: IDefault;
        private _point: IPoint;
        private _width: IWidth;
        private _height: IHeight;

        public static get default(): Setting {
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
        public get default(): IDefault {
            return this._default;
        }
        public get point(): IPoint {
            return this._point;
        }
        public get width(): IWidth {
            return this._width;
        }
        public get height(): IHeight {
            return this._height;
        }
    }
    class DrawingContext {
        private _workbook: Workbook;
        private _ctx: CanvasRenderingContext2D;

        public constructor(workbook: Workbook, ctx: CanvasRenderingContext2D) {
            this._workbook = workbook;
            this._ctx = ctx;
        }

        public get ratio(): number {
            return this._workbook.ratio;
        }
        public set fillStyle(value: string) {
            this._ctx.fillStyle = value;
        }
        public set strokeStyle(value: string) {
            this._ctx.strokeStyle = value;
        }
        public set font(value: string) {
            this._ctx.font = value;
        }
        public set textBaseline(value: CanvasTextBaseline) {
            this._ctx.textBaseline = value;
        }
        public set lineWidth(value: number) {
            this._ctx.lineWidth = value;
        }
        public set textAlign(value: CanvasTextAlign) {
            this._ctx.textAlign = value;
        }

        private convert(value: number, fix?: boolean): number {
            return fix ? (value + 0.5) * this._workbook.ratio : value * this._workbook.ratio;
        }
        private getTextLine(text: string, width: number): Array<string> {
            if (!text) {
                return null;
            }
            let temp = '';
            let array = `${text}`.split('');
            let row = new Array<string>();
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

        public drawText(x: number, y: number, row: Array<string>, maxWidth?: number): void {
            if (row.length > 1) {
                for (let i = 0; i < row.length; i++) {
                    this._ctx.fillText(row[i], x, y + (i * 15));
                }
            } else if (maxWidth) {
                let array = this.getTextLine(row[0], maxWidth);
                if (array) {
                    this._ctx.fillText(array[0], x, y, maxWidth);
                }
            } else {
                this._ctx.fillText(row[0], x, y);
            }
        }

        public beginPath(): void {
            this._ctx.beginPath();
        }
        public closePath(): void {
            this._ctx.closePath();
        }
        public stroke(): void {
            this._ctx.stroke();
        }
        public fill(): void {
            this._ctx.fill();
        }
        public clearRect(x: number, y: number, width: number, height: number): void {
            x = this.convert(x);
            y = this.convert(y);
            width = this.convert(width);
            height = this.convert(height);
            this._ctx.clearRect(x, y, width, height);
        }
        public fillRect(x: number, y: number, width: number, height: number, fix?: boolean): void {
            x = this.convert(x, fix);
            y = this.convert(y, fix);
            width = this.convert(width, fix);
            height = this.convert(height, fix);
            this._ctx.fillRect(x, y, width, height);
        }
        public strokeRect(x: number, y: number, width: number, height: number): void {
            x = this.convert(x);
            y = this.convert(y);
            width = this.convert(width);
            height = this.convert(height);
            this._ctx.strokeRect(x, y, width, height);
        }
        public moveTo(x: number, y: number, fix?: boolean): void {
            x = this.convert(x, fix);
            y = this.convert(y, fix);
            this._ctx.moveTo(x, y);
        }
        public lineTo(x: number, y: number, fix?: boolean): void {
            x = this.convert(x, fix);
            y = this.convert(y, fix);
            this._ctx.lineTo(x, y);
        }
    }

    enum Orientation {
        horizontal,
        vertical,
    }
    class ScrollBar extends EventDispatcher {
        public static readonly Scroll = 'scroll';
        private _orientation: Orientation;
        private _dom: HTMLDivElement;
        private _slider: HTMLDivElement;
        private _answer: HTMLDivElement;
        private _viewport: number = 0;
        private _minimum: number = 0;
        private _maximum: number = 1;
        private _value: number = 0;

        public constructor(orientation: Orientation) {
            super();
            this._orientation = orientation;
            this._dom = document.createElement('div');
            this._slider = document.createElement('div');
            this._slider.addEventListener('mousedown', (e: MouseEvent) => {
                e.stopImmediatePropagation();
                e.stopPropagation();

                let valueStart = this.scroll;
                let mouseStart = this._orientation === Orientation.horizontal ? e.screenX : e.screenY;
                let maxScroll = this.maxScroll;
                let mouseMoveFunction = (e: MouseEvent) => {
                    e.stopImmediatePropagation();
                    e.stopPropagation();
                    let changedvalue = (this._orientation === Orientation.horizontal ? e.screenX : e.screenY) - mouseStart;
                    let scroll = valueStart + changedvalue;
                    let value = scroll < 0 ? 0 : scroll > maxScroll ? maxScroll : scroll;
                    this.value = (this._maximum - this._minimum) * (value / maxScroll);
                };
                let mouseUpFunction = (e: MouseEvent) => {
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

        private get slider(): number {
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
        private get scroll(): number {
            return this.maxScroll * (this._value - this._minimum) / (this._maximum - this._minimum);
        }
        private get maxScroll(): number {
            switch (this._orientation) {
                case Orientation.horizontal:
                    return this.width - this.slider;
                case Orientation.vertical:
                    return this.height - this.slider;
                default:
                    throw 'unknown orientation: ' + this._orientation;
            }
        }

        public get dom(): Element {
            return this._dom;
        }
        public get width(): number {
            return this._dom.clientWidth;
        }
        public set width(value: number) {
            this._dom.style.width = value + 'px';
        }
        public get height(): number {
            return this._dom.clientHeight;
        }
        public set height(value: number) {
            this._dom.style.height = value + 'px';
        }
        public get viewport(): number {
            return this._viewport;
        }
        public set viewport(value: number) {
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
        public get minimum(): number {
            return this._minimum;
        }
        public set minimum(value: number) {
            this._minimum = value;
            this.render();
        }
        public get maximum(): number {
            return this._maximum;
        }
        public set maximum(value: number) {
            this._maximum = value;
            this.render();
        }
        public get value(): number {
            return this._value;
        }
        public set value(value: number) {
            this._value = value < this._minimum ? this._minimum : value > this._maximum ? this._maximum : value;
            this.dispatchEventWith(ScrollBar.Scroll);
            this.render();
        }

        private render(): void {
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

    class Workbook {
        private _setting: Setting;
        private _sheets: Worksheets;
        private _dom: HTMLDivElement;
        private _headContainer: HTMLDivElement;
        private _bodyContainer: HTMLDivElement;
        private _inputContainer: HTMLDivElement;
        private _inputResize: HTMLDivElement;
        private _cellHead: HTMLSpanElement;
        private _cellInput: HTMLDivElement;
        private _canvas: HTMLCanvasElement;
        private _ctx: CanvasRenderingContext2D;
        private _canvasBounds: ClientRect;
        private _drawingContext: DrawingContext;
        private _horizontalScrollBar: ScrollBar;
        private _verticalScrollBar: ScrollBar;
        private _ratio: number;
        private _current: Worksheet;

        public constructor(setting?: Setting) {
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
                    } else {
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
                    } else if (mx <= sheet.rows.width && my > sheet.columns.height) {
                        this.setCursor('default');
                    } else if (mx <= sheet.rows.width && my <= sheet.columns.height) {
                        this.setCursor('cell');
                    } else {
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

        public get dom(): Element {
            return this._dom;
        }
        public get setting(): Setting {
            return this._setting;
        }
        public get sheets(): Worksheets {
            return this._sheets;
        }
        public get current(): Worksheet {
            return this._current;
        }
        public get width(): number {
            return this._dom.clientWidth;
        }
        public get height(): number {
            return this._dom.clientHeight;
        }
        public get ratio(): number {
            return this._ratio;
        }

        private onHorizontalScroll(e: system.Event): void {
            if (this._current != null) {
                this._current.offset = new Vector(this._horizontalScrollBar.value, this._current.offset.y);
                this.render();
            }
        }
        private onVerticalScroll(e: system.Event): void {
            if (this._current != null) {
                this._current.offset = new Vector(this._current.offset.x, this._verticalScrollBar.value);
                this.render();
            }
        }
        private onMouseWheel(e: WheelEvent): void {
            e.stopImmediatePropagation();
            e.stopPropagation();
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                this._horizontalScrollBar.value += e.deltaX;
            } else {
                this._verticalScrollBar.value += e.deltaY;
            }
        }
        private setCursor(cursor: string): void {
            if (this._canvas.style.cursor != cursor) {
                this._canvas.style.cursor = cursor;
            }
        }
        private resize(): void {
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

        public initialize(): void {
            this.resize();
        }
        public select(sheet: Worksheet): void {
            if (sheet == null)
                throw 'argument null exception: sheet';

            this._current = sheet;
            this.resize();
        }
        public render(): void {
            if (this._current !== undefined) {
                requestAnimationFrame(() => {
                    this._current.render(this._drawingContext);
                });
            }
        }
    }

    class Selector {
        public start: GridPoint;
        public width: number;
        public height: number;
        public isDragging: boolean;

        public constructor() {
            this.clear();
        }

        public clear(): void {
            this.start = new GridPoint();
            this.width = undefined;
            this.height = undefined;
            this.isDragging = undefined;
        }
    }
    class Worksheet {
        private _workbook: Workbook;
        private _name: string;
        private _columns: Columns;
        private _rows: Rows;
        private _width: number = 0;
        private _height: number = 0;
        private _bodyWidth: number = 0;
        private _bodyHeight: number = 0;
        private _offset: system.drawing.Vector;
        private _selector: Selector;

        public constructor(workbook: Workbook) {
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

            let column: Column;
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
                    column = this._columns[j]
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

        public get name(): string {
            return this._name;
        }
        public set name(value: string) {
            this._name = value;
        }
        public get columns(): Columns {
            return this._columns;
        }
        public get rows(): Rows {
            return this._rows;
        }
        public get width(): number {
            return this._width;
        }
        public get height(): number {
            return this._height;
        }
        
        public get offset(): system.drawing.Vector {
            return this._offset;
        }
        public set offset(value: system.drawing.Vector) {
            this._offset = value;
        }
        public get selector(): Selector {
            return this._selector;
        }
        public set selector(value: Selector) {
            this._selector = value;
        }

        private getColumnName(index: number): string {
            const charForArray = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
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
        private drawSelector(drawingContext: DrawingContext): void {
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
        private drawGrid(drawingContext: DrawingContext): void {
            let width = this._workbook.width;
            let height = this._workbook.height;
            drawingContext.beginPath();
            drawingContext.lineWidth = 1 * drawingContext.ratio;
            drawingContext.strokeStyle = '#cecece';

            let column: Column;
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

            let row: Row;
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
        private drawBorder(drawingContext: DrawingContext): void {
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

            let column: Column;
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
                    } else if (column.width > 0) {
                        drawingContext.drawText(startx + column.width / 2, 12, ['.']);
                    }
                }
                startx += column.width;
            }
            drawingContext.stroke();

            let row: Row;
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
                    } else if (row.height > 0) {
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
                drawingContext.fillStyle = '#237245'
                drawingContext.strokeStyle = '#237245'
            } else {
                drawingContext.strokeStyle = '#dfdfdf';
                drawingContext.fillStyle = '#dfdfdf';
            }

            drawingContext.fill();
            drawingContext.stroke();
        }
        private drawData(drawingContext: DrawingContext): void {
            drawingContext.beginPath();
            drawingContext.font = `normal ${12 * drawingContext.ratio}px PingFang SC`;
            drawingContext.textAlign = 'center';
            drawingContext.textBaseline = 'middle';
            
        }

        public render(drawingContext: DrawingContext): void {
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
        public getRow(index: number): Row {
            return this._rows[index];
        }
        public getColumn(index: number): Column {
            return this._columns[index];
        }
        public getCell(p: GridPoint): Cell {
            let row = this._rows[p.row];
            return row.cells[p.column];
        }
        public getGridPoint(p: system.drawing.Point): GridPoint {
            let top: number;
            let left: number;
            let right: number;
            let bottom: number;
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
        public getPosition(p: GridPoint | Cell): system.drawing.Point {
            let cell = p instanceof GridPoint ? this.getCell(p) : p;
            return new Point(cell.column.x - this._offset.x, cell.row.y - this._offset.y);
        }
    }
    class Worksheets implements Iterable<Worksheet> {
        private _workbook: Workbook;
        private _size: number = 0;
        private _version: number = 0;

        public constructor(workbook: Workbook) {
            this._workbook = workbook;
        }

        [index: number]: Worksheet;
        public get count(): number {
            return this._size;
        }

        public add(name: string): Worksheet {
            let worksheet = new Worksheet(this._workbook);
            worksheet.name = name;

            this[this._size++] = worksheet;
            this._version++;
            return worksheet;
        }

        [Symbol.iterator](): Iterator<Worksheet> {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator(): IterableIterator<Worksheet> {
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
        private _x: number;
        private _width: number;
        private _title: string;
        private _index: number;
        private _hidden: boolean;

        public get x(): number {
            return this._x;
        }
        public set x(value: number) {
            this._x = value;
        }
        public get width(): number {
            return this._width;
        }
        public set width(value: number) {
            this._width = value;
        }
        public get title(): string {
            return this._title;
        }
        public set title(value: string) {
            this._title = value;
        }
        public get index(): number {
            return this._index;
        }
        public set index(value: number) {
            this._index = value;
        }
        public get hidden(): boolean {
            return this._hidden;
        }
        public set hidden(value: boolean) {
            this._hidden = value;
        }
    }
    class Columns implements Iterable<Column> {
        private _size: number = 0;
        private _version: number = 0;
        private _height: number;

        [index: number]: Column;
        public get count(): number {
            return this._size;
        }
        public get height(): number {
            return this._height;
        }
        public set height(value: number) {
            this._height = value;
        }

        public add(column: Column): void {
            this[this._size++] = column;
            this._version++;
        }

        [Symbol.iterator](): Iterator<Column> {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator(): IterableIterator<Column> {
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
        private _sheet: Worksheet;
        private _cells: system.collections.generic.List<Cell> = new List<Cell>();
        private _index: number;
        private _height: number;
        private _style: string;
        private _y: number;

        public constructor(sheet: Worksheet) {
            if (sheet === undefined)
                throw 'argument null exception: sheet';

            this._sheet = sheet;
        }

        public get cells(): system.collections.generic.IList<Cell> {
            return this._cells;
        }
        public get index(): number {
            return this._index;
        }
        public set index(value: number) {
            this._index = value;
        }
        public get height(): number {
            return this._height;
        }
        public set height(value: number) {
            this._height = value;
        }
        public get style(): string {
            return this._style;
        }
        public set style(value: string) {
            this._style = value;
        }
        public get y(): number {
            return this._y;
        }
        public set y(value: number) {
            this._y = value;
        }
    }
    class Rows implements Iterable<Row> {
        private _size: number = 0;
        private _version: number = 0;
        private _width: number;

        [index: number]: Row;
        public get count(): number {
            return this._size;
        }
        public get width(): number {
            return this._width;
        }
        public set width(value: number) {
            this._width = value;
        }

        public add(row: Row): void {
            this[this._size++] = row;
            this._version++;
        }

        [Symbol.iterator](): Iterator<Row> {
            let enumerable = this;
            let count = this._size;
            let version = this._version;
            function* anotherGenerator(): IterableIterator<Row> {
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
        private _row: Row;
        private _column: Column;
        private _text: string;
        private _font: string;
        private _type: string;
        private _style: string;

        public get row(): Row {
            return this._row;
        }
        public set row(value: Row) {
            this._row = value;
        }
        public get column(): Column {
            return this._column;
        }
        public set column(value: Column) {
            this._column = value;
        }
        public get text(): string {
            return this._text;
        }
        public set text(value: string) {
            this._text = value;
        }
        public get font(): string {
            return this._font;
        }
        public set font(value: string) {
            this._font = value;
        }
        public get type(): string {
            return this._type;
        }
        public set type(value: string) {
            this._type = value;
        }
        public get style(): string {
            return this._style;
        }
        public set style(value: string) {
            this._style = value;
        }
    }

    return {
        Workbook: Workbook,
    };
});