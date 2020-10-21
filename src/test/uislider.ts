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
    }

    create(): void {
        let slider = this.addUI.slider({
            x: 250,
            y: 25,
            width: 200,
            height: 40,
        });  
        slider.setBackgroundColor(0xffff00, true);        

        let bar = this.addUI.image({
            name: "bar",
            textureKey: "normal",
            width: 200,
            height: 40,
        });
        bar.fillType = EFillType.Horizontal;
        bar.fillMask.origin = EDirectionType.Right;           
        slider.addChild(bar);
        slider.reverse = true;

        let grip = this.addUI.image({
            name: "grip",
            textureKey: "nine",
            width: 15,
            height: 60,
            y: -10,
        });
        slider.addChild(grip);
        grip.relations.set(ERelationPinType.LEFT, bar);

        let title = this.makeUI.textField();
        title.x = 40;
        title.setSize(120, 40);
        title.autoSize = EAutoSizeType.None;
        title.textAlign = EAlignType.Center;
        title.horizontalAlign = EHorAlignType.Center;
        title.name = "title";
        title.fontSize = 24;
        slider.addChild(title);
        slider.ensureAllCorrect();
        console.log(slider.toJSON());
        
        let pg = slider.clone() as UIProgressBar;
        pg.y = 200;
        let img = pg.getChild('bar') as UIImage;
        img.fillMask.origin = EDirectionType.Left;
        pg.reverse = false;
        pg.titleType = EProgressTitleType.ValueAndMax;
        pg.value = 100;

        let pg1 = pg.clone() as UIProgressBar;
        pg1.removeComponentByType(AnimationComponent);
        pg1.y = 300;
        img = pg1.getChild('bar') as UIImage;
        img.fillType = EFillType.None;


        //v-slider
        let vslider = this.addUI.slider({
            x: 600,
            y: 25,
            width: 40,
            height: 200,
        });  
        vslider.setBackgroundColor(0xffff00, true);        

        let vbar = this.addUI.image({
            name: "bar_v",
            textureKey: "normal",
            width: 40,
            height: 200,
        });
        vbar.fillType = EFillType.Vertical;
        vbar.fillMask.origin = EDirectionType.Top;           
        vslider.addChild(vbar);
        vslider.value = 100;

        let vgrip = this.addUI.image({
            name: "grip_v",
            textureKey: "nine",
            width: 60,
            height: 15,
            x: -10,
        });
        vslider.addChild(vgrip);

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
        vslider.addChild(vtitle);
        vslider.ensureAllCorrect();

        let vs = vslider.clone() as UISlider;
        vs.x = 700;
        vs.reverse = true;
        (vs.getChild("bar_v") as UIImage).fillMask.origin = EDirectionType.Bottom;

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