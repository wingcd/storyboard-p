import { UITextField, ITextField } from "./UITextField";
import { ViewScene } from "../core/ViewScene";
import { GameObject } from "../phaser";
import { EHorAlignType, EVertAlignType } from "../core/Defines";
import { TextEvent, FocusEvent } from "../events";

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
            if(!(textfield as any).style) {
                (textfield as any).style = {
                    backgroundColor: null,
                };
            }

            this._editor = new TextEdit(textfield); 
            let align = 'left';            
            let width = this.width - UITextField.GUTTER_X * 2;
            let paddingLeft = UITextField.GUTTER_X;
            switch(this.horizontalAlign) {
                case EHorAlignType.Left:
                    break;
                case EHorAlignType.Center:
                    align = 'center';
                    break;
                case EHorAlignType.Right:
                    align = 'right';
                    break;                
            }           
            let paddingTop = 0;
            let height = Math.min(this.fontSize, this.height - UITextField.GUTTER_Y * 2);
            switch(this.verticalAlign) {
                case EVertAlignType.Top:
                    paddingTop = UITextField.GUTTER_Y;
                    break;
                case EVertAlignType.Middle:
                    paddingTop = (this.height - height) / 2;
                    break;
                case EVertAlignType.Bottom:
                    paddingTop = (this.height - height) - UITextField.GUTTER_Y;
                    break;
            }            
            let type = this.password ? "password" : "text";
            this._editor.open({
                x:0 ,y:0,
                width: width, height: height,
                textAlign: align as any,
                onTextChanged: (textObj: any, text: string)=>{
                    textObj.text = text;
                    textfield.emit(TextEvent.Change, textfield);
                },
                onClose:(textObj: any)=>{
                    this.text = textObj.text;
                    textfield.emit(TextEvent.Changed, textfield);

                    textfield.emit(FocusEvent.CHANGED, "blur", textfield);
                    textfield.emit(TextEvent.FocusOut, textfield);
                },
                type: type as any,
            });
            this._editor.inputText.x = this.x + paddingLeft + 0.5;
            this._editor.inputText.y = this.y + paddingTop - 1.5;
            this._editor.inputText.setStyle('line-height', height + 'px');
            this._editor.inputText.setText(this._text);            

            textfield.emit(FocusEvent.CHANGED, "focus", textfield);
            textfield.emit(TextEvent.FocusIn, textfield);
        }
    }

    protected setDisplayObject(displayObject: GameObject) {
        super.setDisplayObject(displayObject);

        this.on(Phaser.Input.Events.POINTER_DOWN, ()=>{
            this._initEditor();
        }, this);
    }

    private changeToPassText(text:string):string {
        let passText: string = "";
        for (let i: number = 0, num = text.length; i < num; i++) {
            switch (text.charAt(i)) {
                case '\n':
                    passText += "\n";
                    break;
                case '\r':
                    break;
                default:
                    passText += '*';
            }
        }
        return passText;
    }

    protected renderNow(updateBounds: boolean = true): void {
        let origText = this._text;
        if(this.password) {
            this._text = this.changeToPassText(this._text);
        }
        super.renderNow(updateBounds);
        this._text = origText;
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