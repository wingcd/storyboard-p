import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import * as Events from '../events';
import { View } from "../core/View";

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
        view.setSize(200, 200);
        view.name = 'view';
        view.touchEnableMoved = false;
        // view.draggable = true;
        view.on(Events.GestureEvent.Click, (sender: View)=>{
            console.log('click:' + sender.name);
        }, this);

        view.on(Events.GestureEvent.DoubleClick, (sender: View)=>{
            console.log('double click:' + sender.name);
        }, this);

        view.on(Events.GestureEvent.LongTouchStart, (sender: View)=>{
            console.log('long touch start:' + sender.name);
        }, this);

        let touchEnd = (sender: View)=>{
            console.log('long touch end:' + sender.name);
        };
        view.on(Events.GestureEvent.LongTouchEnd, touchEnd, this);
        view.off(Events.GestureEvent.LongTouchEnd, touchEnd);
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
    type: Phaser.WEBGL,
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