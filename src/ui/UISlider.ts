import { ISerializeFields, IUISlider } from "../types";
import { EFillType, EProgressTitleType } from "../core/Defines";
import { View } from "../core/View";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { EventData, Point, Pointer, Tween } from "../phaser";
import { MathUtils } from "../utils/Math";
import { PoolManager } from "../utils/PoolManager";
import { UIImage } from "./UIImage";
import { UITextField } from "./UITextField";
import { clone } from "../utils/Serialize";
require("../components");
                    
export class UISlider extends ViewGroup  implements IUISlider{
    static TYPE = "slider";
    
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(ViewGroup.SERIALIZABLE_FIELDS),
        {
            min: {property: "_min", default: 0},
            max: {property: "_max",default: 100},
            titleType: {property: "_titleType", default: EProgressTitleType.Percent},
            value: {property: "_value", default: 0},
            reverse: {property: "_reverse", default: false},
            changeOnClick: {default: true},       
            autoSetGripPos: {property: "_autoSetGripPos", default: true},
        }    
    );

    public changeOnClick: boolean = true;

    private _titleObject: UITextField;
    private _hBar: View;
    private _vBar: View;
    private _hGrip: View;
    private _vGrip: View;
    private _hAnchor: View;
    private _vAnchor: View;
    // private _aniView: View;

    private _min: number = 0;
    private _max: number = 100;
    private _titleType: EProgressTitleType = EProgressTitleType.Percent;
    private _value: number = 0;
    private _reverse: boolean = false;
    private _autoSetGripPos: boolean = true;

    private _barMaxWidth: number;
    private _barMaxHeight: number;
    private _barMaxWidthDelta: number;
    private _barMaxHeightDelta: number;
    private _barStartX: number;
    private _barStartY: number;

    private _tweener: Tween;
    private _canDrag: boolean = true;
    private _clickPercent: number = 0;
    
    public constructor(scene: ViewScene) {
        super(scene);

        this.on(Events.PointerEvent.DOWN, this.__barMouseDown, this);
    } 

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);

        this.update();
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

            this.update();
        }
    }

    public get max(): number {
        return this._max;
    }

    public set max(val: number) {
        if(this._max != val) {
            this._max = val;
            
            this.update();
        }
    }

    public get titleType(): EProgressTitleType {
        return this._titleType;
    }

    public set titleType(val: EProgressTitleType) {
        if(this._titleType != val) {
            this._titleType = val;

            this.update();
        }
    }

    public get reverse(): boolean {
        return this._reverse;
    }

    public set reverse(val: boolean) {
        if(this._reverse != val) {
            this._reverse = val;

            this.update();
        }
    }

    public get autoSetGripPos(): boolean {
        return this._autoSetGripPos;
    }

    /**
     * 如果为false时，需要添加水平(anchor)或竖直(anchor_v)锚点，并进行设置关联,否则grip组件不会移动
     */
    public set autoSetGripPos(val: boolean) {
        if(this._autoSetGripPos != val) {
            this._autoSetGripPos = val;

            this.update();
        }
    }

    public get value(): number {
        return this._value;
    }

    public set value(val: number) {
        this._clearTween();

        if(val != this._value) {
            this._value = val;

            this.update();
        }
    }

    private _clearTween() {
        if(this._tweener) {
            this._tweener.removeAllListeners();
            this._tweener.remove();
            this._tweener = null;
        }
    }

    private _update(val: number, pointer?: Pointer) {
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
            if(this._autoSetGripPos && this._hGrip) {
                this._hGrip.x = this._barStartX + w - this._hGrip.width * 0.5;
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
            if(this._autoSetGripPos && this._vGrip) {
                this._vGrip.y = this._barStartX + h - this._vGrip.height * 0.5;
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
            if(this._autoSetGripPos && this._hGrip) {
                this._hGrip.x = newx - this._hGrip.width * 0.5;
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
            if(this._autoSetGripPos && this._vGrip) {
                this._vGrip.y = newy - this._vGrip.height * 0.5;
            }
            if(this._vAnchor) {
                this._vAnchor.y = newy;
            }
        }   

        //add anim view?            

        if(pointer) {
            this._value = val;
            this.emit(Events.StateChangeEvent.CHANGED, pointer);
        }
    }

    private setFillAmount(bar: View, percent: number): boolean {
        if (((bar instanceof UIImage)) && bar.fillMask && bar.fillMask.fillType != EFillType.None) { // || (bar instanceof UILoader)
            bar.fillMask.value = percent;
            return true;
        }
        else {
            return false;
        }
    }

    public update() {
        this._update(this._value);
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
        let oldHGrip = this._hGrip;
        let oldVGrip = this._vGrip;
        let oldTitle = this._titleObject;        
        let oldHAnchor = this._hAnchor;
        let oldVAnchor = this._vAnchor;

        this._hBar = this.getChild("bar");
        this._vBar = this.getChild("bar_v");
        this._titleObject = this.getChild("title") as UITextField;
        this._hGrip = this.getChild('grip');
        this._vGrip = this.getChild('grip_v');
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
                this._barStartY = this._vBar.y;
                this._barMaxHeight = this._vBar.height;
                this._barMaxHeightDelta = this.height - this._vBar.height;
            }
        }else{
            this._barStartY = 0;
            this._barMaxHeight = this.height;
            this._barMaxHeightDelta = 0;
        }

        if(this._hGrip != oldHGrip) {
            if(oldHGrip) {
                oldHGrip.off(Events.PointerEvent.DOWN, this.__gripMouseDown, this);
            }
            if(this._hGrip) {
                this._hGrip.on(Events.PointerEvent.DOWN, this.__gripMouseDown, this);
            }
        }      
        
        if(this._vGrip != oldVGrip) {
            if(oldVGrip) {
                oldVGrip.off(Events.PointerEvent.DOWN, this.__gripMouseDown, this);
            }
            if(this._vGrip) {
                this._vGrip.on(Events.PointerEvent.DOWN, this.__gripMouseDown, this);
            }
        }

        let changed = oldHBar != this._hBar || oldVBar != this._vBar || 
                    oldHGrip != this._hGrip || oldVGrip != this._vGrip || this._titleObject != oldTitle ||
                    oldHAnchor != this._hAnchor || oldVAnchor != this._vAnchor;
        
        if(changed) {
            this.update();
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

        this.update();
    }

    public dispose() {
        super.dispose();

        this._clearTween();

        this.root.off(Events.PointerEvent.MOVE, this.__gripMouseMove, this);
        this.root.off(Events.PointerEvent.UP, this.__gripMouseUp, this);
    }

    private __gripMouseDown(sender: View, pointer: Pointer, localX: number, localY: number, event: EventData): void {
        this._canDrag = true;
        event.stopPropagation();

        this._clickPercent = MathUtils.clamp01((this._value - this._min) / (this._max - this._min));

        this.root.on(Events.PointerEvent.MOVE, this.__gripMouseMove, this);
        this.root.on(Events.PointerEvent.UP, this.__gripMouseUp, this);
    }

    private __gripMouseMove(sender: View, pointer: Pointer): void {
        if (!this._canDrag) {
            return;
        }
        var deltaX: number = pointer.x - pointer.downX;
        var deltaY: number = pointer.y - pointer.downY;
        if (this._reverse) {
            deltaX = -deltaX;
            deltaY = -deltaY;
        }
        var percent: number;
        if (this._hBar) {
            percent = this._clickPercent + deltaX / this._barMaxWidth;
        } else {
            percent = this._clickPercent + deltaY / this._barMaxHeight;
        }
        percent = MathUtils.clamp01(percent);

        let newValue = this._min + (this._max - this._min) * percent;
        this._update(newValue, pointer);
    }

    private __gripMouseUp(sender: View, pointer: Pointer): void {
        this.root.off(Events.PointerEvent.MOVE, this.__gripMouseMove, this);
        this.root.off(Events.PointerEvent.UP, this.__gripMouseUp, this);
    }

    private __barMouseDown(sender: View, pointer: Pointer): void {
        if (!this.changeOnClick)
            return;

        var percent: number;            
        let pt = PoolManager.inst.get(Point) as Point;
        if (this._hBar) {
            this._hBar.globalToLocal(pointer.x, pointer.y, pt);
            percent = pt.x / this._barMaxWidth;
        }
        if (this._vBar) {
            this._vBar.globalToLocal(pointer.x, pointer.y, pt);
            percent = pt.y / this._barMaxHeight;
        }
        PoolManager.inst.put(pt);

        if(percent != undefined) {
            percent = MathUtils.clamp01(percent);
            if(this._reverse) {
                percent = 1 - percent;
            }

            let newValue = this._min + (this._max - this._min) * percent;
            this._update(newValue, pointer);
        }
    }
}