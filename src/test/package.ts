import { Settings } from "../core/Setting";
import { StageScalePlugin, Pointer, EventData, GameObject, EStageScaleMode, EStageOrientation, Rectangle } from "../phaser";
import { UIManager } from "../core/UIManager";
import { ViewScene } from "../core/ViewScene";
import { BaseComponent } from "../components/BaseComponent";
import { Deserialize, Serialize } from "../utils/Serialize";
import { DragComponent } from "../components/DragComponent";
import { ScrollPaneComponent } from "../components/ScrollPaneComponent";
import { ViewGroup } from "../core/ViewGroup";
import { EEaseType, EOverflowType } from "../core/Defines";
import { Package } from "../core/Package";
import { PackageItem } from "../core/PackageItem";
import { View } from "../core/View";
import { PropertyManager } from "../tween/Property";
import { GetViewRelativePath, GetViewByRelativePath } from "../utils/Object";
import { TimelineManager, KeyFrameGroup } from "../tween/Timeline";
import { AnimationComponent } from "../components/AnimationComponent";

Settings.showDebugBorder = true;
Settings.showDebugFrame = true;

class UIScene extends ViewScene {
    constructor() {
        super({key: 'game', active: true})
    }

    preload() {
        let r = this.addUI.group();
        r.overflowType = EOverflowType.Scroll;
        r.scrollPane.scrollSpeed = 20;

        r.setBackgroundColor(0x0000ff, true);
        r.setSize(50,100);
        r.setXY(50, 50);
        
        let g = this.addUI.view();
        g.setBackgroundColor(0x00ff00, true);
        g.setSize(50,40);
        g.setXY(-5, -5);
        r.addChild(g);

        let path = GetViewRelativePath(r, g);
        console.log(path);
        let g1 = GetViewByRelativePath(r, path);
        console.log(g1);

        let json = r.toJSON();
        let pkgItem = new PackageItem();        
        Package.inst.addPackage(pkgItem);
        let temp = pkgItem.addTemplate(json);

        let prop = new PropertyManager();
        prop.add("state1").add("x", 100).add("y", 200).bindTarget(g);
        prop.bindTarget(r);
        let propJson = prop.toJSON();
        console.log(JSON.stringify(propJson));
        let propTemp = pkgItem.addTemplate(propJson);

        let clone = Package.inst.createObjectFromUrl(this, temp) as View;
        clone.x = 200;

        let clone1 = Package.inst.createObjectFromUrl(this, propTemp) as PropertyManager;
        clone1.bindTarget(clone);

        let copyJson = clone.toJSON();
        console.log(JSON.stringify(copyJson));

        let clone2 = Package.inst.createObjectFromData(this, copyJson) as View;
        clone2.x = 300;

        let itemJson = Serialize(pkgItem);

        let pk = new PackageItem();
        Deserialize(pk, itemJson);

        let pkgJson = Serialize(Package.inst);

        let pkg = new Package();
        Deserialize(pkg, pkgJson);

        console.log(JSON.stringify(pkgJson));
        
        console.log(1);
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