import "reflect-metadata";
import { SerializeInfo } from "../annotations/Serialize";
import { SerializeFactory } from "./SerializeFactory";
import { SetValue } from "./Object";

function serializeProperty(target:any, info: SerializeInfo, source: any, tpl: any = null) {
    let targetProp = info.alias || info.property;
    let sourceProp = info.property;

    if(tpl) {
        let t = tpl[info.alias || info.importAs];
        tpl =  t !== undefined ? t : tpl[sourceProp];
    }

    let onstart: Function = source.constructor.SERIALIZE_FIELD_START;
    let onend: Function = target.constructor.SERIALIZE_FIELD_END;
    if(onstart) {
        if(!onstart(source, target, sourceProp, targetProp, tpl)) {
            return;
        }
    }

    let sourceData = source[sourceProp];
    if(typeof(sourceData) === 'function' || !sourceData || sourceData == info.default) {
        return;
    }

    if(typeof(source) === 'object') {
        if (target[sourceProp] != sourceData) {
            if(source.constructor.SERIALIZABLE_FIELDS) {
                if (typeof(sourceData) === 'object') {                            
                    let sdata = SerializeFactory.inst.serialize(sourceData);
                    if(sdata) {
                        target[targetProp] = sdata;
                    }else {
                        if(tpl) {
                            target[targetProp] = Serialize(sourceData, tpl);
                        }else{
                            target[targetProp] = Serialize(sourceData);
                        }
                    }                    

                    if(target[targetProp] && Object.getOwnPropertyNames(target[targetProp]).length == 0) {
                        delete target[targetProp];
                    }
                }else{
                    target[targetProp] = sourceData;
                }
            }else{
                target[targetProp] = sourceData;
            }
        }
    }else{
        target[targetProp] = sourceData;
    }

    if(onend) {
        onend(source, target, sourceProp, targetProp, tpl);
    }
}

function deserializeProperty(target:any, info: SerializeInfo, config: any, tpl:any = null) {
    let cfgProp = info.alias && config.hasOwnProperty(info.alias) ? info.alias : info.property;
    let targetProp = info.importAs || info.property;

    let cfgData = config[cfgProp];
    if(typeof(cfgData) === 'function') {
        return;
    }
    
    if(tpl) {
        tpl = tpl[cfgProp] == undefined ?  tpl[cfgProp] : tpl[targetProp];
    }
    if(cfgData === undefined) {
        target[targetProp] = tpl != undefined ? tpl : info.default;
        return;  
    }

    let onstart:Function = target.constructor.DESERIALIZE_FIELD_START;
    let onend:Function = target.constructor.DESERIALIZE_FIELD_END;
    if(onstart) {
        if(!onstart(config, target, cfgProp, targetProp, tpl)) {
            return;
        }
    }

    if(typeof(config) === 'object') {
        if (target[targetProp] != cfgData) {
            if(typeof(cfgData) === "object" && info.type) {
                if(target[targetProp] === undefined) {
                    target[targetProp] = new info.type();
                }
                if(!SerializeFactory.inst.deserialize(target[targetProp], cfgData)) {
                    if(!Deserialize(target[targetProp], cfgData, tpl)) {
                        SetValue(target, targetProp, cfgData);
                    }
                }
            }else{      
                SetValue(target, targetProp, cfgData);
            }
        }
    }else{
        SetValue(target, targetProp, cfgData);
    }

    if(onend) {
        onend(config, target, cfgProp, targetProp, tpl);
    }
}

/**
 * 序列化对象
 * @param source 被序列化的对象 
 * @param tpl 模板对象，当设置此参数后，只序列化差异化数据
 */
export function Serialize(source: any, tpl?: any) {
    let result:any = {};
    let pnames: SerializeInfo[] = source.constructor.SERIALIZABLE_FIELDS || [];

    for(let item of pnames) {
        serializeProperty(result, item, source, tpl);
    }

    if(source.constructor.SERIALIZE_COMPLETED) {
        source.constructor.SERIALIZE_COMPLETED(source, result, tpl);
    }

    return result;
}

/**
 * 反序列化
 * @param target 需要被反序列化的对象 
 * @param config 序列化后的数据
 * @param tpl 模板对象，当设置此参数后，需要将模板数据一起赋值
 */
export function Deserialize(target: any, config: any, tpl?:any): boolean {
    if(!target.constructor.SERIALIZABLE_FIELDS) {
        return false;
    }

    let pnames: SerializeInfo[] = target.constructor.SERIALIZABLE_FIELDS || [];

    for(let item of pnames) {
        deserializeProperty(target, item, config, tpl);
    }

    if(target.constructor.DESERIALIZE_COMPLETED) {
        target.constructor.DESERIALIZE_COMPLETED(config, target, tpl);
    }
    return true;
}