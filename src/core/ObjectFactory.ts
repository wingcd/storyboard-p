type FUNCTYPE = Function;

export class ObjectFactory {
    private static _types: {[key: string] : FUNCTYPE} = {};

    private static getKey(category: string, type: string): string {
        if(!type) {
            return category;
        }
        return `${category}_${type}`;
    }

    public static regist(category: string, type: string, cls: FUNCTYPE) {
        let key = ObjectFactory.getKey(category, type);
        ObjectFactory._types[key] = cls;
    }

    public static get(category: string, type: string): FUNCTYPE {
        let key = ObjectFactory.getKey(category, type);
        return ObjectFactory._types[key];
    }

    public static create(category: string, config?: any): any {
        if(!config || !config.__type__) {
            throw new Error("must be with class type to create instance!");
        }

        let key = ObjectFactory.getKey(category, config.__type__);

        let cls: any = ObjectFactory._types[key];
        if(!cls) {
            throw new Error(`not regist class type:${config.__type__}!`);
        }

        return new cls();
    }
}