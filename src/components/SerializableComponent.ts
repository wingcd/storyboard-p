import { BaseComponent } from "./BaseComponent";
import { ECategoryType } from "../core/Defines";
import { ComponentFactory } from "./ComponentFactory";

export class SerializableComponent extends BaseComponent {
    public static CATEGORY = ECategoryType.Component;
    public static TYPE = "";

    public clone(): SerializableComponent {
        let json = this.toJSON();
        return ComponentFactory.inst.create(json) as SerializableComponent;
    }
}