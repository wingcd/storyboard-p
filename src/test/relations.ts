import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { ERelationPinType } from "../core/Relations";
import { EDragType } from "../core/Defines";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let left = this.addUI.view();
        left.setBackgroundColor(0xff0000, true);
        left.setXY(150, 250);
        left.setSize(50, 100);
        left.draggable = true;
        left.dragComponent.dragType = EDragType.Horizontal;

        let right = this.addUI.view();
        right.setBackgroundColor(0xff0000, true);
        right.setXY(400, 250);
        right.setSize(50, 100);
        right.draggable = true;    
        right.dragComponent.dragType = EDragType.Horizontal;
        
        let top = this.addUI.view();
        top.setBackgroundColor(0xff0000, true);
        top.setXY(250, 150);
        top.height = 50;
        top.draggable = true;
        top.dragComponent.dragType = EDragType.Vertical;

        let bottom = this.addUI.view();
        bottom.setBackgroundColor(0xff0000, true);
        bottom.setXY(250, 400);
        bottom.height = 50;
        bottom.draggable = true;    
        bottom.dragComponent.dragType = EDragType.Vertical;

        let center = this.addUI.group();
        center.setBackgroundColor(0xffff00, true);
        center.setXY(200, 200);
        center.setSize(200, 200);
        center.relations.set(ERelationPinType.LEFT, left, ERelationPinType.LEFT);
        center.relations.set(ERelationPinType.RIGHT, right, ERelationPinType.RIGHT);
        center.relations.set(ERelationPinType.TOP, top, ERelationPinType.TOP);
        center.relations.set(ERelationPinType.BOTTOM, bottom, ERelationPinType.BOTTOM);

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
        innerCM.relations.set(ERelationPinType.MIDDLE, center, ERelationPinType.MIDDLE);
        innerCM.relations.set(ERelationPinType.CENTER, center, ERelationPinType.CENTER);
        
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