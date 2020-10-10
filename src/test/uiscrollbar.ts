import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EAlignType, EAutoSizeType, EDirectionType, EFillType, EHorAlignType, EProgressTitleType, ERelationPinType, EVertAlignType } from "../core/Defines";
import { AnimationComponent } from "../components/AnimationComponent";
import { UIProgressBar } from "../ui/UIProgressBar";
import { UIImage } from "../ui/UIImage";
import { UISlider } from "../ui/UISlider";

// Settings.showDebugBorder = true;
// Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('nine', './res/44.png');
        this.load.image('normal', './res/ui/normal.png');
        this.load.image('up', './res/ui/up.png');
        this.load.image('down', './res/ui/down.png');
        this.load.image('left', './res/ui/left.png');
        this.load.image('right', './res/ui/right.png');
    }

    create(): void {
        let scroll = this.addUI.scrollBar({
            x: 250,
            y: 25,
            width: 200,
            height: 40,
        });  
        scroll.setBackgroundColor(0xffff00, true);        

        let bar = this.addUI.image({
            name: "bar",
            textureKey: "normal",
            width: 160,
            height: 40,
            x: 20,
        });
        bar.fillMask.fillType = EFillType.Horizontal;
        bar.fillMask.origin = EDirectionType.Right;
        bar.fillMask.value = 1;           
        scroll.addChild(bar);

        let grip = this.addUI.image({
            name: "grip",
            textureKey: "nine",
            width: 20,
            height: 40,
            x: 20,
        });
        scroll.addChild(grip);

        let lbtn = this.addUI.image({
            name: "arrow1",
            textureKey: 'left',
            width: 20,
            height: 40,
            enableBackground: true,
            backgroundColor: 0x00ff00,
        });
        lbtn.touchable = true;
        scroll.addChild(lbtn);

        let rbtn = this.addUI.image({
            name: "arrow2",
            textureKey: 'right',
            x: 180,
            width: 20,
            height: 40,
            enableBackground: true,
            backgroundColor: 0x00ff00,
        });
        rbtn.touchable = true;
        scroll.addChild(rbtn);

        //v-slider
        let vscroll = this.addUI.scrollBar({
            x: 600,
            y: 25,
            width: 40,
            height: 200,
        });  
        vscroll.setBackgroundColor(0xffff00, true);        

        let vbar = this.addUI.image({
            name: "bar_v",
            textureKey: "normal",
            width: 40,
            height: 200,
        });        
        vscroll.addChild(vbar);

        let vgrip = this.addUI.image({
            name: "grip_v",
            textureKey: "nine",
            width: 60,
            height: 15,
            x: -10,
        });
        vscroll.addChild(vgrip);

        let vtitle = this.makeUI.textField();
        // vtitle.y = 40;
        // vtitle.x = 10;
        vtitle.setSize(40, 200);
        vtitle.autoSize = EAutoSizeType.None;
        vtitle.horizontalAlign = EHorAlignType.Center;
        vtitle.verticalAlign = EVertAlignType.Middle;
        vtitle.name = "title";
        vtitle.fontSize = 24;
        vtitle.verticalMode = true;
        vscroll.addChild(vtitle);
        vscroll.ensureAllCorrect();

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