import { View } from "./core/View";
import { Settings } from "./core/Setting";
import { Point, Rectangle, OrientationPlugin } from "./phaser";
import { ViewRoot, EOrientation } from "./core/ViewRoot";
import { UIManager } from "./core/UIManager";
import { ViewScene } from "./core/ViewScene";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class MainScene extends Phaser.Scene {
    init() {    
        
    }
}

class Scene1 extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        this.load.image('a', '../res/1.jpg');  
        // let uimgr = (this as any).ui as UIManager;  
        // uimgr.create(this);

        let view = this.addUI.view();
        view.setBackgroundColor(0xff0000, true);
        view.setXY(0, 0);
        
        view.on(Phaser.Input.Events.POINTER_DOWN, ()=>{
            console.log("1231");
        });
    }

    create(): void {
        this.scale.orientation = Phaser.Scale.Orientation.PORTRAIT;
        // let img = this.add.image(300, 400, 'a').setInteractive();
        // // img.input.enabled = false
        // this.input.setDraggable(img, true);
        this.input.on('drag', (point: Point, go: any, dragX: number, dragY: number)=>{
            go.x = dragX;
            go.y = dragY;

            console.log('draging');
        })

        
        // this.input.setDraggable(view.rootContainer, true);
        // view.rootContainer.on('click', ()=>{
        //     console.log('pointerdown');
        // });

        // this.input.setDraggable(view.rootContainer, true);
        // this.input.on('drag', ()=>{
        //     console.log('drag');
        // })

        // let container = this.add.container(1, 0);
        // container.angle = 45; 
        // container.add(img);
    }
}

export class StarfallGame extends Phaser.Game {
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
    scene: [Scene1],    
    scale: {
        mode: Phaser.Scale.RESIZE,
        // autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    plugins: {
        global: [
            {key: 'storyboard-ui', plugin: UIManager, start: true, mapping: 'uimgr'},
            {key: 'orientation', plugin: OrientationPlugin, start: true, mapping: 'orientation', data: {
                orientation: EOrientation.LANDSCAPE,
            }},
        ]
    }
};


window.onload = () => {
    var game = new StarfallGame(config); 
    // game.scale.orientation = Phaser.Scale.LANDSCAPE;
    // game.scale.lockOrientation(Phaser.Scale.PORTRAIT);
    // game.scale.scaleMode = Phaser.Scale.FIT;
    // game.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
        // game.scale.orientation = Phaser.Scale.Orientation.PORTRAIT;
    // game.scale.on(Phaser.Scale.Events.ORIENTATION_CHANGE, ()=>{
    //     console.log('size');
    //     game.scale.refresh();
    // });    
}