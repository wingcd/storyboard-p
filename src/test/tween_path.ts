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
    }

    create(): void {       
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
                repeat: -1,
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