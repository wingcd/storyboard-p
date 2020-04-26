// import { BaseComponent } from "./BaseComponent";
// import * as Events from "../events";
// import { Point } from "../phaser";
// import { Settings } from "../core/Setting";
// import { SEvent, GestureEvent } from "../events";
// import { disallow_multiple_component } from "../annotations/Component";
// import { DragComponent } from "./DragComponent";

// @disallow_multiple_component()
// export class GestureClick extends BaseComponent {
//     protected _touchDownPoint: Point;
//     protected _touched: boolean = false;
//     private _pointerId = -1;
    
//     private onEnable() {
//         this.owner.on(GestureEvent.Down, this._touchBegin, this);
//     }

//     private onDisable() {
//         this.owner.off(GestureEvent.Down, this._touchBegin, this);     
//     }

//     private _touchBegin(evt: SEvent) {
//         if (this._touchDownPoint == null) {
//            this._touchDownPoint = new Point();
//         } 

//         this._touchDownPoint.x = evt.raw.data.global.x;
//         this._touchDownPoint.y = evt.raw.data.global.y;
//         this._pointerId = evt.raw.data.pointerId;

//         this._touched = true;

//         this.owner.on(GestureEvent.Up, this._touchUp, this);
//         this.owner.on(GestureEvent.UpOutside, this._touchUpOutside, this);
//     }

//     private _reset() {
//         this.owner.off(GestureEvent.Up, this._touchUp, this);
//         this.owner.off(GestureEvent.UpOutside, this._touchUpOutside, this);
//         this._touched = false;
//         this._pointerId = -1;

//         // remove click compoment
//         if(!this.owner.hasListener(Events.GestureEvent.Click)) {
//             this.owner.removeComponent(this);
//         }
//     }

//     private _touchUp(evt: SEvent) {
//         if(this._pointerId != evt.raw.data.pointerId) {
//             return;
//         }

//         if(this._touched && DragComponent.draggingObject != this.owner) {
//             if(this.owner.touchEnableMoved ||
//               (Math.abs(this._touchDownPoint.x - evt.raw.data.global.x) <= Settings.touchSensitivity && 
//                Math.abs(this._touchDownPoint.y - evt.raw.data.global.y) <= Settings.touchSensitivity)) {
//                 this.owner.emit(Events.GestureEvent.Click, evt.raw);
//             }
//             this._reset();
//         }
//     }

//     private _touchUpOutside(evt: SEvent) {
//         if(this._touched) {
//             this._reset();
//         }
//     }
// }