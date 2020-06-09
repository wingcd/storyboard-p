export interface SerializeInfo {
    sourceProp: string,
    targetProp?: string,
    alias?: string,
    default?: any,
    type?: any,
}

export function serializable_object(): ClassDecorator {
    return target => {
        let value = {
            serializable_object: true,
        }

        Reflect.defineMetadata(Symbol("serializable_object"), value, target);
    }
}