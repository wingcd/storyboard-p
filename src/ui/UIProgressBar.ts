import { View } from "../core/View";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { EProgressTitleType } from "../types/IUIProgressBar";
import { UITextField } from "./UITextField";
require("../components");
                    
export class UIProgressBar extends ViewGroup {
    static TYPE = "progress";

    protected _titleObject: UITextField;
    protected _hBar: View;
    protected _vBar: View;
    // protected _aniView: View;

    private _min: number = 0;
    private _max: number = 100;
    private _titleType: EProgressTitleType = EProgressTitleType.Percent;
    private _value: number = 0;
    private _reverse: boolean = false;

    private _tweenValue: number = 0;
    
    public constructor(scene: ViewScene) {
        super(scene);
    } 

    /**
     * params: 
     *  sender: this,
     *  value: number,
     *  precent: number,
     * returns:
     *  text: string
     */
    public customTitleFormator: Function;

    public get min(): number {
        return this._min;
    }

    public set min(val:number) {
        if(this._min != val) {
            this._min = val;

        }
    }

    public get max(): number {
        return this._max;
    }

    public set max(val: number) {
        if(this._max != val) {
            this._max = val;
            
        }
    }

    public get titleType(): EProgressTitleType {
        return this._titleType;
    }

    public set titleType(val: EProgressTitleType) {
        if(this._titleType != val) {
            this._titleType = val;

        }
    }

    public get reverse(): boolean {
        return this._reverse;
    }

    public set reverse(val: boolean) {
        if(this._reverse != val) {
            this._reverse = val;

        }
    }

    public get value(): number {
        return this._value;
    }

    public set value(val: number) {
        if(val != this._value) {
            this._value = val;


        }
    }

    private _update(val: number) {
        let length = this._max - this._min;
        let orignVal = val - this._min;
        let percent = length != 0 ? orignVal / length : 0;

        if(this._titleObject) {
            switch(this._titleType) {
                case EProgressTitleType.Percent:
                    this._titleObject.text = `${Math.round(percent * 100)}%`;
                    break;
                case EProgressTitleType.Value:
                    this._titleObject.text = `${Math.round(val)}`;
                    break;
                case EProgressTitleType.ValueAndMax:
                    this._titleObject.text = `${Math.round(val)}/${Math.round(this._max)}`;
                    break;
                case EProgressTitleType.Custom:
                    if(this.customTitleFormator) {
                        this._titleObject.text = this.customTitleFormator(this, val, percent);
                    }else{
                        this._titleObject.text = `${Math.round(percent * 100)}%`;
                    }
                    break;
            }
        }

        
    }

    protected onChildrenChanged() {
        super.onChildrenChanged();

        this._hBar = this.getChild("bar") as View;
        this._vBar = this.getChild("bar_v") as View;
        this._titleObject = this.getChild("title") as UITextField;
    }
}