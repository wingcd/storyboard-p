import { Graphics, Point, Polygon } from "../phaser";
import { ISerializeFields, IView } from "../types";
import { MathUtils } from "../utils/Math";
import { GetValue } from "../utils/Object";
import { clone } from "../utils/Serialize";
import { Shape } from "./Shape";
import { ShapeFactory } from "./ShapeFactory";

export class SRegularPolygon extends Shape {
    public static TYPE = "r-polygon";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(Shape.SERIALIZABLE_FIELDS),
        {
            sideNumber: {default: 3},
            startAngle: {default: 0},
            distances: {raw: true},  
        }
    );

    public sideNumber: number = 3;
    public startAngle: number = 0;
    public distances?: number[];

    private _points: Point[] = [];

    constructor(config?: any) {
        super(config);

        this.sideNumber = GetValue(config, "sideNumber", 3);
        this.startAngle = GetValue(config, "startAngle", 0);
        this.distances = GetValue(config, "distances", null);
    }

    contains(view: IView, x:number, y: number): boolean {
        return Polygon.Contains(this._shape, x, y);
    } 

    protected reset(view: IView, g: Graphics) {
        super.reset(view, g);

        this._points.length = 0;
        var sides = Math.max(3, this.sideNumber || 3);
        var startAngle = this.startAngle || 0;
        var radius: number = Math.min(view.width, view.height) / 2;
        this._points.length = 0;
        var angle: number = MathUtils.angleToRadian(startAngle);
        var deltaAngle: number = 2 * Math.PI / sides;
        var dist: number;
        for (var i: number = 0; i < sides; i++) {
            if (this.distances) {
                dist = this.distances[i];
                if (isNaN(dist))
                    dist = 1;
            }
            else
                dist = 1;

            var xv: number = radius + radius * dist * Math.cos(angle);
            var yv: number = radius + radius * dist * Math.sin(angle);
            this._points.push(new Point(xv, yv));

            angle += deltaAngle;
        }
        this._shape = new Polygon(this._points);
    }

    fill(view: IView, g: Graphics): this {
        if(this.needFill()) {
            g.fillPoints(this._points, true, true);
        }
        return this;
    }

    storke(view: IView, g: Graphics): this {
        if(this.needFill()) {
            g.strokePoints(this._points, true, true);
        }
        return this;
    }
}

ShapeFactory.regist(SRegularPolygon);