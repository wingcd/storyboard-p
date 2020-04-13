import "reflect-metadata";

function cloneProperty(objClone:any, key: string, thisObject: any, deep: boolean = false, justProperies: boolean = true, ignores: string[] = null) {
    if(ignores) {
        if(ignores.includes(key)) {
            return;
        }
    }

    if(typeof(thisObject[key]) === 'function') {
        return;
    }

    let checkClonable = false;
    if(typeof(thisObject) === 'object' && typeof(thisObject.constructor) === 'function') {
        let keys = Reflect.getMetadataKeys(thisObject.constructor);
        for(let mkey of keys) {
            let metadata = Reflect.getMetadata(mkey, thisObject.constructor);
            if(metadata.isClonableObject) {
                checkClonable = metadata.isClonableObject();
                if(checkClonable) {
                    break;
                }
            }
        }
    }

    let propDeep = true;
    if(checkClonable) {
        let keys = Reflect.getMetadataKeys(thisObject, key);
        let clonable = false;
        for(let mkey of keys) {
            let metadata = Reflect.getMetadata(mkey, thisObject, key);
            propDeep = metadata.deep;
            if(metadata.onBeforeClone) {
                clonable = metadata.onBeforeClone();
                break;
            }
        }
        if(!clonable) {
            return;
        }
    }

    // if target/source object's property is not null, copy to target object
    if(typeof(thisObject[key]) == 'object' && 
        objClone[key] !== undefined && objClone[key] != null && 
        thisObject[key] != null && thisObject[key] !== undefined) {
        CopyTo(objClone[key], thisObject[key], deep, justProperies, ignores);
    }else{
        if (objClone[key] != thisObject[key]) {
            if ((deep || propDeep) && typeof(thisObject[key]) == 'object') {
                if(typeof(thisObject[key].clone) === "function") {
                    objClone[key] = thisObject[key].clone();
                }else{
                    objClone[key] = Clone(thisObject[key], deep, justProperies, ignores);
                }
            }
            else {
                objClone[key] = thisObject[key];
            }
        }
    }
}

export function Clone(thisObject: any, deep: boolean = false, justProperies: boolean = true, ignores: string[] = null) {
    let objClone;
    if ( thisObject.constructor == Object) {
        objClone = new thisObject.constructor();
    }
    else {
        objClone = new thisObject.constructor(thisObject.valueOf());
    }

    if(typeof(objClone.beforeClone) === "function") {
        objClone.beforeClone();
    }

    if(justProperies) {
        let pnames = Object.getOwnPropertyNames(thisObject);
        for(let key of pnames) {
            cloneProperty(objClone, key, thisObject, deep, justProperies, ignores);
        }
    }else{
        for(let key in thisObject){
            cloneProperty(objClone, key, thisObject, deep, justProperies, ignores);
        }
    }

    objClone.toString = thisObject.toString;
    objClone.valueOf = thisObject.valueOf;

    if(typeof(objClone.afterClone) === "function") {
        objClone.afterClone();
    }
    return objClone;
}

export function CopyTo(thisObject: any, objClone: any, deep: boolean = false, justProperies: boolean = true, ignores: string[] = null) {
    if(justProperies) {
        let pnames = Object.getOwnPropertyNames(thisObject);
        for(let key of pnames) {
            cloneProperty(objClone, key, thisObject, deep, justProperies, ignores);
        }
    }else{
        for(let key in thisObject){
            cloneProperty(objClone, key, thisObject, deep, justProperies, ignores);
        }
    }

    objClone.toString = thisObject.toString;
    objClone.valueOf = thisObject.valueOf;
    return objClone;
}