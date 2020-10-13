import { View } from "../core/View";
import { IComponentOptions } from "../types";

export function disallow_multiple_component(options?: IComponentOptions): ClassDecorator {
    return target => {
        let value = {
            options,
            onCheckComponent: (owner: View, type: Function)=>{
                if(owner.hasComponent(type, options)) {
                    throw new Error(`already had the same instance of ${type.name} or parent/child type`);
                }
            }
        }

        Reflect.defineMetadata(Symbol("disallow_multiple_component"), value, target);
    }
}

export function enable_replaced_component(options?: IComponentOptions): ClassDecorator {
    return target => {
        let value = {
            options,
            onCheckComponent:(owner: View, type: Function)=>{
                owner.removeComponentByType(type, true, options);
            }
        }

        Reflect.defineMetadata(Symbol("enable_replaced_component"), value, target);
    }
}

export function require_component(compType: new()=>{}): ClassDecorator {
    return target => {
        let value = {
            compType,
            onBeforeAddComponent: (owner: View, type: Function)=>{
                if(!owner.hasComponent(compType)) {
                    owner.addComponentByType(compType);
                }
            }
        }

        Reflect.defineMetadata(Symbol("require_component"), value, target);
    }
}
