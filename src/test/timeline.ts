import { StageScalePlugin, EStageScaleMode, EStageOrientation } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { EEaseType, EFillType } from "../core/Defines";
import { TimelineManager } from "../tween/Timeline";
require("../components");

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('nine', './res/1.jpg');
    }

    create() {
        let target = this.addUI.image({
            textureKey: "nine",
        });
        target.setBackgroundColor(0xc0c0c0, true);
        target.setXY(200, 200);
        let timeline = new TimelineManager().bindTarget(this, target);
        timeline.add('x').
            add(0, 100, {type: EEaseType.Linear}).
            add(2000, 200, {type: EEaseType.Linear}).
            add(4000, 400, {type: EEaseType.Linear}).
            add(5000, 600);   

        target.fillMask.fillType = EFillType.Rotate360;
        timeline.add("fillMask.value").
            add(0, 0, {type: EEaseType.Linear, repeat: 2}).
            add(2000, 1);

        // target.timelineManager.add("visible").
        //     add(0, true).
        //     add(4000, false);

        // target.timelineManager.add('y').add(0, 100, {type: EEaseType.Linear}).add(2000, 200, {type: EEaseType.Linear}).add(3000, 300);        
        timeline.store();
        let start = Date.now();
        // target.on(TimelineEvent.UPDATE, (sender: any)=>{
        //     console.log(`x${target.x},y:${target.y}:${target.data}`);
        //     console.log(`${target.timelineManager.totalProgress}--${(Date.now() - start) / 1000}`);
        // });

        let state1 = this.addUI.view();
        state1.setBackgroundColor(0xc0c0c0, true);
        state1.setXY(100, 50);
        state1.setSize(100, 40);
        state1.rootContainer.add(this.add.text(20, 10, '0-1', {color: '#000000'}));
        state1.onClick(()=>{
            timeline.play();
        })

        let state2 = this.addUI.view();
        state2.setBackgroundColor(0xc0c0c0, true);
        state2.setXY(220, 50);
        state2.setSize(100, 40);
        state2.rootContainer.add(this.add.text(20, 10, '1-0', {color: '#000000'}));
        state2.onClick(()=>{
            start = Date.now();
            timeline.play(null, null, true);
        })

        let state3 = this.addUI.view();
        state3.setBackgroundColor(0xc0c0c0, true);
        state3.setXY(340, 50);
        state3.setSize(100, 40);
        state3.rootContainer.add(this.add.text(20, 10, '3000-5000', {color: '#000000'}));
        state3.onClick(()=>{
            console.log(`x from 300 to 600`);
            timeline.play(3000, 5000);
        })
        
        let state4 = this.addUI.view();
        state4.setBackgroundColor(0xc0c0c0, true);
        state4.setXY(460, 50);
        state4.setSize(100, 40);
        state4.rootContainer.add(this.add.text(20, 10, '3000-1000', {color: '#000000'}));
        state4.onClick(()=>{        
            console.log(`x from 400 to 200`);
            timeline.play(1000, 3000, true);
        })

        let state5 = this.addUI.view();
        state5.setBackgroundColor(0xc0c0c0, true);
        state5.setXY(580, 50);
        state5.setSize(100, 40);
        state5.rootContainer.add(this.add.text(20, 10, '0.8-1', {color: '#000000'}));
        state5.onClick(()=>{
            timeline.play(0.8, 1, false, true);
        })

        let state6 = this.addUI.view();
        state6.setBackgroundColor(0xc0c0c0, true);
        state6.setXY(700, 50);
        state6.setSize(100, 40);
        state6.rootContainer.add(this.add.text(20, 10, 'to:4000', {color: '#000000'}));
        state6.onClick(()=>{
            timeline.gotoInDuration(5000);
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