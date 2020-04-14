import { InteractiveEvents } from "./InteractiveEvents";

export class GestureEvent { 
    public static Click:string = "__gesture_click";
    public static DoubleClick: string = "__gesture_double_click";
    public static LongTouchStart: string = "__gesture_long_touch_start";
    public static LongTouchEnd: string = "__gesture_long_touch_end";

    
    public static Down:string = "__warp_" + InteractiveEvents.Down;
    public static Cancel:string = "__warp_" + InteractiveEvents.Cancel;
    public static Up:string = "__warp_" + InteractiveEvents.Up;
    // public static Click:string;
    public static UpOutside:string = "__warp_" + InteractiveEvents.UpOutside;
    public static Move:string = "__warp_" + InteractiveEvents.Move;
    public static Over:string = "__warp_" + InteractiveEvents.Over;
    public static Out:string = "__warp_" + InteractiveEvents.Out;
    //mouse only
    public static RightDown = "__warp_" + InteractiveEvents.RightDown;
    public static RightUp = "__warp_" + InteractiveEvents.RightUp;
    public static RightClick = "__warp_" + InteractiveEvents.RightClick;
    public static RightUpOutside = "__warp_" + InteractiveEvents.RightUpOutside;
}