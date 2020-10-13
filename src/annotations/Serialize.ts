export function serializable_object(): ClassDecorator {
    return target => {
        let value = {
            serializable_object: true,
        }

        Reflect.defineMetadata(Symbol("serializable_object"), value, target);
    }
}