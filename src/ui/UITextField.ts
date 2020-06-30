import { View } from "../core/View";
import { Text, BitmapText, Point, ITextStyle, Color } from "../phaser";
import { EVertAlignType, EAutoSizeType, EAlignType } from "../core/Defines";
import { ViewScene } from "../core/ViewScene";
import { Settings } from "../core/Setting";

export class LineInfo {
    public width: number = 0;
    public height: number = 0;
    public textHeight: number = 0;
    public text: string;
    public y: number = 0;

    private static pool: LineInfo[] = [];

    public static get(): LineInfo {
        if (LineInfo.pool.length) {
            let ret: LineInfo = LineInfo.pool.pop();
            ret.width = 0;
            ret.height = 0;
            ret.textHeight = 0;
            ret.text = null;
            ret.y = 0;
            return ret;
        }
        else
            return new LineInfo();
    }

    public static recycle(value: LineInfo): void {
        LineInfo.pool.push(value);
    }

    public static recycleMany(value: LineInfo[]): void {
        if(value && value.length)
        {
            value.forEach(v => {
                LineInfo.pool.push(v);
            }, this);
        }
        value.length = 0;
    }
}

export interface ITextField {

}

export class UITextField extends View {
    private _textField: Text;
    private _richTextField: BBCodeText;
    private _bitmapTextField: BitmapText;   
    private _lines: LineInfo[];

    private _text: string = "";
    private _rich: boolean = false;

    private _style: ITextStyle;
    private _verticalAlign: EVertAlignType = EVertAlignType.Top;
    private _offset: Point = new Point();
    private _singleLine:boolean = true;

    private _autoSize: EAutoSizeType;
    private _widthAutoSize: boolean;
    private _heightAutoSize: boolean;

    private _requireRender: boolean;
    private _updatingSize: boolean;
    private _sizeDirty: boolean;

    private _textWidth: number = 0;
    private _textHeight: number = 0;
    
    public static GUTTER_X: number = 2;
    public static GUTTER_Y: number = 2;

    public constructor(scene: ViewScene, config?: ITextField | any) {
        super(scene, config);

        this._style = {
            fontSize: 24,
            align: EAlignType.Left,
            leading: 3,
            color: 0,
        };
        this._verticalAlign = EVertAlignType.Top;
        this._text = "";
        this._autoSize = EAutoSizeType.Both;
        this._widthAutoSize = true;
        this._heightAutoSize = true;

        this.touchable = false;  //base GTextField has no interaction

        this.fromJSON(config);
    }

    public get font(): string {
        return this._style.fontFamily;
    }

    public set font(val: string) {
        if(this._style.fontFamily != val) {
            this._style.fontFamily = val;
            if(val && val.startsWith("ui://")) {
                this.switchBitmapMode(true);
            }else{
                this.switchBitmapMode(false);
            }
        }
    }

    public get fontSize(): number {
        return this._style.fontSize;
    }

    public set fontSize(val: number) {
        if(val != this._style.fontSize) {
            this._style.fontSize = val;

            this.render();
        }
    }

    public get text(): string {
        return this._text;
    }

    public set text(val: string) {
        if(val != this.text) {
            this._text = val;

            this.render();
        }
    }

    public get rich(): boolean {
        return this._rich;
    }

    public set rich(val: boolean) {
        if(val != this._rich) {
            this._rich = val;

            this.render();
        }
    }

    private switchBitmapMode(val: boolean): void {
        if(val) {
            if(this._textField) {
                this._textField.destroy();
                this._textField = null;
            }
            if(this._richTextField) {
                this._richTextField.destroy();
                this._richTextField = null;
            }
            if(!this._bitmapTextField) {
                this._bitmapTextField = this._scene.add.bitmapText(0, 0, this.font);
                this.setDisplayObject(this._bitmapTextField);
            }            
        }else if(!this._rich){
            if(this._bitmapTextField) {
                this._bitmapTextField.destroy();
                this._bitmapTextField = null;
            }
            if(this._richTextField) {
                this._richTextField.destroy();
                this._richTextField = null;
            }
            if(!this._textField) {
                this._textField = this._scene.addExt.text(0, 0, "");
                this.setDisplayObject(this._textField);
            }
        }else {
            if(this._bitmapTextField) {
                this._bitmapTextField.destroy();
                this._bitmapTextField = null;
            }
            if(this._textField) {
                this._textField.destroy();
                this._textField = null;
            }
            if(!this._richTextField) {
                this._richTextField = this._scene.addExt.richText(0, 0, "");
                this.setDisplayObject(this._richTextField);
            }
        }

        this.render();
    }

    protected render() {
        this._requireRender = true;
        this._scene.time.addEvent({
            delay: 1,
            callback: ()=>{
                this._render();
            },
        })
    }

    private _render() {
        if(this._requireRender) {
            this.renderNow();
        }
    }

    public renderNow() {
        this._requireRender = false;
        this._sizeDirty = false;
        this.font = this._style.fontFamily || Settings.defaultFont;
        if(this._rich && !this._richTextField) {  
            if(!this.font.startsWith('ui://')) {
                this.switchBitmapMode(false);
            }
        }

        let textfield = this._textField || this._richTextField || this._bitmapTextField;

        if(this._textField) {
            this.applyStyle();
            this._textField.text = this._text;

        }else if(this._richTextField) {
            this.applyRichStyle();
            this._richTextField.text = this._text;

        }else if(this._bitmapTextField) {
            this.applyBitmapStyle();
            this._bitmapTextField.text = this._text;
        }

        this.setSize(textfield.width, textfield.height);
    } 

    private _getStyle() {
        let style: any = {};
        Object.assign(style, this._style);
        if(typeof(style.fontSize) === 'number') {
            style.fontSize = `${style.fontSize}px`;
        }
        if(typeof(style.color) === 'number') {
            let color  = Color.IntegerToRGB(style.color);
            style.color = Color.RGBToString(color.r, color.g, color.b, color.a);
        }
        if(typeof(style.backgroundColor) == 'number') {
            let color  = Color.IntegerToRGB(style.backgroundColor);
            style.backgroundColor = Color.RGBToString(color.r, color.g, color.b, color.a);
        }
        if(typeof(style.stroke) == 'number') {
            let color  = Color.IntegerToRGB(style.stroke);
            style.stroke = Color.RGBToString(color.r, color.g, color.b, color.a);
        }
        return style;
    }

    protected applyStyle() {
        if(this._textField) {
            this._textField.setStyle(this._getStyle());
        }
    }

    protected applyRichStyle() {
        if(this._richTextField) {
            this._richTextField.setStyle(this._getStyle());
        }
    }

    protected applyBitmapStyle() {
        if(this._bitmapTextField) {
            this._bitmapTextField.setFont(this.font);
            this._bitmapTextField.setFontSize(this.fontSize);
        }
    }

    public fromJSON(config: ITextField | any) {
        super.fromJSON(config);
        this.render();
    }
}