export interface ISerializeInfo {
    property: string; // 序列化的属性
    importAs?: string; // 反序列化时，导入的属性
    alias?: string; // 别名，用户序列化后的名字
    default?: any; // 默认值
    type?: any;  // 对象的类型
    parms?: string[]; // 反序列化时，构造对象的属性名（通过父对象获取）
    static?: boolean;  // 是否类的静态属性
    readonly?: boolean; // 是否只序列化，不反序列化
    priority?: number; // 反序列化时的优先级
    asarray?: boolean; // 把对象当做数组处理
    raw?: boolean; // 是否将对象直接序列化
}

export function serializable_object(): ClassDecorator {
    return target => {
        let value = {
            serializable_object: true,
        }

        Reflect.defineMetadata(Symbol("serializable_object"), value, target);
    }
}