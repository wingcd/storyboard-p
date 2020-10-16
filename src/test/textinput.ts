import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EAutoSizeType, EAlignType, EVertAlignType, EHorAlignType } from "../core/Defines";
require('../components');

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
        let textfield = this.addUI.textInput();
        textfield.setXY(300, 100);
        textfield.setSize(300, 60);   
        textfield.fontSize = 30;     
        textfield.font = "ui://fonts/ice";
        textfield.text = 'abc';
        textfield.singleLine = true;
        // textfield.password = true;
        textfield.autoSize = EAutoSizeType.None;
        textfield.textAlign = EAlignType.Left;
        textfield.verticalAlign = EVertAlignType.Middle;
        textfield.horizontalAlign = EHorAlignType.Center;
        textfield.promptText = "请输入...";

        textfield.clone().y = 300;

        console.log(textfield.toJSON());
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