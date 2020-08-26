import "reflect-metadata";
import { ISerializeInfo } from "../annotations/Serialize";
import { SerializeFactory } from "./SerializeFactory";
import { SetValue } from "./Object";
import { Templates } from "../core/Templates";

function serializeProperty(target:any, info: ISerializeInfo, source: any, tpl: any = null) {
    let raw = source;    
    // 静态变量
    if(info.static) {
        source = source.constructor;
    }

    let targetProp = info.alias || info.property;
    let sourceProp = info.property;

    if(tpl) {
        let t = tpl[info.alias || info.importAs];
        tpl =  t !== undefined ? t : tpl[sourceProp];
    }

    let onstart: Function = raw.constructor.SERIALIZE_FIELD_START;
    let onend: Function = raw.constructor.SERIALIZE_FIELD_END;
    let done = false;
    if(onstart) {
        if(!onstart(source, target, sourceProp, targetProp, tpl)) {
            done = true;
        }
    }

    let sourceData = source[sourceProp];
    if(!done) {
        if(typeof(sourceData) === 'function' || !sourceData || sourceData == info.default) {
            done = true;
        }
    }

    if(!done && sourceData != tpl) {
        if (target[sourceProp] != sourceData) {
            if(typeof(sourceData) === 'object') {
                let isarray = Array.isArray(sourceData);
                if(!info.raw) {
                    if(isarray || info.asarray) {
                        // 处理数组对象
                        let rets: any = isarray ? [] : {};
                        for(let i in sourceData) {
                            let t = null;
                            if(tpl && tpl[i] != undefined) {
                                t = tpl[i];
                            }

                            let item = Serialize(sourceData[i], t);
                            // 不添加0属性对象
                            if(item && Object.getOwnPropertyNames(item).length > 0) {    
                                if(isarray) {
                                    rets.push(item);
                                }else{
                                    rets[i] = item;
                                }
                            }
                        }

                        target[targetProp] = rets;
                    } else if (typeof(sourceData) === 'object') {
                        if(info.raw) {
                            target[targetProp] = Object.assign({}, sourceData);
                        }else{                    
                            let sdata = SerializeFactory.inst.serialize(sourceData);
                            if(sdata) {
                                target[targetProp] = sdata;
                            }else {
                                target[targetProp] = Serialize(sourceData, tpl);
                            }  
                        }
                    }else{
                        target[targetProp] = sourceData;
                    } 
                }else{
                    target[targetProp] = sourceData;
                }
            }else{
                target[targetProp] = sourceData;
            }
        }
    }                      

    // 刪除空属性对象
    let result = target[targetProp];
    if(result) {
        if((Array.isArray(result) && result.length == 0)
           || (typeof(result) === "object" && Object.getOwnPropertyNames(result).length == 0)) {
            delete target[targetProp];
        }
    }

    if(onend) {
        onend(source, target, sourceProp, targetProp, tpl);
    }
}

function deserializeProperty(target:any, info: ISerializeInfo, config: any, tpl:any = null, depth:number = 0) {
    if(!config && tpl) {
        config = {};
    }

    depth++;

    let raw = target;    
    // 静态变量
    if(info.static) {
        target = target.constructor;
    }
    let cfgProp = info.alias && (config.hasOwnProperty(info.alias) || (tpl && tpl.hasOwnProperty(info.alias))) ? info.alias : info.property;
    let targetProp = info.importAs || info.property;

    let cfgData = config[cfgProp];
    if(tpl) {
        tpl = tpl[cfgProp] != undefined ?  tpl[cfgProp] : tpl[targetProp];
    }

    if(cfgData == undefined) {
        if(tpl == undefined) {
            return;
        }
        cfgData = tpl;
        tpl = null;
    }  

    let onstart:Function = raw.constructor.DESERIALIZE_FIELD_START;
    let onend:Function = raw.constructor.DESERIALIZE_FIELD_END;
    let done = false;
    if(onstart) {
        if(!onstart(config, target, cfgProp, targetProp, tpl)) {
            done = true;
        }
    }
    
    if(!done) {
        if(cfgData === undefined || typeof(cfgData) === 'function') {
            target[targetProp] = info.default;
            done = true;
        }
    }

    if(!done) {
        if(typeof(config) === 'object') {
            let isarray = Array.isArray(cfgData);
            if(!info.raw) {
                if((isarray || info.asarray) && info.type) {
                    // process array
                    target[targetProp] = isarray ? [] : {};

                    for(let i in cfgData) {
                        let t = null;
                        if(tpl && tpl[i] != undefined) {
                            t = tpl[i];
                        }

                        let ritem = null;
                        let needInit = true;
                        if(info.type.CREATE_INSTANCE) {
                            let instRet = info.type.CREATE_INSTANCE(cfgData[i], target, cfgProp, targetProp, t, i);
                            ritem = instRet.inst;
                            needInit = !instRet.hasInit;
                        }
                        
                        if(needInit) {
                            let parms = [];
                            if(info.parms) {
                                for(let p of info.parms) {
                                    parms.push(target[p]);
                                }
                            }
                            ritem = new info.type(...parms);
                        }

                        let done = false;
                        if(!SerializeFactory.inst.deserialize(target[targetProp], cfgData)) {
                            if(Deserialize(ritem, cfgData[i], t, depth)) {
                                done = true;
                            }
                        }else{
                            done = true;
                        }

                        if(done) {
                            if(isarray) {
                                target[targetProp].push(ritem);
                            }else{
                                target[targetProp][i] = ritem;
                            }
                        }
                    }
                } else if (target[targetProp] != cfgData) {
                    if(!info.type && cfgData.__category__) {
                        info.type = Templates.get(cfgData.__category__);
                    }

                    if(!info.raw && typeof(cfgData) === "object" && info.type) {
                        let needInit = true;
                        if(target[targetProp] === undefined) {
                            let ritem = null;
                            if(info.type.CREATE_INSTANCE) {
                                let instRet = info.type.CREATE_INSTANCE(cfgData, target, cfgProp, targetProp, tpl);;
                                ritem = instRet.inst;
                                needInit = !instRet.hasInit;
                            }
                            
                            if(needInit){
                                let parms = [];
                                if(info.parms) {
                                    for(let p of info.parms) {
                                        parms.push(target[p]);
                                    }
                                }
                                ritem = new info.type(...parms);
                            }
                            target[targetProp] = ritem;
                        }

                        if(!SerializeFactory.inst.deserialize(target[targetProp], cfgData)) {
                            if(!Deserialize(target[targetProp], cfgData, tpl, depth)) {
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
        }else{
            SetValue(target, targetProp, cfgData);
        }
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
    let pnames: ISerializeInfo[] = source.constructor.SERIALIZABLE_FIELDS || [];

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
export function Deserialize(target: any, config: any, tpl?:any, depth?:number): boolean {
    if(!target.constructor.SERIALIZABLE_FIELDS) {
        return false;
    }
    depth = depth || 0;

    let pnames: ISerializeInfo[] = target.constructor.SERIALIZABLE_FIELDS || [];
    pnames.sort((a, b)=>{
        let ap = a.priority || 0;
        let bp = b.priority || 0;
        return ap - bp;
    });

    for(let item of pnames) {
        if(!item.readonly) {
            deserializeProperty(target, item, config, tpl, depth);
        }
    }

    if(target.constructor.DESERIALIZE_COMPLETED) {
        target.constructor.DESERIALIZE_COMPLETED(config, target, tpl, depth);
    }
    return true;
}