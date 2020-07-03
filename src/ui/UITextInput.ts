import { UITextField, ITextField } from "./UITextField";
import { ViewScene } from "../core/ViewScene";
import { GameObject } from "../phaser";

export const enum EInputType {
    TEXT = "text",
    PASSWORD = "password",
    NUMBER = "number",
    EMAIL = "email",
    TEL = "tel",
    URL = "url"
};

export interface ITextInput extends ITextField {

}

export class UITextInput extends UITextField {    
    protected _editable:boolean;
    protected _editor: TextEdit = null;
    protected _inputType: EInputType;

    /**@internal */
    _isTyping:boolean = false;

    public constructor(scene: ViewScene, config?: ITextInput | any) {
        super(scene, config);

        this.focusable = true;
        this.editable = true;  //init
        
        this.type = EInputType.TEXT;
    }

    private _initEditor() {
        if(this._editor) {
            this._editor.destroy();
        }

        let textfield = this.getTextField();
        if(textfield && this._editable) {
            this._editor = new TextEdit(textfield);
            this._editor.open({
                x:0,y:0,
                width: this.width, height: this.height,
            });
        }
    }

    protected setDisplayObject(displayObject: GameObject) {
        super.setDisplayObject(displayObject);

        this.on(Phaser.Input.Events.POINTER_DOWN, ()=>{
            this._initEditor();
        }, this);
    }

    public get editable(): boolean {
        return this._editable;
    }

    public set editable(v: boolean) {
        if(v != this._editable)
        {
            this._editable = v;
            
            if(this._editable) {
                this._initEditor();
            }
            else
            {
                if(this._editor) {
                    this._editor.destroy();
                }
            }

            this.touchable = this._editable;
        }
    }

    public get password(): boolean {
        return this.type == EInputType.PASSWORD;
    }

    public set password(v: boolean) {
        this.type = EInputType.PASSWORD;
    }

    public get type(): EInputType {
        return this._inputType;
    }

    public set type(value: EInputType) {
        if(this._inputType != value) {
            this._inputType = value;
        }
    }
}