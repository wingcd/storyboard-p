import { UITextField } from "./UITextField";
import { ViewScene } from "../core/ViewScene";
import { GameObject, Color } from "../phaser";
import { EHorAlignType, EVertAlignType } from "../core/Defines";
import { TextEvent, FocusEvent, DisplayObjectEvent } from "../events";
import { Browser } from "../utils/Browser";
import { ViewGroup } from "../core/ViewGroup";
import { ISerializeFields, IUITextField } from "../types";
import * as Events from "../events";
import { clone } from "../utils/Serialize";

export const enum EInputType {
    TEXT = "text",
    PASSWORD = "password",
    NUMBER = "number",
    EMAIL = "email",
    TEL = "tel",
    URL = "url"
};

export class UITextInput extends UITextField  implements IUITextField{ 
    static TYPE = "textinput";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {} as ISerializeFields,
        clone(UITextField.SERIALIZABLE_FIELDS),
        {            
            editable: {property: "_editable", default: true},
            inputType: {property: "_inputType", default: EInputType.TEXT},
            promptText: {property: "_promptText", },
            promptColor: {property: "_promptColor", },
        }
    );

    static SERIALIZE_INIT() 
    {      
        let fields = UITextInput.SERIALIZABLE_FIELDS;  
        fields.touchable.default = true;        
        fields.focusable.default = true;
    }

    protected _editable:boolean = true;
    protected _inputType: EInputType = EInputType.TEXT;
    protected _promptText: string;
    protected _promptColor: number;

    protected _editor: TextEdit = null;    
    private _oldColor: number;

    /**@internal */
    public static isTyping:boolean = false;

    public constructor(scene: ViewScene) {
        super(scene);

        this.touchable = true;
        this.focusable = true;
        this.inputType = EInputType.TEXT;

        this.on(DisplayObjectEvent.PARENT_CHANGED, this._onParentChanged, this);
        this.on(DisplayObjectEvent.VISIBLE_CHANGED, this._onVisiableChanged, this);

        this.render();
    }    

    protected constructFromJson(config: any, tpl?:any) {
        super.constructFromJson(config, tpl);

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
            // this.updateStyle();

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

                align: align as any,
                fontSize: this._style.fontSize + "px",

                onTextChanged: (textObj: any, text: string)=>{
                    textObj.text = text;
                    textfield.emit(TextEvent.CHANGE, textfield);
                },
                onClose:(textObj: any)=>{
                    UITextInput.isTyping = false;
                    this.text = textObj.text;
                    this.render();

                    textfield.emit(TextEvent.CHANGED, textfield);

                    textfield.emit(FocusEvent.CHANGED, "blur", textfield);
                    textfield.emit(TextEvent.FOCUS_OUT, textfield);
                },
                type: !this.singleLine ? "textarea" : "text",
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
            textfield.emit(TextEvent.FOCUS_IN, textfield);
        }
    }

    protected setDisplayObject(displayObject: GameObject) {
        super.setDisplayObject(displayObject);

        this.on(Events.PointerEvent.DOWN, this._onPointerDown, this);
    }

    private _onPointerDown() {
        this._initEditor();
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

    public get promptColor(): number {
        return this._promptColor;
    }

    public set promptColor(v: number) {
        if(this._promptColor != v) {
            this._promptColor = v;    
            this.render();        
        }
    }

    public dispose() {
        super.dispose();

        this.off(Events.PointerEvent.DOWN, this._onPointerDown, this);

        if(this._editor) {
            this._editor.destroy();
            this._editor = null;
        }
    }
}