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
        view.setSize(200, 40);
        view.rootContainer.name = 'view';
        view.draggable = true;
        
        // view.dragComponent.topMostOnDragging = true;
        
        view.on(Events.DragEvent.START, (sender: View)=>{
            console.log('drag start:' + sender.depth);
        });

        let dropView = this.addUI.group();
        dropView.setBackgroundColor(0xffff00, true);
        dropView.setXY(200, 200);
        dropView.setSize(200, 200);
        dropView.on(Events.DragEvent.DROP, (sender: View, target: View)=>{
            console.log(sender);
        }, this);

        // dropView.addChild(view);
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