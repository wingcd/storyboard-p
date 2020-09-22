import { View } from "../core/View";
import { ISerializeInfo } from "../annotations/Serialize";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import * as Events from "../events";
import { Input } from "../phaser";
import { PropertyComponent } from "../components/PropertyComponent";
import { PropertyManager } from "../tween/Property";
                    
export const enum EButtonMode { Common, Check, Radio };
export class UIButton extends ViewGroup {
    static TYPE = "button";

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = ViewGroup.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_selected", alias: "selected", default: false},
            {property: "_title", alias: "title", default: ""},
            {property: "_icon", alias: "icon", default: ""},
            {property: "_titleColor", alias: "titleColor", default: 0},
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

    protected _titleObject: View;
    protected _iconObject: View;
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

    protected onComponentChanged() {
        super.onComponentChanged();

        if(this.propertyComponent) {
            this._buttonPropManager = this.propertyComponent.get('button');
        }else{
            this._buttonPropManager = null;
        }
    }

    private _rollover(sender: View, pointer: Input.Pointer) {
        this._over = true;
        
        if(!this._buttonPropManager) {
            return;
        }
        
        if(this._down) {
            return;
        }

        this._buttonPropManager.applyTo(this._selected ? UIButton.SELECTED_OVER : UIButton.OVER);
    }

    private _rollout(sender: View, pointer: Input.Pointer) {
        this._over = false;
    }

    private _mousedown(sender: View, pointer: Input.Pointer) {
        this._down = true;
    }

    private _click(sender: View, pointer: Input.Pointer) {
        this._down = false;
    }

    public get icon(): string {
        return this._icon;
    }

    public get title(): string {
        return this._title;
    }

    public set title(val: string) {
        if(this._title != val) {
            this._title = val;
        }
    }

    public get titleColor(): number {
        return this._titleColor;
    }

    public set titleColor(val: number) {
        if(this._titleColor != val) {
            this._titleColor = val;
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
}