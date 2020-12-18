import { Graphics } from "../phaser";
import { IView } from "../types";
import { Shape, ShapeStyle } from "./Shape";

export class PointStyle extends ShapeStyle {
    size: number = 5;
}

export class SPoint extends Shape {
    public static TYPE = 1;

    private _x: number = 0;
    private _y: number = 0;
    private _radius: number = 0;

    protected reset(view: IView, g: Graphics, style: PointStyle) {
        super.reset(view, g, style);

        this._x = view.width / 2;
        this._y = view.height / 2;
        this._radius = style.size || Math.min(view.width, view.height);
    }

    fill(view: IView, g: Graphics, style: PointStyle): this {
        if(this.needFill(style)) {
            g.fillCircle(this._x, this._y, this._radius);
        }
        return this;
    }

    storke(view: IView, g: Graphics, style: PointStyle): this {
        return this;
    }
}