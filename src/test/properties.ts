import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let target = this.addUI.view();
        target.setBackgroundColor(0xc0c0c0, true);
        target.setXY(200, 200);
        target.propertyManager.add("s1");
        target.propertyManager.add("s2")
            .add('backgroundColor', 0xffff00)
            .add('width', 200)
            .add('angle', 45);
        target.propertyManager.add("s3")
            .add('backgroundColor', 0xff00ff)
            .add('width', 100)
            .add('height', 100);
        target.propertyManager.store();

        let state1 = this.addUI.view();
        state1.setBackgroundColor(0xc0c0c0, true);
        state1.setXY(100, 50);
        state1.setSize(100, 40);
        state1.rootContainer.add(this.add.text(20, 10, 'state A', {color: '#000000'}));
        state1.onClick(()=>{
            target.propertyManager.applyTo('s1');
        })

        let state2 = this.addUI.view();
        state2.setBackgroundColor(0xc0c0c0, true);
        state2.setXY(220, 50);
        state2.setSize(100, 40);
        state2.rootContainer.add(this.add.text(20, 10, 'state B', {color: '#000000'}));
        state2.onClick(()=>{
            target.propertyManager.applyTo('s2');
        })

        let state3 = this.addUI.view();
        state3.setBackgroundColor(0xc0c0c0, true);
        state3.setXY(340, 50);
        state3.setSize(100, 40);
        state3.rootContainer.add(this.add.text(20, 10, 'state C', {color: '#000000'}));
        state3.onClick(()=>{
            target.propertyManager.applyTo('s3');
        })
        
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
                // alignV: EStageAlign.CENTER,
                // alignH: EStageAlign.MIDDLE,
            }},
        ]
    }
};


window.onload = () => {
    var game = new App(config);
}