import { Graphics, Rectangle } from "../phaser";
import { IView } from "../types";
import { Shape } from "./Shape";

export class SLine extends Shape {
    public static TYPE = 2;

    private _points: number[] = [0,0]; 
    private _height: number = 0;   

    contains(view: IView, x:number, y: number): boolean {
        return Rectangle.Contains(this._shape, x, y);
    } 

    protected reset(view: IView, g: Graphics) {
        super.reset(view, g);

        this._points[0] = 0;
        this._points[1] = this.lineWidth ? (view.height - this.lineWidth) / 2 : view.height / 2;
        this._height = this.lineWidth || view.height;
        this._shape = new Rectangle(this._points[0], this._points[1], Math.min(Shape.MIN_HITTEST_SIZE,view.width), Math.min(Shape.MIN_HITTEST_SIZE, this._height));
    }

    public fill(view: IView, g: Graphics): this {
        return this;
    }

    public storke(view: IView, g: Graphics): this {
        if(!this.needLine()) {
            return this;
        }

        g.moveTo(this._points[0], this._points[1]);
        g.lineTo(view.width, this._points[1]);
        g.stroke();

        return this;
    }
}