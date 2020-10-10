import { ISerializeInfo } from "../annotations/Serialize";
import { Deserialize } from "./Serialize";

export class Margin {
    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields: ISerializeInfo[] = [];
        fields.push(
            {property: "left", alias: "l", default:0},
            {property: "right", alias: "r", default:0},
            {property: "top", alias: "t", default:0},
            {property: "bottom", alias: "b", default:0},
        );
        return fields;
    }
    
    public left: number = 0;
    public right: number = 0;
    public top: number = 0;
    public bottom: number = 0;

    constructor(left?: number, right?: number, top?: number, bottom?: number) {
        this.set(left, right, top, bottom);
    }

    public set(left?: number, right?: number, top?: number, bottom?: number) {
        this.left = left || 0;
        this.right = right || 0;
        this.top = top || 0;
        this.bottom = bottom || 0;
    }

    public parse(str: string): void {
        if (!str) {
            this.left = this.right = this.top = this.bottom = 0;
            return;
        }
        let arr: string[] = str.split(",");
        if (arr.length == 1) {
            let k: number = parseInt(arr[0]);
            this.left = this.right = this.top = this.bottom = k;
        }
        else {
            this.top = parseInt(arr[0]);
            this.bottom = parseInt(arr[1]);
            this.left = parseInt(arr[2]);
            this.right = parseInt(arr[3]);
        }
    }

    public copy(source: Margin): void {
        Deserialize(this, source);
    }
}