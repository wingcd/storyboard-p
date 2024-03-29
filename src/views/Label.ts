import { ViewGroup } from "../core/ViewGroup";
import { ILabel } from "../types";
import { Image } from "./Image";
import { TextInput } from "./TextInput";
require("../components");
                    
export class Label extends ViewGroup  implements ILabel{
    static TYPE = "label";

    protected _titleObject: TextInput;
    protected _iconObject: Image;

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

    public get fontSize(): number {
        if(this._titleObject) {
            return this._titleObject.fontSize;
        }
        return 0;
    }

    public set fontSize(value: number) {
        if(this._titleObject) {
            this._titleObject.fontSize = value;
        }
    }

    public get editable(): boolean {
        if(this._titleObject) {
            return this._titleObject.editable;
        }
        return false;
    }

    public set editable(val: boolean) {
        if(this._titleObject) {
            this._titleObject.editable = val;
        }
    }

    protected onChildrenChanged() {
        super.onChildrenChanged();

        this._iconObject = this.getChild("icon") as Image;
        this._titleObject = this.getChild("title") as TextInput;
    }
}