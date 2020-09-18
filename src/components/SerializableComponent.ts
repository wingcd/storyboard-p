import { BaseComponent } from "./BaseComponent";
import { ECategoryType } from "../core/Defines";

export class SerializableComponent extends BaseComponent {
    public static CATEGORY = ECategoryType.Component;
    public static TYPE = "";
}