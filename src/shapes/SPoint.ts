import { Circle, Graphics } from "../phaser";
import { ISerializeFields, IView } from "../types";
import { GetValue } from "../utils/Object";
import { clone } from "../utils/Serialize";
import { Shape } from "./Shape";
import { ShapeFactory } from "./ShapeFactory";

export class SPoint extends Shape {
    public static TYPE = "point";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(Shape.SERIALIZABLE_FIELDS),
        {
            size: {default: 5},       
        }
    );

    public size: number = 5;

    private _x: number = 0;
    private _y: number = 0;
    private _radius: number = 0;    

    constructor(config?: any) {
        super(config);

        this.size = GetValue(config, "size", 5);
    }

    contains(view: IView, x:number, y: number): boolean {
        return Circle.Contains(this._shape, x, y);
    } 

    protected reset(view: IView, g: Graphics) {
        super.reset(view, g);

        this._x = view.width / 2;
        this._y = view.height / 2;
        this._radius = this.size || Math.min(view.width, view.height) / 2;
        this._shape = new Circle(this._x, this._y, Math.min(Shape.MIN_HITTEST_SIZE,this._radius));
    }

    fill(view: IView, g: Graphics): this {
        if(this.needFill()) {
            g.fillCircle(this._x, this._y, this._radius);
        }
        return this;
    }

    storke(view: IView, g: Graphics): this {
        return this;
    }
}

ShapeFactory.regist(SPoint);