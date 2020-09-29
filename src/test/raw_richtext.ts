import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Point } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { TimelineEvent } from "../events";
import TweenPath, { ETweenPathRotation } from "../tween/TweenPath";
import { TimelineManager } from "../tween/Timeline";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        // (this.add as any).bbCodeText(100, 100, "[b][i][size=24][color=red]Phaser[/color] [size=12]is a [color=yellow]fast[/color]", {
        //     fontSize: 24,
        // });
        // this.load.plugin('rexbbcodetextplugin', './libs/rex/rexbbcodetextplugin.min.js', true);
        // this.load.plugin('rextexttypingplugin', './libs/rex/rextexttypingplugin.min.js', true);
        this.load.image('smile', './res/1.jpg');
    }

    create(): void {
        let richText =  this.addExt.richText(0, 0, '[b][i][size=24][color=red]Phaser[/color][size=12][img=smile] is a [area=click-test][color=yellow]fast[/color][/area]', false, {
            color: '#ff0000',
            typing: {
                speed: 333,
                start: true,
            } 
        }).addImage('smile', {key:"smile", width:24, height: 24, left: 5});        

        var tags = {
            cap: {
              color: 'red',
              fontStyle: 'bold italic',
              size: 40,
            },
            marker: {
              underline: {
                color: 'blue',
                thinkness: 20,
                // offset: -10
              }
            },
            tail: {
              color: 'none',
              stroke: {
                color: 'yellow',
                thinkness: 1
              }
            }
          };
        richText =  this.addExt.richText(0, 200, `<class='cap'>H</class><class='marker'>ell</class><class='tail'>o</class><style='color:red;size:30px'>W</style><style='size:40px'>o</style><style='size:40px'>r</style><style='u:green 10px 0px'>ld</style>`, true, {
            color: '#ff0000',
            tags,
            typing: {
                speed: 333,
                start: true,
            } 
        });
       
        let obj = this.addUI.view();
        obj.setPivot(0.5, 0.5, true);
        let path = new TweenPath(obj)
            .splineTo([ 164, 446, 274, 542, 412, 457, 522, 541, 664, 464 ] as any)
            .lineTo(700, 300)
            .lineTo(600, 350)
            .ellipseTo(200, 100, 100, 250, false, 0)
            .cubicBezierTo(222, 119, 308, 107, 208, 368)
            .ellipseTo(60, 60, 0, 360, true)
            .rotateBy(ETweenPathRotation.Down2Target, new Point(400, 400));
            
        let g = this.add.graphics();
        path.draw(g);
        let timeline = new TimelineManager();
        timeline.bindTarget(this, obj);
        timeline.add("p___path___", {})
            .add(0, 0, {
                yoyo: true,
                plugin: path,
            })
            .add(5000, 1);

        timeline.store();
        timeline.on(TimelineEvent.UPDATE, ()=>{
            console.log(obj.name);
        });
        timeline.play();
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