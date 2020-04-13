import { View } from "./core/View";
import { Settings } from "./core/Setting";

Settings.showDebugBorder = true;

class Scene1 extends Phaser.Scene {
    constructor() {
        super({key: 'game', active: true})
    }


    preload() {
        this.load.image('a', '../res/1.jpg');    
    
    }

    create(): void {
        // this.add.image(0, 0, 'a').setPosition(200, 200).setSize(50,50);

        let view = new View();
        view.bind(this);
        view.onGizmos();
    }
}

const config: Phaser.Types.Core.GameConfig = {
    title: "Starfall",
    width: 800,
    height: 600,
    parent: "game",
    backgroundColor: "#f0f0f0",
    scene: [Scene1],
};

export class StarfallGame extends Phaser.Game {
    constructor(config: Phaser.Types.Core.GameConfig) {
        super(config);
    }

    
}

window.onload = () => {
    var game = new StarfallGame(config);
    
}