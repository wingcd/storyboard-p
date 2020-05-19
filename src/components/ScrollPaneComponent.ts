import { BaseComponent } from "./BaseComponent";
import * as Events from "../events";
import { Point, Tween, Input, EventData, Pointer, GameObject, Easing } from "../phaser";
import { EOverflowType, EScrollType } from "../core/Defines";
import { MathUtils } from "../utils/Math";
import { DisplayObjectEvent, GestureEvent } from "../events";
import { Settings } from "../core/Setting";
import { DragComponent } from "./DragComponent";
import { disallow_multiple_component } from "../annotations/Component";
import { ViewGroup } from "../core/ViewGroup";
import { View } from "../core/View";

const enum EScrollStatus {
    NONE,
    TOUCH_DOWN,
    TOUCH_MOVING,
    TOUCH_UP,      
    SCROLL_BEGIN,
    SCROLLING,
    SCROLL_END,
 }

 const enum EScrollAnimStatus {
    NONE,
    BOUNCE,
    INERTANCE,
    SLITHER,
 }

 @disallow_multiple_component()
export class ScrollPaneComponent extends BaseComponent {    
    public static draggingPane: ScrollPaneComponent;

    protected static sGlobalScrollStart: Point = new Point();
    protected static sLastScrollPt: Point = new Point();
    private   static _sScrollBeginCancelled: boolean;    
    protected static _sStatus: EScrollStatus = EScrollStatus.NONE;

    private _viewSize: Point = new Point();
    private _contentSize: Point = new Point();
    private _overlapSize: Point = new Point();
    private _scrollType: EScrollType = EScrollType.Both;
    private _scrollSpeed: number = Settings.defaultScrollSpeed;
    private _mouseScrollSpeed: number = Settings.defaultScrollSpeed * 2;

    private _endPos: Point = new Point();
    private _posX: number = 0;
    private _posY: number = 0;
    private _moveOffset: Point = new Point();
    private _group: ViewGroup;

    private _enableMouseWheel: boolean = true;
    private _touchEffect: boolean = true;
    private _inertanceEffect: boolean = true;
    private _animationInfo: {
        status: EScrollAnimStatus,
        tween: Tween,
    } = {
        status: EScrollAnimStatus.NONE,
        tween: null,
    };
    private _canreset = false;
    private _pointerId = -1;

    public regist(view: ViewGroup) {
        if(!(view instanceof ViewGroup)) {
            return;
        }

        this._group = view;
        super.regist(view);
    }

    public get owner(): ViewGroup {
        return this._group;
    }

    private onEnable() {
        this.owner.on(Events.DisplayObjectEvent.SIZE_CHANGED, this._onSizeChanged, this);
        this.owner.on(Input.Events.GAMEOBJECT_WHEEL, this._mouseWheel, this);

        this.owner.on(Input.Events.POINTER_DOWN, this._touchDown, this);

        this._init();
    }

    private onDisable() {
        this.owner.off(Events.DisplayObjectEvent.SIZE_CHANGED, this._onSizeChanged, this);
        this.owner.off(Input.Events.GAMEOBJECT_WHEEL, this._mouseWheel, this);   

        this.owner.off(Input.Events.POINTER_DOWN, this._touchDown, this);

        this.owner.container.setPosition(0, 0);
    }

    private _init() {
        this.owner.container.setPosition(0, 0);
        this._viewSize.setTo(this.owner.width, this.owner.height);
        this._contentSize.setTo(this.owner.bounds.width + this.owner.bounds.x, this.owner.bounds.height + this.owner.bounds.y);
        this._updateOverlap();
    }

    private _updateOverlap() {
        if (this._scrollType == EScrollType.Horizontal || this._scrollType == EScrollType.Both) {
            this._overlapSize.x = Math.ceil(Math.max(0, this._contentSize.x - this._viewSize.x));
        }
        else {
            this._overlapSize.x = 0;
        }
        if (this._scrollType == EScrollType.Vertical || this._scrollType == EScrollType.Both) {
            this._overlapSize.y = Math.ceil(Math.max(0, this._contentSize.y - this._viewSize.y));
        }
        else {
            this._overlapSize.y = 0;
        }
    }

    private _onSizeChanged(sender: View, oldWidth:number, oldHeight:number, newWidth:number, newHeight:number) {
        this._viewSize.setTo(this.owner.width, this.owner.height);
        this._handleSizeChanged();
    }

    public setContentSize(w: number, h: number): void {
        if (this._contentSize.x == w && this._contentSize.y == h)
            return;

        this._contentSize.x = w;
        this._contentSize.y = h;
        this._handleSizeChanged();
    }

    private _handleSizeChanged() {
        this._updateOverlap();
    }

    public setPosX(val: number, ani?: boolean) {
        this.owner.ensureBoundsCorrect();
        val = Math.round(val);

        let value = this._clampX(val, 0, 1);
        if(value != this._posX) {
            this._endPos.x = val;
            this._refresh(ani);
        }
    }

    public setPosY(val: number, ani?: boolean) {
        this.owner.ensureBoundsCorrect();
        val = Math.round(val);

        let value = this._clampY(val, 0, 1);
        if(value != this._posY) {
            this._endPos.y = val;
            this._refresh(ani);
        }
    }

    public get percX(): number {
        return this._overlapSize.x == 0 ? 0 : this._posX / this._overlapSize.x;
    }

    public set percX(value: number) {
        this.setPercX(value, false);
    }

    public setPercX(value: number, ani: boolean = false): void {
        this.setPosX(this._overlapSize.x * MathUtils.clamp01(value), ani);
    }

    public get percY(): number {
        return this._overlapSize.y == 0 ? 0 : this._posY / this._overlapSize.y;
    }

    public set percY(value: number) {
        this.setPercY(value, false);
    }

    public setPercY(value: number, ani: boolean = false): void {
        this.setPosY(this._overlapSize.y * MathUtils.clamp01(value), ani);
    } 

    private _refresh(ani?: boolean) {
        if(ani) {
            this._animationInfo.status = EScrollAnimStatus.SLITHER;
            this._doAnimation();
        }else{
            this._posX = this._endPos.y;
            this._posY = this._endPos.x;
            this.owner.scrollTo(-this._posX, -this._posY);
        }
    }

    private _mouseWheel(pointer: Pointer, gameObject: GameObject, deltaX: number, deltaY: number, deltaZ: number, event: EventData): void {
        if (!this._enableMouseWheel)
            return;
        let dlt = 0;
        if(Math.abs(deltaX) > Math.abs(deltaY)) {
            dlt = deltaX;
        }else{
            dlt = deltaY;
        }
        const delta = dlt > 0 ? -1 : (dlt < 0 ? 1 : 0);
        if(delta != 0) {
            if(this._overlapSize.x == 0){
                this.setPosX(0);
            } 
            if(this._overlapSize.y == 0) {
                this.setPosY(0);
            }
            
            if(this._overlapSize.x > 0 && this._overlapSize.y == 0) {
                this.setPosX(this._posX + delta * this._mouseScrollSpeed, false);
            }else{
                this.setPosY(this._posY + delta * this._mouseScrollSpeed, false);
            }
        }
    }

    private _touchDown(pointer: Pointer, localX: number, localY: number, event: EventData) {
        if(!this._touchEffect) {
            return;
        }
        this._scrollEnd();
        this._clearAnimation();
        this._pointerId = pointer.pointerId;
   
         ScrollPaneComponent._sStatus = EScrollStatus.TOUCH_DOWN;
         this._owner.scene.input.on(Input.Events.POINTER_MOVE, this._moving, this);
         this._owner.scene.input.on(Input.Events.POINTER_UP, this._end, this);
         this._owner.scene.input.on(Input.Events.POINTER_UP_OUTSIDE, this._end, this);
         this._canreset = true;
    }

    private _clampX(val: number, minRatio: number = 1, maxRatio: number = 0): number {
        let ret = MathUtils.clamp(val, -this._overlapSize.x*minRatio, this._overlapSize.x*maxRatio);
        return Math.round(ret);
    }

    private _clampY(val: number, minRatio: number = 1, maxRatio: number = 0): number {
        let ret = MathUtils.clamp(val, -this._overlapSize.y*minRatio, this._overlapSize.y*maxRatio);
        return Math.round(ret);
    }

    private _moving(pointer: Pointer): void {     
        if(this._pointerId !== pointer.pointerId) {
            return;
        }
        
        if(ScrollPaneComponent.draggingPane && ScrollPaneComponent.draggingPane != this || DragComponent.draggingObject) {         
            this._reset();
            return;
        }

        let sensitivity: number = Settings.touchScrollSensitivity;  
        if(ScrollPaneComponent._sStatus == EScrollStatus.TOUCH_DOWN || ScrollPaneComponent._sStatus == EScrollStatus.TOUCH_MOVING) {
           // check can into drag status
           if (Math.abs(pointer.downX - pointer.x) < sensitivity &&
              Math.abs(pointer.downY - pointer.y) < sensitivity) {
              return;
           }
           ScrollPaneComponent._sStatus = EScrollStatus.TOUCH_MOVING;
  
           // remove event listener
           this._reset();
           ScrollPaneComponent._sScrollBeginCancelled = false;
      
           ScrollPaneComponent.draggingPane = this;
  
           this.owner.emit(Events.ScrollEvent.START, pointer);
  
           if(!ScrollPaneComponent._sScrollBeginCancelled) {
              this._scrollBegin();
           }
           
        } else if(ScrollPaneComponent._sStatus == EScrollStatus.SCROLL_BEGIN || ScrollPaneComponent._sStatus == EScrollStatus.SCROLLING) {
            //dragging
            if(ScrollPaneComponent._sStatus == EScrollStatus.SCROLL_BEGIN) {
                ScrollPaneComponent._sStatus = EScrollStatus.SCROLLING;                
            } 
            this._clearAnimation();
            
            this._moveOffset.x = pointer.worldX - ScrollPaneComponent.sLastScrollPt.x;
            this._moveOffset.y = pointer.worldY - ScrollPaneComponent.sLastScrollPt.y;

            //simulate drag force
            let sx = 1 - Math.abs(pointer.worldX - ScrollPaneComponent.sGlobalScrollStart.x) / this._viewSize.x;
            let sy = 1 - Math.abs(pointer.worldY - ScrollPaneComponent.sGlobalScrollStart.y) / this._viewSize.y;          
            this._moveOffset.x *= sx;
            this._moveOffset.y *= sy;
                        
            let newPosX = Math.round(this.owner.container.x + this._moveOffset.x);
            let newPosY = Math.round(this.owner.container.y + this._moveOffset.y);

            if(this._touchEffect) { 
                if(this._scrollType == EScrollType.Both || this._scrollType == EScrollType.Horizontal) {
                    if(newPosX > 0) {
                        // scroll to right
                        let x = Math.round(Math.min(newPosX, this._viewSize.x * 0.5));
                        this.owner.scrollTo(x);
                    }else if(newPosX < -this._overlapSize.x){
                        // scroll to left
                        let x = Math.round(Math.max((newPosX + this._overlapSize.x), -this._viewSize.x * 0.5) - this._overlapSize.x);
                        this.owner.scrollTo(x);
                    }else{
                        this.owner.scrollTo(newPosX);
                    }
                }

                if(this._scrollType == EScrollType.Both || this._scrollType == EScrollType.Vertical) {
                    if(newPosY > 0) {
                        // scroll to bottom
                        let y = Math.round(Math.min(newPosY, this._viewSize.y * 0.5));
                        this.owner.scrollTo(null, y);
                    }else if(newPosY < -this._overlapSize.y){
                        // scroll to top
                        let y = Math.round(Math.max((newPosY + this._overlapSize.y), -this._viewSize.y * 0.5) - this._overlapSize.y);
                        this.owner.scrollTo(null, y);
                    }else{
                        this.owner.scrollTo(null, newPosY);
                    }
                }
                
                this._endPos.x = this._posX = -this._clampX(this.owner.container.x);
                this._endPos.y = this._posY = -this._clampY(this.owner.container.y);                
            }else{
                if(this._overlapSize.x == 0) {
                    this.setPosX(0);
                }else{
                    this.setPosX(-newPosX);
                }

                if(this._overlapSize.y == 0) {
                    this.setPosY(0);
                }else{
                    this.setPosY(-newPosY);
                }
            }             

            ScrollPaneComponent.sLastScrollPt.setTo(pointer.worldX, pointer.worldY);
            this.owner.emit(Events.ScrollEvent.SCROLLING);
        }  
     }

     private _scrollBegin() {
        if(ScrollPaneComponent.draggingPane) {
           ScrollPaneComponent.draggingPane.stopScroll();
        } 
  
        this._owner.scene.input.on(Input.Events.POINTER_MOVE, this._moving, this);
         this._owner.scene.input.on(Input.Events.POINTER_UP, this._end, this);
         this._owner.scene.input.on(Input.Events.POINTER_UP_OUTSIDE, this._end, this);
        this._canreset = true;
  
        ScrollPaneComponent._sStatus = EScrollStatus.SCROLL_BEGIN;      
        ScrollPaneComponent.draggingPane = this;
  
        ScrollPaneComponent.sLastScrollPt.x = ScrollPaneComponent.sGlobalScrollStart.x = this._owner.scene.input.activePointer.worldX;
        ScrollPaneComponent.sLastScrollPt.y = ScrollPaneComponent.sGlobalScrollStart.y = this._owner.scene.input.activePointer.worldY;
    } 

    private _reset() {
        if(this._canreset) {
            this._canreset = false;
            this._owner.scene.input.off(Input.Events.POINTER_MOVE, this._moving, this);
            this._owner.scene.input.off(Input.Events.POINTER_UP, this._end, this);
            this._owner.scene.input.off(Input.Events.POINTER_UP_OUTSIDE, this._end, this);
        }
    }

    private _clearAnimation() {
        if(this._animationInfo.tween) {
            this._animationInfo.tween.stop();
            this._animationInfo.tween = null;
        }
        this._animationInfo.status = EScrollAnimStatus.NONE;
    }

    private _doAnimation() {
        let dx = Math.abs(this._endPos.x + this.owner.container.x);
        let dy = Math.abs(this._endPos.y + this.owner.container.y);
        
        let status = this._animationInfo.status;
        if(dx == 0 && dy == 0) {
            status = EScrollAnimStatus.NONE;
        }
        this._clearAnimation();

        if(status != EScrollAnimStatus.NONE) { 
            let time = Math.max(Math.max(dx, dy) / this._scrollSpeed * 2, 200);
            let easing: any = Easing.Linear;
            let tween = this._owner.scene.tweens.create({
                targets: {
                    x: this.owner.container.x, 
                    y: this.owner.container.y,
                },
                ease: easing,
                props:{x: -this._endPos.x, y: -this._endPos.y},
                duration: time,
                onUpdate: (t, data)=>{
                    switch(status)
                    {
                        case EScrollAnimStatus.BOUNCE:
                            this.owner.scrollTo(data.x, data.y);
                            break;
                        case EScrollAnimStatus.INERTANCE:
                        case EScrollAnimStatus.SLITHER:
                            this._posX = -this._clampX(data.x);
                            this._posY = -this._clampY(data.y);
                            this.owner.scrollTo(data.x, data.y);
                            this.owner.emit(Events.ScrollEvent.SCROLLING);
                            break;                            
                    }
                },
                onComplete: (t, targets)=>{
                    this._clearAnimation();

                    let data = targets[0];
                    if(status == EScrollAnimStatus.INERTANCE) {                        
                        this._endPos.x = -this._clampX(data.x);
                        this._endPos.y = -this._clampY(data.y);
                        if(this._endPos.x + this.owner.container.x != 0 || this._endPos.y + this.owner.container.y != 0) {
                            this._animationInfo.status = EScrollAnimStatus.BOUNCE;
                        }
                        this._doAnimation();
                    }else{
                        ScrollPaneComponent._sStatus = EScrollStatus.SCROLL_END;
                        this.owner.emit(Events.ScrollEvent.END);
                        this._scrollEnd();   
                    }   
                }
            });
                
            this._animationInfo.tween = tween;
            tween.play();
        }else{
            ScrollPaneComponent._sStatus = EScrollStatus.SCROLL_END;
            this.owner.emit(Events.ScrollEvent.END);
            this._scrollEnd(); 
        }
    }

    private _end(pointer: Pointer): void {
        if(this._pointerId !== pointer.pointerId) {
            return;
        }
        this._pointerId = -1;

        if(this._touchEffect && this._inertanceEffect && this._animationInfo.status == EScrollAnimStatus.NONE) {
            let dx: number = Math.round(pointer.worldX - ScrollPaneComponent.sLastScrollPt.x);
            let dy: number = Math.round(pointer.worldY - ScrollPaneComponent.sLastScrollPt.y);

            let sx = 1 - Math.abs(pointer.worldX - ScrollPaneComponent.sGlobalScrollStart.x) / this._viewSize.x;
            let sy = 1 - Math.abs(pointer.worldY - ScrollPaneComponent.sGlobalScrollStart.y) / this._viewSize.y;          
            dx *= sx;
            dy *= sy;

            if(dx != 0 || dy != 0) {
                let canDo = false;
                if(Math.abs(this.owner.container.x) < this._viewSize.x * 0.5) {
                    this._endPos.x = -this._clampX(this.owner.container.x + dx, 1.2, 0.2);
                    canDo = true;
                }

                if(Math.abs(this.owner.container.y) < this._viewSize.y * 0.5) {
                    this._endPos.y = -this._clampY(this.owner.container.y + dy, 1.2, 0.2);
                    canDo = true;
                }

                if(canDo) {
                    this._animationInfo.status = EScrollAnimStatus.INERTANCE;
                }
            }
        }

        if(this._touchEffect && this._animationInfo.status == EScrollAnimStatus.NONE) {
            if(this.owner.container.x > 0 || this.owner.container.x < -this._overlapSize.x ||
               this.owner.container.y > 0 || this.owner.container.y < -this._overlapSize.y ) {
                this._animationInfo.status = EScrollAnimStatus.BOUNCE;
            }
        } 

        if (ScrollPaneComponent.draggingPane == this) {
            this._reset();    
            if(this._animationInfo.status != EScrollAnimStatus.NONE) {
                this._doAnimation();
            }                       
        } else if(!ScrollPaneComponent.draggingPane) {
            this._scrollEnd();
        }
    }

    private _scrollEnd(): void {
        this._reset();
        ScrollPaneComponent.draggingPane = null;
        ScrollPaneComponent._sStatus = EScrollStatus.NONE;
        ScrollPaneComponent._sScrollBeginCancelled = true;
    }

    public startScroll(): void {
        if (!this.owner.onStage)
            return;
        this._scrollBegin();
    }
  
     public stopScroll(): void {
        if(ScrollPaneComponent.draggingPane == this) { 
           this._scrollEnd();
        }
     }
}