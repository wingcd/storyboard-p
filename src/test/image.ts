import { StageScalePlugin, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { ETextureScaleType } from "../core/Defines";
import { Settings } from "../core/Setting";

Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('nine', './res/44.png');
        this.load.svg('role', './res/imgs/role.svg');
    }

    create(): void {
        this.add.image(0,0,'nine');

        let view = this.addUI.image({
           scaleType: ETextureScaleType.NinePatch,
           textureKey: "nine",
           tile: {
            scaleX: 0.5,
            scaleY: 0.5,
           },
           ninePatch: {
            left: 0.2,     
            right: 0.8,   
            top: 0.2,   
            bottom: 0.8,      
            stretchMode: {
                edge: 0,
                internal: 1,
            }       
           },
           tint: 0xffffff,
        });
        view.setXY(100, 100);
        view.setSize(300, 100);
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