import { Graphics, Container, MaskType } from "../phaser";
import { EDirectionType } from "../core/Defines";
import { SerializeInfo } from "../annotations/Serialize";
import { View } from "../core/View";
import { MathUtils } from "../utils/Math";
import { Serialize, Deserialize } from "../utils/Serialize";

export const enum EFillType {
    None,
    Horizontal,
    Vertical,
    Rotate90,
    Rotate180,
    Rotate360,
}

interface IMaskable {
    mask: MaskType;
}

interface IFillMask {
    fillType?: EFillType;
    value?: number;
    origin?: EDirectionType;
    anticlockwise?: boolean;
    outterRadius?: number;
    innerRadius?: number;
}

export class FillMask {
    private _target:IMaskable = null;
    private _owner: View = null;
    private _mask: Graphics = null;
    private _fillType: EFillType = EFillType.None;
    private _value: number = 1;
    private _origin?: EDirectionType;
    private _anticlockwise?: boolean;
    private _outterRadius?: number;
    private _innerRadius?: number;

    public attach(owner: View, target: IMaskable, config?: IFillMask | any) {
        this._target = target;
        this._owner = owner;

        this.fromJSON(config);
    }

    public toJSON(): any {
        return Serialize(this);
    }

    public fromJSON(config?: any) {
        if(!config) {
            return;
        }

        Deserialize(this, config);

        this._update();
    }

    private _attach() {
        this._dettach();
        if(this._target) {
            if(!this._mask) {
                this._mask = this._owner.scene.make.graphics({});
            }
            this._target.mask = this._mask.createGeometryMask();
            this._mask.clear();
        }
    }

    private _dettach() {
        if(this._mask) {
            this._mask.destroy();
            this._mask = null;                        
        }

        if(this._target.mask) {
            this._target.mask.destroy();
            this._target.mask = null;
        }
    }

    public destory() {
        this._dettach();
    }

    private _update() {
        if(this._fillType == EFillType.None) {
            this._dettach();
        }else{
            this._attach();
        }

        let PI_2 = Math.PI * 0.5;
        switch(this._fillType) {
            case EFillType.Horizontal:
                {
                    this._mask.fillStyle(0x1, 1);
                    let startx = 0;
                    let width = this._value * this._owner.width;
                    if(this._origin == EDirectionType.Right) {
                        startx = this._owner.width - width;
                    }
                    this._mask.fillRect(startx, 0, width, this._owner.height);
                    break;
                }
            case EFillType.Vertical:
                {
                    this._mask.fillStyle(0x1, 1);
                    let starty = 0;
                    let height = this._value * this._owner.height;
                    if(this._origin == EDirectionType.Bottom) {
                        starty = this._owner.height - height;
                    }
                    this._mask.fillRect(0, starty, this._owner.width, height);                
                    break;
                }
            case EFillType.Rotate90:
                {
                    let simple = this.innerRadius == 0;
                    if(simple) {
                        this._mask.fillStyle(0x1, 1);
                    }
                    let value = this._anticlockwise ? 1 - this._value : this._value;
                    let width = this._owner.width, height = this._owner.height;
                    let posx = 0, posy = 0, startAngle = this.anticlockwise ? PI_2 : 0, endAngle = PI_2 * value;
                    let angleOffset = 0;
                    
                    if((this._origin & EDirectionType.Left) == EDirectionType.Left) {
                        posx = 0;

                        if((this._origin & EDirectionType.Bottom) == EDirectionType.Bottom) {
                            angleOffset = Math.PI * 1.5;
                        }
                    } else if((this._origin & EDirectionType.Right) == EDirectionType.Right) {
                        posx = width;                        

                        if((this._origin & EDirectionType.Bottom) == EDirectionType.Bottom) {
                            angleOffset = Math.PI;
                        }else{
                            angleOffset = Math.PI * 0.5;
                        }
                    }
                    if((this._origin & EDirectionType.Top) == EDirectionType.Top) {
                        posy = 0;
                    } else if((this._origin & EDirectionType.Bottom) == EDirectionType.Bottom) {
                        posy = height;
                    }   

                    startAngle += angleOffset;
                    endAngle += angleOffset;

                    let radius = Math.sqrt(width * width + height * height);  
                    this._drawArc(simple, posx, posy, radius, startAngle, endAngle);  
                    break;
                }
            case EFillType.Rotate180:
                {
                    let simple = this.innerRadius == 0;
                    if(simple) {
                        this._mask.fillStyle(0x1, 1);
                    }
                    let value = this._anticlockwise ? 1 - this._value : this._value;
                    let width = this._owner.width, height = this._owner.height;
                    let posx = 0, posy = 0, startAngle = this.anticlockwise ? Math.PI : 0, endAngle = Math.PI * value;
                    let angleOffset = 0;
                    
                    if(this._origin == EDirectionType.Left) {
                        posy = this._owner.height * 0.5;
                        angleOffset = -Math.PI * 0.5;
                    }else if(this._origin == EDirectionType.Top) {
                        posx = this._owner.width * 0.5;
                    }else if(this._origin == EDirectionType.Right) {
                        posx = this._owner.width;
                        posy = this._owner.height * 0.5;
                        angleOffset = Math.PI * 0.5;
                    }else if(this._origin == EDirectionType.Bottom) {
                        posx = this._owner.width * 0.5;
                        posy = this._owner.height;
                        angleOffset = Math.PI;
                    }

                    startAngle += angleOffset;
                    endAngle += angleOffset;

                    let radius = Math.sqrt(width * width + height * height);  
                    this._drawArc(simple, posx, posy, radius, startAngle, endAngle);
                    break;
                }
            case EFillType.Rotate360:
                {
                    let simple = this.innerRadius == 0;
                    if(simple) {
                        this._mask.fillStyle(0x1, 1);
                    }
                    let value = this._anticlockwise ? 1 - this._value : this._value;
                    let width = this._owner.width, height = this._owner.height;
                    let posx = width * 0.5, posy = height * 0.5, startAngle = this.anticlockwise ? Math.PI * 2 : 0, endAngle = Math.PI * 2 * value;
                    let angleOffset = 0;
                    
                    if(this._origin == EDirectionType.Left) {
                        angleOffset = Math.PI;
                    }else if(this._origin == EDirectionType.Top) {
                        angleOffset = -Math.PI * 0.5;
                    }else if(this._origin == EDirectionType.Right) {
                        angleOffset = 0;
                    }else if(this._origin == EDirectionType.Bottom) {
                        angleOffset = Math.PI * 0.5;
                    }

                    startAngle += angleOffset;
                    endAngle += angleOffset;

                    let radius = Math.sqrt(width * width + height * height) * 0.5;  
                    this._drawArc(simple, posx, posy, radius, startAngle, endAngle);                      
                    break;
                }
        }      
    }

    private _drawArc(simple: boolean, posx: number, posy: number, radius: number, startAngle: number, endAngle: number) {
        if(simple) {
            this._mask.moveTo(posx, posy);
            this._mask.arc(posx, posy, radius * this.outterRadius, startAngle, endAngle, this._anticlockwise);
            this._mask.closePath();
        }else{
            this._mask.lineStyle(radius * this.outterRadius - radius * this.innerRadius, 0x1, 1); //, this._anticlockwise ? 1 : 0);
            this._mask.arc(posx, posy, radius * this.outterRadius, startAngle, endAngle, this._anticlockwise); 
        }  
    }

    public get fillType(): EFillType {
        return this._fillType;
    }

    public set fillType(val: EFillType) {
        if(this._fillType != val) {
            this._fillType = val;
            this._update();
        }
    }

    public get outterRadius(): number {
        return (this._outterRadius === undefined ? 1 : this._outterRadius);
    }

    public set outterRadius(val: number) {
        if(this._outterRadius != val) {
            this._outterRadius = val;

            this._update();
        }
    }

    public get innerRadius(): number {
        return (this._innerRadius === undefined ? 0 : this._innerRadius);
    }

    public set innerRadius(val: number) {
        if(this._innerRadius != val) {
            this._innerRadius = val;

            this._update();
        }
    }

    public get value(): number {
        return this._value;
    }

    public set value(val: number) {
        val = MathUtils.clamp01(val);
        if(this._value != val) {
            this._value = val;
            this._update();
        }
    }

    public get origin(): EDirectionType {
        return this._origin || EDirectionType.None;
    }

    public set origin(val: EDirectionType) {
        if(this._origin != val) {
            this._origin = val;
            this._update();
        }
    }

    public get anticlockwise(): boolean {
        return this._anticlockwise;
    }

    public set anticlockwise(val: boolean) {
        if(this._anticlockwise != val) {
            this._anticlockwise = val;
            this._update();
        }
    }
}