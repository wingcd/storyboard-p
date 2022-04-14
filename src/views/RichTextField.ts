import { GameObject, Pointer, Rectangle } from "../phaser";
import { TextField } from "./TextField";
import * as Events from '../events';
import { View } from "../core/View";
import { ViewRoot } from "../core/ViewRoot";
import { MultiPointerManager } from "../utils/MultiPointerManager";
import { ITextField } from "../types";

export class RichTextField extends TextField  implements ITextField{ 
    static TYPE = "richtext";

    private static AREA_DOWN_EVENT = "areadown";
    private static AREA_UP_EVENT = "areaup";

    private _isDownOnArea = false;
    private _pointerMgr = new MultiPointerManager();

    protected fromConstruct() {
        super.fromConstruct();

        this._canUseBitmap = false;
        this.touchable = true;
        this.rich = true;
    }

    setRoot(root: ViewRoot): this {
        super.setRoot(root);        

        this.onClick(this._onClick, this);
        this.root.on(Events.PointerEvent.UP, this._rootUp, this);

        return this;
    }

    public get tagMode(): boolean {
        return super.tagMode;
    }

    public set tagMode(val: boolean) {
        super.tagMode = val;
    }

    protected applyHitArea() {
        super.applyHitArea();

        if(this.rootContainer.input) {
            if(this._richTextField) {
                if(this.hitArea && !this._richTextField.input) {
                    this._richTextField.setInteractive(this.hitArea, Rectangle.Contains);    
                }
                if(this._richTextField.input) {
                    this._richTextField.input.enabled = this.rootContainer.input.enabled;
                }       
            }
        }
    }

    private _areaDown(key: string, pointer: Pointer, localX: number, localY: number) {
        if(!this._pointerMgr.isDown(pointer)) {
            this._isDownOnArea = true;
            this._pointerMgr.down(pointer, key);
            this.emit(Events.TextEvent.AREA_DOWN, key, pointer);
        }
    }

    private _areaUp(key: string, pointer: Pointer, localX: number, localY: number) {
        if(this._pointerMgr.isDown(pointer)) {
            this.emit(Events.TextEvent.AREA_UP, key, pointer);
        }
    }

    private _rootUp(sender: View, pointer: Pointer) {
        if(this._pointerMgr.isDown(pointer)) { 
            this._isDownOnArea = false;
            this._pointerMgr.up(pointer);
        }
    }

    private _onClick(sender: View, pointer: Pointer) {
        if(this._pointerMgr.isDown(pointer)) {
            if(this._isDownOnArea) {
                this.emit(Events.TextEvent.AREA_CLICK, this._pointerMgr.getData(pointer), pointer);
            }
        }
    }

    protected setDisplayObject(display: GameObject) {
        if(this._richTextField) {
            this._richTextField.off(RichTextField.AREA_DOWN_EVENT, this._areaDown, this);
            this._richTextField.off(RichTextField.AREA_UP_EVENT, this._areaUp, this);
        }

        super.setDisplayObject(display);        

        if(this._richTextField) {
            this._richTextField.on(RichTextField.AREA_DOWN_EVENT, this._areaDown, this);
            this._richTextField.on(RichTextField.AREA_UP_EVENT, this._areaUp, this);
        }
    }
}