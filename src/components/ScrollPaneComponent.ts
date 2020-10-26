import * as Events from "../events";
import { Point, Tween, Input, EventData, Pointer, Easing, TimerEvent, Rectangle } from "../phaser";
import { EScrollbarDisplayType as EScrollBarDisplayType, EScrollType } from "../core/Defines";
import { MathUtils } from "../utils/Math";
import { Settings } from "../core/Setting";
import { DragComponent } from "./DragComponent";
import { disallow_multiple_component } from "../annotations/Component";
import { ViewGroup } from "../core/ViewGroup";
import { ISerializeFields, IUIList } from "../types";
import { ComponentFactory } from "./ComponentFactory";
import { SerializableComponent } from "./SerializableComponent";
import { UIScrollBar } from "../ui/UIScrollBar";
import { Package } from "../core/Package";
import { Margin } from "../utils/Margin";
import { View } from "../core/View";
import { clone } from "../utils/Serialize";

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
export class ScrollPaneComponent extends SerializableComponent {
    public static TYPE = "scroll";

    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(SerializableComponent.SERIALIZABLE_FIELDS),
        {
            scrollType: {importAs: "_scrollType", default: EScrollType.Both},
            scrollSpeed: {alias: "speed",default: Settings.defaultScrollSpeed},
            enableMouseWheel: {alias: "mouseWheel",default: true},
            mouseScrollSpeed: {alias: "mouseSpeed",default: Settings.defaultScrollSpeed * 2},
            touchEffect: {default: true},
            inertanceEffect: {default: false},
            bouncebackEffect: {default: false},      
            
            scrollBarDisplay: {importAs: "_scrollBarDisplay", alias: "barDispType", default: EScrollBarDisplayType.Default},
            scrollBarMargin: {importAs: "_scrollBarMargin", alias: "barMargin", type: Margin},           
            displayOnLeft: {importAs: "_displayOnLeft", alias: "barOnLeft", default: false},         
            autoLayoutView: {importAs: "_autoLayoutView", alias: "autoLayout", default: true},      
            vScrollBarRes: {importAs: "_vScrollBarRes", alias: "vbarRes"},
            hScrollBarRes: {importAs: "_hScrollBarRes", alias: "hbarRes"},      
        }
    );

    private static _draggingPane: ScrollPaneComponent;
    private static get draggingPane(): ScrollPaneComponent {
        return ScrollPaneComponent._draggingPane;
    }

    protected static sHelperRect: Rectangle = new Rectangle();
    protected static sGlobalScrollStart: Point = new Point();
    protected static sLastScrollPt: Point = new Point();
    private   static _sScrollBeginCancelled: boolean;    
    protected static _sStatus: EScrollStatus = EScrollStatus.NONE;

    public enableMouseWheel: boolean = true;
    public touchEffect: boolean = true;
    // 是否允许惯性
    public inertanceEffect: boolean = false;
    // 是否允许回弹效果
    public bouncebackEffect: boolean = false;

    public scrollSpeed: number = Settings.defaultScrollSpeed;
    public mouseScrollSpeed: number = Settings.defaultScrollSpeed * 2;

    private _scrollBarDisplay: EScrollBarDisplayType = EScrollBarDisplayType.Default;    
    private _scrollBarMargin: Margin = new Margin();
    private _displayOnLeft: boolean = false;
    // 是否自动为滚动条留出空位，当需要透明浮层滚动条时，可将值设置为假
    private _autoLayoutView: boolean = true;

    
    private _scrollType: EScrollType = EScrollType.Both;
    private _vScrollBarRes: string;
    private _hScrollBarRes: string;
    private _pageMode: boolean = false;

    private _viewSize: Point = new Point();
    private _contentSize: Point = new Point();
    private _overlapSize: Point = new Point();
    private _endPos: Point = new Point();
    private _posX: number = 0;
    private _posY: number = 0;
    private _prePosX: number = 0;
    private _prePosY: number = 0;
    private _moveOffset: Point = new Point();
    private _group: ViewGroup;

    private _vScrollBar: UIScrollBar;
    private _hScrollBar: UIScrollBar;
    // 标记是否显示scrollbar
    private _scrollBarVisible: boolean = false;
    private _mouseWheelEnabled: boolean = false;
    // 标记滚动条是否已经显示
    private _vScrollVisble: boolean = false;
    private _hScrollVisble: boolean = false;
    private _pageSize: Point = new Point();
    private _showScrollBarTimer: TimerEvent;
    private _realDisplayType: EScrollBarDisplayType = EScrollBarDisplayType.Default;
    private _mouseIn = false;

    /**@internal
     * 0 - no loop
     * 1 - x loop 
     * 2 - y loop
     */
    loop: number = 0;

    //防止事件穿透的组件
    private _preventEventHBar: View;
    private _preventEventVBar: View;

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
        this._construct();
    }

    public get owner(): ViewGroup {
        return this._group;
    }

    private onEnable() {
        this.owner.on(Input.Events.POINTER_WHEEL, this._mouseWheel, this);
        this.owner.on(Input.Events.POINTER_DOWN, this._touchDown, this);
        this.owner.on(Input.Events.POINTER_OVER, this._mouseOver, this);
        this.owner.on(Input.Events.POINTER_OUT, this._mouseOut, this);

        this._init(true);
    }

    private onDisable() {
        this.owner.off(Input.Events.POINTER_WHEEL, this._mouseWheel, this);
        this.owner.off(Input.Events.POINTER_DOWN, this._touchDown, this);
        this.owner.off(Input.Events.POINTER_OVER, this._mouseOver, this);
        this.owner.off(Input.Events.POINTER_OUT, this._mouseOut, this);
        
        this._scrollTo(0, 0);
    }

    private onDispose() {
        if(this._vScrollBar) {
            this._vScrollBar.dispose();
            this._vScrollBar = null;
        }

        if(this._hScrollBar) {
            this._hScrollBar.dispose();
            this._hScrollBar = null;
        }

        if(this._preventEventVBar) {
            this._preventEventVBar.dispose();
            this._preventEventVBar = null;
        }

        if(this._preventEventHBar) {
            this._preventEventHBar.dispose();
            this._preventEventHBar = null;
        }
    }

    private _init(resetPos: boolean) {
        if(resetPos) {
            this._scrollTo(0, 0);
        }
        this._viewSize.setTo(this.owner.scrollRect.width, this.owner.scrollRect.height);
        this._pageSize.setTo(this._viewSize.x + this._columnGap(), this._viewSize.y + this._rowGap());
        this._contentSize.setTo(this.owner.bounds.width + this.owner.bounds.x, this.owner.bounds.height + this.owner.bounds.y);
        this._updateOverlap();
    }
    
    private _updateOverlap() {
        if (this.scrollType == EScrollType.Horizontal || this.scrollType == EScrollType.Both) {
            this._overlapSize.x = Math.ceil(Math.max(0, this._contentSize.x - this._viewSize.x));
        }
        else {
            this._overlapSize.x = 0;
        }
        if (this.scrollType == EScrollType.Vertical || this.scrollType == EScrollType.Both) {
            this._overlapSize.y = Math.ceil(Math.max(0, this._contentSize.y - this._viewSize.y));
        }
        else {
            this._overlapSize.y = 0;
        }
    }

    public onOwnSizeChanged() {
        this._viewSize.setTo(this.owner.scrollRect.width, this.owner.scrollRect.height);
        this._pageSize.setTo(this._viewSize.x, this._viewSize.y);
        this._handleSizeChanged();
    }

    public setContentSize(w: number, h: number): void {
        if (this._contentSize.x == w && this._contentSize.y == h)
            return;

        this._contentSize.x = w;
        this._contentSize.y = h;
        this._handleSizeChanged();
    }

    private _needShowVScrollBar(): boolean {
        let typeEanble = this.scrollType == EScrollType.Vertical || this.scrollType == EScrollType.Both;
        let shouldShow = this._contentSize.y > this._viewSize.y;
        return typeEanble && (shouldShow || this._realDisplayType == EScrollBarDisplayType.Always);
    }

    private _needShowHScrollBar(): boolean {
        let typeEanble = this.scrollType == EScrollType.Horizontal || this.scrollType == EScrollType.Both;
        let shouldShow = this._contentSize.x > this._viewSize.x;
        return typeEanble && (shouldShow || this._realDisplayType == EScrollBarDisplayType.Always);
    }

    private _handleSizeChanged() {
        this._updateOverlap();

        let ofs = this.owner.scrollOffsetSize;
        let offset = new Point(ofs.x, ofs.y);
        if (this._realDisplayType != EScrollBarDisplayType.Hidden) {
            if (this._vScrollBar) {
                if (!this._needShowVScrollBar()) {
                    if (this._vScrollVisble) {
                        this._vScrollVisble = false;
                        offset.x += this._vScrollBar.width;
                    }
                }
                else {
                    if (!this._vScrollVisble) {
                        this._vScrollVisble = true;
                        offset.x -= this._vScrollBar.width;
                    }
                }
            }
            if (this._hScrollBar) {
                if (!this._needShowHScrollBar()) {
                    if (this._hScrollVisble) {
                        this._hScrollVisble = false;
                        offset.y += this._hScrollBar.height;
                    }
                }
                else {
                    if (!this._hScrollVisble) {
                        this._hScrollVisble = true;
                        offset.y -= this._hScrollBar.height;
                    }
                }
            }
        }

        if(this._autoLayoutView) {
            this.owner.scrollOffsetSize = offset;
        }

        if (this._vScrollBar) {
            if (this._viewSize.y < this._vScrollBar.minSize) {
                //use this._vScrollBar.rootContainer.visible instead of this._vScrollBar.visible... ScrollBar actually is not in its owner's display tree, so vScrollBar.visible will not work
                this._vScrollBar.rootContainer.visible = false;
            } else {
                this._vScrollBar.rootContainer.visible = this._scrollBarVisible && this._vScrollVisble;
                if (this._contentSize.y == 0)
                    this._vScrollBar.displayPerc = 0;
                else
                    this._vScrollBar.displayPerc = Math.min(1, this._viewSize.y / this._contentSize.y);
            }
        }
        if (this._hScrollBar) {
            if (this._viewSize.x < this._hScrollBar.minSize) {
                this._hScrollBar.rootContainer.visible = false;
            } else {
                this._hScrollBar.rootContainer.visible = this._scrollBarVisible && this._hScrollVisble;
                if (this._contentSize.x == 0)
                    this._hScrollBar.displayPerc = 0;
                else
                    this._hScrollBar.displayPerc = Math.min(1, this._viewSize.x / this._contentSize.x);
            }
        }

        this._syncScrollBar();
    }

    public get scrollType(): EScrollType {
        return this._scrollType;
    }

    public set scrollType(val: EScrollType) {
        if(val != this._scrollType) {
            this._scrollType = val;

            this._init(false);   
            this._syncScrollBar();
            this.owner.onScrollStatusChanged();
        }
    }

    public get scrollBarDisplay(): EScrollBarDisplayType {
        return this._scrollBarDisplay;
    }

    public set scrollBarDisplay(val: EScrollBarDisplayType) {
        if(val != this._scrollBarDisplay) {
            this._scrollBarDisplay = val;
            this._applyDisplayType();
        }
    }

    public get scrollBarMargin(): Margin {
        return this._scrollBarMargin;
    }

    public set scrollBarMargin(val: Margin) {
        if(!this._scrollBarMargin.equal(val)) {
            this._scrollBarMargin.copy(val);
            this.updateScrollBar();
        }
    }

    /**@internal */
    get pageMode(): boolean {
        return this._pageMode;
    }

    /**@internal */
    set pageMode(val: boolean) {
        if(val != this._pageMode) {
            this._pageMode = val;

            if(val) {
                this._endPos.x = this._clampX(this._endPos.x);
                this._endPos.y = this._clampY(this._endPos.y);
                this._refresh(false);
            }
        }
    }

    public get posX(): number {
        return this._posX;
    }

    public get posY(): number {
        return this._posY;
    }

    public get prePosX(): number {
        return this._prePosX;
    }

    public get prePosY(): number {
        return this._prePosY;
    }

    public setPosX(val: number, ani?: boolean) {
        this.owner.ensureBoundsCorrect();
        val = Math.round(val);

        let value = this._clampX(val, 0, 1);
        if(value != this._posX) {
            this._endPos.x = value;
            this._refresh(ani);
        }
    }

    public setPosY(val: number, ani?: boolean) {
        this.owner.ensureBoundsCorrect();
        val = Math.round(val);

        let value = this._clampY(val, 0, 1);
        if(value != this._posY) {
            this._endPos.y = value;
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

    private _scrollTo(x?: number, y?: number) {
        let ox = -this.owner.container.x;
        let oy = -this.owner.container.y;
        let nx = x || ox;
        let ny = y || oy;
        if(nx != this._prePosX || this._prePosY != ny) {
            this._prePosY = ox;
            this._prePosY = oy;
            this.owner.scrollTo(x, y);
        }
    }

    private _refresh(ani?: boolean) {
        if(ani) {
            this._animationInfo.status = EScrollAnimStatus.SLITHER;
            this._doAnimation();
        }else{
            this._posX = this._endPos.x;
            this._posY = this._endPos.y;
            this._scrollTo(-this._posX, -this._posY);
            this._syncScrollBar();
        }
    }

    private _mouseWheel(pointer: Pointer): void {
        if (!this.enableMouseWheel || !this._mouseWheelEnabled)
            return;
            
        let dlt = 0;
        if(Math.abs(pointer.deltaX) > Math.abs(pointer.deltaY)) {
            dlt = pointer.deltaX;
        }else{
            dlt = pointer.deltaY;
        }
        const delta = dlt > 0 ? -1 : (dlt < 0 ? 1 : 0);
        if(delta != 0) {
            if((this.scrollType == EScrollType.Both  || this.scrollType == EScrollType.Horizontal) && 
                this._overlapSize.x == 0){
                this.setPosX(0);
            } 
            if((this.scrollType == EScrollType.Both  || this.scrollType == EScrollType.Vertical) && 
                this._overlapSize.y == 0) {
                this.setPosY(0);
            }
            
            if(this.scrollType == EScrollType.Both) {
                if(this._overlapSize.x > 0 && this._overlapSize.y == 0) {
                    this.setPosX(this._posX + delta * this.mouseScrollSpeed, false);
                }else{
                    this.setPosY(this._posY + delta * this.mouseScrollSpeed, false);
                }
            }else if(this.scrollType == EScrollType.Horizontal) {
                if(this._overlapSize.x > 0) {
                    this.setPosX(this._posX + delta * this.mouseScrollSpeed, false);
                }
            }else{
                if(this._overlapSize.y > 0){
                    this.setPosY(this._posY + delta * this.mouseScrollSpeed, false);
                }
            }
        }
    }

    private _touchDown(pointer: Pointer, localX: number, localY: number, event: EventData) {
        if(!this.touchEffect) {
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

    private _mouseOver(pointer: Pointer): void { 
        this._mouseIn = true;
        this._syncScrollBar();
    }

    private _mouseOut(pointer: Pointer): void { 
        this._mouseIn = false;
        this._syncScrollBar();
    }

    private _clampX(val: number, minRatio: number = 1, maxRatio: number = 0): number {
        if(this._pageMode) {
            let w = this._pageSize.x;
            val = Math.round(val / w) * w;
        }

        if(this.loop == 1) {
            return val;
        }
        let ret = MathUtils.clamp(val, -this._overlapSize.x*minRatio, this._overlapSize.x*maxRatio);
        return Math.round(ret);
    }

    private _clampY(val: number, minRatio: number = 1, maxRatio: number = 0): number {
        if(this._pageMode) {
            let h = this._pageSize.y;
            val = Math.round(val / h) * h;
        }

        if(this.loop == 2) {
            return val;
        }
        let ret = MathUtils.clamp(val, -this._overlapSize.y*minRatio, this._overlapSize.y*maxRatio);
        return Math.round(ret);
    }

    public get isDragging(): boolean {
        return ScrollPaneComponent._draggingPane == this && 
            (ScrollPaneComponent._sStatus != EScrollStatus.NONE && ScrollPaneComponent._sStatus != EScrollStatus.SCROLL_END);
    }
    
    private get _realBouncebackEffect(): boolean {
        return this.bouncebackEffect || this._pageMode;
    }

    private _limitBounaryX(val:number): number {
        let ret = val;
        if(this.scrollType == EScrollType.Both || this.scrollType == EScrollType.Horizontal) {
            let limitX = this.loop == 1 ? Infinity : this._viewSize.x * 0.5;
            if(val > 0) {
                // scroll to right
                ret = Math.round(Math.min(val, limitX));
            }else if(val < -this._overlapSize.x){
                // scroll to left
                ret = Math.round(Math.max((val + this._overlapSize.x), -limitX) - this._overlapSize.x);
            }
        }
        return ret;
    }

    private _limitBounaryY(val:number): number {
        let ret = val;
        if(this.scrollType == EScrollType.Both || this.scrollType == EScrollType.Vertical) {
            let limitY = this.loop == 2 ? Infinity : this._viewSize.y * 0.5;
            if(val > 0) {
                // scroll to bottom
                ret = Math.round(Math.min(val, limitY));
            }else if(val < -this._overlapSize.y){
                // scroll to top
                ret = Math.round(Math.max((val + this._overlapSize.y), -limitY) - this._overlapSize.y);
            }
        }
        return ret;
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
           let npassX = Math.abs(pointer.downX - pointer.x) < sensitivity;
           let npassY = Math.abs(pointer.downY - pointer.y) < sensitivity;
           if (npassX && npassY && this.scrollType == EScrollType.Both || 
               npassX && this.scrollType == EScrollType.Horizontal ||
               npassY && this.scrollType == EScrollType.Vertical) {
              return;
           }
           ScrollPaneComponent._sStatus = EScrollStatus.TOUCH_MOVING;
  
           // remove event listener
           this._reset();
           ScrollPaneComponent._sScrollBeginCancelled = false;
  
           if(!ScrollPaneComponent._sScrollBeginCancelled) {
                this._scrollBegin();
           }else{               
                ScrollPaneComponent._draggingPane = this;        
                this.owner.emit(Events.ScrollEvent.START);
           }    
        } else if(ScrollPaneComponent._sStatus == EScrollStatus.SCROLL_BEGIN || ScrollPaneComponent._sStatus == EScrollStatus.SCROLLING) {
            //dragging
            if(ScrollPaneComponent._sStatus == EScrollStatus.SCROLL_BEGIN) {
                ScrollPaneComponent._sStatus = EScrollStatus.SCROLLING;                
            } 
            this._clearAnimation();
            
            this._moveOffset.x = pointer.worldX - ScrollPaneComponent.sLastScrollPt.x;
            this._moveOffset.y = pointer.worldY - ScrollPaneComponent.sLastScrollPt.y;
                        
            let newPosX = Math.round(this.owner.container.x + this._moveOffset.x);
            let newPosY = Math.round(this.owner.container.y + this._moveOffset.y);

            if(this._realBouncebackEffect) {
                // 模拟阻尼效果
                let sx = (pointer.worldX - ScrollPaneComponent.sGlobalScrollStart.x) / (this._pageSize.x || 1);
                let sy = (pointer.worldY - ScrollPaneComponent.sGlobalScrollStart.y) / (this._pageSize.y || 1);
                if(sx != 0 || sy != 0) {
                    if(this._overlapSize.x > 0 && this.loop != 1) { 
                        if(newPosX > 0) {
                            // scroll to right
                            if(this._overlapSize.x > 0 && sx > 0) {
                                this._moveOffset.x *= MathUtils.clamp01(1-sx);
                            }
                        }else if(newPosX < -this._overlapSize.x){
                            // scroll to left
                            if(this._overlapSize.x > 0 && sx < 0) {
                                this._moveOffset.x *= MathUtils.clamp01(1+sx);
                            }
                        }
                        newPosX = Math.round(this.owner.container.x + this._moveOffset.x);
                    }

                    if(this._overlapSize.y > 0 && this.loop != 2) {
                        if(newPosY > 0) {
                            // scroll to bottom
                            if(this._overlapSize.y > 0 && sy > 0) {
                                this._moveOffset.y *= MathUtils.clamp01(1-sy);
                            }
                        }else if(newPosY < -this._overlapSize.y){
                            // scroll to top
                            if(this._overlapSize.y > 0 && sy < 0) {
                                this._moveOffset.y *= MathUtils.clamp01(1+sy);
                            }
                        }
                        newPosY = Math.round(this.owner.container.y + this._moveOffset.y);
                    }
                }
            }else{                
                newPosX = this._clampX(newPosX);
                newPosY = this._clampY(newPosY);
            }

            if(this.touchEffect) { 
                if(this.scrollType == EScrollType.Both || this.scrollType == EScrollType.Horizontal) {
                    this._scrollTo(this._limitBounaryX(newPosX));
                }

                if(this.scrollType == EScrollType.Both || this.scrollType == EScrollType.Vertical) {
                    this._scrollTo(null, this._limitBounaryY(newPosY));
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

            this._syncScrollBar();
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
        ScrollPaneComponent._draggingPane = this;
  
        ScrollPaneComponent.sLastScrollPt.x = ScrollPaneComponent.sGlobalScrollStart.x = this._owner.scene.input.activePointer.worldX;
        ScrollPaneComponent.sLastScrollPt.y = ScrollPaneComponent.sGlobalScrollStart.y = this._owner.scene.input.activePointer.worldY;

        this.owner.emit(Events.ScrollEvent.START);
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
        let cx = this.owner.container.x;
        let cy = this.owner.container.y;

        let dx = Math.abs(this._endPos.x - cx);
        let dy = Math.abs(this._endPos.y - cy);
        
        let status = this._animationInfo.status;
        let t = Math.max(dx, dy) / this.scrollSpeed * 2 * 10;
        if(dx == 0 && dy == 0 || t < 10) {
            status = EScrollAnimStatus.NONE;
        }
        this._clearAnimation();

        if(status != EScrollAnimStatus.NONE) { 
            let time = MathUtils.clamp(t, 150, 250);
            let easing: any = Easing.Linear;            
            if(status == EScrollAnimStatus.INERTANCE) {
                easing = Easing.Bounce;
            }
            let tween = this._owner.scene.tweens.create({
                targets: {
                    x: cx,
                    y: cy,
                },
                ease: easing,
                props:{x: -this._endPos.x, y: -this._endPos.y},
                duration: time,
                onUpdate: (t, data)=>{
                    switch(status)
                    {
                        case EScrollAnimStatus.BOUNCE:
                            this._scrollTo(data.x, data.y);
                            break;
                        case EScrollAnimStatus.INERTANCE:
                        case EScrollAnimStatus.SLITHER:
                            this._posX = -this._clampX(data.x);
                            this._posY = -this._clampY(data.y);
                            this._scrollTo(data.x, data.y);
                            this.owner.emit(Events.ScrollEvent.SCROLLING);
                            break;                            
                    }                    
                    this._syncScrollBar();
                },
                onComplete: (t, targets)=>{
                    this._clearAnimation();

                    let data = targets[0];                
                    this._endPos.x = -this._clampX(data.x);
                    this._endPos.y = -this._clampY(data.y);
                    if(this._realBouncebackEffect && status == EScrollAnimStatus.INERTANCE) {        
                        if(this._isInOutPosition()) {
                            this._animationInfo.status = EScrollAnimStatus.BOUNCE;
                        }
                        this._doAnimation();
                    }else{          
                        ScrollPaneComponent._sStatus = EScrollStatus.SCROLL_END;
                        this._scrollEnd();
                        this._syncScrollBar();
                    }   
                }
            });
                
            this._animationInfo.tween = tween;
            tween.play();
        }else{
            ScrollPaneComponent._sStatus = EScrollStatus.SCROLL_END;
            this._scrollEnd();
            this._syncScrollBar();
        }
    }

    private _end(pointer: Pointer): void {
        if(this._pointerId !== pointer.pointerId) {
            return;
        }
        this._pointerId = -1;

        if(this.touchEffect && this.inertanceEffect && this._animationInfo.status == EScrollAnimStatus.NONE) {
            let dx = (pointer.worldX - ScrollPaneComponent.sLastScrollPt.x) / (this._overlapSize.x||1) * 10000;
            let dy = (pointer.worldY - ScrollPaneComponent.sLastScrollPt.y) / (this._overlapSize.y||1) * 10000;

            if(dx != 0 && this._overlapSize.x > 0 || dy != 0 && this._overlapSize.y > 0) {
                let canDo = false;
                let ax = Math.abs(this.owner.container.x);
                let ay = Math.abs(this.owner.container.y);
                if(ax < this._overlapSize.x && ax > 0 && this._overlapSize.x > 0) {
                    this._endPos.x = -this._clampX(this.owner.container.x + dx, 1.2, 0.2);
                    canDo = true;
                }

                if(ay < this._overlapSize.y && ay > 0 && this._overlapSize.y > 0) {
                    this._endPos.y = -this._clampY(this.owner.container.y + dy, 1.2, 0.2);
                    canDo = true;
                }

                if(canDo) {
                    if(!this._realBouncebackEffect) {
                        if(this.loop != 1) {
                            this._endPos.x = -MathUtils.clamp(-this._endPos.x, -this._overlapSize.x, 0);
                        }
                        if(this.loop != 2) {
                            this._endPos.y = -MathUtils.clamp(-this._endPos.y, -this._overlapSize.y, 0);
                        }
                    }
                    this._animationInfo.status = EScrollAnimStatus.INERTANCE;

                    this._endPos.x = -this._limitBounaryX(-this._endPos.x)
                    this._endPos.y = -this._limitBounaryX(-this._endPos.y)
                }
            }
        }

        if((this.touchEffect && this._realBouncebackEffect) && this._animationInfo.status == EScrollAnimStatus.NONE) {
            if(this._isInOutPosition()) {
                this._animationInfo.status = EScrollAnimStatus.BOUNCE;
            }
        } 

        if (ScrollPaneComponent.draggingPane == this) {
            this._reset();    
            if((this._realBouncebackEffect || this.inertanceEffect) && this._animationInfo.status != EScrollAnimStatus.NONE) {
                this._doAnimation();
            }else{
                this._scrollEnd();  
            }                    
        } else if(!ScrollPaneComponent.draggingPane) {
            this._scrollEnd();
        }
    }

    // 是否拉出边缘，从而引发弹性效果
    private _isInOutPosition(): boolean {
        if(this._pageMode) {
            return (this.loop == 1 || this._contentSize.x > this._pageSize.x) ||
                   (this.loop == 2 || this._contentSize.y > this._pageSize.y);
        }
        return this.loop != 1 && this._overlapSize.x > 0 && (this.owner.container.x > 0 || this.owner.container.x < -this._overlapSize.x) ||
               this.loop != 2 && this._overlapSize.y > 0 && (this.owner.container.y > 0 || this.owner.container.y < -this._overlapSize.y);
    }

    private _scrollEnd(): void {   
        if(ScrollPaneComponent._draggingPane == this) {   
            this._posX = -this._clampX(this.owner.container.x);
            this._posY = -this._clampY(this.owner.container.y);
            this._scrollTo(-this._posX, -this._posY);

            ScrollPaneComponent._draggingPane._reset();  
            ScrollPaneComponent._sStatus = EScrollStatus.NONE;
            ScrollPaneComponent._sScrollBeginCancelled = true;

            ScrollPaneComponent._draggingPane.owner.emit(Events.ScrollEvent.END);
            ScrollPaneComponent._draggingPane = null;
        }
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

     public get scrollingPosX(): number {
        return MathUtils.clamp(-this._group.container.x, 0, this._overlapSize.x);
    }

    public get scrollingPosY(): number {
        return MathUtils.clamp(-this._group.container.y, 0, this._overlapSize.y);
    }

    public scrollTop(ani?: boolean): void {
        this.setPercY(0, ani);
    }

    public scrollBottom(ani?: boolean): void {
        this.setPercY(1, ani);
    }

    public scrollUp(ratio?: number, ani?: boolean): void {
        ratio = ratio || 1;
        if (this._pageMode)
            this.setPosY(this._posY - this._pageSize.y * ratio, ani);
        else
            this.setPosY(this._posY - this.scrollSpeed * ratio, ani);;
    }

    public scrollDown(ratio?: number, ani?: boolean): void {
        ratio = ratio || 1;
        if (this._pageMode)
            this.setPosY(this._posY + this._pageSize.y * ratio, ani);
        else
            this.setPosY(this._posY + this.scrollSpeed * ratio, ani);
    }

    public scrollLeft(ratio?: number, ani?: boolean): void {
        ratio = ratio || 1;
        if (this._pageMode)
            this.setPosX(this._posX - this._pageSize.x * ratio, ani);
        else
            this.setPosX(this._posX - this.scrollSpeed * ratio, ani);
    }

    public scrollRight(ratio?: number, ani?: boolean): void {
        ratio = ratio || 1;
        if (this._pageMode)
            this.setPosX(this._posX + this._pageSize.x * ratio, ani);
        else
            this.setPosX(this._posX + this.scrollSpeed * ratio, ani);
    }

    private _columnGap() {
        return ((this.owner as any).columnGap || 0);
    }

    private _rowGap() {
        return ((this.owner as any).rowGap || 0);
    }

    public scrollToView(target: View | Rectangle, ani: boolean = false, snapToFirst: boolean = false): void {
        this.owner.ensureBoundsCorrect();
        // if (this._needRefresh)
        //     this._refresh();

        let rect: Rectangle = ScrollPaneComponent.sHelperRect;
        if (target instanceof View) {
            if (target.parent != this.owner) {
                target.parent.localToGlobalRect(target.x, target.y,
                    target.width, target.height, rect);
                rect = this.owner.globalToLocalRect(rect.x, rect.y,
                    rect.width, rect.height, rect);
            }
            else {
                rect.x = target.x;
                rect.y = target.y;
                if(this.loop == 1) {
                    if(this.owner.container2.list.indexOf(target.rootContainer) >= 0) {
                        let offset = this.owner.bounds.width + this._columnGap();
                        if(this.owner.container.y < 0) {
                            rect.x = target.x + offset;
                        }else{
                            rect.x = target.x - offset;
                        }
                    }
                }else if(this.loop == 2) {
                    if(this.owner.container2.list.indexOf(target.rootContainer) >= 0) {
                        let offset = this.owner.bounds.height + this._rowGap();
                        if(this.owner.container.y < 0) {
                            rect.y = target.y + offset;
                        }else{
                            rect.y = target.y - offset;
                        }
                    }
                }
                rect.width = target.width;
                rect.height = target.height;
            }
        }
        else {
            rect = target as Rectangle;
        }

        if (this._overlapSize.y > 0) {
            const bottom: number = this._posY + this._viewSize.y;
            if (snapToFirst || rect.y <= this._posY || rect.height >= this._viewSize.y) {
                if (this._pageMode) {
                    this.setPosY(Math.floor(rect.y / this._pageSize.y) * this._pageSize.y, ani);
                }else {
                    this.setPosY(rect.y, ani);
                }
            }
            else if (rect.y + rect.height > bottom) {
                if (this._pageMode) {
                    this.setPosY(Math.floor(rect.y / this._pageSize.y) * this._pageSize.y, ani);
                // }else if (rect.height <= this._viewSize.y / 2) {
                //     this.setPosY(rect.y + rect.height * 2 - this._viewSize.y, ani);
                }else{
                    this.setPosY(rect.y + rect.height - this._viewSize.y, ani);
                }
            }
        }

        if (this._overlapSize.x > 0) {
            let right: number = this._posX + this._viewSize.x;
            if (snapToFirst || rect.x <= this._posX || rect.width >= this._viewSize.x) {
                if (this._pageMode) {
                    this.setPosX(Math.floor(rect.x / this._pageSize.x) * this._pageSize.x, ani);
                }else{
                    this.setPosX(rect.x, ani);
                }
            }
            else if (rect.x + rect.width > right) {
                if (this._pageMode){
                    this.setPosX(Math.floor(rect.x / this._pageSize.x) * this._pageSize.x, ani);
                // }else if (rect.width <= this._viewSize.x / 2){
                //     this.setPosX(rect.x + rect.width * 2 - this._viewSize.x, ani);
                }else{
                    this.setPosX(rect.x + rect.width - this._viewSize.x, ani);
                }
            }
        }

        if (!ani) // && this._needRefresh)
            this._refresh();
    }

    public set displayOnLeft(val: boolean) {
        if(this._displayOnLeft != val) {
            this._displayOnLeft = val;
            this.updateScrollBar();
        }
    }

    public get displayOnLeft(): boolean {
        return this._displayOnLeft;
    }

    public set autoLayoutView(val: boolean) {
        if(this._autoLayoutView != val) {
            this._autoLayoutView = val;
            this.updateScrollBar();
        }
    }

    public get autoLayoutView(): boolean {
        return this._autoLayoutView;
    }

    public setSrollbar(hScrollBarRes: string, vScrollBarRes: string): this {
        if(this._vScrollBarRes != vScrollBarRes || this._hScrollBarRes != hScrollBarRes) {
            this._vScrollBarRes = vScrollBarRes;
            this._hScrollBarRes = hScrollBarRes;
            this._construct();
        }
        return this;
    }

    public get hScrollBarRes(): string {
        return this._hScrollBarRes;
    }

    public get vScrollBarRes(): string {
        return this._vScrollBarRes;
    }

    private _applyDisplayType() {        
        let display = this.scrollBarDisplay;
        if (display == EScrollBarDisplayType.Default) {
            display = Settings.defaultScrollBarDisplay;
        }
        this._realDisplayType = display;
    }
    private _construct() {
        this._applyDisplayType();

        this._scrollBarVisible = true;
        this._mouseWheelEnabled = true;

        if(this._realDisplayType != EScrollBarDisplayType.Hidden) {
            if(this._hScrollBar) {
                this._hScrollBar.dispose();
                this._hScrollBar = null;
            }
            let hRes = this._hScrollBarRes || Settings.horizontalScrollBar;
            if(hRes) {
                this._hScrollBar = Package.inst.createObjectFromUrl(this._owner.scene, hRes) as UIScrollBar;
                if(!this._hScrollBar) {
                    throw new Error(`Cannot create scrollbar from ${hRes}`);
                }
                this._hScrollBar.setScrollPane(this, false);
                this._owner.rootContainer.add(this._hScrollBar.rootContainer);
            }

            if(this._vScrollBar) {
                this._vScrollBar.dispose();
                this._vScrollBar = null;
            }
            let vRes = this._vScrollBarRes || Settings.verticalScrollBar;
            if(vRes) {
                this._vScrollBar = Package.inst.createObjectFromUrl(this._owner.scene, vRes) as UIScrollBar;
                if(!this._vScrollBar) {
                    throw new Error(`Cannot create scrollbar from ${vRes}`);
                }
                this._vScrollBar.setScrollPane(this, true);
                this._owner.rootContainer.add(this._vScrollBar.rootContainer);
            }
        }else{
            this._mouseWheelEnabled = false;
        }

        this.updateScrollBar();
    }

    public updateScrollBar() {
        this.setSize(this._owner.width, this._owner.height);
    }

    private _setSize(width: number, height: number) {
        if (this._hScrollBar) {
            this._hScrollBar.y = height - this._hScrollBar.height;
            if (this._vScrollBar && this._vScrollBar.rootContainer.visible) {
                this._hScrollBar.width = width - this._vScrollBar.width - this._scrollBarMargin.left - this._scrollBarMargin.right;
                if (this._displayOnLeft)
                    this._hScrollBar.x = this._scrollBarMargin.left + this._vScrollBar.width;
                else
                    this._hScrollBar.x = this._scrollBarMargin.left;
            }
            else {
                this._hScrollBar.width = width - this._scrollBarMargin.left - this._scrollBarMargin.right;
                this._hScrollBar.x = this._scrollBarMargin.left;
            }
        }
        if (this._vScrollBar) {
            if (!this._displayOnLeft)
                this._vScrollBar.x = width - this._vScrollBar.width;
            else
                this._vScrollBar.x = 0;
            if (this._hScrollBar && this._hScrollBar.rootContainer.visible)
                this._vScrollBar.height = height - this._hScrollBar.height - this._scrollBarMargin.top - this._scrollBarMargin.bottom;
            else
                this._vScrollBar.height = height - this._scrollBarMargin.top - this._scrollBarMargin.bottom;
            this._vScrollBar.y = this._scrollBarMargin.top;
        }
    } 

    public updateSize() {
        this._init(false);
    }

    public setSize(width: number, height: number): void {
        this._setSize(width, height);
        this._updateEventPreventBar(false);
        this._updateEventPreventBar(true);
        this._handleSizeChanged();
    }

    private _updateEventPreventBar(vertical: boolean) {
        let scrollBar = vertical ? this._vScrollBar : this._hScrollBar;
        let eventBar = vertical ? this._preventEventVBar : this._preventEventHBar;
        if(scrollBar) {
            if(!eventBar) {
                eventBar = this.owner.scene.makeUI.view();
                this.owner.rootContainer.addAt(eventBar.rootContainer, this.owner.rootContainer.getIndex(scrollBar.rootContainer));
                eventBar.on(Events.PointerEvent.DOWN, (sender:View, pointer: Pointer, lx: number, ly: number, event: EventData)=>{
                    event.stopPropagation();
                }, this);
            }
            eventBar.setXY(scrollBar.x, scrollBar.y);
            if(vertical) {
                eventBar.setSize(scrollBar.width, this.owner.height);
            }else{
                eventBar.setSize(this.owner.width, scrollBar.height);
            }
        }else if(eventBar) {
            eventBar.dispose();
            eventBar = null;
        }

        if(vertical) {
            this._preventEventVBar = eventBar;
        }else{
            this._preventEventHBar = eventBar;
        }
    }

    private _syncScrollBar(): void {
        let visible = true;
        switch(this._realDisplayType) {
            case EScrollBarDisplayType.Hidden:
                visible = false;
                break;
            case EScrollBarDisplayType.Auto:
                visible = this._mouseIn;
                break;
        }
        if (this._vScrollBar != null) {
            this._vScrollBar.scrollPerc = this._overlapSize.y == 0 ? 0 : MathUtils.clamp(-this.owner.container.y, 0, this._overlapSize.y) / this._overlapSize.y;
            this._showScrollBar(visible);
        }
        if (this._hScrollBar != null) {
            this._hScrollBar.scrollPerc = this._overlapSize.x == 0 ? 0 : MathUtils.clamp(-this.owner.container.x, 0, this._overlapSize.x) / this._overlapSize.x;
            this._showScrollBar(visible);
        }
    }

    private _showScrollBar(visible: boolean): void {
        if(this._scrollBarVisible == visible) {
            this._setSize(this.owner.width, this.owner.height);
            return;
        }
        this._scrollBarVisible = visible;

        if(this._showScrollBarTimer) {
            this._showScrollBarTimer.remove();
            this._showScrollBarTimer = null;
        }

        if (visible) {
            this._setScrollBarVisible(visible);
        }
        else {
            this._showScrollBarTimer = this.owner.scene.time.addEvent({
                delay: 500,
                callback: ()=>{
                    this._setScrollBarVisible(visible);
                }
            })
        }
    }

    private _setScrollBarVisible(visible: boolean): void {
        this._scrollBarVisible = visible && this._viewSize.x > 0 && this._viewSize.y > 0;
        let vCanShow = this._needShowVScrollBar();
        let hCanShow = this._needShowHScrollBar();
        if (this._vScrollBar)
            this._vScrollBar.rootContainer.visible = vCanShow && this._scrollBarVisible && this._vScrollVisble;
        if (this._hScrollBar)
            this._hScrollBar.rootContainer.visible = hCanShow && this._scrollBarVisible && this._hScrollVisble;

        this._setSize(this._owner.width, this._owner.height);
    }

    public get currentPageX(): number {
        if (!this._pageMode)
            return 0;

        var page: number = Math.floor(this._posX / this._pageSize.x);
        if (this._posX - page * this._pageSize.x > this._pageSize.x * 0.5)
            page++;

        return page;
    }

    public set currentPageX(value: number) {
        if (this._pageMode && this._overlapSize.x > 0)
            this.setPosX(value * this._pageSize.x, false);
    }

    public get currentPageY(): number {
        if (!this._pageMode)
            return 0;

        let page: number = Math.floor(this._posY / this._pageSize.y);
        if (this._posY - page * this._pageSize.y > this._pageSize.y * 0.5)
            page++;

        return page;
    }

    public set currentPageY(value: number) {
        if (this._pageMode && this._overlapSize.y > 0)
            this.setPosY(value * this._pageSize.y, false);
    }

    public get isBottomMost(): boolean {
        return this._posY == this._overlapSize.y || this._overlapSize.y == 0;
    }

    public get isRightMost(): boolean {
        return this._posX == this._overlapSize.x || this._overlapSize.x == 0;
    }
}

export type ScrollPane = ScrollPaneComponent;
ComponentFactory.regist(ScrollPaneComponent);