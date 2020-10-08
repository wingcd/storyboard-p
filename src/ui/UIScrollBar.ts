import { ISerializeInfo } from "../annotations/Serialize";
import { ScrollPane } from "../components";
import { EDragType } from "../core/Defines";
import { View } from "../core/View";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { EventData, EventEmitter, Point, Pointer, Rectangle, Tween } from "../phaser";
import { EFillType } from "../types";
import { EProgressTitleType } from "../types/IUIProgressBar";
import { MathUtils } from "../utils/Math";
import { PoolManager } from "../utils/PoolManager";
import { UIImage } from "./UIImage";
import { UITextField } from "./UITextField";
require("../components");
                    
export class UIScrollBar extends ViewGroup {
    static TYPE = "scrollbar";
    
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = ViewGroup.SERIALIZABLE_FIELDS;
        fields.push(  
            {property: "value", default: 0},
        );
        return fields;
    }    

    private _vertical: boolean = true;
    private _fixedGripSize: boolean = false;
    
    private _grip: View;
    private _arrow1: View;
    private _arrow2: View;
    private _bar: View;
    
    private _target: ScrollPane;
    private _scrollPrec: number = 0;

    private _dragOffset: Point = new Point();
    private _gripDragging: boolean = false;

    
    public constructor(scene: ViewScene) {
        super(scene);

        this.on(Events.PointerEvent.DOWN, this.__barMouseDown, this);
    } 

    public setScrollPane(target: ScrollPane, vertical: boolean): this {
        this._target = target;
        this._vertical = vertical;
        return this;
    }

    public setDisplayPrec(val: number): this {
        if(this._vertical) {
            if(!this._fixedGripSize) {
                this._grip.height = Math.floor(val * this._bar.height);
            }
            this._grip.y = this._bar.y + (this._bar.height - this._grip.height) * this._scrollPrec;
        }else{
            if(!this._fixedGripSize) {
                this._grip.width = Math.floor(val * this._bar.width);
            }
            this._grip.x = this._bar.x + (this._bar.width - this._grip.width) * this._scrollPrec;
        }

        this._grip.visible = val != 0 && val != 1;
        return this;
    }

    public get scrollPrec(): number {
        return this._scrollPrec;
    }
    
    public set scrollPrec(val: number) {
        if(this._scrollPrec != val) {
            this._scrollPrec = val;

            if(this._vertical) {
                this._grip.y = this._bar.y + (this._bar.height - this._grip.height) * val;
            }else{
                this._grip.x = this._bar.x + (this._bar.width - this._grip.width) * val;
            }
        }
    }

    public get minSize(): number {
        if(this._vertical) {
            return (this._arrow1 ? this._arrow1.height : 0) + (this._arrow2 ? this._arrow2.height : 0);
        }else{
            return (this._arrow1 ? this._arrow1.width : 0) + (this._arrow2 ? this._arrow2.width : 0);
        }
    }

    public get gripDragging(): boolean {
        return this._gripDragging;
    }
    
    protected onChildrenChanged() {
        super.onChildrenChanged();

        let oldGrip = this._grip;
        let oldArrow1 = this._arrow1;
        let oldArrow2 = this._arrow2;
        let oldBar = this._bar;

        this._bar = this.getChild("bar");
        this._grip = this.getChild('grip');
        this._arrow1 = this.getChild("arrow1");
        this._arrow2 = this.getChild("arrow2");

        if(this._grip != oldGrip) {
            if(oldGrip) {
                oldGrip.off(Events.PointerEvent.DOWN, this.__gripMouseDown, this);
            }
            if(this._grip) {
                this._grip.off(Events.PointerEvent.DOWN, this.__gripMouseDown, this);
            }
        }

        if(this._bar != oldBar) {
            if(oldBar) {
                oldBar.off(Events.PointerEvent.DOWN, this.__barMouseDown, this);
            }
            if(this._bar) {
                this._bar.off(Events.PointerEvent.DOWN, this.__barMouseDown, this);
            }
        }

        if(this._arrow1 != oldArrow1) {
            if(oldArrow1) {
                oldArrow1.off(Events.GestureEvent.CLICK, this.__arrow1Click, this);
            }
            if(this._arrow1) {
                this._arrow1.off(Events.GestureEvent.CLICK, this.__arrow1Click, this);
            }
        }

        if(this._arrow2 != oldArrow2) {
            if(oldArrow2) {
                oldArrow2.off(Events.GestureEvent.CLICK, this.__arrow2Click, this);
            }
            if(this._arrow2) {
                this._arrow2.off(Events.GestureEvent.CLICK, this.__arrow2Click, this);
            }
        }
    }

    protected handleSizeChanged() {
        super.handleSizeChanged();

        
    }

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

        this.root.off(Events.PointerEvent.MOVE, this.__gripMouseMove, this);
        this.root.off(Events.PointerEvent.UP, this.__gripMouseUp, this);
    }

    private __gripMouseDown(sender: View, pointer: Pointer, localX: number, localY: number, event: EventData): void {
        event.stopPropagation();

        this._gripDragging = true;
        
        this.root.on(Events.PointerEvent.MOVE, this.__gripMouseMove, this);
        this.root.on(Events.PointerEvent.UP, this.__gripMouseUp, this);

        this.globalToLocal(pointer.x, pointer.y, this._dragOffset);
        this._dragOffset.x -= this._grip.x;
        this._dragOffset.y -= this._grip.y;
    }

    private __gripMouseMove(sender: View, pointer: Pointer): void {
        if (!this.onStage || !this._gripDragging) {
            return;
        }
        
        let pt = this.globalToLocal(pointer.x, pointer.y, View.sHelperPoint);
        if(this._vertical) {
            let curY = pt.y - this._dragOffset.y;
            this._target.setPercY((curY - this._bar.y) / (this._bar.height - this._grip.height), false);
        }else {
            let curX = pt.x - this._dragOffset.x;
            this._target.setPercX((curX - this._bar.x) / (this._bar.width - this._grip.width), false);
        }
    }

    private __gripMouseUp(sender: View, pointer: Pointer): void {
        if (!this.onStage || !this._gripDragging) {
            return;
        }

        this.root.off(Events.PointerEvent.MOVE, this.__gripMouseMove, this);
        this.root.off(Events.PointerEvent.UP, this.__gripMouseUp, this);

        this._gripDragging = false;
    }

    private __arrow1Click(sender: View, pointer: Pointer, localX: number, localY: number, event: EventData): void {
        event.stopPropagation();

        if (this._vertical)
            this._target.scrollUp();
        else
            this._target.scrollLeft();
    }

    private __arrow2Click(sender: View, pointer: Pointer, localX: number, localY: number, event: EventData): void {
        event.stopPropagation();

        if (this._vertical)
            this._target.scrollDown();
        else
            this._target.scrollRight();
    }

    private __barMouseDown(sender: View, pointer: Pointer): void {
        var pt = this._grip.globalToLocal(pointer.x, pointer.y, View.sHelperPoint);
        if (this._vertical) {
            if (pt.y < 0)
                this._target.scrollUp(4);
            else
                this._target.scrollDown(4);
        }
        else {
            if (pt.x < 0)
                this._target.scrollLeft(4);
            else
                this._target.scrollRight(4);
        }
    }
}