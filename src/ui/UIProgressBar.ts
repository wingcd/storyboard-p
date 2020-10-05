import { ISerializeInfo } from "../annotations/Serialize";
import { View } from "../core/View";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { Tween } from "../phaser";
import { EFillType } from "../types";
import { EProgressTitleType } from "../types/IUIProgressBar";
import { UIImage } from "./UIImage";
import { UITextField } from "./UITextField";
require("../components");
                    
export class UIProgressBar extends ViewGroup {
    static TYPE = "progress";
    
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = ViewGroup.SERIALIZABLE_FIELDS;
        fields.push(  
            {property: "min", default: 0},
            {property: "max", default: 100},
            {property: "titleType", default: EProgressTitleType.Percent},
            {property: "value", default: 0},
            {property: "reverse", default: false},
        );
        return fields;
    }

    protected _titleObject: UITextField;
    protected _hBar: View;
    protected _vBar: View;
    protected _hAnchor: View;
    protected _vAnchor: View;
    // protected _aniView: View;

    private _min: number = 0;
    private _max: number = 100;
    private _titleType: EProgressTitleType = EProgressTitleType.Percent;
    private _value: number = 0;
    private _reverse: boolean = false;

    private _barMaxWidth: number;
    private _barMaxHeight: number;
    private _barMaxWidthDelta: number;
    private _barMaxHeightDelta: number;
    private _barStartX: number;
    private _barStartY: number;

    private _tweener: Tween;
    
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

            this._update(this._value);
        }
    }

    public get max(): number {
        return this._max;
    }

    public set max(val: number) {
        if(this._max != val) {
            this._max = val;
            
            this._update(this._value);
        }
    }

    public get titleType(): EProgressTitleType {
        return this._titleType;
    }

    public set titleType(val: EProgressTitleType) {
        if(this._titleType != val) {
            this._titleType = val;

            this._update(this._value);
        }
    }

    public get reverse(): boolean {
        return this._reverse;
    }

    public set reverse(val: boolean) {
        if(this._reverse != val) {
            this._reverse = val;

            this._update(this._value);
        }
    }

    public get value(): number {
        return this._value;
    }

    public set value(val: number) {
        this._clearTween();

        if(val != this._value) {
            this._value = val;

            this._update(this._value);
        }
    }

    private _clearTween() {
        if(this._tweener) {
            this._tweener.removeAllListeners();
            this._tweener.remove();
            this._tweener = null;
        }
    }

    private _update(val: number) {
        if(this.inBuilding) {
            return;
        }

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

        let fullWidth = this.width - this._barMaxWidthDelta;
        let fullHeight = this.height - this._barMaxHeightDelta;
        if(!this._reverse) {
            let w = fullWidth * percent;
            if(this._hBar) {
                if(!this.setFillAmount(this._hBar, percent)) {
                    this._hBar.width = w;
                }
            }
            if(this._hAnchor) {
                this._hAnchor.x = this._barStartX + w;
            }
            
            let h = fullHeight * percent;
            if(this._vBar) {
                if(!this.setFillAmount(this._vBar, percent)) {
                    this._vBar.height = fullHeight * percent;
                }
            }
            if(this._vAnchor) {
                this._vAnchor.y = this._barStartX + h;
            }
        }else {            
            let w = fullWidth * percent;
            let newx = this._barStartX + (fullWidth - w);
            if(this._hBar) {                
                if(!this.setFillAmount(this._hBar, percent)) {
                    this._hBar.width = fullWidth * percent;
                    this._hBar.x = newx;
                }
            }
            if(this._hAnchor) {
                this._hAnchor.x = newx;
            }
            
            let h = fullHeight * percent;
            let newy = this._barStartY + (fullHeight - h);
            if(this._vBar) {
                if(!this.setFillAmount(this._vBar, percent)) {
                    this._vBar.height = fullHeight * percent;
                    this._vBar.y = newy;
                }
            }
            if(this._vAnchor) {
                this._vAnchor.y = newy;
            }

            //add anim view?
        }
    }

    private setFillAmount(bar: View, percent: number): boolean {
        if (((bar instanceof UIImage)) && bar.fillMask.fillType != EFillType.None) { // || (bar instanceof UILoader)
            bar.fillMask.value = percent;
            return true;
        }
        else {
            return false;
        }
    }

    /**
     * 
     * @param value target value
     * @param duration duration in seconds
     */
    public tweenValue(value: number, duration: number): Tween {
        if (this._value != value) {
            this._clearTween();

            this._tweener = this.scene.add.tween({
                targets: {value: this._value},
                ease: Phaser.Math.Easing.Linear,      
                duration: duration * 1000,      
                props: {
                    value: value,         
                },
                onUpdate: (tween, target)=>{
                    this._update(target.value);
                },
                onComplete: ()=>{
                    this._clearTween();
                }
            });
            
            this._value = value;
            return this._tweener;
        }
        else
            return null;
    }

    protected onChildrenChanged() {
        super.onChildrenChanged();

        let oldHBar = this._hBar;
        let oldVBar = this._vBar;

        this._hBar = this.getChild("bar");
        this._vBar = this.getChild("bar_v");
        this._titleObject = this.getChild("title") as UITextField;
        this._hAnchor = this.getChild('anchor');
        this._vAnchor = this.getChild('anchor_v');

        if(this._hBar) {
            if(oldHBar != this._hBar) {
                this._barStartX = this._hBar.x;
                this._barMaxWidth = this._hBar.width;
                this._barMaxWidthDelta = this.width - this._hBar.width;
            }
        }else{
            this._barStartX = 0;
            this._barMaxWidth = this.width;
            this._barMaxWidthDelta = 0;
        }

        if(this._vBar) {
            if(oldVBar != this._vBar) {
                this._barStartY = this._hBar.y;
                this._barMaxHeight = this._hBar.height;
                this._barMaxHeightDelta = this.height - this._hBar.height;
            }
        }else{
            this._barStartX = 0;
            this._barMaxHeight = this.height;
            this._barMaxHeightDelta = 0;
        }
    }

    protected handleSizeChanged() {
        super.handleSizeChanged();

        if(this._hBar) {
            this._barMaxWidth = this.width - this._barMaxWidthDelta;
        }

        if(this._vBar) {
            this._barMaxHeight = this.height - this._barMaxHeightDelta;
        }

        this._update(this._value);
    }

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

        this._clearTween();
    }
}