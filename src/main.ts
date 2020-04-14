import { View } from "./core/View";
import { Settings } from "./core/Setting";
import { Point, Rectangle } from "./phaser";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class Scene1 extends Phaser.Scene {
    constructor() {
        super({key: 'game', active: true})
    }


    preload() {
        this.load.image('a', '../res/1.jpg');    
    
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

        let view = new View();
        view.bind(this);
        view.onGizmos();
        view.setBackgroundColor(0xff0000, true);
        view.rootContainer.setInteractive(new Rectangle(0,0, view.width, view.height), Phaser.Geom.Rectangle.Contains);
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

const config: Phaser.Types.Core.GameConfig = {
    title: "Starfall",
    parent: "game",
    width: 800,
    height: 600,
    backgroundColor: "#f0f0f0",
    scene: [Scene1],
    
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    }
};

export class StarfallGame extends Phaser.Game {
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }

    
}

window.onload = () => {
    var game = new StarfallGame(config);    
    // game.scale.scaleMode = Phaser.Scale.FIT;
    // game.scale.autoCenter = Phaser.Scale.CENTER_BOTH;
        // game.scale.orientation = Phaser.Scale.Orientation.PORTRAIT;
    // game.scale.on(Phaser.Scale.Events.ORIENTATION_CHANGE, ()=>{
    //     console.log('size');
    //     game.scale.refresh();
    // });
}