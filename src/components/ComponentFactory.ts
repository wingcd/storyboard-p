import { IComponent } from "../types";

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
    private _components: {
        [key: string] : Function
     } = {};

    public regist(compType: Function) {
        let tName = (compType as any).TYPE;
        if(tName) {
            this._components[tName] = compType;
        }
    }

    private _add(cls: {new (): IComponent}, config?:any): IComponent {
        let comp = new cls();
        comp.fromJSON(config);
        return comp;
    }

    public create(config?: any): IComponent {
        if(!config || !config.type) {
            throw new Error("must be with component type to create instance!");
        }

        let type: any = this._components[config.type];
        if(!type) {
            throw new Error(`not regist component type:${type}!`);
        }

        return this._add(type, config);
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