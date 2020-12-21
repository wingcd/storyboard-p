import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation, } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { EAlignType, EAutoSizeType, EButtonMode, EHorAlignType, EOverflowType } from "../core/Defines";
import { PropertyComponent } from "../components/PropertyComponent";
import { Button } from "../views/Button";
import { PackageItem } from "../core/PackageItem";
import { Package } from "../core/Package";
require("../components");

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

        
        let pkg = new PackageItem();
        Package.inst.addPackage(pkg);
        let btn = pkg.addTemplate(button.toJSON());
        button.visible = false;

        // r.opaque = true;
        let nbtn = Package.inst.createObjectFromUrl(this, btn) as Button;
        nbtn.titleColor = 0xff0000;
        r.addChild(nbtn);
        r.overflowType = EOverflowType.Scroll;

        console.log(JSON.stringify(r.toJSON()));

        r.clone().x = 500;

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