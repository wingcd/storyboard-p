import { BaseComponent } from "./BaseComponent";
import { ECategoryType } from "../core/Defines";
import { disallow_multiple_component } from "../annotations/Component";
import { View } from "../core/View";
import { ISerializeInfo } from "../annotations/Serialize";
import { ComponentFactory } from "./ComponentFactory";
import { TimelineManager } from "../tween/Timeline";

 @disallow_multiple_component()
export class AnimationComponent extends BaseComponent {
    public static CATEGORY = ECategoryType.Component;
    public static TYPE = "animation";

    private _timeline: TimelineManager;
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = BaseComponent.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_timeline", alias: "timeline"},
        );
        return fields;
    }

    
    public regist(view: View) {
        super.regist(view);
    }
    
    public unRegist() {
        super.unRegist();
    }

    private onEnable() {

    }

    private onDisable() {

    }
}

ComponentFactory.regist(AnimationComponent);