import { View } from "../core/View";
import { IExtendsValue, ISerializeInfo, IUIButton } from "../types";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { Input } from "../phaser";
import { PropertyManager } from "../tween/Property";
import { UIImage } from "./UIImage";
import { UITextField } from "./UITextField";
import { EButtonMode } from "../core/Defines";
require("../components");
                    
export class UIButton extends ViewGroup implements IUIButton {
    static TYPE = "button";

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = ViewGroup.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_selected", alias: "selected", default: false},     
            {property: "_mode", alias: "mode", default: EButtonMode.Common},
            {property: "_relatedPropMgrId", alias: "propMgrId"},
            {property: "_propertyGroupId", alias: "groupId"},
            {property: "_changeStateOnClick", alias: "changeStateOnClick", default: true},
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
    private _mode: EButtonMode = EButtonMode.Common;
    private _changeStateOnClick: boolean = true;

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
        this.on(Events.GestureEvent.CLICK, this._click, this);
    }    

    public get mode(): EButtonMode {
        return this._mode;
    }

    public set mode(value: EButtonMode) {
        if (this._mode != value) {
            if (value == EButtonMode.Common)
                this.selected = false;
            this._mode = value;
        }
    }

    public get icon(): string {
        if(this._iconObject) {
            return this._iconObject.textureKey;
        }
        return ""
    }

    public set icon(val: string) {
        if(this._iconObject) {
            this._iconObject.textureKey = val;
        }
    }

    public get title(): string {
        if(this._titleObject) {
            return this._titleObject.text;
        }
        return "";
    }

    public set title(val: string) {
        if(this._titleObject) {
            this._titleObject.text = val;
        }
    }

    public get titleColor(): number {
        if(this._titleObject) {
            return this._titleObject.titleColor;
        }
        return 0;
    }

    public set titleColor(val: number) {
        if(this._titleObject) {
            this._titleObject.titleColor = val;
        }
    }

    public get text(): string {
        return this.title;
    }

    public set text(value: string) {
        this.title = value;
    }

    public get changeStateOnClick(): boolean {
        return this._changeStateOnClick;
    }

    public set changeStateOnClick(value: boolean) {
        this._changeStateOnClick = value;
    }

    public get selected(): boolean {
        return this._selected;
    }

    public set selected(val: boolean) {
        if (this._mode == EButtonMode.Common)
            return;

        if (this._selected != val) {
            this._selected = val;

            if(this._buttonPropManager) {
                let hasDisable = this._buttonPropManager.has(UIButton.DISABLED);
                let hasSelectedDisable = this._buttonPropManager.has(UIButton.SELECTED_DISABLED);
                if (this.grayed && this._buttonPropManager && (hasDisable || hasSelectedDisable)) {
                    if (this._selected && hasSelectedDisable) {
                        this._buttonPropManager.applyTo(UIButton.SELECTED_DISABLED);
                    }
                    else {
                        this._buttonPropManager.applyTo(UIButton.DISABLED);
                    }
                }
                else {
                    if (this._selected) {
                        let over = this._over && this._buttonPropManager.has(UIButton.SELECTED_OVER);
                        this._buttonPropManager.applyTo(over ? UIButton.SELECTED_OVER : UIButton.DOWN);
                    }
                    else {
                        let over = this._over && this._buttonPropManager.has(UIButton.OVER);
                        this._buttonPropManager.applyTo(over ? UIButton.OVER : UIButton.UP);
                    }
                }
            }

            if(val && this._mode == EButtonMode.Radio && this.parent) {
                for(let p of this.parent.children) {
                    if(p != this && p instanceof UIButton && p.mode == EButtonMode.Radio) {
                        p.selected = false;
                    }
                }
            }
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