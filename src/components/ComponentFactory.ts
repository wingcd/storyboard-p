// import { GestureDoubleClick } from "./GestureDoubleClick";
import * as Events from "../events";
// import { GestureClick } from "./GestureClick";
// import { GestureLongTouch } from "./GestureLongTouch";
import { DropComponent } from "./DropComponent";

export class ComponentFactory {
    private static _inst: ComponentFactory;
    public static get inst(): ComponentFactory {
        if(!ComponentFactory._inst) {
            ComponentFactory._inst = new ComponentFactory();
        }

        return ComponentFactory._inst;
    }

    private _gestures: any = {};

    public regist(type: string, compType: new()=>{}) {
        this._gestures[type] = compType;
    }

    public getType(type: string): new()=>{} {
        return this._gestures[type];
    }
}

ComponentFactory.inst.regist(Events.DragEvent.DROP, DropComponent);

// ComponentFactory.inst.regist(Events.GestureEvent.Click, GestureClick);
// ComponentFactory.inst.regist(Events.GestureEvent.DoubleClick, GestureDoubleClick);
// ComponentFactory.inst.regist(Events.GestureEvent.LongTouchStart, GestureLongTouch);
// ComponentFactory.inst.regist(Events.GestureEvent.LongTouchEnd, GestureLongTouch);