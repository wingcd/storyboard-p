import { Color } from "../phaser";

export function colorMultiply(a: number, b: number): number {
    let ca  = Color.IntegerToRGB(a);
    let cb = Color.IntegerToRGB(b);
    let cc: any = {};
    cc.r = Math.floor(ca.r * cb.r/255);
    cc.g = Math.floor(ca.g * cb.g/255);
    cc.b = Math.floor(ca.b * cb.b/255);
    return Color.GetColor(cc.r, cc.g, cc.b);
}

export function colorToString(value: number): string {
    let color  = Color.IntegerToRGB(value);
    return Color.RGBToString(color.r, color.g, color.b, color.a);
}

export function splitColorAndAlpha(value: number): number[] {
    let color = value;
    let alpha = 1;
    if (value > 0xffffff) {
        alpha = value & 0x0000ff;
        color = value & 0xffffff >> 8;
    }
    return [color, alpha];
}

export function combineColorAndAlpha(color: number, alpha: number): number {
    return (color << 8) | alpha;
}