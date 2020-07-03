import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EAutoSizeType, EAlignType, EVertAlignType, EHorAlignType } from "../core/Defines";

Settings.showDebugBorder = true;
// Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.bitmapFont('ui://fonts/ice', 'res/fonts/iceicebaby.png', 'res/fonts/iceicebaby.xml');
    }

    create(): void {
        let textfield = this.addUI.textinput();
        textfield.setSize(300, 40);        
        textfield.text = 'abc';
        textfield.autoSize = EAutoSizeType.None;
        textfield.textAlign = EAlignType.Left;
        textfield.verticalAlign = EVertAlignType.Top;
        textfield.horizontalAlign = EHorAlignType.Left;

        let text = this.addExt.richText(100, 200, 'abc', {
            color: 'yellow',
            fontSize: '24px',
            fixedWidth: 200,
            // fixedHeight: 80,
            backgroundColor: '#333333',
        });
        text.setOrigin(0.5)
            .setInteractive();
        let edit = (require('../libs/rex/behaviors/textedit/Edit.js').default);
        text.on('pointerdown', ()=>{
            edit(text);
        }, this);
    }
}

export class App extends Phaser.Game {
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }
}

const config: Phaser.Types.Core.GameConfig = {
    title: "Starfall",
    parent: "game",
    width: 960,
    height: 540,
    backgroundColor: "#f0f0f0",    
    scene: [UIScene],  
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,   
    },
    dom: {
        createContainer: true
    },
    plugins: {
        global: [
            {key: 'storyboard-ui', plugin: UIManager, start: true, mapping: 'uimgr'},
            {key: 'orientation', plugin: StageScalePlugin, start: true, mapping: 'scaleEx', data: {
                orientation: EStageOrientation.LANDSCAPE,
                scaleMode: EStageScaleMode.FIXED_AUTO,
                // alignV: EStageAlign.CENTER,
                // alignH: EStageAlign.MIDDLE,
            }},
        ]
    }
};


window.onload = () => {
    var game = new App(config);
}