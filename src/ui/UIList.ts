import { IExtendsValue } from "../types";
import { EAlignType, EListLayoutType, EOverflowType, EVertAlignType } from "../core/Defines";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import { View } from "../core/View";
require("../components");

export type ListRenderer = (index: number, item: View) => void;
export type ListItemProvider = (index: number) => string;

const enum EListChangedType {
    None = 0,
    ContentChanged = 1,
    SizeChanged = 2
};

class ItemInfo {
    public width: number = 0;
    public height: number = 0;
    public view: View;
    public updateFlag: number = 0;
    public selected: boolean = false;
}
                    
export class UIList extends ViewGroup {
    static TYPE = "list";

    static get EXTENDS_SERIALIZABLE_FIELDS(): IExtendsValue {
        return {
            opaque: true,
            _overflowType: EOverflowType.Hidden,  
        };
    }

    public itemRenderer: ListRenderer;
    public itemProvider: ListItemProvider;

    public scrollItemToViewOnClick: boolean;

    private _layout: EListLayoutType = EListLayoutType.SingleColumn;
    private _lineCount: number = 0;
    private _columnCount: number = 0;
    private _lineGap: number = 0;
    private _columnGap: number = 0;    
    private _defaultItem: string;
    private _autoResizeItem: boolean;
    private _align: EAlignType;
    private _verticalAlign: EVertAlignType;

    public constructor(scene: ViewScene) {
        super(scene);

        this.opaque = true;
        this.overflowType = EOverflowType.Hidden;
    }


}