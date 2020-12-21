import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { EAutoSizeType, EAlignType, EVertAlignType, EHorAlignType, EOverflowType } from "../core/Defines";
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
        let textfield = this.addUI.textField();
        textfield.setSize(200, 100);
        textfield.singleLine = true;
        textfield.touchable = true;
        
        textfield.text =  'hello world';

        textfield.setXY(100, 100);

        textfield.on(Events.TextEvent.AREA_UP, (sender: View, key: string, pointer: Pointer)=>{
            console.log(`click area ${key}`);
        }, this);

        console.log(textfield.toJSON());

        let g = this.addUI.group();
        g.overflowType = EOverflowType.Hidden;
        let img = this.addUI.image({
            textureKey: "smile"
        });
        g.addChild(img);

        textfield.clone().y = 300;
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