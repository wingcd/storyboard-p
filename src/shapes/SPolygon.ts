import { Graphics, Point, Polygon } from "../phaser";
import { ISerializeFields, IView } from "../types";
import { GetValue } from "../utils/Object";
import { clone } from "../utils/Serialize";
import { Shape } from "./Shape";
import { ShapeFactory } from "./ShapeFactory";

export class SPolygon extends Shape {
    public static TYPE = "polygon";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(Shape.SERIALIZABLE_FIELDS),
        {
            points: {raw: true},  
        }
    );

    public points: number[] = [];

    private _points: Point[] = [];

    constructor(config?: any) {
        super(config);

        this.points = GetValue(config, "points", []);
    }

    contains(view: IView, x:number, y: number): boolean {
        return Polygon.Contains(this._shape, x, y);
    } 

    protected reset(view: IView, g: Graphics) {
        super.reset(view, g);

        this._points.length = 0;
        if(this.points) {
            for(let i=0;i<this.points.length;i+=2){
                this._points.push(new Point(this.points[i], this.points[i+1]));
            }
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

ShapeFactory.regist(SPolygon);