import { StageScalePlugin, EStageScaleMode, EStageOrientation, Point } from "../phaser";
import { ViewManager } from "../core/ViewManager";
import { ViewScene } from "../core/ViewScene";
import { ETextureScaleType } from "../core/Defines";
import { Settings } from "../core/Setting";
import { SPoint } from "../shapes/SPoint";
import { SLine } from "../shapes/SLine";
import { SRect } from "../shapes/SRect";
import { SEllipse } from "../shapes/SEllipse";
import { SCircle } from "../shapes/SCircle";
import { SRegularPolygon } from "../shapes/SRegularPolygon";
import { SPolygon } from "../shapes/SPolygon";
import { Graphic } from "../views/Graphic";

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
        pt.shape.fillColor = 0xff0000;
        pt.draw();

        let line = this.addUI.graphic();
        line.setXY(100, 250);
        let sline = new SLine();
        sline.lineSize = 5;
        line.draw(sline);

        let rect = this.addUI.graphic();
        rect.setXY(200, 300);
        let rshape = new SRect();
        rshape.cornerRadius = [5, 5, 10, 10];
        rshape.lineSize = 2;
        rshape.lineColor = 0xff00ff;
        rect.draw(rshape);

        let circle = this.addUI.graphic();
        circle.setXY(300, 250);
        circle.setSize(200, 100);
        let cshape = new SCircle();
        cshape.lineColor = 0xffff00;
        cshape.fillColor = 0xff00ff50;
        cshape.lineSize = 3;
        circle.draw(cshape);
        
        let elli = this.addUI.graphic();
        elli.setXY(300, 200);
        elli.setSize(200, 100);
        let eshape = new SEllipse();
        eshape.lineColor = 0xffff00;
        eshape.fillColor = 0xff000050;
        eshape.lineSize = 3;
        elli.draw(eshape);

        let rpoly = this.addUI.graphic();
        rpoly.setXY(300, 100);
        rpoly.setSize(200, 200);
        let reshape = new SRegularPolygon();
        reshape.lineSize = 3;
        reshape.lineColor = 0xffff00;
        reshape.fillColor = 0xff000050;
        reshape.sideNumber = 10;
        reshape.distances = [0.5,1,0.5,1,0.5,1,0.5,1,0.5,1];
        rpoly.draw(reshape);
        console.log(rpoly.toJSON());
        let cloneG = (rpoly.clone() as Graphic).setXY(100, 50);
        (cloneG.shape as SRegularPolygon).onGetDistance = (i: number)=>{
            return i * 0.1;
        };
        cloneG.draw();

        let poly = this.addUI.graphic();
        poly.setXY(500, 100);
        poly.setSize(200, 200);
        let pshape = new SPolygon();
        pshape.lineSize = 3;
        pshape.lineColor = 0xffff00;
        pshape.fillColor = 0xff000050;
        pshape.points = [0,0, 100,100, 200,200, 100,200, 300,400, 50, 400];
        poly.draw(pshape);
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