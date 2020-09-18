import { BaseComponent } from "./BaseComponent";
import { ECategoryType } from "../core/Defines";
import { disallow_multiple_component } from "../annotations/Component";
import { View } from "../core/View";
import { ISerializeInfo } from "../annotations/Serialize";
import { ComponentFactory } from "./ComponentFactory";
import { PropertyManager } from "../tween/Property";
import { SerializableComponent } from "./SerializableComponent";

 @disallow_multiple_component()
export class PropertyComponent extends SerializableComponent {
    public static CATEGORY = ECategoryType.Component;
    public static TYPE = "property";

    private _propMgr: PropertyManager;
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = BaseComponent.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_propMgr", alias: "propMgr", type: PropertyManager},
        );
        return fields;
    }

    public get propertyManger(): PropertyManager {
        return this._propMgr;
    }

    public set propertyManger(val: PropertyManager) {
        if(val != this._propMgr) {
            this._propMgr = val;
            if(this.owner) {
                this._propMgr.bindTarget(this.owner);
            }
        }
    }
    
    public regist(view: View) {
        if(this._propMgr) {
            this._propMgr.bindTarget(view);
        }
        super.regist(view);
    }
}

ComponentFactory.regist(PropertyComponent);