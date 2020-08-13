import { ViewGroup } from "./ViewGroup";
import { Scene, Game, Size, Scale, Container } from "../phaser";
import { View } from "./View";
import { ViewScene } from "./ViewScene";
import { FocusEvent } from "../events";

export class ViewRoot extends ViewGroup {
    private _game: Game;
    private _uiRoot: Container;    
    private _focusedObject: View;

    constructor(scene: ViewScene) {
        super(scene);
        this._root = this;

        this._attachTo(scene);
    }

    private _attachTo(scene: ViewScene) {
        if(!this._game) {
            this._game = scene.game;
            this.bind(scene);

            scene.children.add(this._rootContainer);
            this.opaque = true;
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

    protected relayout() {
        super.relayout();
                
        this.applyOverflow();
    }

    public get focus(): View {
        if (this._focusedObject && !this._focusedObject.onStage)
            this._focusedObject = null;

        return this._focusedObject;
    }

    public set focus(value: View) {
        if (value && (!value.focusable || !value.onStage))
            throw new Error("Invalid target to focus");

        this.setFocus(value);
    }

    private setFocus(value: View) {
        if (this._focusedObject != value) {
            this._focusedObject = value;
            this.emit(FocusEvent.CHANGED, this);
        }
    }
}