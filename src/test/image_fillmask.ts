import { StageScalePlugin, EStageScaleMode, EStageOrientation, Rectangle } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EDirectionType, EFillType, ETextureScaleType } from "../core/Defines";
import { UIImage } from "../ui/UIImage";

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('nine', './res/44.png');
    }

    create(): void {
        let view = this.addUI.image({
           scaleType: ETextureScaleType.NinePatch,
           textureKey: "nine",
           tile: {
            scaleX: 0.5,
            scaleY: 0.5,
           },
           ninePatch: {
            left: 0.2,     
            right: 0.8,   
            top: 0.2,   
            bottom: 0.8,      
            stretchMode: {
                edge: 0,
                internal: 1,
            }       
           },
           tint: 0xffffff,
           fillMask: {
            fillType: EFillType.Rotate360,
            value: 0.3,
            anticlockwise: true,
            outterRadius: 0.5,
            innerRadius: 0.3,
            origin: EDirectionType.Top,
           },
        });
        view.setXY(100, 100);
        view.setSize(100, 100);
        
        console.log(view.toJSON())

        let json = view.toJSON();
        json.name = "1231";
        // json.fillMask.innerRadius = undefined;
        // json.fillMask.anticlockwise = false;
        let view2 = this.addUI.image(json);
        view2.x = 200;

        console.log(view2.toJSON());
        
        let view3 = view.clone() as UIImage;
        view3.x = 400;
        view3.fillType = EFillType.Horizontal;
        view3.fillMask.value = 1;

        this.tweens.add({
            targets: [view.fillMask, view2.fillMask],
            repeat: Infinity,
            ease: 'Power1',
            duration: 3000,
            props: {
                value: {
                    from: 0,
                    to: 1,
                },
            },
        })

        this.tweens.add({
            targets: [view3],
            repeat: Infinity,
            ease: 'Power1',
            duration: 3000,
            props: {
                width: {
                    from: 50,
                    to: 100,
                },
            },
        })
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