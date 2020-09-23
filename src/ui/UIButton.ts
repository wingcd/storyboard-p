import { View } from "../core/View";
import { ISerializeInfo } from "../annotations/Serialize";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { Input } from "../phaser";
import { PropertyManager } from "../tween/Property";
import { EButtonMode } from "../types/IUIButton";
import { UIImage } from "./UIImage";
import { UITextField } from "./UITextField";
require("../components");
                    
export class UIButton extends ViewGroup {
    static TYPE = "button";

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = ViewGroup.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_selected", alias: "selected", default: false},
            {property: "_title", alias: "title", default: ""},
            {property: "_icon", alias: "icon", default: ""},
            {property: "_titleColor", alias: "titleColor", default: 0},            
            {property: "_mode", alias: "mode", default: EButtonMode.Common},
        );
        return fields;
    }

    public static UP: string = "up";
    public static DOWN: string = "down";
    public static OVER: string = "over";
    public static SELECTED_OVER: string = "selectedOver";
    public static DISABLED: string = "disabled";
    public static SELECTED_DISABLED: string = "selectedDisabled";

    private _selected: boolean = false;
    private _title: string = "";
    private _icon: string = "";
    private _titleColor: number = 0;
    private _mode: EButtonMode = EButtonMode.Common;

    protected _titleObject: UITextField;
    protected _iconObject: UIImage;
    protected _buttonPropManager: PropertyManager;

    private _down: boolean = false;
    private _over: boolean = false;
    
    public constructor(scene: ViewScene) {
        super(scene);

        this.on(Events.PointerEvent.OVER, this._rollover, this);
        this.on(Events.PointerEvent.OUT, this._rollout, this);
        this.on(Events.PointerEvent.DOWN, this._mousedown, this);
        this.on(Events.GestureEvent.Click, this._click, this);
    }    

    protected constructFromJson() {
        super.constructFromJson();

        if(this._iconObject) {
            this._iconObject.textureKey = this._icon;
        }

        if(this._titleObject) {
            this._titleObject.text = this._title;
            this._titleObject.titleColor = this._titleColor;
        }
    }

    public get icon(): string {
        return this._icon;
    }

    public set icon(val: string) {
        if(this._icon != val) {
            this._icon = val;
            
            if(this._iconObject) {
                this._iconObject.textureKey = val;
            }
        }
    }

    public get title(): string {
        return this._title;
    }

    public set title(val: string) {
        if(this._title != val) {
            this._title = val;

            if(this._titleObject) {
                this._titleObject.text = val;
            }
        }
    }

    public get titleColor(): number {
        return this._titleColor;
    }

    public set titleColor(val: number) {
        if(this._titleColor != val) {
            this._titleColor = val;

            if(this._titleObject) {
                this._titleObject.titleColor = val;
            }
        }
    }

    public get selected(): boolean {
        return this._selected;
    }

    public set selected(val: boolean) {
        if(this._selected != val) {
            this._selected = val;
        }
    }

    protected onComponentChanged() {
        super.onComponentChanged();
        this._searchAll();
    }

    private _searchAll() {
        if(this.propertyComponent) {
            this._buttonPropManager = this.propertyComponent.get('button');
        }else{
            this._buttonPropManager = null;
        }
    }

    public ensureAllCorrect() {
        super.ensureAllCorrect();
        this._searchAll();
    }

    protected onChildrenChanged() {
        super.onChildrenChanged();

        this._iconObject = this.getChild("icon") as UIImage;
        this._titleObject = this.getChild("title") as UITextField;
    }

    private _rollover(sender: View, pointer: Input.Pointer) {        
        if(!this._buttonPropManager) {
            return;
        }
        
        this._over = true;
        if(this._down) {
            return;
        }

        this._buttonPropManager.applyTo(this._selected ? UIButton.SELECTED_OVER : UIButton.OVER);
    }

    private _rollout(sender: View, pointer: Input.Pointer) {
        if(!this._buttonPropManager) {
            return;
        }
        
        this._over = false;
        if(this._down) {
            return;
        }

        this._buttonPropManager.applyTo(this._selected ? UIButton.DOWN : UIButton.UP);
    }

    private _mousedown(sender: View, pointer: Input.Pointer) {
        this._down = true;
        this.root.on(Events.PointerEvent.UP, this._mouseup, this);

        if (this._mode == EButtonMode.Common) {
            if(this._buttonPropManager) {
                if (this.grayed && this._buttonPropManager.has(UIButton.DISABLED)) {
                    this._buttonPropManager.applyTo(UIButton.SELECTED_DISABLED);
                } else {
                    this._buttonPropManager.applyTo(UIButton.DOWN);
                }
            }
        }
    }

    private _mouseup(sender: View, pointer: Input.Pointer) {
        if(this._down) {
            this._down = false;
            this.root.off(Events.PointerEvent.UP, this._mouseup, this);

            if (this._mode == EButtonMode.Common) {
                if(this._buttonPropManager) {
                    if (!this.grayed && this._buttonPropManager.has(UIButton.DISABLED)) {
                        this._buttonPropManager.applyTo(UIButton.DISABLED);
                    } else if (this._over && this._buttonPropManager.has(UIButton.OVER)) {
                        this._buttonPropManager.applyTo(UIButton.OVER);
                    } else {
                        this._buttonPropManager.applyTo(UIButton.UP);
                    }
                }
            }
        }
    }

    private _click(sender: View, pointer: Input.Pointer) {
        if (this._mode == EButtonMode.Check) {
            this.selected = !this._selected;
            this.emit(Events.StateChangeEvent.CHANGED, this);
        }
        else if (this._mode == EButtonMode.Radio) {
            if (!this._selected) {
                this.selected = true;
                this.emit(Events.StateChangeEvent.CHANGED, this);
            }
        }
    }

    public dispose():void {
        this.root.off(Events.PointerEvent.UP, this._mouseup, this);
        super.dispose();
    }
}