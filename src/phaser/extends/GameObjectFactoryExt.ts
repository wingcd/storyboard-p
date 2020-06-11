
export class GameObjectFactoryExt {
    private _scene: any;

    constructor(scene: Phaser.Scene) {
        this._scene = scene;
    }

    addTyping(text:Phaser.GameObjects.Text, config?: any): TextTyping {
        if(config) {
            if(TextTyping) {
                let typing: TextTyping = new TextTyping(text, config);
                if(typing.start) {
                    typing.start(text.text);
                }
                return typing;
            }
        }
        return null;
    }

    text(x:number, y:number, text: string, config?: any): Phaser.GameObjects.Text {
        let nText = this._scene.add.text(x, y, text, config);            
        this.addTyping(nText, config.typing);
        return nText;
    }

    richText(x:number, y:number, text: string, config?: any): BBCodeText {
        if(this._scene.add.rexBBCodeText) {
            if(text && config.fontSize == null) {
                let sizeRex = /size ?= ?(\d+)/ig;
                let match = [];
                let maxSize = 0;
                while((match = sizeRex.exec(text)) !== null) {
                    maxSize = Math.max(maxSize, parseInt(match[1]));
                }

                if(maxSize > 0) {
                    config.fontSize = maxSize;
                }
            }

            let richText:BBCodeText = this._scene.add.rexBBCodeText(x, y, text, config);
            richText.typing = this.addTyping(richText, config.typing);
            return richText;
        }
        return null;
    }

    /**
     * @see https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ninepatch/
     * @param x Position of this object.
     * @param y Position of this object.
     * @param width Size of this object.
     * @param height Size of this object.
     * @param key Texture key of source image.
     * @param baseFrame Frame name of base texture
             undefined : Use default base frame '__BASE'.
     * @param columns Configuration of columns
             A number array, like [20, 20, 20], or [20, undefined, 20] : Width of each column. undefined value will be replaced by remainder value from texture width.
             Width of odd columns (column 0, column 2, ...) will be origin width.
             Width of even columns (column 1, column 3, ...) will be stretched.
     * @param rows Configuration of rows
             A number array, like [20, 20, 20], or [20, undefined, 20] : Height of each row. undefined value will be replaced by remainder value from texture width.
             Height of odd rows (row 0, row 2, ...) will be origin height.
             Height of odd rows (row 1, row 3, ...) will be stretched.
     * @param config 
     * stretchMode : Stretch mode of edges and internal cells
     *              A number (0, or 1), or a string ('scale', or 'repeat'):
                        0, or 'scale' : Stretch each edge and internal cell by scaled image. Default value.
                        1, or 'repeat' : Stretch each edge and internal cell by repeated image (tile-sprite).
                    An object :
                        {
                            edge: 0, // 'scale', or 1, 'repeat'
                            internal: 0, // 'scale', or 1, 'repeat'
                        }
     * getFrameNameCallback : Callback to get frame name of each cell.
                    undefined : Use default callback.
                        If baseFrame is '__BASE' : return ${colIndex},${rowIndex}
                        Else : return ${baseFrame}_${colIndex},${rowIndex}
                    Function object : Return a string, or undefined.
                        function(colIndex, rowIndex, baseFrame) {
                            return `${colIndex},${rowIndex}`;
                        }
     */
    ninePatchTexture(x:number|object, y?:number|object, 
        width?:number|object, height?:number|object, 
        key?:string|object, baseFrame?:string|object, 
        columns?:number[]|object, rows?:number[]|object, 
        config?:any): NinePatch {
            if(this._scene.add.rexNinePatch) {    
                if(!baseFrame) {
                    baseFrame = undefined;
                }
                if(config && !config.baseFrame) {
                    config.baseFrame = undefined;
                }
                let ninePath:NinePatch = this._scene.add.rexNinePatch(x, y, width, height, key, baseFrame, columns, rows, config);
                return ninePath;
            }
            return null;
        }
}