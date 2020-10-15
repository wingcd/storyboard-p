export interface ISerialable {
    toJSON(tpl?: any): any;
    fromJSON(config: any, template?: any): this;
}

export interface ISerializeField {
    property?: string; // 序列化的属性
    importAs?: string; // 反序列化时，导入的属性， 优先最高的反序列化的属性名
    alias?: string; // 别名，用户序列化后的名字, 优先级最高的序列化属性名
    default?: any; // 默认值
    type?: any;  // 对象的类型
    parms?: string[]; // 反序列化时，构造对象的属性名（通过父对象获取）
    static?: boolean;  // 是否类的静态属性
    readOnly?: boolean; // 是否只序列化，不反序列化
    writeOnly?: boolean; // 是否只反序列化， 不进行序列化, 一般用于子类对此属性进行了重命名
    priority?: number; // 反序列化时的优先级
    asMap?: boolean; // 把对象当做数组处理
    raw?: boolean; // 是否将对象直接序列化
    must?: boolean; // 必须包含属性，不存在则不进行后续序列化
    keepArray?: boolean; // 保证输出数组大小不变
    ignore?: boolean; //一般用户子类，忽略父类中的此属性
}

export interface ISerializeFields {
    [property: string]: ISerializeField;
}