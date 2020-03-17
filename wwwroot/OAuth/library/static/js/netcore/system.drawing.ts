define((require) => {

    class Point {
        private _x: number;
        private _y: number;

        public constructor(x: number = 0, y: number = 0) {
            this._x = x;
            this._y = y;
        }

        public get x(): number {
            return this._x;
        }
        public get y(): number {
            return this._y;
        }

        public add(v: Vector): Point {
            if (v == null)
                throw 'argument null exception: v';

            return new Point(this._x + v.x, this._y + v.y);
        }
        public subtract(v: Vector): Point {
            if (v == null)
                throw 'argument null exception: v';

            return new Point(this._x - v.x, this._y - v.y);
        }
    }

    class Vector {
        private _x: number;
        private _y: number;

        public constructor(x: number = 0, y: number = 0) {
            this._x = x;
            this._y = y;
        }

        public get x(): number {
            return this._x;
        }
        public get y(): number {
            return this._y;
        }
    }

    class Size {
        private _width: number;
        private _height: number;

        public constructor(width: number = 0, height: number = 0) {
            this._width = width;
            this._height = height;
        }

        public get width(): number {
            return this._width;
        }
        public get height(): number {
            return this._height;
        }

        public multiply(value: number): Size {
            return new Size(this._width * value, this._height * value);
        }
    }

    class Rectangle {
        private _x: number;
        private _y: number;
        private _width: number;
        private _height: number;

        public constructor(x: number | Point = 0, y: number | Size = 0, width: number = 0, height: number = 0) {
            switch (arguments.length) {
                case 0:
                case 4:
                    this._x = <number>x;
                    this._y = <number>y;
                    this._width = width;
                    this._height = height;
                    break;
                case 2:
                    let point = <Point>x;
                    let size = <Size>y;
                    this._x = point.x;
                    this._y = point.y;
                    this._width = size.width;
                    this._height = size.height;
                    break;
                default:
                    throw 'argument exception.';
            }
        }

        public get x(): number {
            return this._x;
        }
        public get y(): number {
            return this._y;
        }
        public get width(): number {
            return this._width;
        }
        public get height(): number {
            return this._height;
        }
        public get top(): number {
            return this._y;
        }
        public get bottom(): number {
            return this._y + this._height;
        }
        public get left(): number {
            return this._x;
        }
        public get right(): number {
            return this._x + this._width;
        }

        public contains(p: Point): boolean {
            if (p == null)
                throw 'argument null exception: p';

            return this._x <= p.x && p.x <= this.right && this._y <= p.y && p.y <= this.bottom;
        }
        public intersectsWith(rect: Rectangle): boolean {
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