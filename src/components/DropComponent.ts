import { BaseComponent } from "./BaseComponent";
import * as Events from "../events";
import { View } from "../core/View";
import { DragComponent } from "./DragComponent";
import { disallow_multiple_component } from "../annotations/Component";
import { Input, Pointer, EventData } from "../phaser";
import { PoolManager } from "../utils/PoolManager";

@disallow_multiple_component()
export class DropComponent extends BaseComponent {
    private _draggingObject:View;

    private onEnable() {
        this.owner.scene.input.on(Input.Events.POINTER_UP, this._touchUp, this);
    }

    private onDisable() {
        this.owner.scene.input.off(Input.Events.POINTER_UP, this._touchUp, this);
    }

    private _touchUp(pointer: Pointer) {
        if(DragComponent.draggingObject && DragComponent.draggingObject != this.owner) {
            let pos = this.owner.globalToLocal(pointer.x, pointer.y);
            if(this.owner.scene.game.input.pointWithinHitArea(this.owner.rootContainer, pos.x, pos.y)) {
                this._draggingObject = DragComponent.draggingObject;
                this._draggingObject.on(Events.DragEvent.END, this._dragEnd, this);
            }
            PoolManager.inst.put(pos);
        }
    }

    private _dragEnd(sender: View) {
        this._draggingObject.off(Events.DragEvent.END, this._dragEnd, this);
        this.owner.emit(Events.DragEvent.DROP, sender, this._draggingObject);
        this._draggingObject = null;
    }
}