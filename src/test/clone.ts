import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Rectangle } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { BaseComponent } from "../components/BaseComponent";
import { Deserialize, Serialize } from "../utils/Serialize";
import { DragComponent } from "../components/DragComponent";
import { ScrollPaneComponent } from "../components/ScrollPaneComponent";
import { ViewGroup } from "../core/ViewGroup";
import { EEaseType, EOverflowType } from "../core/Defines";
import { PropertyManager } from "../tween/Property";
import { PropertyComponent } from "../components/PropertyComponent";
import { AnimationComponent } from "../components/AnimationComponent";
import { TimelineManager } from "../tween/Timeline";
import { Package } from "../core/Package";
import { View } from "../core/View";

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

        r.setBackgroundColor(0x0000ff, true);
        r.setSize(250,250);
        r.setXY(50, 50);

        let view = this.addUI.view();
        view.setSize(100, 100);
        view.setXY(-10, -10);
        view.setBackgroundColor(0xff0000, true);
        let propComp = new PropertyComponent();
        propComp.propertyManger = new PropertyManager();
        view.addComponent(propComp);
        let state1 = propComp.propertyManger.add("state1");
        state1.add("x", 100);
        state1.add("y", 200);
        propComp.propertyManger.store();

        let timeline = new TimelineManager();
        let tg1 = timeline.add("x");
        tg1.add(10, 100, {type: EEaseType.Linear}).add(2000, 400);
        let animComp = new AnimationComponent();
        animComp.playOnEnable = true;
        animComp.timeline = timeline;
        view.addComponent(animComp);
        timeline.store();

        js = view.toJSON();
        let rr = view.clone();
        rr.x = 300;
        this.time.addEvent({
            delay: 2100,
            callback: ()=>{
                propComp.propertyManger.applyTo('state1');

                let pm = (rr.getComponent(PropertyComponent) as PropertyComponent).propertyManger;
                pm.applyTo('state1');
            }
        })        

        console.log(1);
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