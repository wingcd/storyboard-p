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
}