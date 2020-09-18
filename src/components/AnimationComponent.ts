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

    private _playOnEnable: boolean = false;
    private _timeline: TimelineManager;
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = BaseComponent.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_timeline", alias: "timeline"},
            {property: "_playOnEnable", alias: "playOnEnable", default: false},
        );
        return fields;
    }

    public get timeline(): TimelineManager {
        return this._timeline;
    }

    public get playOnEnable(): boolean {
        return this._playOnEnable;
    }

    public set playOnEnable(val: boolean) {
        this._playOnEnable = val;
    }
    
    public regist(view: View) {
        super.regist(view);

        if(this._timeline) {
            this._timeline.bindTarget(view.scene, view);
        }
    }
    
    public unRegist() {
        super.unRegist();

        if(this._timeline) {
            this._timeline.stop();
        }        
    }

    private onEnable() {
        if(this._timeline) {
            if(this._playOnEnable) {
                this._timeline.play();
            } 
        }
    }

    private onDisable() {
        if(this._timeline) {
            this._timeline.stop();
        } 
    }
}

ComponentFactory.regist(AnimationComponent);