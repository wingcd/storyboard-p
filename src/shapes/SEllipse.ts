import { Circle, Ellipse, Graphics } from "../phaser";
import { IView } from "../types";
import { Shape } from "./Shape";
import { ShapeFactory } from "./ShapeFactory";

export class SEllipse extends Shape {
    public static TYPE = "ellipse";

    private _x: number = 0;
    private _y: number = 0;
    private _width: number = 0;
    private _height: number = 0;

    contains(view: IView, x:number, y: number): boolean {
        return Ellipse.Contains(this._shape, x, y);
    } 

    protected reset(view: IView, g: Graphics, ) {
        super.reset(view, g);

        this._x = view.width / 2;
        this._y = view.height / 2;
        this._width = view.width;
        this._height = view.height;
        this._shape = new Ellipse(this._x, this._y, this._width, this._height);
    }

    fill(view: IView, g: Graphics, ): this {
        if(this.needFill()) {
            g.fillEllipse(this._x, this._y, this._width, this._height);
        }
        return this;
    }

    storke(view: IView, g: Graphics, ): this {
        if(this.needFill()) {
            g.strokeEllipse(this._x, this._y, this._width, this._height);
        }
        return this;
    }
}

ShapeFactory.regist(SEllipse);