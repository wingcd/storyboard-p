import "reflect-metadata";
import { SerializeInfo } from "../annotations/Serialize";

function serializeProperty(target:any, targetProp: string, source: any, sourceProp: string, ignores: string[] = null) {
    if(ignores) {
        if(ignores.includes(sourceProp)) {
            return;
        }
    }

    if(typeof(source[sourceProp]) === 'function') {
        return;
    }

    if(typeof(source) === 'object') {
        if(source.constructor.SERIALIZABLE_FIELDS) {
            if (target[sourceProp] != source[sourceProp]) {
                if (typeof(source[sourceProp]) === 'object') {
                    target[sourceProp] = Serialize(source[sourceProp], ignores);
                }else{
                    target[targetProp] = source[sourceProp];
                }
            }
        }
    }else{
        target[targetProp] = source[sourceProp];
    }
}

function deserializeProperty(target:any, info: SerializeInfo, config: any, ignores: string[] = null) {
    let cfgProp = info.alias || info.sourceProp;
    let targetProp = info.targetProp || info.sourceProp; 

    if(ignores) {
        if(ignores.includes(cfgProp)) {
            return;
        }
    }

    if(typeof(config[cfgProp]) === 'function') {
        return;
    }

    if(typeof(config) === 'object') {
        if (target[targetProp] != config[cfgProp]) {
            if(target[targetProp] == undefined) {
                if(typeof(config[cfgProp]) === "object" && info.type) {
                    target[targetProp] = new info.type();
                    Deserialize(target[cfgProp], config[cfgProp], ignores);
                }else{
                    target[targetProp] = config[cfgProp];
                }
            }else{                
                Deserialize(target[targetProp], config[cfgProp], ignores);
            }
        }
    }else{
        target[targetProp] = config[cfgProp];
    }
}

export function Serialize(source: any, ignores: string[] = null) {
    let result:any = {};
    let pnames: SerializeInfo[] = source.constructor.SERIALIZABLE_FIELDS || [];

    for(let item of pnames) {
        serializeProperty(result, item.alias || item.sourceProp, source, item.sourceProp, ignores);
    }

    return result;
}

export function Deserialize(target: any, config: any, ignores: string[] = null) {
    let pnames: SerializeInfo[] = target.constructor.SERIALIZABLE_FIELDS || [];

    for(let item of pnames) {
        deserializeProperty(target, item, config, ignores);
    }
}