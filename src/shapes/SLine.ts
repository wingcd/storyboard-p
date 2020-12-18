import { Graphics } from "../phaser";
import { IView } from "../types";
import { GetValue } from "../utils/Object";
import { Shape, ShapeStyle } from "./Shape";

export class LineStyle extends ShapeStyle{
    size: number = 5;
}

export class SLine extends Shape {
    public static TYPE = 2;

    private _points: number[] = [0,0];

    protected reset(view: IView, g: Graphics, style: LineStyle) {
        super.reset(view, g, style);

        this._points[0] = 0;
        this._points[1] = style.size ? (view.height - style.size) / 2 : view.height / 2;
    }

    public fill(view: IView, g: Graphics, style: LineStyle): this {
        return this;
    }

    public storke(view: IView, g: Graphics, style: LineStyle): this {
        if(!this.needLine(style)) {
            return this;
        }

        g.moveTo(this._points[0], this._points[1]);
        g.lineTo(view.width, this._points[1]);
        g.stroke();

        return this;
    }
}