import { View } from "../core/View";
import { Text, BitmapText, Point, ITextStyle } from "../phaser";
import { EVertAlignType, EAutoSizeType, EAlignType, EHorAlignType, ECategoryType } from "../core/Defines";
import { ViewScene } from "../core/ViewScene";
import { Settings } from "../core/Setting";
import { DisplayObjectEvent } from "../events/DisplayObjectEvent";
import { ISerializeFields, ITextField } from "../types";
import { Templates } from "../core/Templates";
import { clone, Deserialize, Serialize } from "../utils/Serialize";
import { colorToString } from "../utils/Color";
import { ComponentFactory } from "../components";
import { Package } from "../core/Package";
import { ITemplatable } from "../types/ITemplatable";

class UnderlineStyle {
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        color: {default: 0},
        thickness: {default: 1},
        offset: {default: 0},
    };

    color?: number = 0x000;
    thickness?: number = 1;
    offset?: number = 0;
}

export class TextStyle implements ITextStyle, ITemplatable {
    static CATEGORY = ECategoryType.TextStyle;
    
    static SERIALIZABLE_FIELDS: ISerializeFields = {
        CATEGORY: {alias: "__category__", static: true, readOnly: true},

        resourceUrl: {},
        id: {property: "_id"}, 

        fontFamily: {default: "Arial"},
        fontSize: {default: 16},
        fontStyle: {},
        backgroundColor: {},            
        color: {default: 0},
        stroke: {},
        strokeThickness: {},            
        shadow: {raw: true},
        padding: {raw: true},
        align: {default: "left"},
        maxLines: {},            
        fixedWidth: {},
        fixedHeight: {},
        resolution: {},
        rtl: {},            
        rtlByWord: {},
        testString: {},
        baselineX: {},
        baselineY: {},
        wordWrap: {raw: true},            
        metrics: {raw: true},
        lineSpacing: {default: 0},
        letterSpacing: {default: 0},
        vertical: {raw: true},
        
        underline: {type: UnderlineStyle},
        halign: {default: "left"},
        valign: {default: "top"},
    }

    private _id: string;
    public resourceUrl: string;

    public constructor() {
        this._id = `${Package.getUniqueID()}`;        
    }

    public get id(): string {
        return this._id;
    }

    /**
     * The font the Text object will render with. This is a Canvas style font string.
     */
    fontFamily?: string = "Arial";    
    fontSize?: number = 20;
    color?: number = 0;
    /**
     * The alignment of the Text. This only impacts multi-line text.
     *  Either `left`, `right`, `center` or `justify` in horizontal model.
     *  Either `top`, `middle`, `bottom` or `justify` in vertical model.
     */
    align?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'justify' = 'left';    
    lineSpacing?: number = 0;
    letterSpacing?: number = 0;

    underline?: UnderlineStyle;
    // in horizontal model 
    halign?: 'left'|'center'|'right'|'justify' = 'left';
    // in vertical model
    valign?: 'top'|'center'|'bottom'|'justify' = 'top';

    public clone(): TextStyle {
        let json = this.toJSON();
        return new TextStyle().fromJSON(json);
    }   

    public toJSON(tpl?: any, ignores?: string[]): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp || tpl, ignores);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            Deserialize(this, config, template);
        }

        return this;
    }
}
Templates.regist(TextStyle.CATEGORY, TextStyle);


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

export class TextField extends View  implements ITextField {
    static TYPE = "textfield";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {} as ISerializeFields,
        clone(View.SERIALIZABLE_FIELDS),
        {           
            GUTTER_X: {default: 2, static: true},
            GUTTER_Y: {default: 2, static: true},

            text: {importAs: "_text", default: ""},
            tagMode: {importAs: "_tagMode", default: false},
            style: {importAs: "_style", type: TextStyle},            
            verticalAlign: {importAs: "_verticalAlign", default: EVertAlignType.Top},
            horizontalAlign: {importAs: "_horizontalAlign", default: EHorAlignType.Left},    
            singleLine: {importAs: "_singleLine", default: true},
            autoSize: {importAs: "_autoSize", default: EAutoSizeType.Both},
        },
    );

    static SERIALIZE_INIT() 
    {      
        let fields = TextField.SERIALIZABLE_FIELDS;  
        fields.touchable.default = false;
    }

    private _textField: Text;
    protected _richTextField: BBCodeText;
    protected _canUseBitmap = true;
    private _bitmapTextField: BitmapText;

    protected _text: string = "";
    private _rich: boolean = false;
    private _tagMode: boolean = false;

    protected _style: ITextStyle = new TextStyle();
    private _verticalAlign: EVertAlignType = EVertAlignType.Top;
    private _horizontalAlign: EHorAlignType = EHorAlignType.Left;
    private _singleLine:boolean = true;
    private _autoSize: EAutoSizeType = EAutoSizeType.Both;

    // 必须需要初始化为false，否则在一些属性进行计算时，会将width和height进行改变
    private _widthAutoSize: boolean = false;
    private _heightAutoSize: boolean = false;

    private _requireRender: boolean;
    private _updatingSize: boolean;
    private _sizeDirty: boolean;

    private _offset: Point = new Point();
    private _textWidth: number = 0;
    private _textHeight: number = 0;
    
    public static GUTTER_X: number = 2;
    public static GUTTER_Y: number = 2;

    protected fromConstruct() {
        super.fromConstruct();        

        this.touchable = false;  //base GTextField has no interaction
        this._updateTextField();
        this._updateAutoSize();
        this.render();
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);

        this._updateTextField();
        this._updateAutoSize();
        this.render();
    }

    public get font(): string {
        return this._style.fontFamily;
    }

    private _updateTextField() {
        let font = this._style.fontFamily;
        if(font && font.startsWith("ui://")) {
            this.switchBitmapMode(true);
        }else{
            this.switchBitmapMode(false);
        }
    }

    public set font(val: string) {
        if(this._style.fontFamily != val) {
            this._style.fontFamily = val;
            this._updateTextField();
        }
    }

    public get fontSize(): number {
        if(typeof(this._style.fontSize) === 'number') {
            return this._style.fontSize;
        }else{
            let size = this._style.fontSize as string || '';
            return parseInt(size.replace('px', ''));
        }
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

    protected getText(): string {
        return this._text;
    }

    public get fontStyle(): string {
        return this._style.fontStyle;
    }

    public set fontStyle(val: string) {
        if(val != this._style.fontStyle) {
            this._style.fontStyle = val;

            this.render();
        }
    }

    protected get rich(): boolean {
        return this._rich;
    }

    protected set rich(val: boolean) {
        if(val != this._rich) {
            this._rich = val;

            this.render();
        }
    }

    protected get tagMode(): boolean {
        return this._tagMode;
    }

    protected set tagMode(val: boolean) {
        if(val != this._tagMode) {
            this._tagMode = val;

            this.render();
        }
    }

    public get rtl(): boolean {
        return this._style.rtl;
    }

    public set rtl(val: boolean) {
        if(this._style.rtl != val) {
            this._style.rtl = val;
            this.render();
        }
    }

    public get rtlByWord(): boolean {
        return this._style.rtlByWord;
    }

    public set rtlByWord(val: boolean) {
        if(this._style.rtlByWord != val) {
            this._style.rtlByWord = val;

            if(this.rtl) {
                this.render();
            }
        }
    }

    public get singleLine(): boolean {
        return this._singleLine;
    }

    public set singleLine(value: boolean) {
        if(this._singleLine != value) {
            this._singleLine = value;
            this.render();
        }
    }

    private _updateAutoSize() {
        if(this.verticalMode) {
            this._widthAutoSize = (this._autoSize == EAutoSizeType.Both || this._autoSize == EAutoSizeType.Width);
            this._heightAutoSize = (this._autoSize == EAutoSizeType.Both || this._autoSize == EAutoSizeType.Shrink|| this._autoSize == EAutoSizeType.Height);
        }else{
            this._widthAutoSize = (this._autoSize == EAutoSizeType.Both || this._autoSize == EAutoSizeType.Shrink || this._autoSize == EAutoSizeType.Width);
            this._heightAutoSize = (this._autoSize == EAutoSizeType.Both || this._autoSize == EAutoSizeType.Height);
        }
    }

    public set autoSize(value: EAutoSizeType) {
        if (this._autoSize != value) {
            this._autoSize = value;
            this._updateAutoSize();
            this.render();
        }
    }

    public get autoSize(): EAutoSizeType {
        return this._autoSize;
    }

    public get verticalMode(): boolean {
        return this._style.vertical != undefined && this._style.vertical.enable;
    }

    public set verticalMode(val: boolean) {
        if(this.verticalMode != val) {
            if(!this._style.vertical) {
                this._style.vertical = {};
            }
            this._style.vertical.enable = val;
            this._updateAutoSize();
            this.render();
        }
    }

    /**
     * must fixed view's height
     */
    public get verticalAlign(): EVertAlignType {
        return this._verticalAlign;
    }

    public set verticalAlign(val: EVertAlignType) {
        if(val != this._verticalAlign) {
            this._verticalAlign = val;
            this.render();
        }
    }

    /**
     * must fixed view's width
     */
    public get horizontalAlign(): EHorAlignType {
        return this._horizontalAlign;
    }

    public set horizontalAlign(val: EHorAlignType) {
        if(val != this._horizontalAlign) {
            this._horizontalAlign = val;
            this.render();
        }
    }

    /**
     * when fixed text's width or height, align of vertical or horizontal
     */
    public get textAlign(): EAlignType {
        return this._style.align as EAlignType;
    }

    public set textAlign(val: EAlignType) {
        if(this._style.align != val) {
            this._style.align = val;
            this.render();
        }
    }

    public updateMask(clear: boolean = false) {
        super.updateMask();

        let textfield = this.getTextField();
        if(textfield && this._needMask()) {
            let scale = this.getLossyScale();
            this.updateGraphicsMask(textfield, 0, 0, this.width * scale.x, this.height * scale.y, clear);
        }
    }

    private switchBitmapMode(useBitmap: boolean): void {
        if(this._canUseBitmap && useBitmap) {
            if(this._textField) {
                this._textField.destroy();
                this._textField = null;
            }
            if(this._richTextField) {
                this._richTextField.destroy();
                this._richTextField = null;
            }
            if(!this._bitmapTextField) {
                this._bitmapTextField = this.scene.add.bitmapText(0, 0, this.font);
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
                this._textField = this.scene.addExt.text(0, 0, "");
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
                this._richTextField = this.scene.addExt.richText(0, 0, "", this._tagMode);
                this.setDisplayObject(this._richTextField);
            }
        }        
        
        this.render();
    }

    protected render() {
        if(this._requireRender) {
            return;
        }
        
        this._requireRender = true;
        this.scene.time.addEvent({
            delay: 1,
            callback: ()=>{
                this._render();
            },
        });

        if (!this._sizeDirty && (this._widthAutoSize || this._heightAutoSize)) {
            this._sizeDirty = true;
            this.emit(DisplayObjectEvent.SIZE_DELAY_CHANGE, this);
        }
    }

    protected getTextField() {
        return this._textField || this._richTextField || this._bitmapTextField;
    }

    protected shrinkTextField():void {
        let textField = this.getTextField();
        let fitScale = Math.min(1, this.width / this._textWidth);
        textField.setScale(fitScale, fitScale);
    }

    private _render() {
        if(this._requireRender) {
            this.renderNow();
        }
    }

    public withBitmapFont(): boolean {
        return this.font.startsWith('ui://');
    }

    private _needMask(): boolean {
        if(this.verticalMode) {
            return !this._heightAutoSize && (this._textHeight+TextField.GUTTER_Y) > this.height;
        }else{
            return !this._widthAutoSize && (this._textWidth+TextField.GUTTER_X) > this.width;
        }
    }

    protected renderNow(updateBounds: boolean = true) {
        if(this.inBuilding) {
            return;
        }

        this._requireRender = false;
        this._sizeDirty = false;

        this.font = this._style.fontFamily || Settings.defaultFont;
        if(this._rich && !this._richTextField) {  
            if(!this.withBitmapFont()) {
                this.switchBitmapMode(false);
            }
        }

        let textfield = this.getTextField();
        if(!textfield) {
            this._updateTextField();
            textfield = this.getTextField();
        }     
        textfield.setOrigin(0, 0);

        let style = this._getStyle();            
        if(this.verticalMode) {
            let wordHeightWrap = !this._heightAutoSize && !this._singleLine;
            let warpHeight = (wordHeightWrap || this.autoSize == EAutoSizeType.None) ? Math.ceil(this.height) : 100000;
            style.wordWrap = {
                width: warpHeight,         
                useAdvancedWrap: !this._singleLine,           
            };
        }else {
            let wordWidthWrap = !this._widthAutoSize && !this._singleLine;
            let warpWidth = (wordWidthWrap || this.autoSize == EAutoSizeType.None) ? Math.ceil(this.width) : 100000;
            style.wordWrap = {
                width: warpWidth,        
                useAdvancedWrap: !this._singleLine,      
            };
        }

        // update text 
        if(this._textField || this._richTextField) {
            if(this._textField) {
                this.applyStyle(style);

            }else if(this._richTextField) {
                this.applyRichStyle(style);

            }
        }else if(this._bitmapTextField) {
            this.applyBitmapStyle(style);
        }      
        textfield.text = this._text; 

        this._textWidth = Math.ceil(textfield.width);
        if (this._textWidth > 0)
            this._textWidth += TextField.GUTTER_X * 2;   //margin gap
        this._textHeight = Math.ceil(textfield.height);
        if (this._textHeight > 0)
            this._textHeight += TextField.GUTTER_Y * 2;  //margin gap

        let w = this.width, h = this.height;
        if(this.autoSize == EAutoSizeType.Shrink)
            this.shrinkTextField();
        else if(!this.verticalMode)
        {
            textfield.setScale(1, 1);
            if (this._widthAutoSize) {
                w = this._textWidth;
                if(this._textField) {
                    this._textField.width = w;
                }else if(this._richTextField) {
                    this._richTextField.width = w;
                }
            }                
                
            if (this._heightAutoSize) {
                h = this._textHeight;
                if(this._textField) {
                    this._textField.height = h;
                }else if(this._richTextField) {
                    this._richTextField.height = h;
                }
            }
            else {
                h = this.height;
                if (this._textHeight > h) {
                    this._textHeight = h;
                }
            }            
        }else{
            textfield.setScale(1, 1);
            if (this._heightAutoSize) {
                h = this._textHeight;
                if(this._textField) {
                    this._textField.height = h;
                }else if(this._richTextField) {
                    this._richTextField.height = h;
                }
            }                
                
            if (this._widthAutoSize) {
                w = this._textWidth;
                if(this._textField) {
                    this._textField.width = w;
                }else if(this._richTextField) {
                    this._richTextField.width = w;
                }
            }
            else {
                w = this.width;
                if (this._textWidth > w) {
                    this._textWidth = w;
                }
            }  
        }

        if (updateBounds) {
            this._updatingSize = true;
            this.setSize(w, h);
            this._updatingSize = false;
        }
       
        this.handleSizeChanged();
        this.applyHitArea();
        this.updateMask();
    }

    private _getStyle(): ITextStyle {
        let style: any = {};
        Object.assign(style, this._style);
        if(typeof(style.fontSize) === 'number') {
            style.fontSize = `${style.fontSize}px`;
        }
        if(typeof(style.color) === 'number') {
            style.color = colorToString(style.color);
        }
        if(typeof(style.backgroundColor) == 'number') {
            style.backgroundColor = colorToString(style.backgroundColor);
        }
        if(typeof(style.stroke) == 'number') {
            style.stroke = colorToString(style.stroke);
        }
        if(style.resolution) {
            style.resolution = this.scene.game.config.resolution;
        }

        if(!style.underline) {
            style.underline = new UnderlineStyle();
        }
        if(typeof(style.underline.color) == 'number') {
            style.underline.color = colorToString(style.underline.color);
        }

        return style;
    }

    public updateStyle() {
        this.applyStyle(this._style);
        this.applyRichStyle(this._style);
        this.applyBitmapStyle(this._style);
    }

    protected applyStyle(style: ITextStyle) {
        if(this._textField) {
            this._textField.setStyle(style);
        }
    }

    protected applyRichStyle(style: ITextStyle) {
        if(this._richTextField) {            
            this._richTextField.setStyle(style);
            let richStyle: any = this._richTextField.style;
            if(!richStyle.resolution) {
                richStyle.resolution = this.scene.game.config.resolution;
            }
            this._richTextField.setWrapMode(this._singleLine ? 'none' : 'char');
            this._richTextField.setWrapWidth(style.wordWrap.width);
            this._richTextField.updateText();
        }
    }

    protected applyBitmapStyle(style: ITextStyle) {
        if(this._bitmapTextField) {
            this._bitmapTextField.setFont(this.font)
                                 .setFontSize(this.fontSize)
                                 .setMaxWidth(style.wordWrap.width);
        }
    }

    protected layoutAlign(): void {
        let textfield = this.getTextField();
        if(!textfield) {
            return;
        }

        let tw = this._textWidth, th = this._textHeight;
        if(this.autoSize == EAutoSizeType.Shrink)
        {
            tw *= textfield.scaleX;
            th *= textfield.scaleY;
        }
        if (this._verticalAlign == EVertAlignType.Top || th == 0)
            this._offset.y = TextField.GUTTER_Y;
        else {
            let dh: number = Math.max(0, this.height - th);
            if (this._verticalAlign == EVertAlignType.Middle)
                this._offset.y = dh * 0.5;
            else if(this._verticalAlign == EVertAlignType.Bottom)
                this._offset.y = dh;
        }
        
        let xPos = 0;
        switch(this._horizontalAlign)
        {
            case EHorAlignType.Left:
                xPos = TextField.GUTTER_X;
                break;
            case EHorAlignType.Center:
                xPos = (this.width - tw) * 0.5;
                break;
            case EHorAlignType.Right:
                xPos = this.width - tw;
                break;
        }
        this._offset.x = xPos;

        this.updatePosition();
    }

    private updatePosition():void {
        let textfield = this.getTextField();
        textfield.setPosition(Math.floor(this._offset.x), Math.floor(this._offset.y));
    }

    protected handleSizeChanged(): void {
        if (this._updatingSize)
            return;

        if(this._autoSize == EAutoSizeType.Shrink)
            this.shrinkTextField();
        else {
            let textfield = this.getTextField();
            if(textfield instanceof Text || textfield instanceof BBCodeText) {
                if (!this._widthAutoSize) {
                    if (!this._heightAutoSize) {
                        textfield.width = this.width;
                        textfield.height = this.height;
                    }
                    else {
                        textfield.width = this.width;
                    }
                }
            }
        }

        this.layoutAlign();
    }
    
    public ensureSizeCorrect(): this {
        super.ensureSizeCorrect();

        if (this._sizeDirty && this._requireRender) {
            this.renderNow();
        }

        return this;
    }

    public get textWidth(): number {
        if (this._requireRender)
            this.renderNow();
        return this._textWidth;
    }

    public get textHeight(): number {
        if (this._requireRender)
            this.renderNow();
        return this._textHeight;
    }

    public get titleColor(): number {
        return this._style.color || 0;
    }

    public set titleColor(value: number) {
        if(this._style.color != value) {
            this._style.color = value;
            this.renderNow();
        }
    }

    public get strokeColor(): number {
        return this._style.stroke;
    }

    public set strokeColor(value: number) {
        if (this._style.stroke != value) {
            this._style.stroke = value;
            this.renderNow();
        }
    }

    public fromJSON(config: any, template?: any): this {      
        if(config || template) {  
            super.fromJSON(config, template);
        }

        return this;
    }
}