import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageAlign, EStageOrientation } from "../phaser";
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

        let div = document.createElement("div");
        div.style.position = "absolute";
        div.style.top = '0px';
        div.style.left = '0px';
        div.style.height = "20px";
        div.style.width = "100px";
        div.style.backgroundColor = "#ffff00";
        div.innerHTML = 'FIXED_AUTO'; 
        document.body.appendChild(div);

        let idx = 0;
        const values = Object.values(EStageScaleMode);
        this.time.addEvent({            
            delay: 3000,
            loop: true,
            callback: ()=>{
                let mode = values[idx];
                div.innerHTML = mode; 
                (this as any).scaleEx.scaleMode = mode;
                idx = (idx + 1) % values.length;
            }
        });
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