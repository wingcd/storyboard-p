import { BaseComponent } from "./BaseComponent";
import * as Events from "../events";
import { Point,Time, Pointer } from "../phaser";
import { disallow_multiple_component } from "../annotations/Component";
import { View } from "../core/View";
import { ComponentFactory } from "./ComponentFactory";

@disallow_multiple_component()
export class GestureDoubleClick extends BaseComponent {
    protected _touchDownPoint: Point;
    protected _clickCount: number = 0;
    private _pointerId = -1;
    
    private onEnable() {
        this.owner.onClick(this._click, this);
    }

    private onDisable() {
        this.owner.removeClick(this._click, this); 
    }

    private _click(sender: View, pointer: Pointer) {
        if (this._touchDownPoint == null) {
           this._touchDownPoint = new Point();
        } 
        if(this._clickCount == 0) {
            this._pointerId = pointer.pointerId;
        }

        this._touchDownPoint.x = pointer.x;
        this._touchDownPoint.y = pointer.y;

        this._owner.scene.time.delayedCall(300, ()=>{
            this._clickCount = 0;
        });        

        if(this._pointerId === pointer.pointerId) {
            this._clickCount++;
        }
        if(this._clickCount >= 2) {
            this.owner.emit(Events.GestureEvent.DOUBLE_CLICK, pointer);
            this._reset();
        }
    }

    private _reset() {
        this._clickCount = 0;
        this._pointerId = -1;

        // remove double click compoment
        if(!this.owner.hasListener(Events.GestureEvent.DOUBLE_CLICK)) {
            this.owner.removeComponent(this);
        }
    }
}

ComponentFactory.inst.registEvents(Events.GestureEvent.DOUBLE_CLICK, GestureDoubleClick);