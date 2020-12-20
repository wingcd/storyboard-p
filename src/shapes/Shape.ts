import { Graphics, Rectangle } from "../phaser";
import { IView } from "../types";
import { IShape } from "../types/IShape";
import { splitColorAndAlpha } from "../utils/Color";
import { GetValue } from "../utils/Object";

export enum EShapeShowType {
    None,
    Line,
    Fill,
    All,
}

export class Shape implements IShape{
    public static TYPE = 0;
    public static MIN_HITTEST_SIZE = 5;
    
    showType: EShapeShowType = EShapeShowType.All;
    lineWidth?: number;
    fillColor?: number;  
    lineColor?: number;  

    constructor(config?: any) {
        this.showType = GetValue(config, "showType", EShapeShowType.All);
        this.lineWidth = GetValue(config, "lineWidth", 1);
        this.lineColor = GetValue(config, "lineColor", 0x0);
        this.fillColor = GetValue(config, "fillColor", 0xffffff);
    }

    protected _shape: any;
    contains(view: IView, x:number, y: number): boolean {
        return Rectangle.Contains(this._shape, x, y);
    }  

    protected reset(view: IView, g: Graphics) {
        this._shape = new Rectangle(0, 0, Math.min(Shape.MIN_HITTEST_SIZE, view.width), Math.min(Shape.MIN_HITTEST_SIZE, view.height));
    } 

    protected needFill(): boolean {
        return this.showType == EShapeShowType.Fill || this.showType == EShapeShowType.All;
    }

    protected needLine(): boolean {
        return this.showType == EShapeShowType.Line || this.showType == EShapeShowType.All;
    }

    protected config(view: IView, g: Graphics) {
        if(this.needFill()) {
            let lColor = splitColorAndAlpha(this.lineColor);
            g.lineStyle(this.lineWidth, lColor[0], lColor[1]);
        }
        if(this.needLine()) {
            let fcolor = splitColorAndAlpha(this.fillColor);
            g.fillStyle(fcolor[0], fcolor[1]);
        }
    }

    public get shape(): any {
        return this._shape;
    }

    public fill(view: IView, g: Graphics): this {
        return this;
    }

    public storke(view: IView, g: Graphics): this {
        return this;
    }
    
    public draw(view: IView, g: Graphics): this {        
        if(this.showType  == EShapeShowType.None) {
            return this;
        }
        this.reset(view, g);
        this.config(view, g);
        this.fill(view, g);
        this.storke(view, g);
        return this;
    }
}