import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Rectangle } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { BaseComponent } from "../components/BaseComponent";
import { Deserialize } from "../utils/Serialize";
import { DragComponent } from "../components/DragComponent";
import { ScrollPaneComponent } from "../components/ScrollPaneComponent";
import { ViewGroup } from "../core/ViewGroup";
import { EOverflowType } from "../core/Defines";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let r = this.addUI.group();
        r.overflowType = EOverflowType.Scroll;
        r.scrollPane.scrollSpeed = 20;
        let js = r.toJSON();
        console.log(js);

        let rr = this.addUI.create(js);
        rr.x = 200;
        return;

        r.setBackgroundColor(0x0000ff, true);
        r.setSize(250,250);
        r.setXY(50, 50);

        let g = this.addUI.group();
        g.setBackgroundColor(0x00ff00, true);
        g.setSize(200,200);
        g.setXY(-5, -5);
        r.addChild(g);

        let view = this.addUI.view();
        view.setSize(100, 100);
        view.setXY(-10, -10);
        view.setBackgroundColor(0xff0000, true);
        let state1 = view.propertyManager.add("state1");
        state1.add("x", 100);
        state1.add("y", 200);

        g.addChild(view);
        
        let json = r.toJSON();
        console.log(json);
        
        json.x = 400;
        let v = this.addUI.create(json) as ViewGroup;
        // v.propertyManager.store();
        // (v.getChildAt(0) as ViewGroup).getChildAt(0).propertyManager.applyTo("state1");
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