import { Point } from "../phaser";

export class MathUtils {
    public static RADIAN:number = Math.PI / 180;
    public static Right: Point = new Point(1, 0);
    public static Left: Point = new Point(-1, 0);
    public static Up: Point = new Point(0, 1);
    public static Down: Point = new Point(0, -1);

    public static clamp(value: number, min: number, max: number): number {
        if (value < min)
            value = min;
        else if (value > max)
            value = max;
        return value;
    }

    public static clamp01(value: number): number {
        if (value > 1)
            value = 1;
        else if (value < 0)
            value = 0;
        return value;
    }

    public static isNumber(n: any): n is number {
        if (typeof (n) != "number") return false;
        if (isNaN(n)) return false;
        return true;
    }

    public static sign(x:number):number {
        x = Number(x);
        
        if (x === 0 || isNaN(x))
            return x;

        return x > 0 ? 1 : -1;
    }

    public static angleToRadian(n:number):number {
        return n * MathUtils.RADIAN;
    }

    public static radianToAngle(n:number):number {
        return n / MathUtils.RADIAN;
    }
    
    public static lerp(s:number, e:number, p:number):number {
        return s + p * (e - s);
    }

    public static closeToZero(val: number): boolean {
        return Math.abs(val) < 0.0001;
    }

    public static normalize(v: Point) {
        let dist = Math.sqrt(v.x * v.x + v.y * v.y);
        v.x = v.x / dist;
        v.y = v.y / dist;
    }

    public static angleBetween(v1: Point, v2: Point): number {
        MathUtils.normalize(v1);
        MathUtils.normalize(v2);
        let cosA = v1.x*v2.x + v1.y*v2.y;
        return MathUtils.radianToAngle(Math.acos(cosA));   
    }
}