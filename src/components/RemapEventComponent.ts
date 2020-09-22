import { disallow_multiple_component } from "../annotations/Component";
import { BaseComponent } from "./BaseComponent";

@disallow_multiple_component()
export class RemapEventComponent extends BaseComponent {    
    protected _souceType = "";
    protected _targetType = "";

    private onEnable() {
        this.owner.on(this._souceType, this._onEvent, this);
    }

    private onDisable() {
        this.owner.off(this._souceType, this._onEvent, this);     
    }

    private _onEvent() {
        let args = [this.owner];
        for(let a of arguments) {
            args.push(a);
        }
        this.owner.emit(this._targetType, ...args);
    }
}
