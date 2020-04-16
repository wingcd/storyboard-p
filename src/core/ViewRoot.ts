import { ViewGroup } from "./ViewGroup";
import { Scene, Game, Size, Scale, Container } from "../phaser";

export const enum EOrientation {
    AUTO,
    PORTRAIT,
    LANDSCAPE,
}

export class ViewRoot extends ViewGroup {
    private _game: Game;
    private _orientation: EOrientation = EOrientation.AUTO;

    public attachTo(scene: Scene, options?: {
        orientation?: EOrientation,
    }) {
        if(!this._game) {
            this._game = scene.game;
            this.bind(scene);

            if(options) {
                this._orientation = options.orientation ? options.orientation : this._orientation;
            }

            this._scene.children.add(this._rootContainer);
            this._init();
        }
    }

    private _init() {  
        // this.setSize(this._game.scale.gameSize.width, this._game.scale.gameSize.height);
        this._game.scale.on("user_resize", this._sizeChanged.bind(this));
    }

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

        this._game.scale.off("user_resize", this._sizeChanged.bind(this));
    }

    private _sizeChanged(width: number, height: number) {
        this.setSize(width, height);
        this._scene.cameras.resize(width, height);

        // let shouldRotate = false;
        // if(this._orientation !== EOrientation.AUTO) {
        //     let rotType = width / height < 1 ? EOrientation.PORTRAIT : EOrientation.LANDSCAPE;
        //     shouldRotate = rotType != this._orientation;
        //     if(shouldRotate) {
        //         [width, height] = [height, width];
        //     }

        //     let rotate = 0;
        //     if(shouldRotate) {
        //         if(this._orientation == EOrientation.LANDSCAPE) {
        //             rotate = 90;    
        //             this._uiRoot.x = height;
        //         }else{
        //             rotate = -90;
        //             this._uiRoot.y = width;
        //         }

        //         this._uiRoot.angle = rotate;
        //     }
        // }
    }
}