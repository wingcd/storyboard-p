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
import { UIButton } from "../ui/UIButton";
import * as Events from "../events";

// Settings.showDebugBorder = true;
// Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('normal', './res/ui/normal.png');
        this.load.image('click', './res/ui/click.png');
        this.load.image('hover', './res/ui/hover.png');
    }

    create(): void {
        let r = this.addUI.group({
            x: 50,
            y: 50,
        });
        let button = this.addUI.button({
            x: 100,
            y: 200,
            width: 100,
            height: 40,
        });  
        r.opaque = true;
        r.addChild(button);

        let img = this.makeUI.image({
            name: "icon",
            textureKey: "normal",
            width: 100,
            height: 40,
        });
        button.addChild(img);

        let title = this.makeUI.textfield();
        title.name = "title";
        title.text = "测试";
        title.setXY((button.width-title.width)/2, (button.height-title.height)/2);
        button.addChild(title);

        let propComp = button.addComponentByType(PropertyComponent) as PropertyComponent;
        let propMgr = propComp.add("button");
        propMgr.add(UIButton.UP);
        let downStatus = propMgr.add(UIButton.DOWN);
        downStatus.add("icon", "click");
        downStatus.add("scaleX", 1.2, img);
        downStatus.add("scaleY", 1.2, img);
        downStatus.add("text", "按下", title);

        let overStatus = propMgr.add(UIButton.OVER);
        overStatus.add("icon", "hover");
        
        img.setPivot(0.5, 0.5);
        button.icon = "normal";
        button.title = "test";

        propMgr.store();
        button.ensureAllCorrect();

        console.log(button.toJSON());
        button.clone().y= 400;

        console.log(1);
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