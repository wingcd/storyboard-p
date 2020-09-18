import { UITextField } from "./UITextField";
import { ViewScene } from "../core/ViewScene";
import { GameObject, Color } from "../phaser";
import { EHorAlignType, EVertAlignType } from "../core/Defines";
import { TextEvent, FocusEvent, DisplayObjectEvent } from "../events";
import { Browser } from "../utils/Browser";
import { ViewEvent } from "../events/ViewEvent";
import { ViewGroup } from "../core/ViewGroup";

export const enum EInputType {
    TEXT = "text",
    PASSWORD = "password",
    NUMBER = "number",
    EMAIL = "email",
    TEL = "tel",
    URL = "url"
};

export class UITextInput extends UITextField { 
    static TYPE = "textinput";

    protected _editable:boolean;
    protected _editor: TextEdit = null;
    protected _inputType: EInputType;
    protected _promptText: string;
    protected _promptColor: number;
    private _oldColor: number;

    /**@internal */
    public static isTyping:boolean = false;

    public constructor(scene: ViewScene) {
        super(scene);

        this.focusable = true;
        this.editable = true;  //init
        
        this.inputType = EInputType.TEXT;

        this.on(ViewEvent.PARENT_CHANGED, this._onParentChanged, this);
        this.on(DisplayObjectEvent.VISIBLE_CHANGED, this._onVisiableChanged, this);

        this.render();
    }    

    private _onParentChanged(oldParent: ViewGroup, parent: ViewGroup) {
        if(!parent && this._editor) {
            this._editor.destroy();
            this._editor = null;
        }
    }

    private _onVisiableChanged(visiable: boolean) {
        if(!visiable && this._editor) {
            this._editor.destroy();
            this._editor = null;
        }
    }

    private _setPromptColor(): void {
        let color  = Color.IntegerToRGB(this._promptColor || 0);
        let cstr = Color.RGBToString(color.r, color.g, color.b, color.a);
        Browser.setPromptColor(cstr);
    }

    private _setPrompt() {
        if(this._editor) {    
            let inputText = this._editor.inputText;        
            inputText.setPlaceholder(this._promptText);
        }
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

            textfield.text = this._text;
            this._style.color = this._oldColor || 0;
            this.updateStyle();

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
            let height = Math.min(this.fontSize + UITextField.GUTTER_Y * 2, this.height);
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

            UITextInput.isTyping = true;            
            this._editor.open({
                x:0 ,y:0,
                width: width, height: height,
                textAlign: align as any,                
                onTextChanged: (textObj: any, text: string)=>{
                    textObj.text = text;
                    textfield.emit(TextEvent.Change, textfield);
                },
                onClose:(textObj: any)=>{
                    UITextInput.isTyping = false;
                    this.text = textObj.text;
                    this.render();

                    textfield.emit(TextEvent.Changed, textfield);

                    textfield.emit(FocusEvent.CHANGED, "blur", textfield);
                    textfield.emit(TextEvent.FocusOut, textfield);
                },
                type: this.multipleLine ? "textarea" : "text",
            });
            this._editor.inputText.x = this.x + paddingLeft - 0.5;
            this._editor.inputText.y = this.y + paddingTop - 1.5;
            this._editor.inputText.setStyle('line-height', height + 'px');
            this._editor.inputText.setText(this._text);
            
            this._setPrompt();
            this._setPromptColor();

            if(this.password) {  
                (this._editor.inputText.node as any).type = "password";
            }

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
        
        let origColor = this._style.color;
        if(this._promptColor == undefined) {
            if(this._style.color) {
                this._promptColor = this._style.color * 0.8;
            }else{
                this._promptColor = 0x6c6c6c;
            }
        }   
        if(!this._text && this._promptText) {
            this._style.color = this._promptColor;
        }

        if(!this._text && this._promptText) {
            this._text = this._promptText;
        }

        super.renderNow(updateBounds);

        this._text = origText;
        this._style.color = origColor;
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
        return this.inputType == EInputType.PASSWORD;
    }

    public set password(v: boolean) {
        this.inputType = EInputType.PASSWORD;
    }

    public get inputType(): EInputType {
        return this._inputType;
    }

    public set inputType(value: EInputType) {
        if(this._inputType != value) {
            this._inputType = value;
        }
    }

    public get promptText(): string {
        return this._promptText;
    }

    public set promptText(v: string) {
        if(this._promptText != v) {
            this._promptText = v;    
            this.render();        
        }
    }

    public dispose() {
        super.dispose();

        if(this._editor) {
            this._editor.destroy();
            this._editor = null;
        }
    }
}