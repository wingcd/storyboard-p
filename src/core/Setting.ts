import { Browser } from "../utils/Browser";
import { EScrollbarDisplayType } from "./Defines";

export class Settings {
    /**default font name of your project. */
    public static defaultFont: string = "Arial";
    
    public static showDebugBorder = false;
    public static showDebugFrame =false;
    public static showDebugBounds = false;

    /** the finger moving threshold in pixel to trigger the dragging event.*/
    public static touchDragSensitivity: number = 10;

    /** the figer moving threshold in pixel to donot trigger the click event */
    public static touchSensitivity: number = 10;

    /** scrolling distance per action in pixel*/
    public static defaultScrollSpeed: number = 25;

    /** the finger moving threshold in pixel to trigger the scrolling action.*/
    public static touchScrollSensitivity: number = 20;

    /** the finger long touch time.*/
    public static longTouchTime: number = 2000;

    /** global scrollbar name */
    public static horizontalScrollBar: string;
    public static verticalScrollBar: string;

    /** default scrollbar display mode. default set EScrollBarDisplayType.Visible for Desktop environment and EScrollBarDisplayType.Auto for mobile environment.*/
    public static defaultScrollBarDisplay: number = EScrollbarDisplayType.Visible;
}

if(Browser.onMobile){
    Settings.defaultScrollBarDisplay = EScrollbarDisplayType.Auto;
}
