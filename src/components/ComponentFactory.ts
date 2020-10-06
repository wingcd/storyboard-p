import { IComponent } from "../types";
import { ObjectFactory } from "../core/ObjectFactory";
import { ECategoryType } from "../core/Defines";

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

    public create(config?: any, template?: any): IComponent {
        let comp = ObjectFactory.create(ECategoryType.Component, config) as IComponent;
        comp.fromJSON(config, template);
        return comp;
    }

    public static regist(viewType: Function) {
        let tName = (viewType as any).TYPE;
        if(tName) {
            ObjectFactory.regist(ECategoryType.Component, tName, viewType);
        }
    }

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