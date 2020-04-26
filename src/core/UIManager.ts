import { Scene } from "../phaser";
import { ViewRoot } from "./ViewRoot";
import { ViewScene } from "./ViewScene";

export class UIManager extends Phaser.Plugins.BasePlugin {
    constructor (pluginManager: Phaser.Plugins.PluginManager) {
        super(pluginManager);
    }

    public create(scene: ViewScene)  {
        let root: ViewRoot = (scene as any).uiroot;
        if(root) {
            return root;
        }

        root = new ViewRoot();
        root.attachTo(scene);

        (scene as any).uiroot = root;
        return root;
    }
}