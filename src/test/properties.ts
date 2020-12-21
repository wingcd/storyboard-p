import { StageScalePlugin, EStageScaleMode, EStageOrientation } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { PropertyManager } from "../tween/Property";
import { EEaseType, EFillType } from "../core/Defines";
require("../components");

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {        
        this.load.image('img', './res/1.jpg');
    }

    create(): void {
        let target = this.addUI.image({
            textureKey: 'img',
        });

        target.setBackgroundColor(0xc0c0c0, true);
        target.setXY(200, 200);
        let propertyManager = new PropertyManager();
        propertyManager.bindTarget(target);
        propertyManager.add("s1");
        propertyManager.add("s2")
            .add('width', 200, null, {type: EEaseType.Linear, duration: 200})
            .add('angle', 45, null, {type: EEaseType.Linear, duration: 200});
        propertyManager.add("s3")
            .add('width', 100)
            .add('tint', 0xff0000, null, {type: EEaseType.Linear, duration: 200})   
            .add('fillMask.fillType', EFillType.Horizontal)      
            .add('fillMask.value', 0.5);
        propertyManager.store();

        let state1 = this.addUI.view();
        state1.setBackgroundColor(0xc0c0c0, true);
        state1.setXY(100, 50);
        state1.setSize(100, 40);
        state1.rootContainer.add(this.add.text(20, 10, 'state A', {color: '#000000'}));
        state1.onClick(()=>{
            propertyManager.applyTo('s1');
        })

        let state2 = this.addUI.view();
        state2.setBackgroundColor(0xc0c0c0, true);
        state2.setXY(220, 50);
        state2.setSize(100, 40);
        state2.rootContainer.add(this.add.text(20, 10, 'state B', {color: '#000000'}));
        state2.onClick(()=>{
            propertyManager.applyTo('s2');
        })

        let state3 = this.addUI.view();
        state3.setBackgroundColor(0xc0c0c0, true);
        state3.setXY(340, 50);
        state3.setSize(100, 40);
        state3.rootContainer.add(this.add.text(20, 10, 'state C', {color: '#000000'}));
        state3.onClick(()=>{
            propertyManager.applyTo('s3');
        })
        
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