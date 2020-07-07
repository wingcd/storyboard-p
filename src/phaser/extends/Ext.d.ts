declare class BBCodeText extends Phaser.GameObjects.Text{
    typing: TextTyping;
    addImage(key: string, config?:{
        key?: string,
        frame?: string,
        width?: number,
        height?: number,
        y?: number,
        left?: number,
        right?: number,
    }): BBCodeText;

    setWrapMode(mode: 'none'|'word'|'char'|'character'): BBCodeText;

    setWrapWidth(width:number): BBCodeText;
}

/**
 * 
 * Events: type,complete
 */
declare class TextTyping extends Phaser.Events.EventEmitter {
   constructor(gameObject: Phaser.GameObjects.GameObject, config?: any);
   get isTyping(): boolean;
   get isLastChar(): boolean;
   /**
    * @param mode 
    * 'left-to-right': 0,
    * 'right-to-left': 1,
    * 'middle-to-sides': 2,
    * 'sides-to-middle': 3
    */
   setTypeMode(mode: string|number):void;
   setTypeSpeed(params:number): void;
   start(text?:string, speed?:number, startIdx?:number, timerStartAt?:number): TextTyping;
   appendText(text?:string): TextTyping;
   stop(showAllText?:string): TextTyping;
   pause(): TextTyping;
   resume(): TextTyping;
   setTypingContent(text: string): TextTyping;
}

declare class NinePatch extends Phaser.GameObjects.RenderTexture {
    
}

declare interface IInputText {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    type?: 'text' | 'textarea' | 'password';
    textAlign?: 'left' | 'center' | 'right';
    paddingTop?: string,
    style?: any;    
    onTextChanged?: Function;
    onClose?: Function;
}
declare class InputText extends Phaser.GameObjects.DOMElement {
    constructor(scene: Phaser.Scene, x?: number|IInputText, y?:number|IInputText, width?:number|IInputText, height?:number|IInputText, config?:IInputText);
    text: string;
    placeholder: string;
    tooltip: string;
    readOnly: boolean;
    spellCheck: boolean;

    setText(value:string): this;
    selectText(): InputText;
    setPlaceholder(value: string): InputText;
    setTooltip(value:string): InputText;
    setTextChangedCallback(callback: Function): InputText; 
    setReadOnly(value: boolean): InputText;
    setSpellCheck(value: boolean): InputText;
    setStyle(key: string, value:any): void;
    getStyle(key: string): any;
    scrollToBottom(): void;
    setEnabled(value: boolean): InputText;
    setBlur(): InputText;
    setFocus(): InputText;
    resize(width: number, height: number): InputText;
}
declare class TextEdit {
    constructor(gameObject: Phaser.GameObjects.GameObject);
    open(config?: IInputText, onCloseCallback?: Function): TextEdit;
    shutdown(): TextEdit;
    destroy(): TextEdit;
    close(): TextEdit;
    get isOpened(): boolean;
    get text(): string;
    get inputText(): InputText;
}