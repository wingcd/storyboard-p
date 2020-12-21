import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation, } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { EAlignType, EAutoSizeType, EButtonMode, EHorAlignType, EOverflowType } from "../core/Defines";
import { PropertyComponent } from "../components/PropertyComponent";
import { Button } from "../views/Button";
import { Renderer } from "phaser";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

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
            width: 300,
            height: 300,
        });


        let button = this.addUI.button({
            x: 250,
            y: 25,
            width: 100,
            height: 40,
        });  
        button.overflowType = EOverflowType.Hidden;

        let img = this.makeUI.image({
            name: "icon",
            textureKey: "normal",
            width: 100,
            height: 40,
        });

        r.opaque = false;
        r.addChild(button);
        r.overflowType = EOverflowType.Scroll;

        button.mode = EButtonMode.Radio;
        button.addChild(img);

        let title = this.makeUI.textField();
        title.setSize(100, 40);
        title.autoSize = EAutoSizeType.None;
        title.textAlign = EAlignType.Center;
        title.horizontalAlign = EHorAlignType.Center;
        title.name = "title";
        title.text = "测试";
        title.fontSize = 24;
        button.addChild(title);

        let propComp = button.addComponentByType(PropertyComponent) as PropertyComponent;
        let propMgr = propComp.add("button");
        propMgr.add(Button.UP);
        let downStatus = propMgr.add(Button.DOWN);
        downStatus.add("icon", "click");
        downStatus.add("scaleX", 1.2);
        downStatus.add("scaleY", 1.2);
        downStatus.add("text", "按下", title);

        let overStatus = propMgr.add(Button.OVER);
        overStatus.add("icon", "hover");
        overStatus.add("title", "移动");

        propMgr.defaultId = overStatus.id;
        
        button.setPivot(0.5, 0.5);
        button.icon = "normal";
        button.title = "test";

        propMgr.store();
        button.ensureAllCorrect();

        console.log(button.toJSON());
        let clone = button.clone() as Button;
        clone.y= 100;
        // clone.mode = EButtonMode.Radio;
        r.addChild(clone);

        console.log(1);
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        if(!(this as any).__fps) {
            (this as any).__fps = this.addUI.textField({
                width: 100,
                height: 30, 
                style: {
                    color: 0xff0000,
                },
                x: 300,
                y: 0,
            });
        }
        (this as any).__fps.text = 1000 / delta;
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