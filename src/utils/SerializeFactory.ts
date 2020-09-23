import { Rectangle, Point } from "../phaser";

interface SerializeItem {
    type: any;
    serializeFun: Function;
    deserializeFun: Function;
    toarray?: boolean;
}

export class SerializeFactory {
    private static _inst: SerializeFactory;
    public static get inst(): SerializeFactory {
        if(!SerializeFactory._inst) {
            SerializeFactory._inst = new SerializeFactory();
        }

        return SerializeFactory._inst;
    }

    private _types: {
        [key:string]:SerializeItem
    } = {};

    public toarray(type: Function): boolean {
        let item = this._types[type.name];
        if(item) {
            return item.toarray === true;
        }
        return false;
    }

    public regist(type: Function, serializeFun: Function, deserializeFun: Function, toarray?: boolean) {
        if(!this._types[type.name]) {
            this._types[type.name] = {
                type,
                serializeFun,
                deserializeFun,
                toarray: toarray,
            };
        }
    }

    public serialize(inst: any): any {        
        let item = this._types[inst.constructor.name];
        if(item) {
            return item.serializeFun(inst);
        }
        return null;
    }

    public deserialize(inst: any, data: any): boolean {        
        let item = this._types[inst.constructor.name];
        if(item) {
            item.deserializeFun(inst, data);
            return true;
        }
        return false;
    }
}

SerializeFactory.inst.regist(Rectangle, 
    (inst:Rectangle)=>{
        return {
            x: inst.x,
            y: inst.y,
            w: inst.width,
            h: inst.height,
        }
    }, (inst:Rectangle,data:any)=>{
        inst.x = data.x;
        inst.y = data.y;
        inst.width = data.w;
        inst.height = data.h;
    });

SerializeFactory.inst.regist(Point, 
    (inst:Point)=>{
        return {
            x: inst.x,
            y: inst.y,
        }
    }, (inst:Point,data:any)=>{
        inst.x = data.x;
        inst.y = data.y;
    });