export interface ISerializeInfo {
    property: string;
    importAs?: string;
    alias?: string;
    default?: any;
    type?: any;
    raw?: boolean;
    parms?: string[];
    static?: boolean;
    readonly?: boolean;
    priority?: number;
}

export function serializable_object(): ClassDecorator {
    return target => {
        let value = {
            serializable_object: true,
        }

        Reflect.defineMetadata(Symbol("serializable_object"), value, target);
    }
}