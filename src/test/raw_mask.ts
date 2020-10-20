class UIScene extends Phaser.Scene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {

        this.load.image('aaa', './res/1.jpg');
    }

    create() {
        let g = this.add.graphics({x: 0, y: 0});
        g.visible = false;           
        g.fillStyle(0x1, 1);
        for(let i=0;i<10;i++) { 
            g.fillCircle(i*10+100, i*10+100, 50);
        }

        for(let i=0;i<10;i++) {
            let img = this.add.image(i*10+100, i*10+100, 'aaa');
            img.mask = img.createGeometryMask(g);
        }
    }

    update(time: number, delta: number) {
        super.update(time, delta);

        if(!(this as any).__fps) {
            (this as any).__fps = this.add.text(0,0,"",{
                color: "#00ff00"
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
    type: Phaser.WEBGL,
    width: 960,
    height: 540,
    backgroundColor: "#f0f0f0",    
    scene: [UIScene], 
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        autoRound: true,   
    },
};


window.onload = () => {
    var game = new App(config);
}