import { InteractiveEvents } from "./InteractiveEvents";

export * from "./SEvent";
export * from "./DisplayObjectEvent";
export * from "./DragEvent";
export * from "./FocusEvent";
export * from "./GearEvent";
// export * from "./InteractiveEvents";
export * from "./ListEvent";
export * from "./ScrollEvent";
export * from "./StateChangeEvent";
export * from "./TextEvent";
export * from "./GestureEvent";
export * from "./AnimationEvent";

let events = [
    InteractiveEvents.Down, InteractiveEvents.Cancel, InteractiveEvents.Up,
    InteractiveEvents.Click, InteractiveEvents.UpOutside, InteractiveEvents.Move,
    InteractiveEvents.Over, InteractiveEvents.Out, InteractiveEvents.RightDown,
    InteractiveEvents.RightUp, InteractiveEvents.RightClick, InteractiveEvents.RightUpOutside,
];

export function isInteractiveEvent(type: string): boolean {
    return events.includes(type);
}

export function getRawEventType(type: string): string {
    let rawType = type.replace("__warp_", "");
    if(rawType != type && isInteractiveEvent(rawType)) {
        return rawType;
    }
    return type;
}

export function getWarpEventType(type: string): string {
    if(isInteractiveEvent(type)) {
        return `__warp_${type}`;
    }
    return type;
}