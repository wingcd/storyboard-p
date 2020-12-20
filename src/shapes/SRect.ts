import { Graphics } from "../phaser";
import { IView } from "../types";
import { GetValue } from "../utils/Object";
import { Shape } from "./Shape";

export class SRect extends Shape {
    public static TYPE = 3;
    cornerRadius: number | number[];

    private _cornerRadius: number[] = [0,0,0,0];  

    constructor(config?: any) {
        super(config);

        this.cornerRadius = GetValue(config, "cornerRadius", 0);
    }

    protected reset(view: IView, g: Graphics) {
        super.reset(view, g);

        if(Array.isArray(this.cornerRadius)) {
            for(let i=0;i<4;i++){
                if(this.cornerRadius.length > i) {
                    this._cornerRadius[i] = this.cornerRadius[i];
                }else{
                    this._cornerRadius[i] = 0;
                }
            }
        }else{
            for(let i=0;i<4;i++){
                this._cornerRadius[i] = this.cornerRadius || 0;
            } 
        }
    }

    public fill(view: IView, g: Graphics): this {
        if(!this.needFill()) {
            return this;
        }

        if(!this.cornerRadius) {
            g.fillRect(0,0, view.width, view.height);
        }else{
            g.fillRoundedRect(0,0, view.width, view.height,{tl:this._cornerRadius[0], tr: this._cornerRadius[1], bl: this._cornerRadius[2], br: this._cornerRadius[3]});
        }

        return this;
    }

    public storke(view: IView, g: Graphics): this {
        if(!this.needLine()) {
            return this;
        }

        if(!this.cornerRadius) {
            g.strokeRect(0,0, view.width, view.height);
        }else{
            g.strokeRoundedRect(0,0, view.width, view.height,{tl:this._cornerRadius[0], tr: this._cornerRadius[1], bl: this._cornerRadius[2], br: this._cornerRadius[3]});
        }

        return this;
    }
}