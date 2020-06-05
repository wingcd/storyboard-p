
declare class BBCodeText extends Phaser.GameObjects.Text{
    typing: TextTyping;
    addImage(data: {
        imgKey: string, config?:{
        key?: string,
        frame?: string,
        width?: number,
        height?: number,
        y?: number,
        left?: number,
        right?: number,
    }}): BBCodeText;
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