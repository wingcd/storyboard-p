import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        
    }

    create(): void {
        let text = this.add.text(100, 100, "%Hello World! \n你好，世界🙂 \n你好", 
        {
            backgroundColor: '#ffff00',
            color: '#ff0000',
            align: 'right',
            // rtl: true,
            // wordWrap: {width: 50},
            lineSpacing: 2,
            
            letterSpacing: 3,
            // align: 'bottom',
            // stroke: '#0000ff',
            // strokeThickness: 2,
            shadowStroke: true,
            shadowFill: true,
            shadow: {
                fill: true,
                offsetX: 1,
                offsetY: 1,
                blur: 5,
            },
            
            // minWidth: 300,
            vertical: {
                enable: true,                
                // rotateP: true,
                // rotateWC: true,
                // punctuation: [',','!','?'],
                // miniHeight: 290,
            },
        })

        let json = text.toJSON();

        let t = this.make.text(json.data);
        // t.x = 300;

        // let tt = Phaser.GameObjects.BuildGameObject(this, t, json as any) as BBCodeText;
        t.x = 500;
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