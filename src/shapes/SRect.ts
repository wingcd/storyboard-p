import { Graphics } from "../phaser";
import { IView } from "../types";
import { Shape } from "./Shape";
import { PointStyle } from "./SPoint";

export class RectStyle extends PointStyle{
    width: number = 1;
    cornerRadius: number | number[];
}

export class SRect extends Shape {
    public static TYPE = 3;

    private _cornerRadius: number[] = [0,0,0,0];
    protected reset(view: IView, g: Graphics, style: RectStyle) {
        super.reset(view, g, style);

        if(Array.isArray(style.cornerRadius)) {
            for(let i=0;i<4;i++){
                if(style.cornerRadius.length > i) {
                    this._cornerRadius[i] = style.cornerRadius[i];
                }else{
                    this._cornerRadius[i] = 0;
                }
            }
        }else{
            for(let i=0;i<4;i++){
                this._cornerRadius[i] = style.cornerRadius || 0;
            } 
        }
    }

    public fill(view: IView, g: Graphics, style: RectStyle): this {
        if(!this.needFill(style)) {
            return this;
        }

        if(!style.cornerRadius) {
            g.fillRect(0,0, view.width, view.height);
        }else{
            g.fillRoundedRect(0,0, view.width, view.height,{tl:this._cornerRadius[0], tr: this._cornerRadius[1], bl: this._cornerRadius[2], br: this._cornerRadius[3]});
        }

        return this;
    }

    public storke(view: IView, g: Graphics, style: RectStyle): this {
        if(!this.needLine(style)) {
            return this;
        }

        if(!style.cornerRadius) {
            g.strokeRect(0,0, view.width, view.height);
        }else{
            g.strokeRoundedRect(0,0, view.width, view.height,{tl:this._cornerRadius[0], tr: this._cornerRadius[1], bl: this._cornerRadius[2], br: this._cornerRadius[3]});
        }

        return this;
    }
}