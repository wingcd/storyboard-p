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
    public static TYPE = "property";

    private _contollers: PropertyManager[] = [];
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = BaseComponent.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_contollers", alias: "contollers", type: PropertyManager, default: []},
        );
        return fields;
    }

    public get properties(): PropertyManager[] {
        return this._contollers;
    }

    public has(name: string): boolean {
        return this._contollers.findIndex(c=>{
            return c.name == name;
        }) >= 0;
    }

    public add(name: string): PropertyManager {
        if(this.has(name)) {
            console.error(`has same name "${name}" property manager!`);
            return null;
        }

        let pm = new PropertyManager(name, this.owner);
        this._contollers.push(pm);
        return pm;
    }

    public get(name: string) {
        return this._contollers.find(c=>{
            return c.name == name;
        });
    }    

    public getAt(index: number): PropertyManager {
        if(index >= 0 && index < this._contollers.length) {
            return this._contollers[index];
        }
        return null;
    }
    
    public regist(view: View) {
        if(this._contollers) {
            for(let key in this._contollers) {
                let pm = this._contollers[key];
                pm.bindTarget(view);
                pm.store();
            }
        }
        super.regist(view);
    }
}

ComponentFactory.regist(PropertyComponent);