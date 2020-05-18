import * as Events from "../events";
import { GestureClick } from "./GestureClick";
import { GestureDoubleClick } from "./GestureDoubleClick";
import { GestureLongTouch } from "./GestureLongTouch";
import { DropComponent } from "./DropComponent";

export class ComponentFactory {
    private static _inst: ComponentFactory;
    public static get inst(): ComponentFactory {
        if(!ComponentFactory._inst) {
            ComponentFactory._inst = new ComponentFactory();
        }

        return ComponentFactory._inst;
    }

    private _events: any = {};
    private _eventComponents: {
       [key: string] : any[]
    } = {};

    public registEvents(type: string, compType: new()=>{}) {
        this._events[type] = compType;
        let key = compType.prototype.constructor.name;
        if(!this._eventComponents[key]) {
            this._eventComponents[key] = [];
        }
        this._eventComponents[key].push(type);
    }

    public getEventComponentType(type: string): new()=>{} {
        return this._events[type];
    }

    public getEvents(compType: new()=>{}): string[] {
        let key = compType.prototype.constructor.name;
        if(!this._eventComponents[key]) {
            return [];
        }
        return this._eventComponents[key];
    }

    public getRelationEvents(type: string, trimSelf: boolean = false): string[] {
        let comp = this.getEventComponentType(type);
        if(!comp) {
            return [type];
        }

        let events = this.getEvents(comp);
        if(trimSelf) {
            let idx = events.indexOf(type);
            if(idx >= 0) {
                events.splice(idx, 1);
            }
        }
        return events;
    }
}

ComponentFactory.inst.registEvents(Events.DragEvent.DROP, DropComponent);
ComponentFactory.inst.registEvents(Events.GestureEvent.Click, GestureClick);
ComponentFactory.inst.registEvents(Events.GestureEvent.DoubleClick, GestureDoubleClick);
ComponentFactory.inst.registEvents(Events.GestureEvent.LongTouchStart, GestureLongTouch);
ComponentFactory.inst.registEvents(Events.GestureEvent.LongTouchEnd, GestureLongTouch);