import { ViewGroup } from "./ViewGroup";
import { Scene, Game } from "../phaser";
import { Scale } from "phaser";

export class ViewRoot extends ViewGroup {
    private static _inst: ViewRoot;
    public static get inst() {
        if(!ViewRoot._inst) {
            ViewRoot._inst = new ViewRoot();
        }
        return ViewRoot._inst;
    }

    bind(scene: Scene): boolean {
        if(super.bind(scene)){
            return true;
        }
        return false;
    }

    private _init() {        
        this._scene.game.scale.on(Scale.Events.ORIENTATION_CHANGE, this._sizeChanged);
    }

    private _sizeChanged() {

    }
}