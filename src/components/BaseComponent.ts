import { IComponent } from "../types";
import { View } from "../core/View";
import { ISerializeFields } from "../types";
import { ComponentFactory } from "./ComponentFactory";

export class BaseComponent implements IComponent {
    protected _owner: View;
    protected _enable: boolean = true;

    constructor() {
        let that = this as any;

        if(that.awake) {
            that.awake();
        }
    }

    public get owner(): View {
        return this._owner;
    }

    public get enable(): boolean {
        return this._enable;
    }

    public set enable(val: boolean) {
        if(val != this._enable) {
            this._enable = val;
            this._emitEnable();
        }
    }

    private _emitEnable() {
        let that = this as any;
        if(this._enable) {
            if(that.onEnable) {
                that.onEnable();
            }
        }else{
            if(that.onDisable) {
                that.onDisable();
            }
        }
    }

    /**@internal */
    regist(owner: View): void {
        if(this._owner == owner) {
            return;
        }

        if(this._owner) {
            this.unRegist();
        }

        this._owner = owner;

        let that = this as any;   
        if(that.onEnable) {
            that.onEnable();
        }
    }

    /**@internal */
    unRegist(): void {
        if(!this._owner) {
            return;
        }
        
        let that = this as any;
        if(that.onDisable) {
            that.onDisable();
        }

        this._owner = null;
    }

    public dispose(): void {
        if(this._owner) {
            this._owner.removeComponent(this);
        }

        let that = this as any;

        if(that.onDispose) {
            that.onDispose();
        }
    }
}