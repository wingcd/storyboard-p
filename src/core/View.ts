import "reflect-metadata";

import { EDirtyType, EOverflowType } from "./Defines";
import { clonable } from "../annotations/Clonable";
import { Point, Container, Scene, GameObject, Graphics, Rectangle, Sprite, Texture, Vector2 } from "../phaser";
import { ViewGroup } from "./ViewGroup";
import { Settings } from "./Setting";
import { PoolManager } from "../utils/PoolManager";
import * as Events from '../events';
import { ViewEvent } from "../events/ViewEvent";
import { ViewRoot } from "./ViewRoot";

export class View {
    static sInstanceCounter: number = 0;

    @clonable()
    public data: any;

    private _id: string;
    private _name: string = "";
    protected _root: ViewRoot = null;

    @clonable()
    private _visible: boolean = true;
    private _internalVisible: boolean = true;
    @clonable()
    private _hiddenCollapsed: boolean = false;
    @clonable()
    protected _x: number = 0; 
    @clonable()   
    protected _y: number = 0;    
    @clonable()
    protected _width: number = 100;
    @clonable()
    protected _height: number = 100;  
    @clonable()
    protected _scaleX: number = 1;
    @clonable()
    protected _scaleY: number = 1;
    @clonable()
    protected _angle: number = 0;
    @clonable()
    protected _pivot: Point = new Point();
    protected _pivotOffset: Point = new Point();
    @clonable()
    protected _pivotAsAnchor: boolean = false;
    
    /**@internal */
    _parent: ViewGroup = null;
    private _dirtyType: EDirtyType = EDirtyType.None; 
    private _isDisposed: boolean = false;

    protected _scene: Scene;
    protected _rootContainer: Container;
    private _displayObject: GameObject;

    @clonable()
    protected _useBorderAsFrame: boolean = true;
    @clonable()
    protected _focusable: boolean = false;
    @clonable()
    protected _touchable: boolean = true;    
    /** enable trigger when touch point moved */
    @clonable()
    public touchEnableMoved: boolean = true;
    @clonable()
    protected _draggable: boolean = false;
    @clonable()
    protected _opaque: boolean = false;
    @clonable()
    protected _enableBackground: boolean = false;
    @clonable()
    protected _backgroundColor: number = 0xffffff;
    protected _gBackground: Graphics = null;

    protected _frame: Rectangle = new Rectangle(0, 0, 100, 100);
    protected _border: Rectangle = new Rectangle(0, 0, 100, 100);
    private _hitArea: Rectangle = null;
    /**debug */
    private _gBorder: Graphics;
    private _gFrame: Graphics;

    /**@internal */
    _rawWidth: number = 100;
    /**@internal */
    _rawHeight: number = 100;
    /**@internal */
    _initWidth: number = 0;
    /**@internal */
    _initHeight: number = 0;
    /**@internal */
    _sourceWidth: number = 0;
    /**@internal */
    _sourceHeight: number = 0;

    constructor() {
        this._id = `${View.sInstanceCounter++}`;
        this.addDirty(EDirtyType.DebugBoundsChanged | EDirtyType.DebugFrameChanged | EDirtyType.DebugBorderChanged);
    }

    /**@internal */
    bind(scene: Scene): boolean {
        if(!this._scene) {
            this._scene = scene;

            this._rootContainer = scene.make.container({}, false);
            (this._rootContainer as any).owner = this;

            this.createDisplayObject();
            return true;
        }
        return false;
    }

    createDisplayObject(): void {

    }

    setDisplayObject(display: GameObject) {
        if(this._displayObject) {
            this._rootContainer.remove(this._displayObject);
        }
        this._displayObject = display;
        this._rootContainer.add(display);
    }

    /**@internal */
    setRoot(root: ViewRoot) {
        this._root = root;
    }

    public get scene(): Scene {
        return this._scene;
    }

    protected get dirty(): boolean {
        return this._dirtyType != EDirtyType.None;
    }

    protected clearDirty() {
        let dirty = EDirtyType.None;
        if(this.withDirty(EDirtyType.DebugBoundsChanged)) {
            dirty |= EDirtyType.DebugBoundsChanged;
        }
        if(this.withDirty(EDirtyType.DebugFrameChanged)) {
            dirty |= EDirtyType.DebugFrameChanged;
        }
        if(this.withDirty(EDirtyType.DebugBorderChanged)) {
            dirty |= EDirtyType.DebugBorderChanged;
        }
        this._dirtyType = dirty;
    }

    protected addDirty(dirty: EDirtyType) {
        this._dirtyType |= dirty;

        if((dirty & EDirtyType.FrameChanged) == EDirtyType.FrameChanged) {
            this._dirtyType |= EDirtyType.DebugFrameChanged;
        } 
        if((dirty & EDirtyType.BorderChanged) == EDirtyType.BorderChanged) {
            this._dirtyType |= EDirtyType.DebugBorderChanged;
        }
        if((dirty & EDirtyType.BoundsChanged) == EDirtyType.BoundsChanged) {
            this._dirtyType |= EDirtyType.DebugBoundsChanged;
        }
    }    

    protected removeDirty(dirty: EDirtyType) {
        this._dirtyType ^= dirty;
    }

    protected withDirty(dirty: EDirtyType): boolean {
        return (dirty&this._dirtyType) != EDirtyType.None;
    }

    public get visible(): boolean {
        return this._visible;
    }

    public set visible(val: boolean) {
        if(this._visible != val) {
            this._visible = val;
            this._rootContainer.visible = val;

            if(this._parent) {
                this._parent.childStateChanged(this);
                
                if(this.hiddenCollapsed) {
                    this._parent.addDirty(EDirtyType.BoundsChanged);
                }
            }

            this.emit(Events.DisplayObjectEvent.VISIBLE_CHANGED, this._visible);
        }
    }

    /**@internal */
    get internalVisible(): boolean {
        return this._internalVisible;
    }
    
    /**@internal */
    set internalVisible(val: boolean) {
        if(val != this._internalVisible) {
            this._internalVisible = val;

            if(this._parent) {
                this._parent.childStateChanged(this);
            }
        }
    }

    public get finalVisible() {
        return this._visible && this._internalVisible;
    }

    public removeFromParent() {
        if(this._parent) {
            this._parent.removeChild(this);

            if(this._gFrame && this._gFrame.parentContainer) {
                this._gFrame.parentContainer.remove(this._gFrame);
            }
        }
    }
    
    /**
     * real border of this object
     */
    public get frame(): Rectangle {
        this.checkDirty();
        return this._frame;
    }

    public get parent(): ViewGroup {
        return this._parent;
    }

    public set parent(parent: ViewGroup) {
        if(this._parent != parent) {
            this.removeFromParent();       
            let oldParent = this._parent;
            this._parent = parent;
            if(parent) {
                this.setRoot(parent._root);
            }
            this.emit(ViewEvent.PARENT_CHANGED, oldParent, parent);
        }
    }

    public get x(): number {
        return this._x;
    }

    public set x(val: number) {
        this.setXY(val, this._y);
    }

    public get y(): number {
        return this._y;
    }

    public set y(val: number) {
        this.setXY(this._x, val);
    }

    protected handleXYChanged() {
        let xv: number = this._x;
        let yv: number = this._y;
        if (this._pivotAsAnchor) {
            xv -= this._pivot.x * this._width;
            yv -= this._pivot.y * this._height;
        }

        this._rootContainer.setPosition(xv + this._pivotOffset.x, yv + this._pivotOffset.y);
    }

    public setXY(xv: number, yv:number) {
        if(this.x != xv || this.y != yv) {
            let oldX = this._x;
            let oldY = this._y;

            this._x = xv;
            this._y = yv;
        
            this.handleXYChanged();     
            this.handleBorderChange();    

            this.addDirty(EDirtyType.FrameChanged | EDirtyType.BorderChanged);
            if(this.parent) {
                this.parent.addDirty(EDirtyType.BoundsChanged);
            }

            this.emit(Events.DisplayObjectEvent.XY_CHANGED, oldX, oldY, xv, yv);
        }
    }

    public get scaleX(): number {
        return this._scaleX;
    }

    public set scaleX(val: number) {
        this.setScale(val, this._scaleY);
    }

    public get scaleY(): number {
        return this._scaleY;
    }

    public set scaleY(val: number) {
        this.setScale(this._scaleX, val);
    }

    public setScale(sx: number, sy: number) {
        if(this.scaleX != sx || this.scaleY != sy) {
            this._scaleX = sx;
            this._scaleY = sy;

            this._rootContainer.setScale(sx, sy);
            this._applyPivot();

            this.addDirty(EDirtyType.FrameChanged);
            if(this._parent) {
                this._parent.addDirty(EDirtyType.BoundsChanged);
            }
        }
    }

    public setSize(wv: number, hv: number, ignorePivot?: boolean) {
        if(this._rawWidth != wv || this._rawHeight != hv) {
            this._rawWidth = wv;
            this._rawHeight = hv;

            wv = Math.max(0, wv);
            hv = Math.max(0, hv);

            let diffw: number = wv - this._width;
            let diffh: number = hv - this._height;
            
            let oldWidth = this._width;
            let oldHeight = this._height;
            this._width = wv;
            this._height = hv;

            if (this._pivot.x != 0 || this._pivot.y != 0) {
                if (!this._pivotAsAnchor) {
                    if(!ignorePivot) {
                        this.setXY(this.x - this._pivot.x * diffw, this.y - this._pivot.y * diffh);    
                    }                    
                    this.updatePivotOffset();
                }
                else {
                    this._applyPivot();
                }
            }  
            this.handleBorderChange();

            this.addDirty(EDirtyType.FrameChanged | EDirtyType.BorderChanged);
            if(this._parent) {
                this._parent.addDirty(EDirtyType.BoundsChanged);
            }

            this.emit(Events.DisplayObjectEvent.SIZE_CHANGED, null, new Point(oldWidth, oldHeight));
        }
    }

    protected updatePivotOffset() {
        // translate object after rotate by pivot point(align pivot to rotate pivot)
        if((this.pivotX == 0 && this.pivotY == 0) || !this.rootContainer.localTransform) {
            this._pivotOffset.setTo(0, 0);
        }else{        
            //old pivot    
            let dx = this._width * this.pivotX;
            let dy = this._height * this.pivotY;

            // this.rootContainer.transform.updateLocalTransform();
            let pos = PoolManager.inst.get(Point) as Point;
            pos.setTo(dx, dy);
            let trans = this.rootContainer.localTransform;
            //offset = (new poivt - old poivt)
            trans.transformPoint(pos.x, pos.y, pos);
            //new pivot
            pos.x -= trans.tx;
            pos.y -= trans.ty;
            this._pivotOffset.setTo(dx - pos.x, dy - pos.y);
            PoolManager.inst.put(pos);
        }
    }

    public get width(): number {
        this.ensureSizeCorrect();
        return this._width;
    }

    public set width(val: number) {
        this.setSize(val, this._height);
    }

    public get height(): number {        
        this.ensureSizeCorrect();
        return this._height;
    }

    public set height(val: number) {
        this.setSize(this._width, val);
    }

    public get sourceHeight(): number {
        return this._sourceHeight;
    }

    public get sourceWidth(): number {
        return this._sourceWidth;
    }

    public get initHeight(): number {
        return this._initHeight;
    }

    public get initWidth(): number {
        return this._initWidth;
    }

    public get actualWidth(): number {
        return this._width * Math.abs(this._scaleX);
    }

    public get actualHeight(): number {
        return this._height * Math.abs(this._scaleY);
    } 

    public get pivotX(): number {
        return this._pivot.x;
    }

    public set pivotX(val: number) {
        this.setPivot(val, this._pivot.y, this._pivotAsAnchor);
    }

    public get pivotY(): number {
        return this._pivot.y;
    }

    public set pivotY(val: number) {
        this.setPivot(this._pivot.x, val, this._pivotAsAnchor);
    }

    public get pivotAsAnchor(): boolean {
        return this._pivotAsAnchor;
    }

    public set pivotAsAnchor(val: boolean) {
        this.setPivot(this._pivot.x, this._pivot.y, val);
    }

    private _applyPivot(): void {
        if (this._pivot.x != 0 || this._pivot.y != 0) {
            this.updatePivotOffset();
            this.handleXYChanged();
        }
    }

    public setPivot(vx: number, vy:number, pivtoAsAnchor: boolean = false) {
        if(this._pivot.x != vx || this._pivot.y != vy || this._pivotAsAnchor != pivtoAsAnchor) {            
            this._pivot.setTo(vx, vy);
            this._pivotAsAnchor = pivtoAsAnchor;

            this._applyPivot();
            this.handleBorderChange();

            this.addDirty(EDirtyType.FrameChanged);
            if(this._parent) {
                this._parent.addDirty(EDirtyType.BoundsChanged);
            }
        }
    }

    public get inContainer(): boolean {
        return this._rootContainer.parentContainer != null;
    }

    protected updateBorder() {
        // if(this._overflowType == EOverflowType.Hidden) {
        //     this._updateRootMask();
        // }
    }

    protected updateFrame() {
        if(this._angle == 0 || this._useBorderAsFrame) {
            let width = this.actualWidth;
            let height = this.actualHeight;
            if(this._pivotAsAnchor) {
                this._frame.x = this._x - this.pivotX * width;
                this._frame.y = this._y - this.pivotY * height;
            }else{
                this._frame.x = this._x;
                this._frame.y = this._y;
            }
            this._frame.width = width;
            this._frame.height = height;
        }else{
            let minx = Number.POSITIVE_INFINITY, 
                miny = Number.POSITIVE_INFINITY, 
                maxx = Number.NEGATIVE_INFINITY, 
                maxy = Number.NEGATIVE_INFINITY; 

            let xx = [];
            let yy = [];

            let trans = this._rootContainer.localTransform;            
            let pos = PoolManager.inst.get(Point) as Point;
            pos.setTo(0, 0);
            trans.transformPoint(pos.x, pos.y, pos);
            xx.push(pos.x);
            yy.push(pos.y);

            pos.setTo(this._width, 0);
            trans.transformPoint(pos.x, pos.y, pos);
            xx.push(pos.x);
            yy.push(pos.y);

            pos.setTo(this._width, this._height);
            trans.transformPoint(pos.x, pos.y, pos);
            xx.push(pos.x);
            yy.push(pos.y);

            pos.setTo(0, this._height);
            trans.transformPoint(pos.x, pos.y, pos);
            xx.push(pos.x);
            yy.push(pos.y);

            for(let i=0; i<4; i++) {
                minx = Math.min(minx, xx[i]);
                miny = Math.min(miny, yy[i]);
                maxx = Math.max(maxx, xx[i]);
                maxy = Math.max(maxy, yy[i]);
            }

            this._frame.x = minx;
            this._frame.y = miny;
            this._frame.width = maxx - minx;
            this._frame.height = maxy - miny;
        }

        this.removeDirty(EDirtyType.FrameChanged);
    }

    protected checkDirty() {
        if(this.withDirty(EDirtyType.FrameChanged)) {
            this.updateFrame();
        }
        if(this.withDirty(EDirtyType.BorderChanged)) {
            this.updateBorder();
        }

        this.clearDirty();
    }

    private showFrame() {     
        if(!Settings.showDebugFrame) {
            if(this._gFrame) {
                this._gFrame.destroy();
                this._gFrame = null;
            }
            return;
        }
        
        if(!this.withDirty(EDirtyType.DebugFrameChanged)){
            return;
        }

        if(this._scaleX == 0 || this._scaleY == 0) {
            return;
        }

        if(this._rootContainer.parentContainer) {
            if(!this._gFrame) {
                this._gFrame = this._scene.make.graphics({}, false);
                this._rootContainer.parentContainer.add(this._gFrame);
            }

            if(this._rootContainer.parentContainer != this._gFrame.parentContainer) {
                this._rootContainer.parentContainer.add(this._gFrame);
            }

            this._gFrame.clear();
            let rect = this.frame;
            this._gFrame.lineStyle(2/Math.min(this._scaleX, this._scaleY), 0xffff00, 1);
            this._gFrame.strokeRect(rect.x, rect.y, rect.width, rect.height);
            
            this.removeDirty(EDirtyType.DebugFrameChanged);
        }
    }

    private showBorder() {
        if(!Settings.showDebugBorder) {
            if(this._gBorder) {
                this._gBorder.destroy();
                this._gBorder = null;
            }
            return;
        }

        if(!this._gBorder) {
            this._gBorder = this._scene.make.graphics({}, false);
            this._rootContainer.add(this._gBorder);
        } 
        
        if(!this.withDirty(EDirtyType.DebugBorderChanged)){
            return;
        }   

        this._gBorder.clear();
        
        if(this._scaleX == 0 || this._scaleY == 0) {
            return;
        }

        this._gBorder.lineStyle(2/Math.min(this._scaleX, this._scaleY), 0xff0000, 1);
        this._gBorder.strokeRect(1, 1, this._width-2, this._height-2);
         
        this.removeDirty(EDirtyType.DebugBorderChanged);      
    }

    public onGizmos() {
        if(this.finalVisible) {
            this.showBorder();
            this.showFrame();
        }
    }

    /**@internal */
    onUpdate(time: number, delta: number) {
        let self = this as any;
        if(this.finalVisible && self.update && self.update instanceof Function) {
            self.update(time, delta);
        }

        // if(this._components) {
        //     this._components.forEach(comp=>{
        //         let thisComp = comp as any;
        //         if(comp.enable && thisComp.update) {
        //             thisComp.update(time, delta);
        //         }
        //     });
        // }
    }

    /**@internal */
    _clear() {
        if(this._gFrame) {
            this._gFrame.destroy();
            this._gFrame = null;
        }
    }

    public reset() {              
        this._isDisposed = false;
    }

    public dispose(toPool?: boolean) {
        this.parent = null;
        this._isDisposed = true;

        this._clear();

        // if(toPool) {
        //     PoolManager.inst.put(this);
        //     return;
        // }    

        this._rootContainer.destroy();
        this._rootContainer = null;
    }

    /**@internal */
    get rootContainer(): Container {
        return this._rootContainer;
    }

    public get hiddenCollapsed(): boolean {
        return this._hiddenCollapsed;
    }

    public set hiddenCollapsed(value: boolean) {
        if(this._hiddenCollapsed != value) {
            this._hiddenCollapsed = value;

            if(!this.finalVisible && this._parent) {
                this._parent.addDirty(EDirtyType.BoundsChanged);
            }
        }
    }

    public ensureSizeCorrect() {
        
    }

    public on(type: string, listener: Function, thisObject?: any): this {
        if (type == null) return this;
        this._rootContainer.on(type, listener, thisObject);
        return this;
    }

    public off(type: string, listener: Function, thisObject?: any): this {
        if (type == null) {
            return this;
        }
        this._rootContainer.off(type, listener, thisObject);
        return this;
    }

    public once(type: string, listener: Function, thisObject?: any): this {
        if (type == null) return this;
        this._rootContainer.once(type, listener, thisObject);
        return this;
    }

    public hasListener(event: string, handler?:Function): boolean {
        if(!handler)
            return this._rootContainer.listeners(event).length > 0;
        else
            return this._rootContainer.listeners(event).indexOf(handler) >= 0;
    }

    public emit(event: string, ...args: any[]): boolean {
        return this._rootContainer.emit.call(this._rootContainer, event, args);
    }

    public removeAllListeners(type?:string):void {
        this._rootContainer.removeAllListeners(type);
    }

    public get enableBackground(): boolean {
        return this._enableBackground;
    }

    public set enableBackground(val: boolean) {
        if(this._enableBackground != val) {
            this._enableBackground = val;
            this.applyBackgroundChange();
            this.applyOpaque();
        }
    }

    public get backgroundColor(): number {
        return this._backgroundColor;
    }

    public set backgroundColor(val: number) {
        this.setBackgroundColor(val, this._enableBackground);
    }

    public setBackgroundColor(color: number, enable: boolean = true) {
        if(this._backgroundColor != color || this._enableBackground != enable) {
            this._enableBackground = enable;
            this._backgroundColor = color;
            this.applyBackgroundChange();
            this.applyOpaque();
        }
    }

    /**
     * @description if enable touch in empty area, default is false
     */
    public get opaque(): boolean {
        return this._opaque;
    }

    public set opaque(value: boolean) {
        if (this._opaque != value) {
            this._opaque = value;
            this.applyOpaque();
        }
    }

    protected applyOpaque() {
        if(!this._opaque && !this._enableBackground) {
            if(this._hitArea) {
                this._hitArea.setSize(0, 0);
            }
            return;
        }

        if (!this._hitArea) {
            this._hitArea = PoolManager.inst.get(Rectangle) as Rectangle;
            this._rootContainer.setInteractive(this._hitArea, Rectangle.Contains);
        }

        let h: Rectangle = this._hitArea;
        h.x = h.y = 0;
        h.width = this.width;
        h.height = this.height;
    } 

    protected handleBorderChange() {
        this.applyBackgroundChange();
        this.applyOpaque();
    }

    protected applyBackgroundChange() {
        if(this._enableBackground) {
            if(!this._gBackground) {
                this._gBackground = this._scene.make.graphics({}, false);
                this._rootContainer.addAt(this._gBackground, 0);
            }
            this._gBackground.clear();
            this._gBackground.fillStyle(this._backgroundColor, 1);
            this._gBackground.fillRect(0, 0, this._width, this._height);
        }else if(this._gBackground){
            this._gBackground.destroy();
            this._gBackground = null;
        }
    }

    public localToGlobal(ax: number = 0, ay: number = 0, resultPoint?: Point): Point {
        if (this._pivotAsAnchor) {
            ax += this._pivot.x * this._width;
            ay += this._pivot.y * this._height;
        }
        if (!resultPoint) {
            resultPoint = PoolManager.inst.get(Point) as Point;
        }
        this._rootContainer.getWorldTransformMatrix().transformPoint(ax, ay, resultPoint);
        return resultPoint;
    }

    public globalToLocal(ax: number = 0, ay: number = 0, resultPoint?: Point): Point {
        if (!resultPoint) {
            resultPoint = PoolManager.inst.get(Point) as Point;
        }
        this._rootContainer.getWorldTransformMatrix().invert().transformPoint(ax, ay, resultPoint);
        if (this._pivotAsAnchor) {
            resultPoint.x -= this._pivot.x * this._width;
            resultPoint.y -= this._pivot.y * this._height;
        }
        return resultPoint;
    }

    public localToGlobalRect(ax: number = 0, ay: number = 0, aWidth: number = 0, aHeight: number = 0, resultRect?: Rectangle): Rectangle {
        if (resultRect == null) {
            resultRect = PoolManager.inst.get(Rectangle) as Rectangle;
        }

        let pt: Point = this.localToGlobal(ax, ay);
        resultRect.x = pt.x;
        resultRect.y = pt.y;
        resultRect.width = aWidth;
        resultRect.height = aHeight;
        return resultRect;
    }

    public globalToLocalRect(ax: number = 0, ay: number = 0, aWidth: number = 0, aHeight: number = 0, resultRect?: Rectangle): Rectangle {
        if (resultRect == null) {
            resultRect = PoolManager.inst.get(Rectangle) as Rectangle;
        }

        let pt: Point = this.globalToLocal(ax, ay);
        resultRect.x = pt.x;
        resultRect.y = pt.y;
        resultRect.width = aWidth;
        resultRect.height = aHeight;
        return resultRect;
    }  

    /**
     * local point to browers dom position
     * @param ax 
     * @param ay 
     * @param resultPoint 
     */
    public localToDOM(ax: number = 0, ay: number = 0, resultPoint?: Point): Point {
        if (!resultPoint) {
            resultPoint = PoolManager.inst.get(Point) as Point;
        }

        resultPoint = this.localToGlobal(ax, ay, resultPoint);
        let scaleMgr = this._scene.scale as any;
        scaleMgr.invertTransformXY(resultPoint.x, resultPoint.y, resultPoint);

        return resultPoint;
    }

    /**
     * dom position to local point
     * @param ax 
     * @param ay 
     * @param resultPoint 
     */
    public domToLocal(ax: number = 0, ay: number = 0, resultPoint?: Point): Point {
        if (!resultPoint) {
            resultPoint = PoolManager.inst.get(Point) as Point;
        }

        resultPoint = this.globalToLocal(ax, ay, resultPoint);
        let scaleMgr = this._scene.scale as any;
        scaleMgr.transformXY(resultPoint.x, resultPoint.y, resultPoint);

        return resultPoint;
    }

    public localToDOMRect(ax: number = 0, ay: number = 0, aWidth: number = 0, aHeight: number = 0, resultRect?: Rectangle): Rectangle {
        if (resultRect == null) {
            resultRect = PoolManager.inst.get(Rectangle) as Rectangle;
        }

        let pt: Point = new Point();
        this.localToDOM(ax, ay, pt);
        resultRect.x = pt.x;
        resultRect.y = pt.y;

        let pt1: Point = new Point();
        this.localToDOM(ax + aWidth, ay + aHeight, pt1);  
        resultRect.width = Math.abs(pt1.x - pt.x);
        resultRect.height = Math.abs(pt1.y - pt.y);
        return resultRect;
    }

    public domToLocalRect(ax: number = 0, ay: number = 0, aWidth: number = 0, aHeight: number = 0, resultRect?: Rectangle): Rectangle {
        if (resultRect == null) {
            resultRect = PoolManager.inst.get(Rectangle) as Rectangle;
        }

        let pt: Point = new Point();
        this.domToLocal(ax, ay, pt);
        resultRect.x = pt.x;
        resultRect.y = pt.y;

        let pt1: Point = new Point();
        this.domToLocal(ax + aWidth, ay + aHeight, pt1);  
        resultRect.width = Math.abs(pt1.x - pt.x);
        resultRect.height = Math.abs(pt1.y - pt.y);

        return resultRect;
    }
}