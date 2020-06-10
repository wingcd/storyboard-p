import { Scene } from "../phaser";
import { View } from "./View";
import { ViewGroup } from "./ViewGroup";
import { ViewScene } from "./ViewScene";

export class ViewFactory {
    private _scene: ViewScene;
    private _addToRoot: boolean;
    constructor(scene: ViewScene, addToRoot: boolean) {        
        this._scene = scene;
        this._addToRoot = addToRoot;
    }

    private _add(cls: {new (scene:ViewScene, config?:any):View}, config?:any): View {
        let view = new cls(this._scene, config);
        if(this._addToRoot) {
            this._scene.root.addChild(view);
        }
        return view;
    }

    public view(config?:any): View {
        return this._add(View, config);
    }

    public group(config?:any): ViewGroup {
        return this._add(ViewGroup, config) as ViewGroup;
    }
}