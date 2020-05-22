export class Property {
    name: string = null;
    value: any = null;
}

class PropertyGroup {
    private _target: any;
    private _properties:Property[] = [];
    private _name: string = null;
    private _store: any = {};

    constructor(target: any, name: string) {
        this._target = target;
        this._name = name;
    }

    public store() {
        this._properties.forEach(p=>{
            this._store[p.name] = this._target[p.name];
        });
    }

    public resotre() {
        for(let name in this._store) {
            this._target[name] = this._store[name];
        }
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
            let prop = this._properties[idx];
            if(prop === undefined) {
                continue;
            }

            this._target[prop.name] = prop.value;
        }

        return this;
    }

    public add(propName: string, value: any): PropertyGroup {
        let prop = this.getByName(propName);
        if(!prop) {
            prop = new Property();
            prop.name = propName;
            this._properties.push(prop);
        }

        if(prop.value != value) {
            prop.value = value;
        }

        return this;
    }

    public getByName(name: string) {
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
}

export class PropertyManager {
    private _target: any;
    private _groups: PropertyGroup[] = [];
    private _lastGroup: PropertyGroup = null;

    constructor(target?: any) {
        this._target = target;
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

        let pg = new PropertyGroup(target, name);
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
    public store() {
        this._groups.forEach(g=>{
            g.store();
        });
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
}