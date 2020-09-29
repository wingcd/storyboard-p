import { ViewScene } from "../core/ViewScene";
import { Rectangle } from "../phaser";
import { UITextField } from "./UITextField";

export class UIRichTextField extends UITextField { 
    static TYPE = "richtext";

    constructor(scene: ViewScene) {
        super(scene);

        this._canUseBitmap = false;
        this.rich = true;
    }

    public get tagMode(): boolean {
        return super.tagMode;
    }

    public set tagMode(val: boolean) {
        super.tagMode = val;
    }

    protected applyOpaque() {
        super.applyOpaque();

        if(this.rootContainer.input) {
            if(this._richTextField) {
                if(this.hitArea) {
                    this._richTextField.setInteractive(this.hitArea, Rectangle.Contains);    
                }
                if(this._richTextField.input) {
                    this._richTextField.input.enabled = this.rootContainer.input.enabled;
                }       
            }
        }
    }
}