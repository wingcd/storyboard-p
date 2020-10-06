import { IComponent } from "../types";
import { View } from "../core/View";
import { ISerializeInfo } from "../annotations/Serialize";
import { Serialize, Deserialize } from "../utils/Serialize";
import { ComponentFactory } from "./ComponentFactory";

export class BaseComponent implements IComponent {
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        return [
            {property: "TYPE", alias: "type", static: true, readonly: true, must: true},
            {property: "enable",importAs: "_enable",default: true}
        ];
    }

    protected _owner: View;
    protected _enable: boolean = true;

    private _inBuilding = false;

    static DESERIALIZE(config: any, target: View, configProp: string, targetProp: string, tpl: any, index?: number) {
        return ComponentFactory.inst.create(config);
    }

    constructor() {
        let that = this as any;

        if(that.awake) {
            that.awake();
        }
    }

    protected constructFromJson(config: any, tpl?:any) {
        this._inBuilding = false;
    }

    public get inBuilding(): boolean {
        return this._inBuilding;
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

    public toJSON(): any {
        let json = Serialize(this);
        return json;
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            this._inBuilding = true;
            Deserialize(this, config, template);
        }        

        return this;
    }
}