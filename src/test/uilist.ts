import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation, } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EAlignType, EAutoSizeType, EButtonMode, EHorAlignType, EOverflowType, ERelationPinType, EScrollType, EVertAlignType } from "../core/Defines";
import { PropertyComponent } from "../components/PropertyComponent";
import { UIButton } from "../ui/UIButton";
import { PackageItem } from "../core/PackageItem";
import { Package } from "../core/Package";
import { View } from "../core/View";
import { Margin } from "../utils/Margin";
import { UIList } from "../ui";
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
        let list = this.addUI.list({
            x: 50,
            y: 50,
            width: 300,
            height: 300,
        });
        list.opaque = true;

        let button = this.addUI.button({
            x: 250,
            y: 25,
            width: 100,
            height: 80,
        });  
        button.overflowType = EOverflowType.Hidden;

        let img = this.makeUI.image({
            name: "icon",
            textureKey: "normal",
            width: 100,
            height: 80,
        });

        button.mode = EButtonMode.Radio;
        button.addChild(img);
        img.relations.set(ERelationPinType.LEFT, button);
        img.relations.set(ERelationPinType.RIGHT, button);

        let title = this.makeUI.textField();
        title.setSize(100, 80);
        title.autoSize = EAutoSizeType.None;
        // title.textAlign = EAlignType.Center;
        title.verticalAlign = EVertAlignType.Middle;
        title.horizontalAlign = EHorAlignType.Center;
        title.name = "title";
        title.text = "测试";
        title.fontSize = 24;
        button.addChild(title);
        title.relations.set(ERelationPinType.CENTER, button);
        
        let pkg = new PackageItem();
        Package.inst.addPackage(pkg);
        let btnRes = pkg.addTemplate(button.toJSON());
        button.visible = false;

        // r.opaque = true;
        // let nbtn = Package.inst.createObjectFromUrl(this, btnRes) as UIButton;
        // nbtn.titleColor = 0xff0000;
        list.overflowType = EOverflowType.Scroll;
        list.scrollPane.scrollType = EScrollType.Both;
        list.scrollPane.bouncebackEffect = true;
        list.rowGap = 20;
        // list.margin = new Margin(10, 0, 10);

        list.defaultItem = btnRes;
        for(let i =0 ;i<8;i++) {
            let item = list.addItem() as UIButton;
            item.title = `button${i+1}`;
        }

        list.onClick(()=>{
            console.log('click');
        }, this);

        console.log(list.toJSON());

        let listRes = pkg.addTemplate(list.toJSON());
        let newList = Package.inst.createObjectFromUrl(this, listRes) as UIList;
        newList.x = 400;

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