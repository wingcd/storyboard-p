export class Templates {
    private static _categories: {[key: string] : Function} = {};

    public static regist(category: string, type: Function) {
        Templates._categories[category] = type;
    }

    public static get(category: string): Function {
        return Templates._categories[category];
    }
}