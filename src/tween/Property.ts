import { GetValue, GetViewRelativePath, GetViewByRelativePath, IsViewChild, SetValue } from "../utils/Object";
import { ISerializeInfo } from "../types";
import { View } from "../core/View";
import { Serialize, Deserialize } from "../utils/Serialize";
import { ECategoryType, EEaseType, ParseEaseType } from "../core/Defines";
import { ITemplatable } from "../types/ITemplatable";
import { Package } from "../core/Package";
import { Templates } from "../core/Templates";
import { EventEmitter, Tween, Types } from "../phaser";
import { PropertyEvent } from "../events";
import { ITweenInfo } from "../types";
import { installTweenPlugin } from "./TweenInfo";
import TweenStep from "./TweenStep";

export class Property {
    _name: string = null;
    name: string = null;
    value: any = null;
    target: any = null;
    targetPath: string = "";
    tweenInfo?: ITweenInfo = null;

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "name"},
            {property: "value"},
            {property: "targetPath", default: ""},
            {property: "tweenInfo", alias: "tween", default: null, raw: true},
        );
        return fields;
    }
}

class PropertyGroup {
    private _targetPath: string = "";
    private _target: View;
    private _parent: PropertyManager;
    private _properties:Property[] = [];
    private _name: string = null;
    private _store: any = {};

    /**@internal */
    id: number;

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "id"},
            {property: "_name", alias: "name"},
            {property: "_properties", alias: "properties", type: Property, default: []},            
            {property: "_targetPath", alias: "target", default: ""},
        );
        return fields;
    }

    static DESERIALIZE(config: any, target: PropertyManager, configProp: string, targetProp: string, tpl: any, index?: number) {
        return new PropertyGroup(target, config.name);
    }

    constructor(parent: PropertyManager, name: string) {
        this._parent = parent;
        this._name = name;
    }

    setParent(parent: PropertyManager): this {
        this._parent = parent;
        this.onParentTargetChanged();
        return this;
    }

    public store(): this {
        if(this.target) {
            this._properties.forEach(p=>{
                this._store[p._name] = {
                    name: p.name,
                    target: p.target,
                    value: p.target[p.name],
                }
            });
        }
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
            
            let tween: Tween = (p as any).__tween__;
            if(tween) {
                tween.remove();
                tween.removeAllListeners();
                (p as any).__tween__ = null;
            }

            if(!p.tweenInfo) {
                p.target[p.name] = p.value;
            }else{
                this._tweenTo(p);
            }
        }

        return this;
    }

    private _tweenTo(p: Property) {
        let tweenData: Types.Tweens.TweenBuilderConfig = {
            targets: p.target,
            duration: p.tweenInfo.duration,
            yoyo: p.tweenInfo.yoyo || false,
            repeat: p.tweenInfo.repeat ? (p.tweenInfo.repeat < 0 ? Infinity : p.tweenInfo.repeat) : 0,
            delay: p.tweenInfo.delay || 0,
            repeatDelay: p.tweenInfo.repeatDelay || 0,
            ease: (t: number)=>{
                return t < 1 ? 0 : 1;
            },
            onComplete: ()=>{
                (p as any).__tween__ = null;
            },
        };
        if(p.tweenInfo.type == null || (p.tweenInfo.type != EEaseType.Known)) {
            tweenData.ease = ParseEaseType(p.tweenInfo.type);
        }

        if(p.tweenInfo.plugin) {
            installTweenPlugin(tweenData, p.tweenInfo.plugin);
        }else if(typeof(p.value) !== 'number') {
            installTweenPlugin(tweenData, new TweenStep(this._target));
        }

        tweenData.props = {};
        tweenData.props[p.name] = p.value;

        let tween = this._target.scene.add.tween(tweenData);
        (p as any).__tween__ = tween;
    }

    /**
     * 
     * @param propName property name, must start with [A-z, 0-9]
     * @param value 
     * @param target 
     * @param tweenInfo 
     */
    public add(propName: string, value: any, target?: View, tweenInfo?: ITweenInfo): PropertyGroup {
        target = target || this._target;
        let prop = this.getByName(propName);
        if(!prop) {
            prop = new Property();
            prop._name = prop.name = propName;
            prop.target = target;
            prop.tweenInfo = tweenInfo;
            prop.targetPath = GetViewRelativePath(this._target, target);
            this._properties.push(prop);

            if(propName.indexOf('.') >= 0) {
                prop._name = propName.replace('.', '$');
                prop.target = GetValue(target, propName, target, true);
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
    bindTarget(target: View): this {
        this._target = target;

        this._targetPath = GetViewRelativePath(this._parent.target, this._target);
        if(this._target) {
            let props = this._properties.slice();
            this._properties.length = 0;

            for(let p of props) {
                let pTarget = GetViewByRelativePath(this._parent.target, p.targetPath) as View;
                if(pTarget == this._parent.target) {
                    pTarget = target;
                }
                this.add(p.name, p.value, pTarget);
            }
        }

        return this;
    }

    /**@internal */
    onParentTargetChanged(): this {
        let root = this._parent.target;
        if(this._targetPath) {
            this._target = GetViewByRelativePath(root, this._targetPath) as View;
        }else{
            this._target = IsViewChild(root, this._target) ? this._target : root;            
            this._targetPath = GetViewRelativePath(root, this._target);
        }

        if(this._target) {
            let props = this._properties.slice();
            this._properties.length = 0;

            for(let p of props) {
                let pTarget = GetViewByRelativePath(root, p.targetPath) as View;
                if(pTarget == this._parent.target) {
                    pTarget = this._target;
                }
                this.add(p.name, p.value, pTarget);
            }
        }

        return this;
    }

    public destory() {
        for(let p of this._properties) {
            let tween: Tween = (p as any).__tween__;
            if(tween) {
                tween.remove();
                tween.removeAllListeners();
                (p as any).__tween__ = null;
            }
        }
        this._properties.length = 0;
    }
}

export class PropertyManager extends EventEmitter implements ITemplatable {
    static CATEGORY = ECategoryType.Property;
    
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields:ISerializeInfo[] = [];
        fields.push(
            {property: "CATEGORY", alias: "__category__", static: true, readonly: true},

            {property: "resourceUrl"},
            {property: "_id", alias: "id"},  
            {property: "_name", alias: "name"},       
            {property: "_defaultId", alias: "default"},
            {property: "_groups", alias: "groups", type: PropertyGroup, default: []},
        );
        return fields;
    } 

    private _name: string;
    private _target: View;
    private _groups: PropertyGroup[] = [];
    private _lastGroup: PropertyGroup = null;
    private _id: string;
    private _defaultId: number;

    // group base id
    private _groupId: number = 0;

    public resourceUrl: string;
    
    constructor(name?: string, target?: View) {
        super();

        this._name = name;
        this._target = target;
        this._id = `${Package.getUniqueID()}`;
    }

    private _emit(eventType: string, ...data: any[]) {
        if(this._target instanceof View) {
            this._target.emit(eventType, ...data);
        }
        this.emit(eventType, this, ...data);
    }   

    public get id(): string {
        return this._id;
    }

    private _genGroupId() {
        return this._groupId++;
    }

    public get defaultId(): number {
        return this._defaultId;
    }

    public set defaultId(val: number) {
        if(this._defaultId != val) {
            this._defaultId = val;
        }
    }

    public set name(val: string) {
        this._name = val;
    }

    public get name(): string {
        return this._name;
    }

    public get groups(): PropertyGroup[] {
        return this._groups;
    }

    public get target(): View {
        return this._target;
    }

    public destory() {
        this._groups.forEach(g=>{
            g.destory();
        })
        this._groups.length = 0;
    }

    /**
     * get all groups
     */
    public getAll(): PropertyGroup[] {
        return this._groups;
    }

    public has(name: string): boolean {
        return this._groups.findIndex((g=>{
            g.name == name;
        })) >= 0;
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

    public getById(id: number): PropertyGroup {
        return this._groups.find((g => {
            return g.id == id;
         }));
    }

    /**
     * add new group, when name is existed, return the old group
     * @param name group's name
     * @param target target object
     * @returns new group when name is not exist, or old group by name
     */
    public add(name: string, target?: View): PropertyGroup {
        let oldPG = this.get(name);
        if(oldPG) {
            return oldPG;
        }
        target = target || this._target;

        let pg = new PropertyGroup(this, name);
        pg.bindTarget(target);
        this._groups.push(pg);

        pg.id = this._genGroupId();

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

    public get currentGroupName(): string {
        if(this._lastGroup) {
            return this._lastGroup.name;
        }
        return "";
    }

    public get currentGroupId(): number {
        if(this._lastGroup) {
            return this._lastGroup.id;
        }
        return -1;
    }

    public applyById(id: number): boolean {
        let oldName = this._lastGroup ? this._lastGroup.name : null;
        let pg = this.getById(id);
        if(!pg) {
            return false;
        }

        if(this._lastGroup != pg) {
            this._lastGroup = pg.applyAll(this._lastGroup);
            this._emit(PropertyEvent.CHANGED, oldName, name);
        }
    }

    /**
     * applay to property group by name
     * @param name group name
     * @returns when not exist group return false, or true
     */
    public applyTo(name: string): boolean {
        let oldName = this._lastGroup ? this._lastGroup.name : null;
        let pg = this.get(name);
        if(!pg) {
            return false;
        }

        if(this._lastGroup != pg) {
            this._lastGroup = pg.applyAll(this._lastGroup);
            this._emit(PropertyEvent.CHANGED, oldName, name);
        }
    }

    public bindTarget(target: View): this {
        this._target = target;
        this.groups.forEach(g=>{
            g.setParent(this);
        });

        return this;
    }

    public toJSON(tpl?: any): any {
        let temp = null;
        if(this.resourceUrl) {
            temp = Package.inst.getTemplateFromUrl(this.resourceUrl);
        }
        return Serialize(this, temp || tpl);
    }

    public fromJSON(config: any, template?: any): this {
        if(config || template) {
            Deserialize(this, config, template);
        }        

        return this;
    }

    public clone(): PropertyManager {
        let json = this.toJSON();
        return new PropertyManager().fromJSON(json);
    }
}

Templates.regist(PropertyManager.CATEGORY, PropertyManager);