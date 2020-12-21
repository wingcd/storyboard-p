import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let view = this.addUI.view();
        view.setBackgroundColor(0xff0000, true);
        view.setXY(100, 50);
        view.setSize(200, 40);
        
        view.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Pointer, localX: number, localY: number, event: EventData)=>{
            console.log(`${localX},${localY}`);
        });

        this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Pointer, currentlyOver: GameObject[]) => {
            let pos = view.globalToLocal(pointer.downX, pointer.downY);
            console.log(`global ${pointer.downX},${pointer.downY} local ${pos.x}, ${pos.y}`);
            pos = view.localToGlobal(pos.x, pos.y);
            console.log(`global ${pos.x}, ${pos.y}`);
        });
    }

    create(): void {
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        if(!(this as any).__fps) {
            (this as any).__fps = this.addUI.textField({
                width: 100,
                height: 30, 
                style: {
                    color: 0xff0000,
                },
                x: 300,
                y: 0,
            });
        }
        (this as any).__fps.text = 1000 / delta;
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
            {key: 'storyboard-ui', plugin: ViewManager, start: true, mapping: 'uimgr'},
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