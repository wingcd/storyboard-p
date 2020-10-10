import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Point } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { EDirectionType, EFillType, EOverflowType, ERelationPinType, EScrollType } from "../core/Defines";
import { Margin } from "../utils/Margin";
import { Package } from "../core/Package";
import { PackageItem } from "../core/PackageItem";
import { UIScrollBar } from "../ui/UIScrollBar";

// Settings.showDebugBorder = true;
// Settings.showDebugFrame = true;
// Settings.showDebugBounds = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {        
        this.load.image('nine', './res/44.png');
        this.load.image('normal', './res/ui/normal.png');
        this.load.image('up', './res/ui/up.png');
        this.load.image('down', './res/ui/down.png');
        this.load.image('left', './res/ui/left.png');
        this.load.image('right', './res/ui/right.png');
    }

    create(): void {
        
        let view = this.addUI.group();
        view.setBackgroundColor(0xa0a0a0, true);
        view.setXY(100, 50);
        view.setSize(450, 400);
        view.margin = new Margin(10, 10, 10, 10);
        view.overflowType = EOverflowType.Scroll;
        // view.scrollPane.inertanceEffect = true;
        view.scrollPane.scrollType = EScrollType.Both;
        view.scrollPane.bouncebackEffect = true;
        
        let child1 = this.makeUI.view();
        child1.setBackgroundColor(0x00ff00, true);
        child1.setXY(100, 200);
        // child1.angle = 45;
        child1.useBorderAsFrame = false;
        view.addChild(child1);
        child1.on(Phaser.Input.Events.POINTER_DOWN, (pointer: Pointer, localX: number, localY: number, event: EventData)=>{
            console.log(`${localX},${localY}`);
        });

        let child2 = this.makeUI.view();
        child2.setBackgroundColor(0xffff00, true);
        child2.setXY(400, 400);
        view.addChild(child2);

        let scroll = this.addUI.scrollBar({
            x: 100,
            y: 0,
            width: 200,
            height: 40,
        });  
        scroll.setBackgroundColor(0xffff00, true);    

        let bar = this.addUI.image({
            name: "bar",
            textureKey: "normal",
            width: 160,
            height: 50,
            x: 20,
        });
        bar.touchable = true;
        bar.fillMask.fillType = EFillType.Horizontal;
        bar.fillMask.origin = EDirectionType.Right;
        bar.fillMask.value = 1;           
        scroll.addChild(bar);        
        bar.relations.set(ERelationPinType.LEFT, scroll);
        bar.relations.set(ERelationPinType.RIGHT, scroll);

        let grip = this.addUI.image({
            name: "grip",
            textureKey: "nine",
            width: 20,
            height: 40,
            x: 20,
        });
        grip.touchable = true;
        scroll.addChild(grip);

        let lbtn = this.addUI.image({
            name: "arrow1",
            textureKey: 'left',
            width: 20,
            height: 40,
            enableBackground: true,
            backgroundColor: 0x00ff00,
        });
        lbtn.touchable = true;
        scroll.addChild(lbtn);

        let rbtn = this.addUI.image({
            name: "arrow2",
            textureKey: 'right',
            x: 180,
            width: 20,
            height: 40,
            enableBackground: true,
            backgroundColor: 0x00ff00,
        });
        rbtn.touchable = true;
        scroll.addChild(rbtn); 
        rbtn.relations.set(ERelationPinType.RIGHT, scroll);

        console.log(scroll.toJSON());  
      
        let vscroll = this.addUI.scrollBar({
            x: 700,
            y: 0,
            width: 40,
            height: 200,
        });  
        vscroll.setBackgroundColor(0xffff00, true);    

        let vbar = this.addUI.image({
            name: "bar",
            textureKey: "normal",
            width: 40,
            height: 160,
            y: 20,
        });
        vbar.touchable = true;
        vbar.fillMask.fillType = EFillType.Vertical;
        vbar.fillMask.origin = EDirectionType.Top;
        vbar.fillMask.value = 1;           
        vscroll.addChild(vbar);        
        vbar.relations.set(ERelationPinType.TOP, vscroll);
        vbar.relations.set(ERelationPinType.BOTTOM, vscroll);

        let vgrip = this.addUI.image({
            name: "grip",
            textureKey: "nine",
            width: 40,
            height: 20,
            y: 20,
        });
        vgrip.touchable = true;
        vscroll.addChild(vgrip);

        let vlbtn = this.addUI.image({
            name: "arrow1",
            textureKey: 'up',
            width: 40,
            height: 20,
            enableBackground: true,
            backgroundColor: 0x00ff00,
        });
        vlbtn.touchable = true;
        vscroll.addChild(vlbtn);

        let vrbtn = this.addUI.image({
            name: "arrow2",
            textureKey: 'down',
            y: 180,
            width: 40,
            height: 20,
            enableBackground: true,
            backgroundColor: 0x00ff00,
        });
        vrbtn.touchable = true;
        vscroll.addChild(vrbtn); 
        vrbtn.relations.set(ERelationPinType.BOTTOM, vscroll);

        let pkg = new PackageItem();
        Package.inst.addPackage(pkg);
        let hScroll = pkg.addTemplate(scroll.toJSON());    
        let vScroll = pkg.addTemplate(vscroll.toJSON());
        let v = Package.inst.createObjectFromUrl(this, hScroll) as UIScrollBar;
        v.x = 400;
            
        view.scrollPane.setSrollbar(hScroll, vScroll);
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
            }},
        ]
    }
};


window.onload = () => {
    var game = new App(config);
}