import { View } from "../core/View";
import { ISerializeInfo } from "../annotations/Serialize";
import { ViewGroup } from "../core/ViewGroup";

export class UIButton extends ViewGroup {
    public static TYPE = "button";

    private _selected: boolean;
    private _title: string;
    private _icon: string;
    private _titleColor: number;

    protected _titleObject: View;
    protected _iconObject: View;

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = View.SERIALIZABLE_FIELDS;
        fields.push(
        );
        return fields;
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