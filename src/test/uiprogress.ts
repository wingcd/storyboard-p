import { Settings } from "../core/Setting";
import { StageScalePlugin, EStageScaleMode, EStageOrientation } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { EAlignType, EAutoSizeType, EDirectionType, EEaseType, EFillType, EHorAlignType, EProgressTitleType, EVertAlignType } from "../core/Defines";
import { AnimationComponent } from "../components/AnimationComponent";
import { ProgressBar } from "../views/ProgressBar";
import { Image } from "../views/Image";

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
        bar.fillType = EFillType.Horizontal;
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
        
        let pg = progress.clone() as ProgressBar;
        pg.y = 200;
        let img = pg.getChild('bar') as Image;
        img.fillMask.origin = EDirectionType.Left;
        pg.reverse = false;
        pg.titleType = EProgressTitleType.ValueAndMax;

        let pg1 = pg.clone() as ProgressBar;
        pg1.removeComponentByType(AnimationComponent);
        pg1.y = 300;
        img = pg1.getChild('bar') as Image;
        img.fillType = EFillType.None;
        
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

         //v-progress
         let vprogress = this.addUI.progressBar({
            x: 600,
            y: 25,
            width: 40,
            height: 200,
            titleType: EProgressTitleType.Percent,
        });  
        vprogress.setBackgroundColor(0xffff00, true);        

        let vbar = this.addUI.image({
            name: "bar_v",
            textureKey: "normal",
            width: 40,
            height: 200,
        });
        vbar.fillType = EFillType.Vertical;
        vbar.fillMask.origin = EDirectionType.Top;           
        vprogress.addChild(vbar);
        vprogress.value = 100;

        let vtitle = this.makeUI.textField();
        vtitle.x = 10;
        vtitle.setSize(40, 200);
        vtitle.autoSize = EAutoSizeType.None;
        vtitle.textAlign = EAlignType.Middle;
        vtitle.horizontalAlign = EHorAlignType.Center;
        vtitle.verticalAlign = EVertAlignType.Middle;
        vtitle.name = "title";
        vtitle.fontSize = 24;
        vtitle.verticalMode = true;
        vprogress.addChild(vtitle);
        vprogress.ensureAllCorrect();
        vprogress.addComponent(animComp.clone());

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