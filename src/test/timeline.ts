import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EEaseType } from "../core/Defines";

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let target = this.addUI.view();
        target.setBackgroundColor(0xc0c0c0, true);
        target.setXY(200, 200);
        target.timelineManager.add('x').add(500, 100, {type: EEaseType.Linear}).add(2500, 50, {type: EEaseType.Linear}).add(4000, 300);   
        // target.timelineManager.add('y').add(0, 100, {type: EEaseType.Linear}).add(2000, 200, {type: EEaseType.Linear}).add(3000, 300);        
        target.timelineManager.store();

        let state1 = this.addUI.view();
        state1.setBackgroundColor(0xc0c0c0, true);
        state1.setXY(100, 50);
        state1.setSize(100, 40);
        state1.rootContainer.add(this.add.text(20, 10, 'state A', {color: '#000000'}));
        state1.onClick(()=>{
            target.timelineManager.play();
        })

        let state2 = this.addUI.view();
        state2.setBackgroundColor(0xc0c0c0, true);
        state2.setXY(220, 50);
        state2.setSize(100, 40);
        state2.rootContainer.add(this.add.text(20, 10, 'state B', {color: '#000000'}));
        state2.onClick(()=>{
            target.timelineManager.play();
        })

        let state3 = this.addUI.view();
        state3.setBackgroundColor(0xc0c0c0, true);
        state3.setXY(340, 50);
        state3.setSize(100, 40);
        state3.rootContainer.add(this.add.text(20, 10, 'state C', {color: '#000000'}));
        state3.onClick(()=>{
            target.timelineManager.play();
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