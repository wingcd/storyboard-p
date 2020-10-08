import { Property } from "../tween/Property";
import { View } from "../core/View";
import { ITemplatable } from "./ITemplatable";

export interface ComponentOptions {
    containsParentType?: boolean; 
    containsChildType?: boolean;
    containsSameParentType?: boolean;
}

export interface IComponent {
    owner: View;
    enable: boolean;
    regist(obj: View): void;
    unRegist(): void;
    dispose(): void;

    // awake?(): void;
    // onEnable?(): void;
    // onDisable?(): void;
    // onDispose?(): void;
    // update?(): void;
}

export interface ISerializableCompoent extends IComponent, ITemplatable{

}

export interface IComponentable {    
    addComponentByType(compType: new()=>{}): IComponent;
    addComponent(comp: IComponent): IComponent;
    removeComponent(comp: IComponent): this;
    removeComponentByType(type: Function, all?: boolean, options?: ComponentOptions): this;
    hasComponent(type: Function, options?: ComponentOptions): boolean;
    getComponent(type: Function, options?: ComponentOptions): IComponent;
    getComponents(type: Function, options?: ComponentOptions): IComponent[];
}