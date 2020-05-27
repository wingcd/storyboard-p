import { Scene,GameObjectFactoryExt } from "../phaser"
import { UIManager } from "./UIManager";
import { ViewRoot } from "./ViewRoot";
import { ViewFactory } from "./ViewFactory";

export class ViewScene extends Scene {    
    _uimgr: UIManager;
    _root: ViewRoot;
    _addFactory: ViewFactory;
    _makeFactory: ViewFactory;
    _addExt: GameObjectFactoryExt;
    constructor(config: string | Phaser.Types.Scenes.SettingsConfig) {
        super(config);
    }

    init() {
        this._uimgr = (this as any).uimgr as UIManager;  
        this._root = this._uimgr.create(this);
        this._addFactory = new ViewFactory(this, true);
        this._makeFactory = new ViewFactory(this, false);
        this._addExt = new GameObjectFactoryExt(this);
        this.scale.refresh();
    }

    get addExt(): GameObjectFactoryExt {        
        return this._addExt;
    }

    public get ui(): UIManager {
        return this._uimgr;
    }

    public get root(): ViewRoot {
        return this._root;
    }

    /**
     * update ui system
     * when override this method, you need invoke super update method
     */
    public update(time: number, delta: number) {
        super.update(time, delta);
        
        this._root.onGizmos();
        this._root.onUpdate(time, delta);
    }

    public get addUI(): ViewFactory {
        return this._addFactory;
    }

    public get makeUI(): ViewFactory {
        return this._makeFactory;
    }
}