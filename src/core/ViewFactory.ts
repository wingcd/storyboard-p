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

    private _add(cls: {new():View}): View {
        let view = new cls();
        view.bind(this._scene);
        if(this._addToRoot) {
            this._scene.root.addChild(view);
        }
        return view;
    }

    public view(): View {
        return this._add(View);
    }

    public group(): ViewGroup {
        return this._add(ViewGroup) as ViewGroup;
    }
}