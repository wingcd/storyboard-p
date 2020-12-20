import { ObjectFactory } from "../core/ObjectFactory";
import { ECategoryType } from "../core/Defines";
import { IShape } from "../types/IShape";

export class ShapeFactory {
    private static _inst: ShapeFactory;
    public static get inst(): ShapeFactory {
        if(!ShapeFactory._inst) {
            ShapeFactory._inst = new ShapeFactory();
        }

        return ShapeFactory._inst;
    }

    public create(config?: any, template?: any): IShape {
        let comp = ObjectFactory.create(ECategoryType.Shape, config) as IShape;
        comp.fromJSON(config, template);
        return comp;
    }

    public static regist(viewType: Function) {
        let tName = (viewType as any).TYPE;
        if(tName) {
            ObjectFactory.regist(ECategoryType.Shape, tName, viewType);
        }
    }
}