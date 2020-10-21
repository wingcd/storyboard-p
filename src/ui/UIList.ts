import { ISerializeFields } from "../types";
import { EAlignType, EHorAlignType, EListLayoutType, EOverflowType, EScrollType, EVertAlignType } from "../core/Defines";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import { View } from "../core/View";
import { IUIList } from "../types/IUIList";
import { UIButton } from "./UIButton";
import { Pointer } from "../phaser";
import * as Events from "../events";
import { Package } from "../core/Package";
import { clone } from "../utils/Serialize";
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
                    
export class UIList extends ViewGroup  implements IUIList{
    static TYPE = "list";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(ViewGroup.SERIALIZABLE_FIELDS),
        {
            defaultItem: {importAs: "_defaultItem"},
            layoutType: {importAs: "_layoutType", alias: "layout", default: EListLayoutType.SingleColumn},
            rowCount: {importAs: "_rowCount", default: 0},
            rowGap: {importAs: "_rowGap", default: 0},
            columnCount: {importAs: "_columnCount", default: 0},
            columnGap: {importAs: "_columnGap", default: 0},
            autoResizeItem: {importAs: "_autoResizeItem", default: true},
            keepResizeAspect: {importAs: "keepResizeAspect", default: false},
            horizontalAlign: {importAs: "_horizontalAlign", alias: "hAlign", default: EHorAlignType.Left},
            verticalAlign: {importAs: "_verticalAlign", alias: "vAlign", default: EVertAlignType.Top},
        }
    );

    static SERIALIZE_INIT() 
    {      
        let fields = UIList.SERIALIZABLE_FIELDS;  
        fields.overflowType.default = EOverflowType.Scroll;
        fields.children.ignores = ['x','y'];
    }

    public itemRenderer: ListRenderer;
    public itemProvider: ListItemProvider;

    public scrollItemToViewOnClick: boolean = true;

    private _layoutType: EListLayoutType = EListLayoutType.SingleColumn;
    private _rowCount: number = 0;
    private _columnCount: number = 0;
    private _rowGap: number = 0;
    private _columnGap: number = 0;    
    private _defaultItem: string;
    private _autoResizeItem: boolean = true;
    private _keepResizeAspect: boolean = false;
    private _horizontalAlign: EHorAlignType;
    private _verticalAlign: EVertAlignType;
    private _loop: boolean = true;

    protected fromConstruct() {     
        super.fromConstruct();
        
        this.overflowType = EOverflowType.Scroll;
        this.on(Events.ScrollEvent.END, this._onScrollEnd, this);
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);

        this.applyOverflow();
        this._update();
    }

    public get layoutType(): EListLayoutType {
        return this._layoutType;
    }

    public set layoutType(val: EListLayoutType) {
        if(val != this._layoutType) {
            this._layoutType = val;
            this._update();
        }
    }

    public get defaultItem(): string {
        return this._defaultItem;
    }

    public set defaultItem(val: string) {
        this._defaultItem = val;
    }

    public get autoResizeItem(): boolean {
        return this._autoResizeItem;
    }

    public set autoResizeItem(val: boolean) {
        if(val != this._autoResizeItem) {
            this._autoResizeItem = val;
            this._update();
        }
    }

    public get rowGap(): number {
        return this._rowGap;
    }

    public set rowGap(val: number) {
        if(val != this._rowGap) {
            this._rowGap = val;
            this._update();
        }
    }

    public get columnGap(): number {
        return this._columnGap;
    }

    public set columnGap(val: number) {
        if(val != this._columnGap) {
            this._columnGap = val;
            this._update();
        }
    }

    public get rowCount(): number {
        return this._rowCount;
    }

    public set rowCount(val: number) {
        if(val != this._rowCount) {
            this._rowCount = val;
            this._update();
        }
    }

    public get columnCount(): number {
        return this._columnCount;
    }

    public set columnCount(val: number) {
        if(val != this._columnCount) {
            this._columnCount = val;
            this._update();
        }
    }

    public get horizontalAlign(): EHorAlignType {
        return this._horizontalAlign;
    }

    public set horizontalAlign(val: EHorAlignType) {
        if(val != this._horizontalAlign) {
            this._horizontalAlign = val;
            this._update();
        }
    }

    public get verticalAlign(): EVertAlignType {
        return this._verticalAlign;
    }

    public set verticalAlign(val: EVertAlignType) {
        if(val != this._verticalAlign) {
            this._verticalAlign = val;
            this._update();
        }
    }

    // private _defaultItemProvider(index: number): string {
    //     if(this._)
    // }

    private _applyLoop() {
        if(!this.scrollPane) {
            return;
        }

        if(!this._loop) {
            this.scrollPane.loop = 0;
        }else {
            if(this._layoutType == EListLayoutType.SingleRow) {
                this.scrollPane.loop = 1;
            }else if(this._layoutType == EListLayoutType.SingleColumn) {
                this.scrollPane.loop = 2;
            }else if(this._layoutType == EListLayoutType.Pagination) {
                if(this.scrollPane.scrollType == EScrollType.Horizontal) {
                    this.scrollPane.loop = 1;
                }else if(this.scrollPane.scrollType == EScrollType.Vertical) {
                    this.scrollPane.loop = 2;
                }
            }
        }
    }

    scrollTo(x?: number, y?: number) {
        super.scrollTo(x, y);

        if(this._loop) {
            this._update();
        }
    }

    private _update() {
        if(!this.inBuilding) {
            this._applyLoop();

            this.layout();
        }
    }

    onChildrenChanged() {
        super.onChildrenChanged();

        this._update();
    }

    private _onScrollEnd() {
        this._update();
    }

    protected layout() {
        switch(this._layoutType) {
            case EListLayoutType.SingleColumn:
                this._layoutSingleColumn();
                break;
            case EListLayoutType.SingleRow:
                this._layoutSingleRow();
                break;
            case EListLayoutType.Pagination:
                this._layoutPage();
                break;
        }
    }    

    private _layoutSingleRow() {
        let posx= 0, posy = 0;
        if(this._loop && this.container2) {
            for(let i in this.children) {
                let c = this.children[i];
                let px = posx + this.container.x;

                if(px + c.width <= 0 || px >= this.width) {
                    this.container2.add(c.rootContainer);
                }else{
                    this.container.add(c.rootContainer);
                }
                
                posx += c.width + this._columnGap;
            }        
            
            posx= posy = 0;
        }

        for(let c of this.children) {
            c.x = posx;
            c.y = posy;
            let width = c._initWidth;
            let height = c.height;
            if(this._autoResizeItem) {
                height = this.scrollRect.height;
                if(this._keepResizeAspect) {
                    width = (c._initWidth / c._initHeight) * height;
                }
            }else{
                height = c._initHeight;
            }

            c.setSize(width, height);
            posx += c.width + this._columnGap;
        }

        if(this.container2) {
            this.container2.y = this.container.y;
            if(this.container.x >= 0) {
                this.container2.x = this.container.x - this.bounds.width - this._columnGap;
            }else {
                this.container2.x = this.container.x + this.bounds.width + this._columnGap;
            }
            
            let width = this.bounds.width;
            if(width > 0) {
                this.container.x %= width;
                this.container2.x %= width;
            }
        }
    }

    private _layoutSingleColumn() {
        let posx= 0, posy = 0;
        //计算长宽
        for(let c of this.children) {
            let width = c._initHeight;
            let height = c.height;

            if(this._autoResizeItem) {
                width = this.scrollRect.width;
                if(this._keepResizeAspect) {
                    height = (c._initHeight / c._initWidth) * width;
                }
            }else{
                width = c._initWidth;
            }
            c.setSize(width, height);
        }

        let loopFunc = (more?: boolean)=>{
            let fronts: View[] = [];
            let ends: View[] = [];
            let middleMin = Infinity, middleMax = 0;
            for(let c of this.children) {
                c.x = posx;

                let py = posy + this.container.y;
                if(py + c.height <= 0) { //在顶部，需要移到底部
                    ends.push(c);
                }else if(py >= this.height) { //在底部, 需要移动到顶部
                    fronts.push(c);
                }else{ // 在中间区域
                    middleMin = Math.min(c.y, middleMin);
                    middleMax = Math.max(posy + c.height + this._rowGap, middleMax);
                    c.y = posy;
                }
                posy += c.height + this._rowGap;
            }

            fronts = fronts.reverse();
            posy = middleMin == Infinity ? 0 : middleMin;
            // 显示前部分，
            for(let c of fronts) {
                posy = posy - c.height - this._rowGap;
                c.y = posy;
            }
            posy = middleMax;
            // 显示尾部分，
            for(let c of ends) {
                c.y = posy;
                posy = posy + c.height + this._rowGap;
            }
            
            // 拉倒最后
            let height = this.scrollRect.height;
            let viewHeight = this.bounds.height - height + this._rowGap;
            if(viewHeight > 0 && height > 0) {
                if(this.container.y >= height) {
                    this.container.y = -viewHeight + (this.container.y - height);
                    for(let c of this.children) {
                        c.y %= height;
                    }
                    if(more) {
                        loopFunc();
                    }
                }else if(this.container.y <= -viewHeight){ //拉倒最上面
                    this.container.y = height - (viewHeight + this.container.y);
                    for(let c of this.children) {
                        c.y %= viewHeight;
                    }
                    if(more) {
                        loopFunc();
                    }
                }
            }
        };

        //设置位置
        if(this._loop) {
            loopFunc();
        }else{
            for(let c of this.children) {
                c.setXY(posx, posy);
                posy += c.height + this._rowGap;
            }
        }
    }

    private _layoutPage() {
        let sp = this.scrollPane;
        if(sp) {
            if(sp.scrollType == EScrollType.Horizontal) {
                this._layoutHorizontalPage();
            } else if(sp.scrollType == EScrollType.Vertical) {
                this._layoutVerticalPage();
            }
        }
    }

    private _layoutHorizontalPage() {
        let posx= 0, posy = 0;
        if(this._loop && this.container2) {
            for(let i in this.children) {
                let c = this.children[i];
                let px = posx + this.container.x;

                if(px + c.width <= 0 || px >= this.width) {
                    this.container2.add(c.rootContainer);
                }else{
                    this.container.add(c.rootContainer);
                }
                
                posx += c.width + this._columnGap;
            }        
            
            posx= posy = 0;
        }

        for(let c of this.children) {
            c.x = posx;
            c.y = posy;
            let width = this.scrollRect.width;
            let height = this.scrollRect.height;

            c.setSize(width, height);
            posx += c.width + this._columnGap;
        }

        if(this.container2) {
            this.container2.y = this.container.y;
            if(this.container.x >= 0) {
                this.container2.x = this.container.x - this.bounds.width - this._columnGap;
            }else {
                this.container2.x = this.container.x + this.bounds.width + this._columnGap;
            }
            
            let width = this.bounds.width;
            if(width > 0) {
                this.container.x %= width;
                this.container2.x %= width;
            }
        }
    }

    private _layoutVerticalPage() {
        let posx= 0, posy = 0;
        if(this._loop && this.container2) {
            for(let i in this.children) {
                let c = this.children[i];
                let py = posy + this.container.y;

                if(py + c.height <= 0 || py >= this.height) {
                    this.container2.add(c.rootContainer);
                }else{
                    this.container.add(c.rootContainer);
                }
                
                posy += c.height + this._rowGap;
            }        
            
            posx= posy = 0;
        }

        for(let c of this.children) {
            c.x = posx;
            c.y = posy;            
            let width = this.scrollRect.width;
            let height = this.scrollRect.height;

            c.setSize(width, height);
            posy += height + this._rowGap;
        }

        if(this.container2) {
            this.container2.x = this.container.x;
            if(this.container.y >= 0) {
                this.container2.y = this.container.y - this.bounds.height - this._rowGap;
            }else {
                this.container2.y = this.container.y + this.bounds.height + this._rowGap;
            }
            
            let height = this.bounds.height;
            if(height > 0) {
                this.container.y %= height;
                this.container2.y %= height;
            }
        }
    }

    protected reconstruct() {  
        super.reconstruct();

        this.children.forEach(child => {
            child.onClick(this._clickItem, this);
        });
    }

    public addChildAt(child: View, index: number = 0): this {
        super.addChildAt(child, index);

        if (child instanceof UIButton) {
            child.selected = false;
            // child.changeStateOnClick = false;
        }
        child.onClick(this._clickItem, this);
        return this;
    }

    private _clickItem(sender: View, pointer: Pointer): void {
        if (this.scrollPane != null && this.scrollPane.isDragging)
            return;

        const item = sender;
        if (!item) return;
        // this.setSelectionOnEvent(item);

        if (this.scrollPane && this.scrollItemToViewOnClick) {
            this.scrollPane.scrollToView(item, true);
        }

        this.emit(Events.ListEvent.ITEM_CLICK, item, pointer);
    }

    public addItem(url: string = null): View {
        if (!url) {
            url = this._defaultItem;
        }
        
        let item = Package.inst.createObjectFromUrl(this.scene, url) as View;
        this.addChild(item);
        return item;
    }
}