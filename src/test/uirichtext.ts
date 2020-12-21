import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EStageScaleMode, EStageOrientation } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { EAutoSizeType, EAlignType, EVertAlignType } from "../core/Defines";
import * as Events from '../events';
import { View } from "../core/View";

Settings.showDebugBorder = true;
// Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.bitmapFont('ui://fonts/ice', 'res/fonts/iceicebaby.png', 'res/fonts/iceicebaby.xml');
        this.load.image('smile', './res/1.jpg');
    }

    create(): void {
        let textfield = this.addUI.richTextField();
        textfield.setSize(200, 100);
        textfield.singleLine = true;
        textfield.touchable = true;
        
        textfield.text =  '[b][i][size=24][color=red]Phaser[/color][size=20][img=smile] is a [area=click-test][color=green][u]fast[/u][/color][/area]' //'abcd efaf aefa fasdfaef asdf asf a'// 'آزمایش برای Foo Ltd.‎ و Bar Inc.‎ باشد که آزموده شود.'; //
        textfield.autoSize = EAutoSizeType.Height;
        // textfield.font = "ui://fonts/ice";
        // textfield.verticalMode = true;
        // textfield.rtl = true;
        // textfield.rtlByWord = true;
        textfield.textAlign = EAlignType.Right;
        textfield.verticalAlign = EVertAlignType.Top;
        // textfield.horizontalAlign = EHorAlignType.Right;

        textfield.setXY(100, 100);

        textfield.on(Events.TextEvent.AREA_UP, (sender: View, key: string, pointer: Pointer)=>{
            console.log(`click area ${key}`);
        }, this);

        console.log(textfield.toJSON());

        textfield.clone().y = 300;
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