import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Rectangle } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { BaseComponent } from "../components/BaseComponent";
import { Deserialize, Serialize } from "../utils/Serialize";
import { DragComponent } from "../components/DragComponent";
import { ScrollPaneComponent } from "../components/ScrollPaneComponent";
import { ViewGroup } from "../core/ViewGroup";
import { EAlignType, EAutoSizeType, EDirectionType, EEaseType, EHorAlignType, EOverflowType } from "../core/Defines";
import { PropertyManager } from "../tween/Property";
import { PropertyComponent } from "../components/PropertyComponent";
import { AnimationComponent } from "../components/AnimationComponent";
import { TimelineManager } from "../tween/Timeline";
import { Package } from "../core/Package";
import { View } from "../core/View";
import { UIButton } from "../ui/UIButton";
import * as Events from "../events";
import { EProgressTitleType } from "../types/IUIProgressBar";
import { EFillType, ETextureScaleType } from "../types";
import { UIProgressBar } from "../ui/UIProgressBar";
import { UIImage } from "../ui/UIImage";

// Settings.showDebugBorder = true;
// Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('nine', './res/44.png');
        this.load.image('normal', './res/ui/normal.png');
    }

    create(): void {
        let progress = this.addUI.progressBar({
            x: 250,
            y: 25,
            width: 200,
            height: 40,
        });  
        progress.setBackgroundColor(0xffff00, true);        

        let bar = this.addUI.image({
            name: "bar",
            textureKey: "normal",
            width: 200,
            height: 40,
        });
        bar.fillMask.fillType = EFillType.Horizontal;
        bar.fillMask.origin = EDirectionType.Right;
        bar.fillMask.value = 1;        
        progress.addChild(bar);
        progress.reverse = true;

        let title = this.makeUI.textField();
        title.x = 40;
        title.setSize(120, 40);
        title.autoSize = EAutoSizeType.None;
        title.textAlign = EAlignType.Center;
        title.horizontalAlign = EHorAlignType.Center;
        title.name = "title";
        title.fontSize = 24;
        progress.addChild(title);

        progress.ensureAllCorrect();


        progress.value = 100;
        let animComp = new AnimationComponent();
        let timeline = animComp.add("t1");
        timeline.add('value').
            add(0, 0, {type: EEaseType.Linear, yoyo: true, repeat: -1}).
            add(2000, 100);
        timeline.playOnEnable = true;
        progress.addComponent(animComp);

        console.log(progress.toJSON());
        
        let pg = progress.clone() as UIProgressBar;
        pg.y = 200;
        let img = pg.getChild('bar') as UIImage;
        img.fillMask.origin = EDirectionType.Left;
        pg.reverse = false;
        pg.titleType = EProgressTitleType.ValueAndMax;

        let pg1 = pg.clone() as UIProgressBar;
        pg1.removeComponentByType(AnimationComponent);
        pg1.y = 300;
        img = pg1.getChild('bar') as UIImage;
        img.fillMask.fillType = EFillType.None;
        
        let button = this.addUI.button({
            x: 50,
            y: 300,
            width: 100,
            height: 30,
            enableBackground: true,
            backgroundColor: 0xffff00,
        });
        let bg = this.addUI.image({
            name: "bg",
            textureKey: "normal",
            width: 100,
            height: 30,
        });
        button.addChild(bg);

        title = this.makeUI.textField({
            name: "title",
            x: 20,
        });
        button.addChild(title);
        button.title = "开始";
        button.onClick(()=>{
            let value = pg1.value + 100;
            if(value > 100) {
                value = 0;
            }
            pg1.tweenValue(value, 2);
        }, this);

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