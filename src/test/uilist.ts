import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation, Pointer, Tween, } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EAlignType, EAutoSizeType, EButtonMode, EHorAlignType, EListLayoutType, EOverflowType, ERelationPinType, EScrollType, EVertAlignType } from "../core/Defines";
import { PropertyComponent } from "../components/PropertyComponent";
import { UIButton } from "../ui/UIButton";
import { PackageItem } from "../core/PackageItem";
import { Package } from "../core/Package";
import { View } from "../core/View";
import { Margin } from "../utils/Margin";
import { UIList } from "../ui";
import * as Events from "../events";
require("../components");

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
        let list = this.addUI.list({
            x: 10,
            y: 50,
            width: 200,
            height: 400,
        });
        list.opaque = true;
        list.setBackgroundColor(0xffff00, true);

        let button = this.makeUI.button({
            x: 250,
            y: 25,
            width: 100,
            height: 80,
        });  
        // 更新mask造成手机卡顿。估计是转换坐标计算有延迟，需要优化
        // button.overflowType = EOverflowType.Hidden;

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
        img.relations.set(ERelationPinType.TOP, button);
        img.relations.set(ERelationPinType.BOTTOM, button);

        let title = this.makeUI.textField();
        title.setSize(100, 80);
        title.autoSize = EAutoSizeType.Both;
        // title.textAlign = EAlignType.Center;
        // title.verticalAlign = EVertAlignType.Middle;
        // title.horizontalAlign = EHorAlignType.Center;
        title.name = "title";
        title.text = "测试";
        title.fontSize = 24;
        button.addChild(title);
        title.relations.set(ERelationPinType.CENTER, button);
        title.relations.set(ERelationPinType.MIDDLE, button);
        
        let pkg = new PackageItem();
        Package.inst.addPackage(pkg);
        let btnRes = pkg.addTemplate(button.toJSON());
        button.visible = false;
        console.log(button.toJSON());

        // r.opaque = true;
        // let nbtn = Package.inst.createObjectFromUrl(this, btnRes) as UIButton;
        // nbtn.titleColor = 0xff0000;
        list.loop = true;
        list.layoutType = EListLayoutType.Pagination;
        list.overflowType = EOverflowType.Scroll;
        list.scrollPane.scrollType = EScrollType.Vertical;
        list.scrollPane.inertanceEffect = true;
        list.scrollPane.bouncebackEffect = true;
        list.rowGap = 20;
        list.margin = new Margin(10, 0, 10);

        list.defaultItem = btnRes;
        for(let i =0 ;i<10;i++) {
            let item = list.addItem() as UIButton;
            item.title = `button${i+1}`;
        }

        // list.onClick(()=>{
        //     console.log('click');
        // }, this);

        let debug = this.addUI.textField({
            width: 100,
            height: 30,
            text: 'test',
        });
        list.on(Events.ScrollEvent.START, ()=>{
            debug.text = "begin scrolling";
        });
        list.on(Events.ScrollEvent.SCROLLING, (sender: View, pointer: Pointer)=>{
            debug.text = `scrolling:${this.game.getTime()}`;
        });
        list.on(Events.ScrollEvent.END, (sender: View)=>{
            debug.text = `end scrolling`;
            console.log( `end scrolling`);
        });
        this.input.on(Events.PointerEvent.UP, ()=>{
            console.log("pointer up");
        });

        this.input.on(Events.PointerEvent.UP_OUTSIDE, ()=>{
            console.log("pointer up outside");
        });

        console.log(list.toJSON());

        let listRes = pkg.addTemplate(list.toJSON());
        let newList = Package.inst.createObjectFromUrl(this, listRes) as UIList;
        newList.x = 220;
        newList.scrollPane.scrollType = EScrollType.Horizontal;
        newList.layoutType = EListLayoutType.Pagination;

        // this.tweens.add({
        //     targets: {}, //list.scrollPane,
        //     props: {
        //         percY: {
        //             from: 0,
        //             to: 1,
        //         }
        //     },
        //     duration: Infinity,
        //     yoyo: true,
        //     onUpdate: (tween: Tween)=>{
        //         list.scrollPane.percY = (list.scrollPane.percY + 0.01) % 1;
        //     },
        // });

        (this as any).__fps = this.addUI.textField({
            width: 100,
            height: 30, 
            style: {
                color: 0xff0000,
            },
            x: 300,
            y: 0,
        });

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
    type: Phaser.WEBGL,
    width: 960,
    height: 540,
    backgroundColor: "#f0f0f0",    
    scene: [UIScene],  
    resolution: 1,
    scale: {
        mode: Phaser.Scale.NONE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,   
    },
    input: {
        touch: {
            capture: true,
        }
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