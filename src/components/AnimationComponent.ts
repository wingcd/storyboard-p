import { disallow_multiple_component } from "../annotations/Component";
import { View } from "../core/View";
import { ComponentFactory } from "./ComponentFactory";
import { TimelineManager } from "../tween/Timeline";
import { SerializableComponent } from "./SerializableComponent";
import { IComponent, ISerializeInfo } from "../types";

 @disallow_multiple_component()
export class AnimationComponent extends SerializableComponent implements IComponent{
    public static TYPE = "animation";

    private _timelines: TimelineManager[] = [];
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = SerializableComponent.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "_timelines", alias: "timelines", type: TimelineManager, default: []},
        );
        return fields;
    }

    public get timelines(): TimelineManager[] {
        return this._timelines;
    }

    public has(name: string): boolean {
        return this._timelines.findIndex(c=>{
            return c.name == name;
        }) >= 0;
    }

    public add(name: string): TimelineManager {
        if(this.has(name)) {
            console.error(`has same name "${name}" timelie manager!`);
            return null;
        }

        let tl = new TimelineManager(name, this.owner?this.owner.scene:null, this.owner);
        this._timelines.push(tl);
        return tl;
    }

    public get(name: string) {
        return this._timelines.find(c=>{
            return c.name == name;
        });
    }    

    public getAt(index: number): TimelineManager {
        if(index >= 0 && index < this._timelines.length) {
            return this._timelines[index];
        }
        return null;
    }
    
    public regist(view: View) {
        if(this._timelines) {
            for(let t of this._timelines) {
                t.bindTarget(view.scene, view);
                t.store();
            }
        }
        super.regist(view);
    }

    private onEnable() {
        if(this._timelines) {
            for(let t of this._timelines) {
                if(t.playOnEnable) {
                    t.play();
                }
            }
        }  
    }

    private onDisable() {
        if(this._timelines) {
            for(let t of this._timelines) {
                t.stop();
            }
        }  
    }

    private onDispose() {
        if(this._timelines) {
            for(let t of this._timelines) {
                t.destroy();
            }
            this._timelines.length = 0;
        }
    }
}

export type Animation = AnimationComponent;
ComponentFactory.regist(AnimationComponent);