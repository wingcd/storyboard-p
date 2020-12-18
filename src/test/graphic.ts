import { StageScalePlugin, EStageScaleMode, EStageOrientation, Point } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { ETextureScaleType } from "../core/Defines";
import { Settings } from "../core/Setting";
import { PointStyle, SPoint } from "../shapes/SPoint";
import { LineStyle, SLine } from "../shapes/SLine";
import { RectStyle, SRect } from "../shapes/SRect";

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
    }

    create(): void {
        let pt = this.addUI.graphic();
        pt.setXY(100, 100);
        pt.setSize(200, 100);
        pt.shape = new SPoint();
        let ps = new PointStyle();       
        pt.draw(ps);

        let line = this.addUI.graphic();
        line.setXY(100, 250);
        line.shape = new SLine();
        let ls = new LineStyle();
        ls.lineWidth = 5;
        line.draw(ls);

        let rect = this.addUI.graphic();
        rect.setXY(200, 300);
        rect.shape = new SRect();
        let rs = new RectStyle();
        rs.cornerRadius = [5, 5, 10, 10];
        rs.lineWidth = 2;
        rs.lineColor = 0xff00ff;
        rect.draw(rs);

        // rect.drawRect(2, 0xff0000, 0x00ff00, [5,5,5,5]);

        // let elli = this.addUI.graphic();
        // elli.setXY(100, 150);
        // elli.setSize(200, 100);
        // elli.drawEllipse(3, 0xffff00, 0xff000050);

        // let rpoly = this.addUI.graphic();
        // rpoly.setXY(300, 100);
        // rpoly.setSize(200, 200);
        // rpoly.drawRegularPolygon(3, 0xffff00, 0xff000050, 10, 0, [0.5,1,0.5,1,0.5,1,0.5,1,0.5,1]);
        // rpoly.clone().setXY(400, 300);

        // let poly = this.addUI.graphic();
        // poly.setXY(500, 100);
        // poly.setSize(200, 200);
        // poly.drawPolygon(3, 0xffff00, 0xff000050, [0,0, 100,100, 200,200, 100,200, 300,400, 50, 400]);
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