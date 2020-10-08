import { ITemplatable } from "../types/ITemplatable";
import { ECategoryType } from "./Defines";
import { ViewScene } from "./ViewScene";

type CONSTRUCTOR = new()=>ITemplatable;

export class Templates {
    private static _categories: {[key: string] : {
        construct: CONSTRUCTOR,
        create: Function,
    }} = {};

    public static regist(category: string, type: Function, createFunc?: Function) {
        Templates._categories[category] = {
            construct: type as any,
            create: createFunc,
        }
    }

    public static get(category: string): CONSTRUCTOR {
        let item = Templates._categories[category];
        if(item) {
            return item.construct;
        }
        return null;
    }

    public static createFromData(scene: ViewScene, data: any, tpl?: any): ITemplatable {
        let category = data ? data.__category__ : null;
        if(!category) {
            category = tpl ? tpl.__category__ : null;
        }

        let item = this._categories[category];
        if(item) {
            if(item.create) {
                return item.create(scene, data, tpl);
            }else{
                let inst = new item.construct();
                inst.fromJSON(data, tpl);
                return inst;
            }
        }
        return null;
    }
}