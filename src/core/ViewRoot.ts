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
        this._game.scale.on(Scale.Events.RESIZE, this._sizeChanged.bind(this));
    }

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

        this._game.scale.off(Scale.Events.RESIZE, this._sizeChanged.bind(this));
    }

    private _sizeChanged(gameSize:Size, baseSize: Size, displaySize: Size, resolution: number, previousWidth: number, previousHeight: number) {
        let width = gameSize.width;
        let height = gameSize.height;
        this.setSize(width, height);
    }
}