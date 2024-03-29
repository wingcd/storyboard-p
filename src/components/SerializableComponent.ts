import { BaseComponent } from "./BaseComponent";
import { ECategoryType } from "../core/Defines";
import { ComponentFactory } from "./ComponentFactory";
import { Deserialize, Serialize } from "../utils/Serialize";
import { ISerializeFields } from "../types";
import { Templates } from "../core/Templates";
import { ViewScene } from "../core/ViewScene";
import { ISerializableCompoent } from "../types";
import { Package } from "../core/Package";
import { View } from "../core/View";

export class SerializableComponent extends BaseComponent implements ISerializableCompoent {
    public static CATEGORY = ECategoryType.Component;
    public static TYPE = "";    

    static SERIALIZABLE_FIELDS: ISerializeFields = {
        CATEGORY: {alias: "__category__", static: true, readOnly: true},
        TYPE: {alias: "__type__", static: true, readOnly: true, must: true},

        enable: {importAs: "_enable",default: true},
        resourceUrl: {},
        id: { importAs: "_id" }, 
    };   

    static DESERIALIZE(config: any, target: View, configProp: string, targetProp: string, tpl: any, index?: number) {
        return [ComponentFactory.inst.create(config, tpl), false];
    }

    private _inBuilding = false;  

    private _id: string;
    public resourceUrl: string;  

    public constructor() {
        super();

        this._id = `${Package.getUniqueID()}`;        
    }

    protected fromConfig(config: any, tpl?:any) {
        this._inBuilding = false;
    }

    public get id(): string {
        return this._id;
    }

    public get inBuilding(): boolean {
        return this._inBuilding;
    }

    public clone(): SerializableComponent {
        let json = this.toJSON();
        return ComponentFactory.inst.create(json) as SerializableComponent;
    }   

    public toJSON(tpl?: any, ignores?: string[]): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp || tpl, ignores);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            this._inBuilding = true;
            Deserialize(this, config, template);
        }

        return this;
    }
}

Templates.regist(SerializableComponent.CATEGORY, null, (scene: ViewScene, data: any, tpl: any)=>{
    return ComponentFactory.inst.create(data, tpl);
});