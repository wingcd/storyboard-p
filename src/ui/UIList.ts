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
            loop: {importAs: "_loop", default: false},
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
    private _loop: boolean = false;

    private _updating = false;

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

    private _applyPageMode() {
        if(!this.scrollPane) {
            return;
        }

        this.scrollPane.pageMode = this._layoutType == EListLayoutType.Pagination;
    }

    private _applyLoop() {
        if(!this.scrollPane) {
            return;
        }

        this.scrollPane.loop = 0;
        if(this._loop) {
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

        this._update(true);
    }

    protected layout(focus?: boolean) {
        switch(this._layoutType) {
            case EListLayoutType.SingleColumn:
                this._layoutSingleColumn(focus);
                break;
            case EListLayoutType.SingleRow:
                this._layoutSingleRow(focus);
                break;
            case EListLayoutType.Pagination:
                this._layoutPage(focus);
                break;
        }
    }    

    private _layoutSingleRow(focus?: boolean) {
        let boundWidth = Math.max(this.bounds.width + this._columnGap, this.scrollRect.width);
        let posx= 0, posy = 0;
        if(this._loop && this.container2) {
            this.container2.y = this.container.y;
            if(this.container.x >= 0) {
                this.container2.x = this.container.x - boundWidth;
            }else {
                this.container2.x = this.container.x + boundWidth;
            }
            
            if(boundWidth > 0) {
                this.container.x %= boundWidth;
                this.container2.x %= boundWidth;
            }

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

        if(!focus && !this.needHRelayout()) {
            return;
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
        
        this.scrollPane.updateSize();
    }

    private _layoutSingleColumn(focus?: boolean) {
        let boundHeight = Math.max(this.bounds.height + this._rowGap, this.scrollRect.height);
        let posx= 0, posy = 0;
        if(this._loop && this.container2) {
            this.container2.x = this.container.x;
            if(this.container.y >= 0) {
                this.container2.y = this.container.y - boundHeight;
            }else {
                this.container2.y = this.container.y + boundHeight;
            }
            
            if(boundHeight > 0) {
                this.container.y %= boundHeight;
                this.container2.y %= boundHeight;
            }

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
            
            posx = posy = 0;
        }

        if(!focus && !this.needVRelayout()) {
            return;
        }

        for(let c of this.children) {
            c.x = posx;
            c.y = posy;
            let width = c.width;
            let height = c._initHeight;
            if(this._autoResizeItem) {
                width = this.scrollRect.width;
                if(this._keepResizeAspect) {
                    height = (c._initHeight / c._initWidth) * width;
                }
            }else{
                width = c._initWidth;
            }

            c.setSize(width, height);
            posy += c.height + this._rowGap;
        }
        
        this.scrollPane.updateSize();
    }

    private _layoutPage(focus?: boolean) {
        let sp = this.scrollPane;
        if(sp) {
            if(sp.scrollType == EScrollType.Horizontal) {
                this._layoutHorizontalPage(focus);
            } else if(sp.scrollType == EScrollType.Vertical) {
                this._layoutVerticalPage(focus);
            }
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

    private _layoutHorizontalPage(focus?: boolean) {        
        let boundWidth = Math.max(this.bounds.width + this._columnGap, this.scrollRect.width);     
        let posx= 0, posy = 0;
        if(this._loop && this.container2) {
            this.container2.y = this.container.y;
            if(this.container.x >= 0) {
                this.container2.x = this.container.x - boundWidth;
            }else {
                this.container2.x = this.container.x + boundWidth;
            }
            
            if(boundWidth > 0) {
                this.container.x %= boundWidth;
                this.container2.x %= boundWidth;
            }            

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

        if(!focus && !this.needHRelayout()) {
            return;
        }

        for(let c of this.children) {
            c.x = posx;
            c.y = posy;
            let width = this.scrollRect.width;
            let height = this.scrollRect.height;

            c.setSize(width, height);
            posx += c.width + this._columnGap;
        }     
        
        this.scrollPane.updateSize();
    }

    private _layoutVerticalPage(focus?: boolean) {
        let boundHeight = Math.max(this.bounds.height + this._rowGap, this.scrollRect.height); 
        let posx= 0, posy = 0;

        if(this._loop && this.container2) {
            this.container2.x = this.container.x;
            if(this.container.y >= 0) {
                this.container2.y = this.container.y - boundHeight;
            }else {
                this.container2.y = this.container.y + boundHeight;
            }
            
            if(boundHeight > 0) {
                this.container.y %= boundHeight;
                this.container2.y %= boundHeight;
            }

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

        if(!focus && !this.needVRelayout()) {
            return;
        }

        for(let c of this.children) {
            c.x = posx;
            c.y = posy;            
            let width = this.scrollRect.width;
            let height = this.scrollRect.height;

            c.setSize(width, height);
            posy += height + this._rowGap;
        }      
        
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