import { ViewGroup } from "./ViewGroup";
import { Scene, Game, Size } from "../phaser";
import { Scale } from "phaser";

export class ViewRoot extends ViewGroup {
    private _game: Game;

    public attachTo(scene: Scene) {
        if(!this._game) {
            this._game = scene.game;
            this.bind(scene);

            scene.children.add(this._rootContainer);
            this._init();
        }
    }

    private _init() {  
        this.setSize(this._game.scale.displaySize.width, this._game.scale.displaySize.height);
        this._game.scale.on(Scale.Events.RESIZE, this._sizeChanged.bind(this));
    }

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

        this._game.scale.off(Scale.Events.RESIZE, this._sizeChanged.bind(this));
    }

    private _sizeChanged(gameSize:Size, baseSize: Size, displaySize: Size, resolution: number, previousWidth: number, previousHeight: number) {
        this.setSize(displaySize.width, displaySize.height);
    }
}