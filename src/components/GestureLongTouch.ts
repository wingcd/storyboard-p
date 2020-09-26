import { BaseComponent } from "./BaseComponent";
import * as Events from "../events";
import { Point, Time, Input, Pointer, EventData } from "../phaser";
import { Settings } from "../core/Setting";
import { disallow_multiple_component } from "../annotations/Component";
import { ComponentFactory } from "./ComponentFactory";

@disallow_multiple_component()
export class GestureLongTouch extends BaseComponent {
    protected _touched: boolean = false;
    protected _longTouched: boolean = false;
    private _pointerId = -1;
    
    private onEnable() {
        this.owner.on(Input.Events.POINTER_DOWN, this._touchBegin, this);
    }

    private onDisable() {
        this.owner.off(Input.Events.POINTER_DOWN, this._touchBegin, this);     
    }

    private _touchBegin(pointer: Pointer, localX: number, localY: number, event: EventData) {
        this._pointerId = pointer.pointerId;

        this._touched = true;
        this._longTouched = false;

        this.owner.on(Input.Events.POINTER_UP, this._touchUp, this);
        this.owner.on(Input.Events.POINTER_UP_OUTSIDE, this._touchUpOutside, this);

        this.owner.scene.time.delayedCall(Settings.longTouchTime, ()=>{
            if(this._touched) {
                if(this.owner.touchEnableMoved ||
                    (Math.abs(pointer.x - pointer.downX) <= Settings.touchSensitivity && 
                        Math.abs(pointer.y - pointer.downY) <= Settings.touchSensitivity)) {
                    this._longTouched = true;
                    this.owner.emit(Events.GestureEvent.LONG_TOUCH_START, pointer);
                }
            }
        });
    }

    private _reset() {
        this.owner.off(Input.Events.POINTER_UP, this._touchUp, this);
        this.owner.off(Input.Events.POINTER_UP_OUTSIDE, this._touchUpOutside, this);
        this._touched = false;
        this._longTouched = false;
        this._pointerId = -1;

        // remove long touch compoment
        if(!this.owner.hasListener(Events.GestureEvent.LONG_TOUCH_END) &&
           !this.owner.hasListener(Events.GestureEvent.LONG_TOUCH_START)) {
            this.owner.removeComponent(this);
        }
    }

    private _touchUp(pointer: Pointer) {
        if(this._pointerId !== pointer.pointerId) {
            return;
        }

        if(this._touched) {
            if((this.owner.touchEnableMoved ||
              (Math.abs(pointer.x - pointer.downX) <= Settings.touchSensitivity && 
               Math.abs(pointer.y - pointer.downY) <= Settings.touchSensitivity)) && 
               this._longTouched) {
                this.owner.emit(Events.GestureEvent.LONG_TOUCH_END, pointer);
            }
            this._reset();
        }
    }

    private _touchUpOutside(pointer: Pointer) {
        if(this._pointerId !== pointer.pointerId) {
            return;
        }

        if(this._touched) {
            this._reset();
        }
    }
}

ComponentFactory.inst.registEvents(Events.GestureEvent.LONG_TOUCH_START, GestureLongTouch);
ComponentFactory.inst.registEvents(Events.GestureEvent.LONG_TOUCH_END, GestureLongTouch);