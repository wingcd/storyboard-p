import { GetValue } from "../utils/Object";
import { ISerializeInfo } from "../annotations/Serialize";
import { View } from "../core/View";
import { Serialize, Deserialize } from "../utils/Serialize";
import { ViewGroup } from "../core/ViewGroup";
import { ECategoryType } from "../core/Defines";
import { ITemplatable } from "../types/ITemplatable";
import { Package } from "../core/Package";
import { Templates } from "../core/Templates";

export class Property {
    _name: string = null;
    name: string = null;
    value: any = null;
    target: any = null;

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "name"},
            {property: "value"},
        );
        return fields;
    }
}

class PropertyGroup {
    private _targetName: string;
    private _target: View;
    private _parent: PropertyManager;
    private _properties:Property[] = [];
    private _name: string = null;
    private _store: any = {};

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "_name", alias: "name", default: null},
            {property: "_properties", alias: "properties", type: Property, default: []},            
            {property: "_target", alias: "target", importAs: "_targetName", default: null},
        );
        return fields;
    }

    static CREATE_INSTANCE(config: any, target: PropertyManager, configProp: string, targetProp: string, tpl: any, index?: number): {inst: PropertyGroup, hasInit:boolean} {
        return { 
            inst: new PropertyGroup(target, config.name), 
            hasInit: false
        };
    }

    static DESERIALIZE_FIELD_START(config: any, target: any, configProp: string, targetProp: string, tpl: any): boolean {
        if(target instanceof PropertyGroup) {
            
        }
        return true;
    }

    static DESERIALIZE_FIELD_END(config: any, target: any, configProp: string, targetProp: string, tpl: any) {
        if(typeof(target.getMetadata) === "function") {
            let metadata = target.getMetadata();

        }
    }

    // static DESERIALIZE_COMPLETED(source: any, target: any, tpl: any) {
    //     if(target instanceof PropertyGroup) {
    //         let props: Property[] = target._properties.slice();
    //         target._properties = [];
    //         for(let p of props) {
    //             target.add(p.name, p.value);
    //         }
    //     }
    // }

    constructor(parent: PropertyManager, name: string) {
        this._parent = parent;
        this._name = name;
    }

    public store(): this {
        this._properties.forEach(p=>{
            this._store[p._name] = {
                name: p.name,
                target: p.target,
                value: p.target[p.name],
            }
        });
        return this;
    }

    public resotre(): this {
        for(let name in this._store) {
            let p = this._store[name];
            p.target[p.name] = p.value;
        }

        return this;
    }

    public get target(): any {
        return this._target;
    }

    public get name(): string {
        return this._name;
    }

    public set name(value: string) {
        this._name = value;
    }

    public getAll(): Property[] {
        return this._properties;
    }

    public applyAll(lastGroup: PropertyGroup): PropertyGroup {
        if(!this._target) {
            return this;
        }

        if(lastGroup) {
            lastGroup.resotre();
        }
        
        for(let idx in this._properties) {
            let p:Property = this._properties[idx];
            if(p === undefined) {
                continue;
            }

            p.target[p.name] = p.value;
        }

        return this;
    }

    public add(propName: string, value: any): PropertyGroup {
        let prop = this.getByName(propName);
        if(!prop) {
            prop = new Property();
            prop._name = prop.name = propName;
            prop.target = this._target;
            this._properties.push(prop);

            if(propName.indexOf('.') >= 0) {
                prop._name = propName.replace('.', '$');
                prop.target = GetValue(prop.target, propName, undefined, true);
                let names = propName.split('.');            
                prop.name = names[names.length - 1];
            }
        }

        if(prop.value != value) {
            prop.value = value;
        }

        return this;
    }

    public getByName(name: string): Property {
        return this._properties.find((item)=>{
            return item.name == name;
        });
    }

    public remove(prop: Property): PropertyGroup {
        let index = this._properties.indexOf(prop);
        if(index >= 0) {
            this._properties.splice(index, 1);
        }
        return this;
    }

    public removeByName(name: string): PropertyGroup {
        let index = this._properties.findIndex((item)=>{
            return item.name == name;
        });
        if(index >= 0) {
            this._properties.splice(index, 1);
        }
        return this;
    }

    /**@internal */
    bindTarget(parentTarget: View): this {
        let owner: View = parentTarget;
        if(parentTarget instanceof ViewGroup) {
            owner = parentTarget.getChild(this._targetName); 
        }
        this._target = owner;
        
        if(owner) {
            let props = this._properties.slice();
            this._properties.length = 0;

            for(let p of props) {
                this.add(p.name, p.value);
            }
        }

        return this;
    }
}

export class PropertyManager implements ITemplatable {
    static CATEGORY = ECategoryType.Property;
    
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "CATEGORY", alias: "__category__", static: true, readonly: true},

            {property: "resourceUrl", default: null},
            {property: "_id", alias: "id", default: null},
            {property: "_groups", alias: "groups", type: PropertyGroup, default: []},
        );
        return fields;
    }

    static CREATE_INSTANCE(config: any, target: View, configProp: string, targetProp: string, tpl: any, index?: number): {inst: PropertyManager,hasInit:boolean} {
        return { 
            inst: (new PropertyManager().bindTarget(target)), 
            hasInit: false
        };
    }

    private _target: View;
    private _groups: PropertyGroup[] = [];
    private _lastGroup: PropertyGroup = null;
    private _id: string;

    public resourceUrl: string;
    
    constructor() {
        this._id = `${Package.getUniqueID()}`;
    }

    public get id(): string {
        return this._id;
    }

    public get groups(): PropertyGroup[] {
        return this._groups;
    }

    public get target(): View {
        return this._target;
    }

    public destory() {
        
    }

    /**
     * get all groups
     */
    public getAll(): PropertyGroup[] {
        return this._groups;
    }

    /**
     * get group by name
     * @param name group's name
     */
    public get(name: string): PropertyGroup {
        return this._groups.find((g => {
           return g.name == name;
        }));
    }

    /**
     * add new group, when name is existed, return the old group
     * @param name group's name
     * @param target target object
     * @returns new group when name is not exist, or old group by name
     */
    public add(name: string, target?: any): PropertyGroup {
        let oldPG = this.get(name);
        if(oldPG) {
            return oldPG;
        }
        target = target || this._target;

        let pg = new PropertyGroup(this, name);
        pg.bindTarget(pg.target);
        this._groups.push(pg);

        return pg;
    }

    /**
     * change group's name
     * @param name old name
     * @param newName  new name
     * @returns group exist return true, or false
     */
    public changeName(name: string, newName: string): boolean {
        let pg = this.get(name);
        if(!pg) {
            return false;
        }

        if(this.get(newName)) {
            return false;
        }

        pg.name = name;
    }

    /**
     * when change group's properties value, please invoke this
     */
    public store(): this {
        this._groups.forEach(g=>{
            g.store();
        });
        return this;
    }

    /**
     * applay to property group by name
     * @param name group name
     * @returns when not exist group return false, or true
     */
    public applyTo(name: string): boolean {
        let pg = this.get(name);
        if(!pg) {
            return false;
        }

        pg.applyAll(this._lastGroup);
        this._lastGroup = pg;
    }

    public bindTarget(target: View): this {
        this.groups.forEach(g=>{
            g.bindTarget(target);
        });

        return this;
    }

    public toJSON(): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            Deserialize(this, config, template);
        }        

        return this;
    }
}

Templates.regist(PropertyManager.CATEGORY, PropertyManager);