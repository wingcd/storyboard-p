import { View } from "../core/View";
import { BaseComponent } from "./BaseComponent";
import { Point, Rectangle, Input, Pointer, EventData } from "../phaser";
import * as Events from "../events";
import { Settings } from "../core/Setting";
import { clonable } from "../annotations/Clonable";
import { DisplayObjectEvent } from "../events";
import { disallow_multiple_component } from "../annotations/Component";
import { PoolManager } from "../utils/PoolManager";
import { TOP_MOST_DEPTH, DEFAULT_DEPTH } from "../core/Defines";
import { ViewGroup } from "../core/ViewGroup";

const enum EDragStatus {
   NONE,
   TOUCH_DOWN,
   TOUCH_MOVING,
   TOUCH_UP,      
   DRAG_BEGIN,
   DRAGGING,
   DRAG_END,
}

@disallow_multiple_component()
export class DragComponent extends BaseComponent {
   protected static sGlobalDragStart: Point = new Point();
   protected static sStartXY: Point = new Point();
   private   static _sDragBeginCancelled: boolean;
   protected static _sStatus: EDragStatus = EDragStatus.NONE;

   private _lockXY: boolean = false;
   
   private _parent: ViewGroup;
   private _index: number;
   /**
    * @description clamp range in parent axis system 
    * @default null
    * */ 
   @clonable()
   public dragBounds: Rectangle;
   @clonable()
   public topMostOnDragging: boolean = false;

   public static draggingObject: View;

   constructor() {
      super();
   }

   private onEnable() {
      this.owner.on(Input.Events.POINTER_DOWN, this._touchBegin, this);
   }

   private onDisable() {
      this.owner.off(Input.Events.POINTER_DOWN, this._touchBegin, this);  

      this.stopDrag();
   }

   private _sizeChanged(sender: View, oldWidth: number, oldHeight: number, width: number, height: number) {
      if(this.owner == DragComponent.draggingObject) {         
         let diffx = width - oldWidth;
         let diffy = height - oldHeight;
         DragComponent.sGlobalDragStart.x += diffx;
         DragComponent.sGlobalDragStart.y += diffy;
      }
   }

   private _xyChanged(sender: View, oldX: number, oldY: number, x: number, y: number) {
      if(!this._lockXY && this.owner == DragComponent.draggingObject) {
         let diffx = x - oldX;
         let diffy = y - oldY;
         DragComponent.sGlobalDragStart.x += diffx;
         DragComponent.sGlobalDragStart.y += diffy;
      }
   }

   public startDrag(): void {
      if (!this.owner.onStage)
          return;
      this._dragBegin();
  }

   public stopDrag(): void {
      if(DragComponent.draggingObject == this.owner) { 
         this._dragEnd();
      }
   }

   private _dragBegin() {
      if(DragComponent.draggingObject) {
         DragComponent.draggingObject.stopDrag();
      } 

      if(this.topMostOnDragging && this.owner.parent) {
         this._parent = this.owner.parent;
         this._index = this._parent.getChildIndex(this.owner);   

         let pt = this.owner.parent.localToGlobal(this.owner.x, this.owner.y);
         this.owner.setXY(pt.x, pt.y);
         PoolManager.inst.put(pt);

         this.owner.root.addChildAt(this.owner, this._parent.children.length);   
      }

      this.owner.scene.input.on(Input.Events.POINTER_MOVE, this._moving, this);
      this.owner.scene.input.on(Input.Events.POINTER_UP, this._end, this);
      this.owner.scene.input.on(Input.Events.POINTER_UP_OUTSIDE, this._end, this);

      this.owner.on(DisplayObjectEvent.SIZE_CHANGED, this._sizeChanged, this);
      this.owner.on(DisplayObjectEvent.XY_CHANGED, this._xyChanged, this);

      DragComponent._sStatus = EDragStatus.DRAG_BEGIN;      
      DragComponent.draggingObject = this.owner;
      
      let pos = PoolManager.inst.get(Point).setTo(this.owner.scene.input.x, this.owner.scene.input.y);
      if(this.owner.parent) {
         this.owner.parent.globalToLocal(pos.x, pos.y, pos);
      }
      DragComponent.sGlobalDragStart.x = pos.x;
      DragComponent.sGlobalDragStart.y = pos.y;

      DragComponent.sStartXY.x = this.owner.x;
      DragComponent.sStartXY.y = this.owner.y;      
   }   

   private _reset() {      
      if(this.topMostOnDragging && this._parent) {
         let pos = this._parent.globalToLocal(this.owner.x, this.owner.y);

         this._parent.addChildAt(this.owner, this._index);
         this._owner.setXY(pos.x, pos.y);
         PoolManager.inst.put(pos);

         this._parent = null;
         this._index = -1;
      }

      this.owner.scene.input.off(Input.Events.POINTER_MOVE, this._moving, this);
      this.owner.scene.input.off(Input.Events.POINTER_UP, this._end, this);
      this.owner.scene.input.off(Input.Events.POINTER_UP_OUTSIDE, this._end, this);
      
      this.owner.off(DisplayObjectEvent.SIZE_CHANGED, this._sizeChanged, this);  
      this.owner.off(DisplayObjectEvent.XY_CHANGED, this._xyChanged, this);
   }

   private _dragEnd(): void {
      this._reset();
      DragComponent.draggingObject = null;
      DragComponent._sStatus = EDragStatus.NONE;
      DragComponent._sDragBeginCancelled = true;
  }

   private _touchBegin(pointer: Pointer, localX: number, localY: number, event: EventData) {
      if(pointer.button != 0) {
         return;
      }

      DragComponent._sStatus = EDragStatus.TOUCH_DOWN;
      this.owner.scene.input.on(Input.Events.POINTER_MOVE, this._moving, this);
      this.owner.scene.input.on(Input.Events.POINTER_UP, this._end, this);
      this.owner.scene.input.on(Input.Events.POINTER_UP_OUTSIDE, this._end, this);
   }

   private _moving(pointer: Pointer, localX: number, localY: number, event: EventData): void {
      if(DragComponent.draggingObject && DragComponent.draggingObject != this.owner) {
         this._reset();
         return;
      }

      let sensitivity: number = Settings.touchDragSensitivity;

      if(DragComponent._sStatus == EDragStatus.TOUCH_DOWN || DragComponent._sStatus == EDragStatus.TOUCH_MOVING) {
         // check can into drag status
         if (Math.abs(pointer.x - pointer.downX) < sensitivity &&
            Math.abs(pointer.y - pointer.downY) < sensitivity) {
            return;
         }
         DragComponent._sStatus = EDragStatus.TOUCH_MOVING;

         this._reset();
         DragComponent._sDragBeginCancelled = false;
    
         DragComponent.draggingObject = this.owner;

         this.owner.emit(Events.DragEvent.START);

         if(!DragComponent._sDragBeginCancelled) {
            this._dragBegin();
         }

      } else if(DragComponent._sStatus == EDragStatus.DRAG_BEGIN || DragComponent._sStatus == EDragStatus.DRAGGING) {
         //dragging
         if(DragComponent._sStatus == EDragStatus.DRAG_BEGIN) {
            DragComponent._sStatus = EDragStatus.DRAGGING;
         }

         let pos = (PoolManager.inst.get(Point) as Point).setTo(this.owner.scene.input.x, this.owner.scene.input.y);
         if(this.owner.parent) {
            this.owner.parent.globalToLocal(pos.x, pos.y, pos);
         }

         let nx: number = pos.x - DragComponent.sGlobalDragStart.x + DragComponent.sStartXY.x;
         let ny: number = pos.y - DragComponent.sGlobalDragStart.y + DragComponent.sStartXY.y;
         
         //clamp to drag bound
         if(this.dragBounds) {
            let dragBounds = this.dragBounds;
            if(this.topMostOnDragging && this._parent) {
               dragBounds = this._parent.localToGlobalRect(dragBounds.x, dragBounds.y, dragBounds.width, dragBounds.height);
            }
            nx = Math.max(nx, dragBounds.left);
            ny = Math.max(ny, dragBounds.top);
            nx = Math.min(nx, dragBounds.right - this.owner.width);
            ny = Math.min(ny, dragBounds.bottom - this.owner.height);
         }

         this._lockXY = true;
         this.owner.setXY(nx, ny);
         this.owner.emit(Events.DragEvent.MOVING, nx, ny);
         this._lockXY = false;
      }  
   }

   private _end(pointer: Pointer, localX: number, localY: number, event: EventData): void {
      if (DragComponent.draggingObject == this.owner) {
         DragComponent._sStatus = EDragStatus.DRAG_END;
         this._dragEnd();
         this.owner.emit(Events.DragEvent.END);
     } else if(!DragComponent.draggingObject) {
         this._dragEnd();
     }
   }
}