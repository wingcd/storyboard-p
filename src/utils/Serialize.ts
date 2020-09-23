import "reflect-metadata";
import { ISerializeInfo } from "../annotations/Serialize";
import { SerializeFactory } from "./SerializeFactory";
import { SetValue } from "./Object";
import { Templates } from "../core/Templates";

function clone(source: any): any {
    if(source == null || typeof(source) !== 'object') {
        return source;
    }

    let json = JSON.stringify(source);
    return JSON.parse(json);
}

function store(source: any, info: ISerializeInfo, tpl: any): any {
    if(source == undefined) {
        return null;
    }

    let item = null;
    if(info.raw) {
        item = Object.assign({}, source);
    }else{    
        if(info.type && info.type.SERIALIZE) {
            item = info.type.SERIALIZE(source, tpl);
        }
        
        if(!item) {
            item = SerializeFactory.inst.serialize(source);
            if(!item) {
                item = Serialize(source, tpl);
            }  
        }
    } 
    return item;
}

function restore(target: any, targetProp: string, data: any, tpl: any, info: ISerializeInfo, depth: number) {
    if(!target) {
        return target;
    }
    
    if(!SerializeFactory.inst.deserialize(target, data)) {
        if(!Deserialize(target, data, tpl, depth)) {
            SetValue(target, targetProp, data);
        }
    }
}

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
        if(typeof(sourceData) == 'function' || sourceData == undefined || sourceData == info.default) {
            done = true;
        }
    }

    if(!done && sourceData != tpl) {
        if (target[sourceProp] != sourceData) {
            if(typeof(sourceData) == 'object') {
                // 判断是否有自带序列化函数
                let isarray = Array.isArray(sourceData);
                if(!info.raw) {
                    if(isarray || info.asMap) {
                        // 处理数组对象,或者key-value对象
                        let rets: any = isarray ? [] : {};
                        for(let i in sourceData) {
                            let t = null;
                            if(tpl && tpl[i] != undefined) {
                                t = tpl[i];
                            }

                            let item = store(sourceData[i], info, t);

                            // 不添加0属性对象
                            if(item && Object.getOwnPropertyNames(item).length > 0) {    
                                if(raw.constructor.CATEGORY != undefined && raw.constructor.CATEGORY == sourceData[i].constructor.CATEGORY) {
                                    delete item.__category__;
                                }

                                if(isarray) {
                                    rets.push(item);
                                }else{
                                    rets[i] = item;
                                }
                            }
                        }

                        target[targetProp] = rets;
                    } else if (typeof(sourceData) == 'object') {
                        target[targetProp] = store(sourceData, info, tpl);
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
           || (typeof(result) == "object" && Object.getOwnPropertyNames(result).length == 0)) {
            delete target[targetProp];
        }
    }

    if(onend) {
        onend(source, target, sourceProp, targetProp, tpl);
    }
}

function getConfigPropName(info: ISerializeInfo, config: any, tpl:any = null) {
    return info.alias && (config.hasOwnProperty(info.alias) || (tpl && tpl.hasOwnProperty(info.alias))) ? info.alias : info.property;;
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
    let cfgProp = getConfigPropName(info, config, tpl);
    let targetProp = info.importAs || info.property;

    let cfgData = config[cfgProp];
    if(tpl) {
        tpl = tpl[cfgProp] != undefined ?  tpl[cfgProp] : tpl[targetProp];
    }

    if(cfgData == undefined) {
        if(tpl == undefined) {   
            if(target[targetProp] == undefined) {         
                target[targetProp] = clone(info.default);
            }
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
        if(cfgData == undefined || typeof(cfgData) == 'function') {
            target[targetProp] = info.default;
            done = true;
        }
    }

    if(!done) {
        if(typeof(config) == 'object') {
            let isarray = Array.isArray(cfgData);
            if(!info.raw) {
                if((isarray || info.asMap) && info.type && !SerializeFactory.inst.toarray(info.type)) {
                    // process array
                    target[targetProp] = isarray ? [] : {};

                    for(let i in cfgData) {                        
                        if(typeof(cfgData[i]) != 'object') {
                            continue;
                        }

                        let t = null;
                        if(tpl && tpl[i] != undefined) {
                            t = tpl[i];
                        }

                        let ritem = null;
                        if(info.type.DESERIALIZE) {
                            ritem = info.type.DESERIALIZE(cfgData[i], target, cfgProp, targetProp, t, i);
                        }else{                        
                            let parms = [];
                            if(info.parms) {
                                for(let p of info.parms) {
                                    parms.push(target[p]);
                                }
                            }
                            ritem = new info.type(...parms);
                        }

                        restore(ritem, i, cfgData[i], t, info, depth);      

                        if(ritem && ritem.constructFromJson) {
                            ritem.constructFromJson();
                        }

                        if(isarray) {
                            target[targetProp].push(ritem);
                        }else{
                            target[targetProp][i] = ritem;
                        }
                    }
                } else if (target[targetProp] != cfgData) {
                    if(!info.type && cfgData.__category__) {
                        info.type = Templates.get(cfgData.__category__);
                    }

                    if(!info.raw && typeof(cfgData) == "object" && info.type) {
                        let ritem = target[targetProp];
                        if(info.type.DESERIALIZE) {
                            ritem = info.type.DESERIALIZE(cfgData, target, cfgProp, targetProp, tpl);
                        }else{                            
                            if(ritem == undefined) {
                                let parms = [];
                                if(info.parms) {
                                    for(let p of info.parms) {
                                        parms.push(target[p]);
                                    }
                                }
                                ritem = new info.type(...parms);
                            }
                        }

                        restore(ritem, targetProp, cfgData, tpl, info, depth);

                        if(ritem && ritem.constructFromJson) {
                            ritem.constructFromJson();
                        }
                        target[targetProp] = ritem;
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

    let shoudproc = true;
    for(let item of pnames) {
        if(item.must) {
            let cfgProp = getConfigPropName(item, source, tpl);
            if(item.static) {
                if(source.constructor && source.constructor[cfgProp] == null) {
                    shoudproc = false;
                }
            }else{
                if(source[cfgProp] == null){
                    shoudproc = false;
                }
            }
        }
    }

    if(shoudproc) {
        for(let item of pnames) {
            serializeProperty(result, item, source, tpl);
        }
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
    return true;
}