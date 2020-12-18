import { Graphics } from "../phaser";
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

export class ShapeStyle {
    showType: EShapeShowType = EShapeShowType.All;
    lineWidth?: number;
    fillColor?: number;  
    lineColor?: number;  
}

export class Shape implements IShape{
    public static TYPE = 0;

    hitTest(): boolean {
        return false;
    }    

    protected reset(view: IView, g: Graphics, style: ShapeStyle) {

    } 

    protected needFill(style: ShapeStyle): boolean {
        let showType = GetValue(style, "showType", EShapeShowType.All);
        return showType == EShapeShowType.Fill || showType == EShapeShowType.All;
    }

    protected needLine(style: ShapeStyle): boolean {
        let showType = GetValue(style, "showType", EShapeShowType.All);
        return showType == EShapeShowType.Line || showType == EShapeShowType.All;
    }

    protected config(view: IView, g: Graphics, style: ShapeStyle) {
        if(this.needFill(style)) {
            let lineWidth = GetValue(style, "lineWidth", 1);
            let lineColor = GetValue(style, "lineColor", 0x0);
            let lColor = splitColorAndAlpha(lineColor);
            g.lineStyle(lineWidth, lColor[0], lColor[1]);
        }
        if(this.needLine(style)) {
            let fillColor = GetValue(style, "fillColor", 0xffffff);
            let fcolor = splitColorAndAlpha(fillColor);
            g.fillStyle(fcolor[0], fcolor[1]);
        }
    }

    fill(view: IView, g: Graphics, style: ShapeStyle): this {
        return this;
    }

    storke(view: IView, g: Graphics, style: ShapeStyle): this {
        return this;
    }
    
    draw(view: IView, g: Graphics, style: ShapeStyle): this {        
        if(style.showType  == EShapeShowType.None) {
            return this;
        }
        this.reset(view, g, style);
        this.config(view, g, style);
        this.fill(view, g, style);
        this.storke(view, g, style);
        return this;
    }
}