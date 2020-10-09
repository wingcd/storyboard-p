import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Point } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EOverflowType, EScrollType } from "../core/Defines";
import { Margin } from "../utils/Margin";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;
Settings.showDebugBounds = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let view = this.addUI.group();
        view.setBackgroundColor(0xa0a0a0, true);
        view.setXY(100, 50);
        view.setSize(450, 400);
        view.margin = new Margin(100, 100, 0, 0);
        view.overflowType = EOverflowType.Scroll;
        // view.scrollPane.inertanceEffect = true;
        view.scrollPane.scrollType = EScrollType.Horizontal;
        view.scrollPane.bouncebackEffect = true;
        
        let child1 = this.makeUI.view();
        child1.setBackgroundColor(0x00ff00, true);
        child1.setXY(100, 200);
        child1.angle = 45;
        child1.useBorderAsFrame = false;
        view.addChild(child1);
        child1.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Pointer, localX: number, localY: number, event: EventData)=>{
            console.log(`${localX},${localY}`);
        });

        let child2 = this.makeUI.view();
        child2.setBackgroundColor(0xffff00, true);
        child2.setXY(700, 100);
        view.addChild(child2);
    }

    create(): void {
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
            }},
        ]
    }
};


window.onload = () => {
    var game = new App(config);
}