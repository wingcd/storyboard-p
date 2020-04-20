import { ViewGroup } from "./ViewGroup";
import { Scene, Game, Size, Scale, Container } from "../phaser";

export class ViewRoot extends ViewGroup {
    private _game: Game;
    private _uiRoot: Container;

    public attachTo(scene: Scene) {
        if(!this._game) {
            this._game = scene.game;
            this.bind(scene);

            this._uiRoot = scene.add.container(0, 0);
            this._uiRoot.add(this._rootContainer);
            this._init();
        }
    }

    private _init() {  
        this._game.scale.on("orientation_resize", this._sizeChanged.bind(this));
    }

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

        this._game.scale.off("orientation_resize", this._sizeChanged.bind(this));
    }

    private _sizeChanged(width: number, height: number, rotation: number) {
        // let scale = this._scene.scale.displayScale;
        // width *= scale.x;
        // height *= scale.y;
        // this._uiRoot.setScale(1/scale.x, 1/scale.y);
        this.setSize(width, height);
        this._scene.cameras.resize(width, height);
    }
}