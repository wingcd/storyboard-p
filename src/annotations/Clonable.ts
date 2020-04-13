export function clonable_object(): ClassDecorator {
    return target => {
        let value = {
            isClonableObject: ()=>{
                return true;
            }
        }

        Reflect.defineMetadata(Symbol("clonable_object"), value, target);
    }
}

export function clonable(deep: boolean = true, clonable: boolean = true): PropertyDecorator {
    return (target,prop) => {
        let value = {
            deep,
            clonable,
            onBeforeClone: () => {
                return clonable;
            }
        }
        Reflect.defineMetadata(Symbol("clonable"), value, target, prop);
    }
}