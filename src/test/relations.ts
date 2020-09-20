import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EDragType } from "../core/Defines";
import { ERelationPinType } from "../types";
import { Package } from "../core/Package";
import { View } from "../core/View";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let group = this.addUI.group();

        let left = this.addUI.view();
        group.addChild(left);
        left.setBackgroundColor(0xff0000, true);
        left.setXY(150, 250);
        left.setSize(50, 100);
        left.draggable = true;
        left.dragComponent.dragType = EDragType.Horizontal;

        let right = this.addUI.view();        
        group.addChild(right);
        right.setBackgroundColor(0xff0000, true);
        right.setXY(400, 250);
        right.setSize(50, 100);
        right.draggable = true;    
        right.dragComponent.dragType = EDragType.Horizontal;
        
        let top = this.addUI.view();
        group.addChild(top);
        top.setBackgroundColor(0xff0000, true);
        top.setXY(250, 150);
        top.height = 50;
        top.draggable = true;
        top.dragComponent.dragType = EDragType.Vertical;

        let bottom = this.addUI.view();
        group.addChild(bottom);
        bottom.setBackgroundColor(0xff0000, true);
        bottom.setXY(250, 400);
        bottom.height = 50;
        bottom.draggable = true;    
        bottom.dragComponent.dragType = EDragType.Vertical;

        let center = this.addUI.group();
        group.addChild(center);
        center.setBackgroundColor(0xffff00, true);
        center.setXY(200, 200);
        center.setSize(200, 200);
        center.relations.set(ERelationPinType.LEFT, left, ERelationPinType.LEFT);
        center.relations.set(ERelationPinType.RIGHT, right, ERelationPinType.RIGHT);
        center.relations.set(ERelationPinType.TOP, top, ERelationPinType.TOP);
        center.relations.set(ERelationPinType.BOTTOM, bottom, ERelationPinType.BOTTOM);

        top.relations.set(ERelationPinType.BOTTOM, center);

        let innerLT = this.makeUI.view();
        innerLT.setSize(20, 20);
        innerLT.setBackgroundColor(0x0000ff, true);
        center.addChild(innerLT);

        let innerLM = this.makeUI.view();
        innerLM.setSize(20, 20);
        innerLM.setBackgroundColor(0x0000ff, true);
        innerLM.y = 90;
        center.addChild(innerLM);
        innerLM.relations.set(ERelationPinType.MIDDLE, center, ERelationPinType.MIDDLE);

        let innerLB = this.makeUI.view();
        innerLB.setSize(20, 20);
        innerLB.setBackgroundColor(0x0000ff, true);
        innerLB.y = 180;
        center.addChild(innerLB);
        innerLB.relations.set(ERelationPinType.BOTTOM, center, ERelationPinType.BOTTOM);

        let innerCT = this.makeUI.view();
        innerCT.setSize(20, 20);
        innerCT.setBackgroundColor(0x0000ff, true);
        innerCT.x = 90;
        center.addChild(innerCT);
        innerCT.relations.set(ERelationPinType.CENTER, center, ERelationPinType.CENTER);

        let innerCB = this.makeUI.view();
        innerCB.setSize(20, 20);
        innerCB.setBackgroundColor(0x0000ff, true);
        innerCB.setXY(90, 180);
        center.addChild(innerCB);
        innerCB.relations.set(ERelationPinType.BOTTOM, center, ERelationPinType.BOTTOM);
        innerCB.relations.set(ERelationPinType.CENTER, center, ERelationPinType.CENTER);

        let innerCM = this.makeUI.view();
        innerCM.setSize(20, 20);
        innerCM.setBackgroundColor(0x0000ff, true);
        innerCM.setXY(90, 90);
        center.addChild(innerCM);
        innerCM.relations.set(ERelationPinType.BOTTOM, center);
        innerCM.relations.set(ERelationPinType.RIGHT, center);
        innerCM.relations.set(ERelationPinType.LEFT, center);
        innerCM.relations.set(ERelationPinType.TOP, center);

        let innerCM1 = this.makeUI.view();
        innerCM1.setSize(20, 20);
        innerCM1.setBackgroundColor(0x00ffff, true);
        innerCM1.setXY(90, 90);
        center.addChild(innerCM1);
        innerCM1.relations.set(ERelationPinType.MIDDLE, center, ERelationPinType.MIDDLE);
        innerCM1.relations.set(ERelationPinType.CENTER, center, ERelationPinType.CENTER);
        
        let innerRT = this.makeUI.view();
        innerRT.setSize(20, 20);
        innerRT.setBackgroundColor(0x0000ff, true);
        innerRT.x = 180;
        center.addChild(innerRT);
        innerRT.relations.set(ERelationPinType.RIGHT, center, ERelationPinType.RIGHT);

        let innerRM = this.makeUI.view();
        innerRM.setSize(20, 20);
        innerRM.setBackgroundColor(0x0000ff, true);
        innerRM.setXY(180, 90);
        center.addChild(innerRM);
        innerRM.relations.set(ERelationPinType.RIGHT, center, ERelationPinType.RIGHT);
        innerRM.relations.set(ERelationPinType.MIDDLE, center, ERelationPinType.MIDDLE);

        let innerRB = this.makeUI.view();
        innerRB.setSize(20, 20);
        innerRB.setBackgroundColor(0x0000ff, true);
        innerRB.setXY(180, 180);
        center.addChild(innerRB);
        innerRB.relations.set(ERelationPinType.RIGHT, center);
        innerRB.relations.set(ERelationPinType.BOTTOM, center);

        let outterLT = this.addUI.view();
        group.addChild(outterLT);
        outterLT.setSize(20, 20);
        outterLT.setBackgroundColor(0xff00ff, true);
        outterLT.setXY(180, 180);
        outterLT.relations.set(ERelationPinType.TOP, center);
        outterLT.relations.set(ERelationPinType.LEFT, center);

        let outterLM = this.addUI.view();
        group.addChild(outterLM);
        outterLM.setSize(20, 20);
        outterLM.setBackgroundColor(0xff00ff, true);
        outterLM.setXY(180, 280);
        outterLM.relations.set(ERelationPinType.MIDDLE, center);
        outterLM.relations.set(ERelationPinType.LEFT, center);

        let outterLB = this.addUI.view();
        group.addChild(outterLB);
        outterLB.setSize(20, 20);
        outterLB.setBackgroundColor(0xff00ff, true);
        outterLB.setXY(180, 400);
        outterLB.relations.set(ERelationPinType.BOTTOM, center);
        outterLB.relations.set(ERelationPinType.LEFT, center);

        let outterCT = this.addUI.view();
        group.addChild(outterCT);
        outterCT.setSize(20, 20);
        outterCT.setBackgroundColor(0xff00ff, true);
        outterCT.setXY(280, 180);
        outterCT.relations.set(ERelationPinType.TOP, center);
        outterCT.relations.set(ERelationPinType.CENTER, center);

        let outterCM = this.addUI.view();
        group.addChild(outterCM);
        outterCM.setSize(20, 20);
        outterCM.setBackgroundColor(0xff00ff, true);
        outterCM.setXY(280, 280);
        outterCM.relations.set(ERelationPinType.MIDDLE, center);
        outterCM.relations.set(ERelationPinType.CENTER, center);

        let outterCB = this.addUI.view();
        group.addChild(outterCB);
        outterCB.setSize(20, 20);
        outterCB.setBackgroundColor(0xff00ff, true);
        outterCB.setXY(280, 400);
        outterCB.relations.set(ERelationPinType.BOTTOM, center);
        outterCB.relations.set(ERelationPinType.CENTER, center);
        
        let outterRT = this.addUI.view();
        group.addChild(outterRT);
        outterRT.setSize(20, 20);
        outterRT.setBackgroundColor(0xff00ff, true);
        outterRT.setXY(400, 180);
        outterRT.relations.set(ERelationPinType.TOP, center);
        outterRT.relations.set(ERelationPinType.RIGHT, center);

        let outterRM = this.addUI.view();
        group.addChild(outterRM);
        outterRM.setSize(20, 20);
        outterRM.setBackgroundColor(0xff00ff, true);
        outterRM.setXY(400, 280);
        outterRM.relations.set(ERelationPinType.MIDDLE, center);
        outterRM.relations.set(ERelationPinType.RIGHT, center);

        let outterRB = this.addUI.view();
        group.addChild(outterRB);
        outterRB.setSize(20, 20);
        outterRB.setBackgroundColor(0xff00ff, true);
        outterRB.setXY(400, 400);
        outterRB.relations.set(ERelationPinType.BOTTOM, center);
        outterRB.relations.set(ERelationPinType.RIGHT, center);

        let js = group.toJSON();
        console.log(js);        

        let clone = Package.inst.createObject(this, js) as View;
        clone.x = 400;
    }

    create(): void {
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