import "reflect-metadata";

import { EDirtyType, ECategoryType } from "./Defines";
import { Point, Container, GameObject, Graphics, Rectangle, GeometryMask, MaskType, BitmapMask, EventEmitter, Pointer } from "../phaser";
import { Settings } from "./Setting";
import { PoolManager } from "../utils/PoolManager";
import * as Events from '../events';
import { DisplayObjectEvent } from "../events";
import { BaseComponent } from "../components/BaseComponent";
import { ViewScene } from "./ViewScene";
import { DragComponent } from "../components/DragComponent";
import { ComponentFactory } from "../components/ComponentFactory";
import { Relations } from "./Relations";
import { IExtendsValue, ISerializeInfo } from "../types";
import { Serialize, Deserialize } from "../utils/Serialize";
import { colorMultiply } from "../utils/Color";
import { ViewGroup } from "./ViewGroup";
import { ViewRoot } from "./ViewRoot";
import { Package } from "./Package";
import { Templates } from "./Templates";
import { PropertyComponent } from "../components/PropertyComponent";
import { AnimationComponent } from "../components/AnimationComponent";
import { IView, IComponent, IComponentOptions } from "../types";

export class View implements IView{
    static CATEGORY = ECategoryType.UI;
    static TYPE = "view";

    static get EXTENDS_SERIALIZABLE_FIELDS(): IExtendsValue {
        return null;
    }

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = [];
        fields.push(
            {property: "CATEGORY", alias: "__category__", static: true, readonly: true},
            {property: "TYPE", alias: "type", static: true, readonly: true},
            {property: "data",default: null},
            {property: "resourceUrl", default: null},
            {property: "id",importAs: "_id"},
            {property: "name",importAs: "_name",default: ""},
            {property: "visible",importAs: "_visible",default: true},
            {property: "hiddenCollapsed",importAs: "_hiddenCollapsed", default: false},
            {property: "x",importAs: "_x",default: 0},
            {property: "y",importAs: "_y",default: 0},
            {property: "width",importAs: "_width",alias: "w",default: 100},
            {property: "height",importAs: "_height",alias: "h",default: 100},
            {property: "scaleX",importAs: "_scaleX",alias: "sx",default: 1},
            {property: "scaleY",importAs: "_scaleY",alias: "sy",default: 1},
            {property: "angle",importAs: "_angle",default: 0},
            {property: "pivotX",importAs: "_pivot.x",alias: "px",default: 0},
            {property: "pivotY",importAs: "_pivot.y", alias: "py",default: 0},
            {property: "pivotAsAnchor",importAs: "_pivotAsAnchor",alias: "asAnchor",default: false},
            {property: "useBorderAsFrame",importAs: "_useBorderAsFrame",alias: "asFrame",default: true},
            {property: "focusable",importAs: "_focusable",default: false},
            {property: "touchable",importAs: "_touchable",default: true},
            {property: "touchEnableMoved",default: true},
            {property: "draggable",importAs: "_draggable",default: false},
            {property: "enableBackground",importAs: "_enableBackground",default: false},
            {property: "backgroundColor",importAs: "_backgroundColor",default: 0xffffff},            
            {property: "alpha", importAs: "_alpha", default: 1},         
            {property: "tint", importAs: "_tint", default: 0xffffff},            
            {property: "grayed", importAs: "_grayed", default: false},
            {property: "_components", alias: "components", type: BaseComponent, priority: 999},          
            {property: "_relations", alias: "relations", type: Relations, priority: 999},
        );
        return fields;
    }

    static DESERIALIZE(config: any, target: View, configProp: string, targetProp: string, tpl: any, index?: number) {
        return [target.scene.makeUI.create(config, tpl), false];
    }

    static DESERIALIZE_FIELD_START(config: any, target: View, configProp: string, targetProp: string, tpl: any): boolean {
        return true;
    }

    static DESERIALIZE_FIELD_END(config: any, target: View, configProp: string, targetProp: string, tpl: any) {
        
    }

    static SERIALIZE_COMPLETED(source: any, target: any, tpl: any) {
        
    }

    protected static sHelperPoint: Point = new Point();
    protected static sHelperRect: Rectangle = new Rectangle();

    protected constructFromJson(config: any, tpl?:any) {
        this.reconstruct();
        this._inBuilding = false;
    }

    public data: any;    
    public resourceUrl: string;

    private _id: string;
    private _name: string = "";

    private _visible: boolean = true;
    private _internalVisible: boolean = true;
    private _hiddenCollapsed: boolean = false;
    private _x: number = 0; 
    private _y: number = 0;    
    private _width: number = 100;
    private _height: number = 100;  
    private _scaleX: number = 1;
    private _scaleY: number = 1;
    private _angle: number = 0;
    private _pivot: Point = new Point();
    private _pivotOffset: Point = new Point();
    private _pivotAsAnchor: boolean = false;
    private _grayed: boolean = false;
    
    private _parent: ViewGroup = null;
    private _dirtyType: EDirtyType = EDirtyType.None; 
    private _isDisposed: boolean = false;
    
    private _root: ViewRoot = null;
    private _scene: ViewScene;
    private _rootContainer: Container;
    private _displayObject: GameObject;

    private _useBorderAsFrame: boolean = true;
    private _focusable: boolean = false;
    private _touchable: boolean = true;    
    private _draggable: boolean = false;
    private _enableBackground: boolean = false;
    private _backgroundColor: number = 0xffffff;   
    private _tint: number = 0xffffff;
    private _alpha: number = 1;
    private _gBackground: Graphics = null;
    private _relations: Relations;
    
    /** enable trigger when touch point moved */
    public touchEnableMoved: boolean = true;

    private _frame: Rectangle = new Rectangle(0, 0, 100, 100);
    private _border: Rectangle = new Rectangle(0, 0, 100, 100);
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

    private _components: IComponent[];
    
    private _dragComponent: DragComponent;
    private _propertyComponent: PropertyComponent;
    private _animationComponent: AnimationComponent;

    private _batchAddComponents = false;
    // in json building view
    private _inBuilding = false;

    constructor(scene: ViewScene) {
        this._id = `${Package.getUniqueID()}`;
        this._name = `n${this._id}`;

        this.addDirty(EDirtyType.DebugBoundsChanged | EDirtyType.DebugFrameChanged | EDirtyType.DebugBorderChanged);
        this.bind(scene);
    }

    /**@internal */
    protected bind(scene: ViewScene): boolean {
        if(!this._scene) {
            this._scene = scene;

            this._rootContainer = scene.make.container({}, false);
            (this._rootContainer as any).owner = this;
 
            this._relations = new Relations().setOwner(this);
            return true;
        }
        return false;
    }

    protected setDisplayObject(display: GameObject) {
        if(this._displayObject) {
            this._rootContainer.remove(this._displayObject);
        }
        this._displayObject = display;
        if(display) {
            this._rootContainer.add(display);
        }
    }

    /**@internal */
    setRoot(root: ViewRoot): this {
        this._root = root;
        return this;
    }

    /**@internal */
    clearParent() {
        this._parent = null;
        if(this._rootContainer.parentContainer) {
            this._rootContainer.parentContainer.remove(this._rootContainer);
        }
        this.onParentChanged();
    }

    protected get realTouchable(): boolean {
        return this._touchable && (this._parent && this._parent.realTouchable || !this._parent);
    }

    protected onParentChanged() {
        if(this._parent) {            
            this.handleGrayedChanged(this._parent.grayed);
        }else{
            this.handleGrayedChanged();
        }
        this.applyHitArea();
    }

    public get root(): ViewRoot {
        return this._root;
    }

    public get onStage(): boolean {
        return this._root != null;
    }

    public get scene(): ViewScene {
        return this._scene;
    }

    public get inBuilding(): boolean {
        return this._inBuilding;
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

    /**
     * @internal
     */
    addDirty(dirty: EDirtyType): this {
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

        return this;
    }    

    protected removeDirty(dirty: EDirtyType) {
        this._dirtyType ^= dirty;
    }

    protected withDirty(dirty: EDirtyType): boolean {
        return (dirty&this._dirtyType) != EDirtyType.None;
    }

    public get id(): string {
        return this._id;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
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

            // when hide the focus view, set focus empty view
            if(!val && this.focused) {
                this.root.focus = null;
            }
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

    public removeFromParent(): this {
        if(this._parent) {
            this._parent.removeChild(this);
            this._root = null;

            if(this._gFrame && this._gFrame.parentContainer) {
                this._gFrame.parentContainer.remove(this._gFrame);
            }

            this.onParentChanged();
        }

        return this;
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
                this.setRoot(parent.root);
            }

            this.onParentChanged();
            this.emit(DisplayObjectEvent.PARENT_CHANGED, oldParent, parent);
        }
    }

    public get x(): number {
        return this._x;
    }

    public set x(val: number) {
        this.setXY(val, this._y);
    }

    public get px(): number {
        if(this._parent && this._parent.width > 0) {
            return this._x / this._parent.width;
        }
        return 0;
    }

    public set px(val: number) {
        if(this._parent && this._parent.width > 0) {
            this.x = val * this._parent.width;
        }
    }

    public get py(): number {
        if(this._parent && this._parent.height > 0) {
            return this._y / this._parent.height;
        }
        return 0;
    }

    public set py(val: number) {
        if(this._parent && this._parent.height > 0) {
            this.y = val * this._parent.height;
        }
    }

    public get y(): number {
        return this._y;
    }

    public set y(val: number) {
        this.setXY(this._x, val);
    }

    public updateMask() {
        this._updateRootMask();

        this.emit(DisplayObjectEvent.UPDATE_MASK, this);
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

    public setXY(xv: number, yv:number): this {
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

        return this;
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

    public setScale(sx: number, sy: number): this {
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

        return this;
    }

    public setSize(wv: number, hv: number, ignorePivot?: boolean): this {
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
            this.handleSizeChanged();

            this.addDirty(EDirtyType.FrameChanged | EDirtyType.BorderChanged);
            if(this._parent) {
                this._parent.addDirty(EDirtyType.BoundsChanged);
            }

            this.emit(Events.DisplayObjectEvent.SIZE_CHANGED, oldWidth, oldHeight, this._width, this._height);
        }

        return this;
    }

    protected mapPivotWidth(scale: number): number {
        return scale * this._width;
    }

    protected mapPivotHeight(scale: number): number {
        return scale * this._height;
    }

    protected updatePivotOffset() {
        // translate object after rotate by pivot point(align pivot to rotate pivot)
        if((this.pivotX == 0 && this.pivotY == 0) || !this.rootContainer.localTransform) {
            this._pivotOffset.setTo(0, 0);
        }else{        
            //old pivot    
            let dx = this.mapPivotWidth(this.pivotX);
            let dy = this.mapPivotHeight(this.pivotY);

            let pos = View.sHelperPoint;
            pos.setTo(dx, dy);
            // need update transform, 
            // do not use localtransform directly
            let trans = this.rootContainer.getLocalTransformMatrix();
            //offset = (new poivt - old poivt)
            trans.transformPoint(pos.x, pos.y, pos);
            //new pivot
            pos.x -= trans.tx;
            pos.y -= trans.ty;
            this._pivotOffset.setTo(this.pivotX*this._width - pos.x, this.pivotY*this._height - pos.y);
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

    /**
     * rotate value in degree
     */
    public get angle(): number {
        return this._angle;
    }

    public set angle(val: number) {
        if(val != this._angle) {
            this._angle = val;

            this._rootContainer.angle = val;

            this._applyPivot();

            this.addDirty(EDirtyType.FrameChanged);
            if(this._parent) {
                this._parent.addDirty(EDirtyType.BoundsChanged);
            }
        }
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

    public setPivot(vx: number, vy:number, pivtoAsAnchor: boolean = false): this {
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

        return this;
    }

    public get displayObject(): GameObject {
        return this._displayObject;
    }

    public get inContainer(): boolean {
        return this._rootContainer.parentContainer != null;
    } 

    public get relations(): Relations {
        return this._relations;
    }

    public get mask(): MaskType {
        return this._rootContainer.mask;
    }

    public set mask(mask: MaskType) {
        if(this._rootContainer.mask != mask) {            
            this.setMask(this._rootContainer, mask);
            this._updateRootMask();
        }
    }

    public get grayed(): boolean {
        return this._grayed;
    }

    public set grayed(value: boolean) {
        if (this._grayed != value) {
            this._grayed = value;
            this.handleGrayedChanged();
        }
    }
    
    public get enabled(): boolean {
        return !this._grayed && this._touchable;
    }

    public set enabled(value: boolean) {
        this.grayed = !value;
        this.touchable = value;
    }
    
    protected updateGraphicsMask(targetObj: Phaser.GameObjects.Components.Mask, x?: number, y?: number, width?: number, height?: number, clear: boolean = false) {
        if(clear) {
            this.setMask(targetObj, null, true);
            return;
        }
        
        let mask = targetObj.mask;
        let target: Graphics;
        if(!mask) {
            target = this._scene.add.graphics({});
            mask = target.createGeometryMask();
        }else{
            target = (mask as GeometryMask).geometryMask;
        }

        let mk = mask as any;
        if(!mk.__mask_raw_x) {
            mk.__mask_raw_x = x;
            mk.__mask_raw_y = y;
        }
        if(x == undefined) {
            x = mk.__mask_raw_x || 0;
            y = mk.__mask_raw_y || 0;
        }

        let pos = this.localToGlobal(x, y);
        target.visible = false;
        // this._rootContainer.add(target);
        target.clear();

        target.setPosition(pos.x, pos.y);
        target.fillStyle(0x1, 1);
        target.fillRect(0, 0, width, height);
        this.setMask(targetObj, mask, true);
    }

    public static setMaskPosition(mask: MaskType, x: number, y: number) {
        let obj: any;
        if(mask instanceof GeometryMask) {
            obj = mask.geometryMask;
        }else if(mask instanceof BitmapMask) {
            obj = mask.bitmapMask;
        }
        let mk = mask as any;
        mk.__mask_raw_x = obj.x = x;
        mk.__mask_raw_y = obj.y = y;
    }

    protected _setToMask(container: Container, mask: MaskType) {
        let obj: any;
        if(mask instanceof GeometryMask) {
            obj = mask.geometryMask;
        }else if(mask instanceof BitmapMask) {
            obj = mask.bitmapMask;
        }
        if(!obj) {
            console.error('invalid mask with no mask data!');
            return;
        }
        if(obj.parentContainer && obj.parentContainer.mask) {
            obj.parentContainer.clearMask(false);
        }

        let mk = mask as any;
        let x = mk.__mask_raw_x, y = mk.__mask_raw_y;
        if(x === undefined || y === undefined) {
            x = obj.x;
            y = obj.y;
            mk.__mask_raw_x = x;
            mk.__mask_raw_y = y;
        }
        container.add(obj);
        container.setMask(mask);
        
        let pos = this.localToGlobal(x, y);
        if(obj.setOrigin) {
            obj.setOrigin(0, 0);
        }
        obj.setPosition(pos.x, pos.y);
        obj.visible = false;
    }

    private _updateRootMask() {
        let mask = this._rootContainer.mask;
        if(!mask) {
            return;
        }
        this._setToMask(this._rootContainer, mask);
    }

    protected setMask(container: Phaser.GameObjects.Components.Mask, mask: MaskType, dispose: boolean = false) {
        if(mask != container.mask) {
            if(container.mask && dispose) {
                let mk = container.mask as any;
                delete mk.__mask_raw_x;
                delete mk.__mask_raw_y;
                container.clearMask(true);
                container.mask = null;
            }

            container.setMask(mask);
        }
    }    

    protected updateBorder() {        
        this.updateMask();
    }

    /**
     * when caculate bounds, if this is true, just use frame as bounds,or false value, will real bounds
     */
    public get useBorderAsFrame(): boolean {
        return this._useBorderAsFrame;
    }

    public set useBorderAsFrame(val: boolean) {
        if(val != this._useBorderAsFrame) {
            this._useBorderAsFrame = val;

            this.addDirty(EDirtyType.FrameChanged);
        }
    }

    protected updateFrame() {
        if(this._angle == 0 || this._useBorderAsFrame) {
            let width = this.actualWidth;
            let height = this.actualHeight;
            let x = this._rootContainer.x;
            let y = this._rootContainer.y;
            if(this._pivotAsAnchor) {
                this._frame.x = x - this.pivotX * width;
                this._frame.y = y - this.pivotY * height;
            }else{
                this._frame.x = x;
                this._frame.y = y;
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

            let trans = this._rootContainer.getLocalTransformMatrix();            
            let pos = View.sHelperPoint;
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

        let parent = this._rootContainer.parentContainer;
        if(parent) {
            if(!this._gFrame) {
                this._gFrame = this._scene.make.graphics({}, false);
                parent.add(this._gFrame);
            }

            if(parent != this._gFrame.parentContainer) {
                parent.add(this._gFrame);
            }

            this._gFrame.clear();
            let rect = this.frame;
            this._gFrame.lineStyle(2/Math.min(this._scaleX, this._scaleY), 0xffff00, 1);
            this._gFrame.strokeRect(rect.x, rect.y, rect.width, rect.height);
        }
            
        this.removeDirty(EDirtyType.DebugFrameChanged);
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
        if(this.finalVisible) {
            if(this._components) {
                this._components.forEach(comp=>{
                    let thisComp = comp as any;
                    if(comp.enable && thisComp.update) {
                        thisComp.update(time, delta);
                    }
                });
            }

            if(self.update && self.update instanceof Function) {
                self.update(time, delta);
            }
        }

        this.checkDirty();
    }

    /**@internal */
    protected clear() {
        if(this._gFrame) {
            this._gFrame.destroy();
            this._gFrame = null;
        }
        if(this._gBorder) {
            this._gBorder.destroy();
            this._gBorder = null;
        }
    }

    public reset(): this {              
        this._isDisposed = false;       

        return this;
    }

    public dispose() {
        if(this._relations) {
            this._relations.dispose();
        }

        if(this._components) {
            this._components.forEach(comp=>{
                comp.unRegist();
                comp.dispose();
            });
            this._components.length = 0;
        }

        this.parent = null;
        this._isDisposed = true;

        this.clear();

        this.removeAllListeners();
        this._rootContainer.destroy();
        this._rootContainer = null;
            
        this._scene.tweens.killTweensOf(this);
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

    public ensureAllCorrect() {
        this.ensureSizeCorrect();
    }

    public ensureSizeCorrect(): this {        

        return this;
    }

    protected get eventOwner(): EventEmitter {
        return this._rootContainer;
    }

    public on(type: string, listener: Function, thisObject?: any): this {
        if (type == null) {
            return this;
        }
        
        let compType = ComponentFactory.inst.getEventComponentType(type);
        if(compType && !this.hasComponent(compType)) {
            this.addComponentByType(compType);
        }

        this.eventOwner.on(type, listener, thisObject);
        return this;
    }

    public off(type: string, listener: Function, thisObject?: any): this {
        if (type == null) {
            return this;
        }

        this.eventOwner.off(type, listener, thisObject);

        let events = ComponentFactory.inst.getRelationEvents(type);
        let hasListens = false;
        for(let idx in events) {
            if(this.hasListener(events[idx])) {
                hasListens = true;
                break;
            }
        }

        if(!hasListens) {
            let compType = ComponentFactory.inst.getEventComponentType(type);
            if(compType && this.hasComponent(compType)) {
                this.removeComponentByType(compType);
            }
        }

        return this;
    }

    public once(type: string, listener: Function, thisObject?: any): this {
        if (type == null) return this;
        this.eventOwner.once(type, listener, thisObject);
        return this;
    }

    public hasListener(event: string, handler?:Function): boolean {
        if(!handler)
            return this.eventOwner.listeners(event).length > 0;
        else
            return this.eventOwner.listeners(event).indexOf(handler) >= 0;
    }

    public emit(event: string, ...args: any[]): boolean {
        args = args || [];
        args.unshift(this);
        return this.eventOwner.emit(event, ...args);
    }

    public removeAllListeners(type?:string): this {
        this.eventOwner.removeAllListeners(type);
        return this;
    }

    public onClick(listener: Function, thisObj?: any): this {
        this.on(Events.GestureEvent.CLICK, listener, thisObj);
        return this;
    }

    public removeClick(listener: Function, thisObj?: any): this {
        this.off(Events.GestureEvent.CLICK, listener, thisObj);
        return this;
    }

    public hasClick(fn?:Function): boolean {
        return this.hasListener(Events.GestureEvent.CLICK, fn);
    }

    public get enableBackground(): boolean {
        return this._enableBackground;
    }

    public set enableBackground(val: boolean) {
        if(this._enableBackground != val) {
            this._enableBackground = val;
            this.applyBackgroundChange();
            this.applyHitArea();
        }
    }

    public get backgroundColor(): number {
        return this._backgroundColor;
    }

    public set backgroundColor(val: number) {
        this.setBackgroundColor(val, this._enableBackground);
    }

    public setBackgroundColor(color: number, enable: boolean = true): this {
        if(this._backgroundColor != color || this._enableBackground != enable) {
            this._enableBackground = enable;
            this._backgroundColor = color;
            this.applyBackgroundChange();
            this.applyHitArea();
        }
        return this;
    }

    protected get hitArea(): Rectangle {
        return this._hitArea;
    }

    protected applyHitArea() {
        if(!this.realTouchable) {
            if(this._hitArea) {
                this._hitArea.setSize(0, 0);
            }
            if(this._rootContainer.input) {
                this._rootContainer.input.enabled = false;
            }
            return;
        }

        if (!this._hitArea) {
            this._hitArea = new Rectangle();
            this._rootContainer.setInteractive(this._hitArea, Rectangle.Contains);
        }

        this._rootContainer.input.enabled = true;

        let h: Rectangle = this._hitArea;
        h.x = h.y = 0;
        h.width = this.width;
        h.height = this.height;
    } 

    protected handleBorderChange() {
        this.applyBackgroundChange();
        this.applyHitArea();
    }

    protected handleSizeChanged() {

    }

    /**@internal */
    handleGrayedChanged(focusGray?: boolean) {
        let gameobjects = this._rootContainer.getAll();
        for(let i in gameobjects) {
            let g: any = gameobjects[i];
            if(g.setPipeline) {
                if(this._grayed || focusGray) {
                    g.setPipeline("gray-scale");
                }else{
                    g.resetPipeline(); 
                }
            }
        }
    }

    protected applyTint() {
        let disp: any = this.displayObject;
        if(disp && disp.tint != undefined) {
            disp.tint = this._tint;
        }
    }

    protected applyAlpha() {
        let disp: any = this.displayObject;
        if(disp && disp.alpha != undefined) {
            disp.alpha = this._alpha;
        }
    }

    protected applyBackgroundChange() {
        if(this._enableBackground) {
            if(!this._gBackground) {
                this._gBackground = this._scene.make.graphics({}, false);
                this._rootContainer.addAt(this._gBackground, 0);            
            }
            this._gBackground.clear();
            this._gBackground.fillStyle(colorMultiply(this._backgroundColor, this._tint), 1);
            this._gBackground.fillRect(0, 0, this._width, this._height);
            this._gBackground.alpha = this._alpha;
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
            resultPoint = View.sHelperPoint;
        }
        this._rootContainer.getWorldTransformMatrix().transformPoint(ax, ay, resultPoint);
        return resultPoint;
    }

    public globalToLocal(ax: number = 0, ay: number = 0, resultPoint?: Point): Point {
        if (!resultPoint) {
            resultPoint = View.sHelperPoint;
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
            resultRect = View.sHelperRect;
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
            resultRect = View.sHelperRect;
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
            resultPoint = View.sHelperPoint;
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
            resultPoint = View.sHelperPoint;
        }

        resultPoint = this.globalToLocal(ax, ay, resultPoint);
        let scaleMgr = this._scene.scale as any;
        scaleMgr.transformXY(resultPoint.x, resultPoint.y, resultPoint);

        return resultPoint;
    }

    public localToDOMRect(ax: number = 0, ay: number = 0, aWidth: number = 0, aHeight: number = 0, resultRect?: Rectangle): Rectangle {
        if (resultRect == null) {
            resultRect = View.sHelperRect;
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
            resultRect = View.sHelperRect;
        }

        let pt: Point = PoolManager.inst.get(Point) as Point;
        this.domToLocal(ax, ay, pt);
        resultRect.x = pt.x;
        resultRect.y = pt.y;        

        let pt1: Point = PoolManager.inst.get(Point) as Point;
        this.domToLocal(ax + aWidth, ay + aHeight, pt1);  
        resultRect.width = Math.abs(pt1.x - pt.x);
        resultRect.height = Math.abs(pt1.y - pt.y);

        PoolManager.inst.put(pt, pt1);
        return resultRect;
    }

    private _checkComponent() {
        if(!this._components) {
            this._components = [];
        }
    }

    private _checkComponentMetadata(compType: Function) {
        let keys = Reflect.getMetadataKeys(compType);
        for(let key of keys) {
            let metadata = Reflect.getMetadata(key, compType);
            if(metadata.onBeforeAddComponent) {
                metadata.onBeforeAddComponent(this, compType);
            }
        }
    }

    public addComponentByType(compType: new()=>{}): IComponent {
        if(compType) {
            return this.addComponent(new compType() as IComponent);
        }
        return null;
    }

    public addComponent(comp: IComponent): IComponent {
        if(!comp) {
            throw new Error(`Invalid component`);
        }
        
        this._checkComponent();
        this._checkComponentMetadata(comp.constructor);

        let comps = this.getComponents(comp.constructor, {
            containsParentType: true,
            containsSameParentType: true,
            containsChildType: true,
        });
        for(let cp of comps) {            
            let keys = Reflect.getMetadataKeys(cp.constructor);
            for(let key of keys) {
                let metadata = Reflect.getMetadata(key, cp.constructor);
                if(metadata.onCheckComponent) {
                    metadata.onCheckComponent(this, cp.constructor);
                }
            }
        }        

        this._components.push(comp);
        comp.regist(this);

        
        if(!this._batchAddComponents) {
            this.onComponentChanged();
        }

        return comp;
    }

    public removeComponent(comp: IComponent): this {
        if(!this._components || !comp) {
            return;
        }

        let index = this._components.indexOf(comp);
        if(index < 0) {
            return;
        }

        comp.unRegist();

        this._components.splice(index, 1);

        this.onComponentChanged();

        return this;
    }

    public removeComponentByType(type: Function, all: boolean = true, options?: IComponentOptions): this {
        if(!this._components || !type) {
            return;
        }

        this._components.forEach(comp=>{
            if(this._compareComponent(comp, type, options)) {
                this.removeComponent(comp);

                if(!all) {
                    return;
                }
            }
        });
        return this;
    }

    private _compareComponent(item: IComponent, type: Function, options?: IComponentOptions) {
        let p = type;
        let last = p;
        let find =  item.constructor.name == type.name;

        options = options || {};

        if(options.containsChildType) {
            find = item instanceof type;
        }

        if(!find && options.containsParentType) {
            if(options.containsSameParentType) {
                while((item as any).__proto__.__proto__.constructor.name != BaseComponent.name) {
                    item = (item as any).__proto__;
                }
            }

            while(!find) {
                find = p == item.constructor || (type as any).__proto__ == item.constructor;
                p = (type as any).__proto__;
                if(p == last || p == item.constructor) {
                    break;
                }
                last = p;
            }
        }

        return find;
    }

    public hasComponent(type: Function, options?: IComponentOptions): boolean {
        if(!this._components || !type) {
            return false;
        }

        return this.getComponent(type, options) != null;
    }

    public getComponent(type: Function, options?: IComponentOptions): IComponent {
        if(!this._components) {
            return null;
        }

        return this._components.find((item) => {
            return this._compareComponent(item, type, options);
        });
    }

    public getComponents(type: Function, options?: IComponentOptions): IComponent[] {
        if(!this._components) {
            return [];
        }

        let comps:IComponent[] = [];
        this._components.forEach(comp=>{
            if(this._compareComponent(comp, type, options)) {
                comps.push(comp);
            }
        });

        return comps;
    }

    protected applayProperties() {
        this._rootContainer.angle = this._angle;
    }

    protected relayout() {        
        this.addDirty(EDirtyType.BoundsChanged | EDirtyType.FrameChanged | EDirtyType.BorderChanged);
        this._rootContainer.setScale(this._scaleX, this._scaleY);
        this.handleXYChanged();
        this.handleSizeChanged();
        this.updatePivotOffset();
        this.applyAlpha();
        this.applyTint();
        this.applyBackgroundChange();
        this.applyHitArea();
        this.applayProperties();
        this.applyDraggable();
        this.checkDirty();
        this.ensureSizeCorrect();
        this.handleGrayedChanged();
        this.updateMask();
    }

    protected updateComponents() {
        this._batchAddComponents = true;

        if(this._components) {
            let comps = this._components.concat();
            this._components.length = 0;
            comps.forEach(comp => {
                this.addComponent(comp);
            });
        }

        this._batchAddComponents = false;
        this.onComponentChanged();
    }

    protected onComponentChanged(){        
        this._dragComponent = this.getComponent(DragComponent) as DragComponent;
        this._propertyComponent = this.getComponent(PropertyComponent) as PropertyComponent;
        this._animationComponent = this.getComponent(AnimationComponent) as AnimationComponent;
    }

    protected setDefaultValues() {
        this._rawWidth = this._width;
        this._rawHeight = this._height;
        this._initWidth = this._width;
        this._initHeight = this._height;
    }

    protected reconstruct() {   
        this.setDefaultValues();
        this.relayout();
        this.updateComponents();
    }    

    /**
     * scale in world
     */
    public getLossyScale(): Point {
        let scale = View.sHelperPoint.setTo(this._scaleX, this._scaleY);
        let parent = this.rootContainer.parentContainer;
        while(parent) {
            scale.x *= parent.scaleX;
            scale.y *= parent.scaleY;
            parent = parent.parentContainer;
        }
        return scale;
    }

    public clone(): View {
        let json = this.toJSON();
        return this.scene.addUI.create(json);
    }

    public toJSON(tpl?: any): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp || tpl);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            this._inBuilding = true;
            Deserialize(this, config, template);
        }        

        return this;
    }

    public get dragComponent(): DragComponent {
        return this._dragComponent;
    }

    public get propertyComponent(): PropertyComponent {
        return this._propertyComponent;
    }

    public get animationComponent(): AnimationComponent {
        return this._animationComponent;
    }

    public get focusable(): boolean {
        return this._focusable;
    }

    public set focusable(val: boolean) {
        this._focusable = val;
    }

    public get focused(): boolean {
        return this.root.focus == this;
    }

    public requestFocus(): this {
        let p: View = this;
        while (p && !p.focusable) {
            p = p.parent;
        }
        if (p != null) {
            this.root.focus = p;
        }

        return this;
    }

    public requestBlur(): this {
        this._root.focus = null;
        return this;
    }

    public get touchable(): boolean {
        return this._touchable;
    }

    public set touchable(val: boolean) {
        if(this._touchable != val) {
            this._touchable = val;
            this.applyHitArea();
        }
    }

    public get draggable(): boolean {
        return this._draggable;
    }

    private applyDraggable(): this {
        if(this._draggable) {                
            if(this._dragComponent) {
                if(!this._dragComponent.owner) {
                    this.addComponent(this._dragComponent);
                }
            }else{
                this._dragComponent = this.getComponent(DragComponent) as DragComponent;
                if(!this._dragComponent) {
                    this._dragComponent = this.addComponentByType(DragComponent) as DragComponent;
                }
            }
        }else{
            this.removeComponent(this._dragComponent);
        }
        return this;
    }

    public set draggable(val: boolean) {
        if (this._draggable != val) {
            this._draggable = val;
            
            this.applyDraggable();
        }
    }    

    public get dragging(): boolean {
        return DragComponent.draggingObject == this;
    }

    public startDrag(): void {
        if (!this.onStage || !this._dragComponent)
            return;

        this._dragComponent.startDrag();
    }

    public stopDrag(): void {
        if(!this._dragComponent) {
            return;
        }

        this._dragComponent.stopDrag();
    }

    public get depth(): number {
        return this._rootContainer.depth;
    }

    public set depth(val: number) {
        if(val != this._rootContainer.depth) {
            this._rootContainer.depth = val;
            if(this._parent) {
                this.parent.appendChildrenList();
            }
        }
    }

    public get tint(): number {
        return this._tint;
    }

    public set tint(value: number) {
        if(this._tint != value) {
            this._tint = value;
            this.applyTint();
            this.applyBackgroundChange();
        }
    }

    public get alpha(): number {
        return this._alpha;
    }

    public set alpha(value: number) {
        if(this._alpha != value) {
            this._alpha = value;
            this.applyAlpha();
            this.applyBackgroundChange();
        }
    }
}

Templates.regist(View.CATEGORY, null, (scene: ViewScene, data: any, tpl: any)=>{
    return scene.addUI.create(data, tpl);
});