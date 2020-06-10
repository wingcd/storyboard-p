import { Rectangle } from "../phaser";

interface SerializeItem {
    type: any;
    serializeFun: Function;
    deserializeFun: Function;
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


    public regist(type: Function, serializeFun: Function, deserializeFun: Function) {
        if(!this._types[type.name]) {
            this._types[type.name] = {
                type,
                serializeFun,
                deserializeFun,
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