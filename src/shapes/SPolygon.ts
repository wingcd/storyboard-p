import { Graphics, Point, Polygon } from "../phaser";
import { IView } from "../types";
import { GetValue } from "../utils/Object";
import { Shape } from "./Shape";

export class SPolygon extends Shape {
    public static TYPE = 6;
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