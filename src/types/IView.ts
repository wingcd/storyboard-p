import { IViewRoot } from "./IViewRoot";
import { IViewScene } from "./IViewScene";
import { EDirtyType } from "../core/Defines";
import { Rectangle, GameObject, MaskType, Container, Point } from "../phaser";
import { IComponentable } from "./IComponent";
import { IColorable } from "./ViewTypes";
import { IEventable } from "./IEventable";
import { ITransformable } from "./ITransformable";
import { IDraggable } from "./IDraggable";
import { IFocusable } from "./IFocusable";
import { IViewGroup } from "./IViewGroup";
import { ISerialable } from "./ISerialable";
import { Relations } from "../core/Relations";
import { ITemplatable } from "./ITemplatable";
import { View } from "../core/View";

export interface IViewConfig extends IColorable {
    name?:string;
    data?:any;
    visible?:boolean;
    hiddenCollapsed?:boolean;
    x?:number;
    y?:number;
    width?:number;
    height?:number;
    scaleX?:number;
    scaleY?:number;
    angle?:number;
    pivotX?:number;
    pivotY?:number;
    pivotAsAnchor?:boolean;
    useBorderAsFrame?:boolean;
    focusable?:boolean;
    touchable?:boolean,
    touchEnableMoved?:boolean,
    draggable?:boolean,
    enableBackground?:boolean,
    backgroundColor?:number;
}

export interface IView extends IViewConfig, IComponentable, IEventable, ITransformable, IDraggable, IFocusable, ISerialable, ITemplatable {
    id: string;
    root: IViewRoot;
    onStage: boolean;
    scene: IViewScene&Phaser.Scene;
    internalVisible: boolean;
    finalVisible: boolean;
    frame: Rectangle;
    parent: IViewGroup;
    sourceHeight: number;
    initHeight: number;
    initWidth: number;
    actualWidth: number;
    displayObject: GameObject;
    inContainer: boolean;
    relations: Relations;
    mask: MaskType;
    rootContainer: Container;

    /**@internal */
    _rawWidth: number;
    /**@internal */
    _rawHeight: number;
    /**@internal */
    _initWidth: number;
    /**@internal */
    _initHeight: number;
    /**@internal */
    _sourceWidth: number;
    /**@internal */
    _sourceHeight: number;

    setRoot(root: IViewRoot): this;
    addDirty(dirty: EDirtyType): this;
    removeFromParent(): this;
    setXY(xv: number, yv:number): this;
    setScale(sx: number, sy: number): this;
    setSize(wv: number, hv: number, ignorePivot?: boolean): this;
    setPivot(vx: number, vy:number, pivtoAsAnchor?: boolean):this;
    setBackgroundColor(color: number, enable?: boolean): this;
    onGizmos(): void;
    onUpdate(time: number, delta: number): void;
    reset(): this;
    dispose(toPool?: boolean): void;
    ensureSizeCorrect(): this;  

    localToView(view: View, ax: number, ay: number, resultPoint?: Point): Point;
    viewToLocal(view: View, ax: number, ay: number, resultPoint?: Point): Point;
    localToGlobal(ax: number, ay: number, resultPoint?: Point): Point;
    globalToLocal(ax: number, ay: number, resultPoint?: Point): Point;
    localToGlobalRect(ax: number, ay: number, aWidth: number, aHeight: number, resultRect?: Rectangle): Rectangle;
    globalToLocalRect(ax: number, ay: number, aWidth: number, aHeight: number, resultRect?: Rectangle): Rectangle;
    localToDOM(ax: number, ay: number, resultPoint?: Point): Point;
    domToLocal(ax: number, ay: number, resultPoint?: Point): Point;
    localToDOMRect(ax: number, ay: number, aWidth: number, aHeight: number, resultRect?: Rectangle): Rectangle;
    domToLocalRect(ax: number, ay: number, aWidth: number, aHeight: number, resultRect?: Rectangle): Rectangle;
}