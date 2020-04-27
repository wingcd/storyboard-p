import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
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

        this.load.image('aaa', './res/1.jpg');
    }

    create() {
        let view = this.addUI.group();
        view.setBackgroundColor(0xa0a0a0, true);
        view.setXY(100, 50);
        view.setSize(550, 400);
        view.overflowType = EOverflowType.Hidden;

        this.tweens.add({
            targets: view,
            x: { value: 400, duration: 3000, yoyo: true, ease: 'Quad.easeInOut' },
        })
        
        let child1 = this.makeUI.view();
        child1.setBackgroundColor(0x00ff00, true);
        child1.setXY(200, 200);
        child1.angle = 45;
        child1.useBorderAsFrame = false;
        view.addChild(child1);
        child1.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Pointer, localX: number, localY: number, event: EventData)=>{
            console.log(`${localX},${localY}`);
        });       
        
        let g = view.scene.make.graphics({}, false);
        g.clear();
        g.setPosition(50, 300);
        g.fillCircle(0, 0, 200);
        view.mask = g.createGeometryMask();

        // let smk = this.add.sprite(50, 50, 'aaa');
        // smk.setSize(100, 100);
        // view.mask = smk.createBitmapMask();

        // has bug if use geometry mask with invert alpha when overlay is hidden
        // view.mask.invertAlpha = true;

        let child2 = this.makeUI.view();
        child2.setBackgroundColor(0xffff00, true);
        child2.setXY(500, 100);
        view.addChild(child2);
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
    type: Phaser.WEBGL,
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