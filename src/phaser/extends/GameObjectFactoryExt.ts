
export class GameObjectFactoryExt {
    private _scene: any;

    constructor(scene: Phaser.Scene) {
        this._scene = scene;
    }

    addTyping(text:Phaser.GameObjects.Text, config?: any): TextTyping {
        if(config) {
            let tpPlugin = this._scene.plugins.get('rextexttypingplugin');
            if(tpPlugin) {
                let typing: TextTyping = tpPlugin.add(text, config);
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
}