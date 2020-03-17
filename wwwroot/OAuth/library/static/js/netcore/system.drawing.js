define((require) => {
    class Point {
        constructor(x = 0, y = 0) {
            this._x = x;
            this._y = y;
        }
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        add(v) {
            if (v == null)
                throw 'argument null exception: v';
            return new Point(this._x + v.x, this._y + v.y);
        }
        subtract(v) {
            if (v == null)
                throw 'argument null exception: v';
            return new Point(this._x - v.x, this._y - v.y);
        }
    }
    class Vector {
        constructor(x = 0, y = 0) {
            this._x = x;
            this._y = y;
        }
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
    }
    class Size {
        constructor(width = 0, height = 0) {
            this._width = width;
            this._height = height;
        }
        get width() {
            return this._width;
        }
        get height() {
            return this._height;
        }
        multiply(value) {
            return new Size(this._width * value, this._height * value);
        }
    }
    class Rectangle {
        constructor(x = 0, y = 0, width = 0, height = 0) {
            switch (arguments.length) {
                case 0:
                case 4:
                    this._x = x;
                    this._y = y;
                    this._width = width;
                    this._height = height;
                    break;
                case 2:
                    let point = x;
                    let size = y;
                    this._x = point.x;
                    this._y = point.y;
                    this._width = size.width;
                    this._height = size.height;
                    break;
                default:
                    throw 'argument exception.';
            }
        }
        get x() {
            return this._x;
        }
        get y() {
            return this._y;
        }
        get width() {
            return this._width;
        }
        get height() {
            return this._height;
        }
        get top() {
            return this._y;
        }
        get bottom() {
            return this._y + this._height;
        }
        get left() {
            return this._x;
        }
        get right() {
            return this._x + this._width;
        }
        contains(p) {
            if (p == null)
                throw 'argument null exception: p';
            return this._x <= p.x && p.x <= this.right && this._y <= p.y && p.y <= this.bottom;
        }
        intersectsWith(rect) {
            if (rect == null)
                throw 'argument null exception: rect';
            return (rect._x < this._x + this._width) &&
                (this._x < (rect._x + rect._width)) &&
                (rect._y < this._y + this._height) &&
                (this._y < rect._y + rect._height);
        }
    }
    return {
        Point: Point,
        Vector: Vector,
        Size: Size,
        Rectangle: Rectangle,
    };
});
//# sourceMappingURL=system.drawing.js.map