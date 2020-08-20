import { ComponentFactory } from "./ComponentFactory";
import * as Events from "../events";
import { GestureClick } from "./GestureClick";
import { GestureDoubleClick } from "./GestureDoubleClick";
import { GestureLongTouch } from "./GestureLongTouch";
import { DropComponent } from "./DropComponent";

export * from "./BaseComponent";
export * from "./DragComponent";
export * from "./DropComponent";
export * from "./GestureClick";
export * from "./GestureDoubleClick";
export * from "./GestureLongTouch";
export * from "./ScrollPaneComponent";
export * from "./ComponentFactory";

ComponentFactory.inst.registEvents(Events.DragEvent.DROP, DropComponent);
ComponentFactory.inst.registEvents(Events.GestureEvent.Click, GestureClick);
ComponentFactory.inst.registEvents(Events.GestureEvent.DoubleClick, GestureDoubleClick);
ComponentFactory.inst.registEvents(Events.GestureEvent.LongTouchStart, GestureLongTouch);
ComponentFactory.inst.registEvents(Events.GestureEvent.LongTouchEnd, GestureLongTouch);
