import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EOverflowType } from "../core/Defines";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;
Settings.showDebugBounds = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
    }

    create(): void {        
        let view = this.addUI.view();
        view.setBackgroundColor(0xff0000, true);
        view.setXY(50, 50);
        view.setSize(100, 100);
        view.draggable = true;

        view.useBorderAsFrame = false;
        view.angle = 45;
        view.setScale(0.5, 0.5);
        
        view = this.addUI.view();
        view.setBackgroundColor(0xffff00, true);
        view.setXY(950, 500);
        view.setSize(100, 100);
        view.draggable = true; 

        this.root.overflowType = EOverflowType.Scroll;
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