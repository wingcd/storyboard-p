export interface IProperty {
    _name: string;
    name: string;
    value: any;
    target: any;
}

export interface IPropertyGroup {
    target: any;
    name: string
    
    store(): this;
    resotre(): this;
    getAll(): IProperty[];
    applyAll(lastGroup: IPropertyGroup): IPropertyGroup;
    add(propName: string, value: any): IPropertyGroup;
    getByName(name: string): IProperty;
    remove(prop: IProperty): IPropertyGroup;
    removeByName(name: string): IPropertyGroup;    
}

export interface IPropertyManagerConfig {

}

export interface IPropertyManager extends IPropertyManagerConfig {
    target: any;
    groups: IPropertyGroup[];

    getAll(): IPropertyGroup[];
    get(name: string): IPropertyGroup;
    add(name: string, target?: any): IPropertyGroup;
    changeName(name: string, newName: string): boolean;
    store(): this;
    applyTo(name: string): boolean;
}