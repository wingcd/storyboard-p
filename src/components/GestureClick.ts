import { BaseComponent } from "./BaseComponent";
import * as Events from "../events";
import { Point, Input, Pointer, EventData } from "../phaser";
import { Settings } from "../core/Setting";
import { GestureEvent } from "../events";
import { disallow_multiple_component } from "../annotations/Component";
import { DragComponent } from "./DragComponent";
import { ComponentFactory } from "./ComponentFactory";
import { MultiPointerManager } from "../utils/MultiPointerManager";

@disallow_multiple_component()
export class GestureClick extends BaseComponent {
    protected _touchDownPoint: Point;
    protected _pointersMgr: MultiPointerManager = new MultiPointerManager();
    
    private onEnable() {
        this.owner.on(Input.Events.POINTER_DOWN, this._touchBegin, this);
    }

    private onDisable() {
        this.owner.off(Input.Events.POINTER_DOWN, this._touchBegin, this);     
    }

    private _touchBegin(pointer: Pointer, localX: number, localY: number, event: EventData) {
        if (this._touchDownPoint == null) {
           this._touchDownPoint = new Point();
        } 

        this._touchDownPoint.x = pointer.x;
        this._touchDownPoint.y = pointer.y;
        this._pointersMgr.down(pointer);

        this.owner.on(Input.Events.POINTER_UP, this._touchUp, this);
        this.owner.on(Input.Events.POINTER_UP_OUTSIDE, this._touchUpOutside, this);
    }

    private _reset() {
        if(this._pointersMgr.isEmpty()) {
            this.owner.off(Input.Events.POINTER_UP, this._touchUp, this);
            this.owner.off(Input.Events.POINTER_UP_OUTSIDE, this._touchUpOutside, this);
        }

        // remove click compoment
        if(!this.owner.hasListener(Events.GestureEvent.CLICK)) {
            this.owner.removeComponent(this);
        }
    }

    private _touchUp(pointer: Pointer, localX: number, localY: number, event: EventData) {
        if(!this._pointersMgr.isDown(pointer)) {
            return;
        }
        this._pointersMgr.up(pointer);

        if(DragComponent.draggingObject != this.owner) {
            if(this.owner.touchEnableMoved ||
              (Math.abs(this._touchDownPoint.x - pointer.x) <= Settings.touchSensitivity && 
               Math.abs(this._touchDownPoint.y - pointer.y) <= Settings.touchSensitivity)) {
                this.owner.emit(Events.GestureEvent.CLICK, pointer, localX, localY, event);
            }
            this._reset();
        }
    }

    private _touchUpOutside(pointer: Pointer) {
        if(this._pointersMgr.isDown(pointer)) {
            this._pointersMgr.up(pointer);
            this._reset();
        }
    }
}

ComponentFactory.inst.registEvents(Events.GestureEvent.CLICK, GestureClick);