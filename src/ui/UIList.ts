import { ISerializeFields } from "../types";
import { EAlignType, EDirtyType, EHorAlignType, EListLayoutType, EOverflowType, EScrollType, EVertAlignType } from "../core/Defines";
import { ViewGroup } from "../core/ViewGroup";
import { ViewScene } from "../core/ViewScene";
import { View } from "../core/View";
import { IUIList } from "../types/IUIList";
import { UIButton } from "./UIButton";
import { Pointer, Rectangle, Size } from "../phaser";
import * as Events from "../events";
import { Package } from "../core/Package";
import { clone } from "../utils/Serialize";
import { UITextField } from "./UITextField";
import { PoolManager } from "../utils/PoolManager";
import { ViewFactory } from "../core/ViewFactory";
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
    public computed: boolean = false;
    public selected: boolean = false;
}
    
/**
 * 目前不支持虚拟列表和多行列时的循环
 */
export class UIList extends ViewGroup  implements IUIList{
    static TYPE = "list";
    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        clone(ViewGroup.SERIALIZABLE_FIELDS),
        {
            defaultItem: {importAs: "_defaultItem"},
            layoutType: {importAs: "_layoutType", alias: "layout", default: EListLayoutType.FlowHorizontal},
            rowCount: {importAs: "_rowCount", default: 0},
            rowGap: {importAs: "_rowGap", default: 0},
            columnCount: {importAs: "_columnCount", default: 0},
            columnGap: {importAs: "_columnGap", default: 0},
            autoResizeItem: {importAs: "_autoResizeItem", default: false},
            keepResizeAspect: {importAs: "keepResizeAspect", default: false},
            horizontalAlign: {importAs: "_horizontalAlign", alias: "hAlign", default: EHorAlignType.Left},
            verticalAlign: {importAs: "_verticalAlign", alias: "vAlign", default: EVertAlignType.Top},
            loop: {importAs: "_loop", default: false},            
            pageMode: {importAs: "_pageMode", default: false},
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

    private _layoutType: EListLayoutType = EListLayoutType.FlowHorizontal;
    private _rowCount: number = 0;
    private _columnCount: number = 0;
    private _rowGap: number = 0;
    private _columnGap: number = 0;    
    private _defaultItem: string;
    private _autoResizeItem: boolean = false;
    private _keepResizeAspect: boolean = false;
    private _horizontalAlign: EHorAlignType;
    private _verticalAlign: EVertAlignType;
    private _loop: boolean = false;
    private _virtual: boolean = false;
    private _itemNum: number = 0;
    private _pageMode: boolean = false;

    private _updating = false;
    private _itemsInfo: ItemInfo[] = [];
    private _startIndex = -1;
    private _showCount = 0;
    private _pageNo = 0;

    protected fromConstruct() {     
        super.fromConstruct();
        
        this.overflowType = EOverflowType.Scroll;
    }

    protected fromConfig(config: any, tpl?:any) {
        super.fromConfig(config, tpl);

        this.applyOverflow();
        this._update(true);
    }

    public get layoutType(): EListLayoutType {
        return this._layoutType;
    }

    public set layoutType(val: EListLayoutType) {
        if(val != this._layoutType) {
            this._layoutType = val;
            this._update(true);
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
            this._update(true);
        }
    }

    public get rowGap(): number {
        return this._rowGap;
    }

    public set rowGap(val: number) {
        if(val != this._rowGap) {
            this._rowGap = val;
            this._update(true);
        }
    }

    public get columnGap(): number {
        return this._columnGap;
    }

    public set columnGap(val: number) {
        if(val != this._columnGap) {
            this._columnGap = val;
            this._update(true);
        }
    }

    public get rowCount(): number {
        return this._rowCount;
    }

    public set rowCount(val: number) {
        if(val != this._rowCount) {
            this._rowCount = val;
            this._update(true);
        }
    }

    public get columnCount(): number {
        return this._columnCount;
    }

    public set columnCount(val: number) {
        if(val != this._columnCount) {
            this._columnCount = val;
            this._update(true);
        }
    }

    public get horizontalAlign(): EHorAlignType {
        return this._horizontalAlign;
    }

    public set horizontalAlign(val: EHorAlignType) {
        if(val != this._horizontalAlign) {
            this._horizontalAlign = val;
            this._update(true);
        }
    }

    public get verticalAlign(): EVertAlignType {
        return this._verticalAlign;
    }

    public set verticalAlign(val: EVertAlignType) {
        if(val != this._verticalAlign) {
            this._verticalAlign = val;
            this._update(true);
        }
    }

    public get loop(): boolean {
        return this._loop;
    }

    public set loop(val: boolean) {
        if(this._loop != val) {
            this._loop = val;
            this._update(true);
        }
    }

    // public get virtual(): boolean {
    //     return this._virtual;
    // }

    // public set virtual(val: boolean) {
    //     if(this._virtual != val) {
    //         this._virtual = val;
    //         if(val) {
    //             this._refreshItemsInfo(true);
    //         } else {
    //             this._itemNum = 0;
    //             this.removeAllChildren(true);
    //         }
    //         this._update(true);
    //     }
    // }

    // public get itemNum(): number {
    //     return this._itemNum;
    // }

    // public set itemNum(val: number) {
    //     if(val != this._itemNum) {
    //         this._itemNum = val;
    //     }
    // }

    public get pageMode(): boolean {
        return this._pageMode;
    }

    public set pageMode(val: boolean) {
        if(val != this._pageMode) {
            this._pageMode = val;
            this._update(true);
        }
    }

    private _applyPageMode() {
        if(!this.scrollPane) {
            return;
        }

        this.scrollPane.pageMode = this._pageMode;
    }

    private _applyLoop() {
        if(!this.scrollPane) {
            return;
        }

        this.scrollPane.loop = 0;
        if(this._loop) {
            if(this._layoutType == EListLayoutType.FlowHorizontal) {                
                this.scrollPane.loop = this._columnCount <= 1 ? 1 : 0;
            }else if(this._layoutType == EListLayoutType.FlowVertical) {
                this.scrollPane.loop = this._rowCount <= 1 ? 2 : 0;
            }
        }
    }

    scrollTo(x?: number, y?: number) {
        super.scrollTo(x, y);

        if(this._loop || this._virtual) {
            this._update();
        }
    }

    private _update(focus?: boolean) {
        if(!this.inBuilding && !this._updating) {
            this._updating = true;
            this._applyPageMode();
            this._applyLoop();
            this.layout(focus);
            this._updating = false;
        }
    }

    onScrollStatusChanged() {
        super.onScrollStatusChanged();

        this._update();
    }

    onChildrenChanged() {
        super.onChildrenChanged();

        if(!this._virtual) {
            this._itemNum = this.children.length;
        }
        this._update(true);
    }

    protected layout(focus?: boolean) {
        switch(this._layoutType) {
            case EListLayoutType.FlowHorizontal:
                this._layoutHorizontalFlowEx(focus, this._rowCount, this._columnCount, this._pageMode);
                break;
            case EListLayoutType.FlowVertical:                
                this._layoutVerticalFlowEx(focus, this._rowCount, this._columnCount, this._pageMode);
                break;
        }
    }    

    private needHRelayout() {
        if(this.scrollPane.prePosX == 0 && this.scrollPane.posX == 0) {
            return true;
        }

        if(Math.sign(this.scrollPane.prePosX) == Math.sign(this.scrollPane.posX)) {
            return false;
        }

        return true;
    }

    private needVRelayout() {
        if(this.scrollPane.prePosY == 0 && this.scrollPane.posY == 0) {
            return true;
        }

        if(Math.sign(this.scrollPane.prePosY) == Math.sign(this.scrollPane.posY)) {
            return false;
        }

        return true;
    }

    private _estimateSize: Size = new Size(0, 0);

    private _getItemInfo(index: number, loop: boolean) {
        let idx = loop ? index % this._itemsInfo.length : index;
        return this._itemsInfo[idx];
    }

    // protected updateBounds() {
        

    //     this.bounds.x = minx;
    //     this.bounds.y = miny;
    //     this.bounds.width = maxx - minx;
    //     this.bounds.height = maxy - miny;

    //     this.removeDirty(EDirtyType.BoundsChanged);

    //     if(this.scrollPane) {
    //         this.scrollPane.setContentSize(maxx, maxy);
    //     }
    // }   

    private _createItem(index: number): View {
        let resUrl = this.itemProvider ? this.itemProvider(index) : this._defaultItem;
        if(resUrl) {
            return Package.inst.createObject(this.scene, resUrl) as View;
        }
        return null;
    }

    private _refreshItemsInfo(focus?: boolean) {        
        if(this._itemsInfo.length != this._itemNum || focus) {
            this._itemsInfo.length = this._itemNum;
            if(!this._virtual) {
                for(let i=0;i<this._itemNum;i++) {
                    let c = this.children[i];
                    let item = this._itemsInfo[i];
                    item = item || new ItemInfo();
                    item.width = c.width;
                    item.height = c.height;
                    item.selected = false;
                    item.computed = false;
                    item.view = c;

                    this._estimateSize.width = Math.max(this._estimateSize.width, c.width);
                    this._estimateSize.height = Math.max(this._estimateSize.height, c.height);
                    this._itemsInfo[i] = item;
                }
            }else if(this.itemRenderer && this._itemNum > 0){
                let c = this._createItem(0);
                if(c) {
                    for(let i=0;i<this._itemNum;i++) {                    
                        let item = this._itemsInfo[i];
                        item = item || new ItemInfo();
                        item.width = c.width;
                        item.height = c.height;
                        item.selected = false;
                        item.computed = false;
                        item.view = c;

                        this._estimateSize.width = Math.max(this._estimateSize.width, c.width);
                        this._estimateSize.height = Math.max(this._estimateSize.height, c.height);                        
                        this._itemsInfo[i] = item;
                    }
                    PoolManager.inst.putByName(c.resourceUrl, c);
                }else{
                    this._itemsInfo.length = 0;
                }
            }
        }
    }

    private _calcFirstIndex(vertical: boolean): number {
        let idx = 0;
        if(vertical) {
            idx = Number.isFinite(this._estimateSize.height) && this._estimateSize.height > 0 ? Math.floor(this.scrollPane.posY / (this._estimateSize.height + this._rowGap)): 0;
        }else{
            idx = Number.isFinite(this._estimateSize.width) && this._estimateSize.width > 0 ? Math.floor(this.scrollPane.posX / (this._estimateSize.width + this._columnGap)) : 0;
        }
        if(idx < 0) {
            idx = (idx % this._itemsInfo.length + this._itemsInfo.length) % this._itemsInfo.length;
        }
        return idx;
    }

    private _calcShowCount(vertical: boolean, rowCount: number, columnCount: number): number {
        let count = 0;
        if(vertical) {
            count = Number.isFinite(this._estimateSize.height) && this._estimateSize.height > 0 ? Math.ceil(this.scrollRect.height / (this._estimateSize.height + this._rowGap)) : 0;
        }else{
            count = Number.isFinite(this._estimateSize.width) && this._estimateSize.width > 0 ? Math.ceil(this.scrollRect.width / (this._estimateSize.width + this._columnGap)) : 0;
        }
        if(vertical && columnCount > 0) {
            count *= columnCount;
        }else if(!vertical && rowCount > 0) {
            count *= rowCount;
        }
        count = Math.min(count, this._itemsInfo.length);
        return count;
    }

    public get bounds():Rectangle {
        let b = super.bounds;
        if(this._virtual) {
            b.height = this._itemsInfo.length * (this._estimateSize.height + this._rowGap) - this._rowGap;
        }
        if(this._pageMode) {
            let pageCount = this._rowCount * this._columnCount;            
            if(this._itemsInfo.length % pageCount != 0) {
                let pageSize = this.scrollPane.pageSize;
                if(this.layoutType == EListLayoutType.FlowHorizontal) {
                    b.height = Math.ceil(b.height / pageSize.y) * pageSize.y;
                }else{
                    b.width = Math.ceil(b.width / pageSize.x) * pageSize.x;
                }
            }
        }
        return b;
    }

    private _layoutHorizontalFlowEx(focus?: boolean, rowCount?: number, columnCount?: number, page?: boolean) {
        this._refreshItemsInfo();

        rowCount = rowCount || 1;
        columnCount = columnCount || 1;
        let loop = columnCount == 1 && this._loop;

        let posx= 0, posy = 0;        

        if(!focus && !this.needVRelayout()) {
            return;
        }

        let autoWidth = page || (columnCount > 0 && this._autoResizeItem);
        let avgWidth = 0;
        if(autoWidth) {
            avgWidth = (this.scrollRect.width - this._columnGap*(Math.max(0, columnCount-1))) / columnCount;
        }

        let autoHeight = page;
        let avgHeight = 0;
        if(autoHeight) {
            avgHeight = (this.scrollRect.height - this._rowGap*(Math.max(0, rowCount-1))) / rowCount;
        }

        let columnNum = 0;
        let start = this._virtual ? this._calcFirstIndex(true) : 0;   
        let viewHeight = Math.max(this.scrollRect.height, this.bounds.height);
        let oldy = this.container.y;
        if(loop) {
            this.container.y %= viewHeight;
            if(this.container.y != oldy) {
                if(this.container.y < 0) {
                    this._pageNo++;
                }else{
                    this._pageNo--;
                }
            }            
        
            if(this.container.y <= 0) {
                for(let i=0;i<this._itemsInfo.length;i++) {
                    let item = this._getItemInfo(i+start, loop);
                    if(!item) {
                        continue;
                    }
                    columnNum++;

                    if(posy + item.height + this._rowGap >= -this.container.y) {
                        start = i;
                        break;
                    }

                    if(columnNum >= columnCount) {
                        posy += item.height + this._rowGap;
                        columnNum = 0;
                    }
                }
            }
            else {
                for(let i=this._itemsInfo.length-1;i>=0;i--) {
                    let item = this._getItemInfo(i+start, loop);
                    if(!item) {
                        continue;
                    }
                    columnNum++;

                    if(columnNum >= columnCount) {
                        posy = posy - item.height - this._rowGap;
                        columnNum = 0;
                        
                        if(posy < -this.container.y) {
                            start = i;
                            break;
                        }
                    }
                }  
            }
        }else{
            posy = 0;
        }


        let topOffset = 0;
        if(this._virtual) {
            topOffset = start * (this._estimateSize.height + this._rowGap);
            for(let c of this._itemsInfo) {
                if(c.view) {
                    PoolManager.inst.putByName(c.view.resourceUrl, c.view);
                    c.view = null;
                }
                break;
            }
            this.removeAllChildren();
        }

        let count = this._itemsInfo.length;
        let maxHeight = 0;
        columnNum = 0;

        for(let i=0;i<count;i++) {
            let idx = i+start;
            let item = this._getItemInfo(idx, loop);
            if(!item) {
                continue;
            }
            columnNum++;
            if(this._virtual) {
                item.view = this._createItem(idx);
                this.addChild(item.view);
                if(this.itemRenderer) {
                    this.itemRenderer(idx, item.view);
                }
            }

            let width = 0;
            let height = 0;
            if(item.computed) {
                width = item.width;
                height = item.height;
            }else{                
                width = item.view.width;
                height = item.view._initHeight;
                if(autoWidth) {
                    width = avgWidth;
                    if(autoHeight) {
                        height = avgHeight;
                    }else if(this._keepResizeAspect) {
                        height = (item.view._initHeight / item.view._initWidth) * width;
                    }
                }else{
                    width = item.view._initWidth;
                }
                
                item.width = width;
                item.height = height;
                item.computed = true;
            }
            item.view.setSize(width, height);

            maxHeight = Math.max(maxHeight, height);
            if(columnNum >= columnCount ||
                autoWidth && posx + item.width > this.scrollRect.width) {
                columnNum = 0;              
                item.view.setXY(posx, posy + topOffset);
                posy += maxHeight + this._rowGap;  
                posx = 0;
                maxHeight = 0;
            }else{     
                item.view.setXY(posx, posy + topOffset);
                posx += item.width + this._columnGap;
            }

            if(this._virtual) {
                if(posy > this.scrollRect.height) {
                    break;
                }
            }
        }        
        
        this._startIndex = start;
        this._showCount = count;
        this.scrollPane.updateSize();
    }

    private _layoutVerticalFlowEx(focus?: boolean, rowCount?: number, columnCount?: number, page?: boolean) {
        this._refreshItemsInfo();

        rowCount = rowCount || 1;
        columnCount = columnCount || 1;
        let loop = columnCount == 1 && this._loop;

        let posx= 0, posy = 0;        

        if(!focus && !this.needHRelayout()) {
            return;
        }

        let autoWidth = page || (columnCount > 0 && this._autoResizeItem);
        let avgWidth = 0;
        if(autoWidth) {
            avgWidth = (this.scrollRect.width - this._columnGap*(Math.max(0, columnCount-1))) / columnCount;
        }

        let autoHeight = page;
        let avgHeight = 0;
        if(autoHeight) {
            avgHeight = (this.scrollRect.height - this._rowGap*(Math.max(0, rowCount-1))) / rowCount;
        }

        let rowNum = 0;
        let start = this._virtual ? this._calcFirstIndex(false) : 0;   
        let viewWidth = Math.max(this.scrollRect.width, this.bounds.width);
        let oldx = this.container.x;
        if(loop) {
            this.container.x %= viewWidth;
            if(this.container.x != oldx) {
                if(this.container.x < 0) {
                    this._pageNo++;
                }else{
                    this._pageNo--;
                }
            }            
        
            if(this.container.x <= 0) {
                for(let i=0;i<this._itemsInfo.length;i++) {
                    let item = this._getItemInfo(i+start, loop);
                    if(!item) {
                        continue;
                    }
                    rowNum++;

                    if(posx + item.width + this._columnGap >= -this.container.x) {
                        start = i;
                        break;
                    }

                    if(rowNum >= rowCount) {
                        posx += item.width + this._columnGap;
                        rowNum = 0;
                    }
                }
            }
            else {
                for(let i=this._itemsInfo.length-1;i>=0;i--) {
                    let item = this._getItemInfo(i+start, loop);
                    if(!item) {
                        continue;
                    }
                    rowNum++;

                    if(rowNum >= rowCount) {
                        posx = posx - item.width - this._columnGap;
                        rowNum = 0;
                        
                        if(posx < -this.container.x) {
                            start = i;
                            break;
                        }
                    }
                }  
            }
        }else{
            posx = 0;
        }


        let leftOffset = 0;
        if(this._virtual) {
            leftOffset = start * (this._estimateSize.width + this._columnGap);
            for(let c of this._itemsInfo) {
                if(c.view) {
                    PoolManager.inst.putByName(c.view.resourceUrl, c.view);
                    c.view = null;
                }
                break;
            }
            this.removeAllChildren();
        }

        let count = this._itemsInfo.length;
        let maxWidth = 0;
        rowNum = 0;

        for(let i=0;i<count;i++) {
            let idx = i+start;
            let item = this._getItemInfo(idx, loop);
            if(!item) {
                continue;
            }
            rowNum++;
            if(this._virtual) {
                item.view = this._createItem(idx);
                this.addChild(item.view);
                if(this.itemRenderer) {
                    this.itemRenderer(idx, item.view);
                }
            }

            let width = 0;
            let height = 0;
            if(item.computed) {
                width = item.width;
                height = item.height;
            }else{                
                height = item.view.height;
                width = item.view._initWidth;
                if(autoHeight) {
                    height = avgHeight;
                    if(autoWidth) {
                        width = avgWidth;
                    }else if(this._keepResizeAspect) {
                        width = (item.view._initWidth / item.view._initHeight) * height;
                    }
                }else{
                    height = item.view._initHeight;
                }
                
                item.width = width;
                item.height = height;
                item.computed = true;
            }
            item.view.setSize(width, height);

            maxWidth = Math.max(maxWidth,  width);
            if(rowNum >= rowCount ||
                autoHeight && posy + item.height > this.scrollRect.height) {
                rowNum = 0;              
                item.view.setXY(posx + leftOffset, posy);
                posx += maxWidth + this._columnGap;  
                posy = 0;
                maxWidth = 0;
            }else{     
                item.view.setXY(posx + leftOffset, posy);
                posy += item.height + this._rowGap;
            }

            if(this._virtual) {
                if(posx > this.scrollRect.width) {
                    break;
                }
            }
        }        
        
        this._startIndex = start;
        this._showCount = count;
        this.scrollPane.updateSize();
    }

    protected reconstruct() {  
        super.reconstruct();

        this.children.forEach(child => {
            child.removeClick(this._clickItem, this);
            child.onClick(this._clickItem, this);
        });
    }

    public addChildAt(child: View, index: number = 0): this {
        super.addChildAt(child, index);

        if (child instanceof UIButton) {
            child.selected = false;
            // child.changeStateOnClick = false;
        }
        child.removeClick(this._clickItem, this);
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