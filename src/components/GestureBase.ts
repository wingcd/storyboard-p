import * as Events from "../events";
import { Input } from "../phaser";
import { ComponentFactory } from "./ComponentFactory";
import { RemapEventComponent } from "./RemapEventComponent";

export class PointerDown extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_DOWN;
    protected _targetType = Events.PointerEvent.DOWN;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.DOWN, PointerDown);

export class PointerDownOutside extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_DOWN_OUTSIDE;
    protected _targetType = Events.PointerEvent.DOWN_OUTSIDE;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.DOWN_OUTSIDE, PointerDownOutside);

export class PointerUp extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_DOWN_OUTSIDE;
    protected _targetType = Events.PointerEvent.UP;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.UP, PointerUp);

export class PointerUpOutside extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_DOWN_OUTSIDE;
    protected _targetType = Events.PointerEvent.UP_OUTSIDE;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.UP_OUTSIDE, PointerUpOutside);

export class PointerOver extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_OVER;
    protected _targetType = Events.PointerEvent.OVER;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.OVER, PointerOver);

export class PointerOut extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_OUT;
    protected _targetType = Events.PointerEvent.OUT;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.OUT, PointerOut);

export class PointerMove extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_MOVE;
    protected _targetType = Events.PointerEvent.MOVE;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.MOVE, PointerMove);

export class PointerWheel extends RemapEventComponent {
    protected _souceType = Input.Events.POINTER_MOVE;
    protected _targetType = Events.PointerEvent.WHEEL;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.WHEEL, PointerWheel);

export class PointerLockChange extends RemapEventComponent {
    protected _souceType = Input.Events.POINTERLOCK_CHANGE;
    protected _targetType = Events.PointerEvent.LOCK_CHANGE;
}
ComponentFactory.inst.registEvents(Events.PointerEvent.LOCK_CHANGE, PointerLockChange);