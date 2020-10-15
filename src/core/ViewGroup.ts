import { Container, Rectangle, Graphics, Point } from "../phaser";
import { EDirtyType, EOverflowType } from "./Defines";
import { Settings } from "./Setting";
import { ViewRoot } from "./ViewRoot";
import { ViewScene } from "./ViewScene";
import { ScrollPaneComponent } from "../components/ScrollPaneComponent";
import { ISerializeFields, IViewGroup } from "../types";
import { View } from "./View";
import { Margin } from "../utils/Margin";

export class ViewGroup extends View implements IViewGroup{
    static TYPE = "group";

    static SERIALIZABLE_FIELDS: ISerializeFields = Object.assign(
        {},
        View.SERIALIZABLE_FIELDS,
        {
            overflowType: {importAs: "_overflowType", default: EOverflowType.Visible},
            opaque: {property: "opaque",importAs: "_opaque",default: true},
            children: {importAs: "_children",default: [], type: View, keepArray: true},
            margin: {importAs: "_margin", type: Margin},
        }
    );

    private _opaque: boolean = true;
    private _overflowType: EOverflowType = EOverflowType.Visible;
    private _children: View[] = []; 
    private _margin: Margin = new Margin();
    
    private _alignOffset: Point = new Point();
    private _scrollRect: Rectangle = new Rectangle();
    private _scrollOffsetSize: Point = new Point();

    private _scrollContainer: Container;
    private _container: Container;
    private _bounds: Rectangle = new Rectangle(0, 0, 100, 100);
    private _scrollPane: ScrollPaneComponent = null;

    private _batchProcessing = false;
    /**debug */    
    private _gBounds: Graphics;
    private _buildingDisplayList: boolean = false;

    constructor(scene: ViewScene) {
        super(scene);
    }

    protected bind(scene: ViewScene): boolean {
        if(super.bind(scene)) {            
            this._container = scene.make.container({}, false);
            this.setDisplayObject(this._container);
            this._container.width = this.width;
            this._container.height = this.height;
            return true;
        }
        return false;
    }

    /**@internal */
    get container(): Container {
        return this._container;
    }    

    /**
     * @description if enable touch in empty area, default is false
     */
    public get opaque(): boolean {
        return this._opaque;
    }

    public set opaque(value: boolean) {
        if (this._opaque != value) {
            this._opaque = value;
            this.applyHitArea();
        }
    }    

    protected applyHitArea() {
        super.applyHitArea();

        (this.rootContainer as any).___filter_input__ = !this.touchable;
        if(this.rootContainer.input && this.rootContainer.input.enabled) {
            // 是否把自身过滤掉
            (this.rootContainer.input as any).___filter_self__ = !this._opaque && !this.enableBackground && this._overflowType != EOverflowType.Scroll;
        }
    }

    /**
     * minimum bounds of all children's frame 
     */
    public get bounds(): Rectangle {
        this.checkDirty();
        return this._bounds;
    }

    public ensureAllCorrect() {
        super.ensureAllCorrect();
        this.ensureBoundsCorrect();
    }

    public ensureBoundsCorrect(): this {
        if (this.withDirty(EDirtyType.BoundsChanged)) {
            this.updateBounds();
        }
        return this;
    }

    handleGrayedChanged() {
        super.handleGrayedChanged();
        
        this._children.forEach(child=>{
            child.handleGrayedChanged(this.grayed);
        });
    }

    /**@internal */
    private showBounds() {
        if(!Settings.showDebugBounds) {
            if(this._gBounds) {
                this._gBounds.destroy();
                this._gBounds = null;
            }
            return;
        }
        
        if(!this.withDirty(EDirtyType.DebugBoundsChanged)){
            return;
        }   

        if(!this._gBounds) {
            this._gBounds = this.scene.make.graphics({});
            this.rootContainer.add(this._gBounds);
        }

        this._gBounds.clear();
        let rect = this.bounds;
        this._gBounds.lineStyle(2/Math.min(this.scaleX, this.scaleY), 0x00ff00, 1);
        this._gBounds.strokeRect(rect.x + this._container.x + this._scrollRect.x, rect.y + this._container.y + this._scrollRect.y, rect.width, rect.height); 
     
        this.removeDirty(EDirtyType.DebugBoundsChanged);   
    }

    public onGizmos() {
        super.onGizmos();

        if(this.finalVisible) {
            this.showBounds();
        }

        this._children.forEach(child=>{
            child.onGizmos();
        });
    }

    onUpdate(time: number, delta: number) {
        super.onUpdate(time, delta);      

        this._children.forEach(child=>{
            if(this.finalVisible) {
                child.onUpdate(time, delta);
            }
        });
    }

    public get children(): View[] {
        return this._children;
    }

    protected _setChildIndex(child: View, oldIndex: number, index: number = 0): number {
        let cnt = this._children.length;
        index = Math.min(cnt, index);

        if(oldIndex == index) {
            return index;
        }

        this._children.splice(oldIndex, 1);
        this._children.splice(index, 0, child);

        if(child.inContainer) {
            let cnt = this._children.length;
            let displayIndex = 0;
            for(let i in this._children) {
                let c = this._children[i];
                if(c.inContainer) {
                    if(c != child) {
                        displayIndex++;
                    }else{
                        break;
                    }
                }
            }
            if(cnt > 0 && displayIndex == cnt) {
                displayIndex--;
            }
            
            this._container.remove(child.rootContainer);
            this._container.addAt(child.rootContainer, displayIndex);
        }
    }

    public setChildIndex(child: View, index: number = 0): number {
        let oldIndex = this._children.indexOf(child);
        if(oldIndex < 0) {
            throw new Error("no such child found");
        }

        return this._setChildIndex(child, oldIndex, index);
    }

    public setChildIndexBefore(child: View, index: number): number {
        let oldIndex = this._children.indexOf(child);
        if(oldIndex < 0) {
            throw new Error("no such child found");
        }

        return this._setChildIndex(child, oldIndex, index - (oldIndex < index ? 1 : 0));
    }

    public childStateChanged(child: View): this {
        if(this._buildingDisplayList) {
            return this;
        }

        if(child.finalVisible) {
            if(!child.inContainer) {
                let index = 0;
                for(let i=0;this._children.length;i++) {
                    let c = this._children[i];
                    if(c == child) {
                        break;
                    }

                    if(c.inContainer) {
                        index++;
                    }
                } 
                this._container.addAt(child.rootContainer, index);
            }
        }else{
            this._container.remove(child.rootContainer);
        }

        return this;
    }

    setRoot(root: ViewRoot): this {
        super.setRoot(root);

        for(let c of this._children) {
            c.setRoot(root);
        }

        return this;
    }

    public addChild(child: View): this {
        this.addChildAt(child, this.children.length);
        return this;
    }

    public addChildAt(child: View, index: number = 0): this {
        if (!child || child == this) {
            throw new Error("Invalid child");
        }

        let cnt = this._children.length;
        if(index >= 0 && index <= cnt) {
            if(child.parent == this) {
                this.setChildIndex(child, index);
            }else{
                child.clearParent();

                if(index == cnt){
                    this._children.push(child);
                }else{
                    this._children.splice(index,0,child);
                }

                this.childStateChanged(child);
                
                child.parent = this;

                this.addDirty(EDirtyType.BoundsChanged | EDirtyType.DebugBoundsChanged | EDirtyType.DebugFrameChanged);

                this.onChildrenChanged();

                // 子节点位置会发生改变，需要刷新mask位置
                child.updateMask();
            }
        }else{
            throw new Error("Invalid child index");
        }

        return this;
    }

    public removeAllChildren(dispose?: boolean): this {
        this._batchProcessing = true;
        let children = this._children.slice();
        for(let i=0;i<children.length;i++) {
            this.removeChild(children[i], dispose);
        }
        this._children = [];
        this.addDirty(EDirtyType.BoundsChanged);
        this.onChildrenChanged();
        this._batchProcessing = false;
        return this;
    }

    public removeChild(child: View, dispose?: boolean): View {
        let childIndex: number = this._children.indexOf(child);
        if (childIndex >= 0) {
            let ret = this.removeChildAt(childIndex, dispose);
            if(!this._batchProcessing) {
                this.onChildrenChanged();
            }
            return ret;
        }

        return child;
    }

    protected clear() {
        super.clear();

        if(this._gBounds) {
            this._gBounds.destroy();
            this._gBounds = null;
        }
    }

    public removeChildAt(index: number, dispose?: boolean): View {
        if(index >= 0 && index < this._children.length) {
            let child = this._children[index];
            child.clearParent();

            this._children.splice(index, 1);
            if(child.inContainer) {
                this._container.remove(child.rootContainer);
            }

            if(dispose === true) {
                child.dispose();
            }

            this.clear();

            this.addDirty(EDirtyType.BoundsChanged);
            
            return child;
        }

        throw new Error("Invalid child index");
    }    

    public get numChildren(): number {
        return this._children.length;
    }

    public getChildAt(index: number = 0): View {
        if (index >= 0 && index < this._children.length)
            return this._children[index];
        else
            throw new Error("Invalid child index");
    }

    public getChild(name: string): View {
        let cnt: number = this._children.length;
        for (let i: number = 0; i < cnt; ++i) {
            if (this._children[i].name == name)
                return this._children[i];
        }
        return null;
    }

    public getChildIndex(child: View): number {
        return this._children.indexOf(child);
    }

    public getChildById(id: string): View {
        return this._children.find(c=>{
            return c.id == id;
        });
    }

    protected updateBounds() {
        if(this._children.length == 0) {  
            this._bounds.x = this._bounds.y = 0;
            this._bounds.width = this._bounds.height = 0; 
            return;
        }

        let minx = Number.POSITIVE_INFINITY, 
            miny = Number.POSITIVE_INFINITY, 
            maxx = Number.NEGATIVE_INFINITY, 
            maxy = Number.NEGATIVE_INFINITY;

        this._children.forEach(child=>{
            if(child.visible || (!child.visible && !child.hiddenCollapsed)) {
                child.ensureSizeCorrect();

                let frame = child.frame;
                minx = Math.min(minx, frame.x);
                miny = Math.min(miny, frame.y);
                maxx = Math.max(maxx, frame.x + frame.width);
                maxy = Math.max(maxy, frame.y + frame.height);
            }
        });

        this._bounds.x = minx;
        this._bounds.y = miny;
        this._bounds.width = maxx - minx;
        this._bounds.height = maxy - miny;

        this.removeDirty(EDirtyType.BoundsChanged);

        if(this._scrollPane) {
            this._scrollPane.setContentSize(maxx, maxy);
        }
    }   

    public dispose() {
        super.dispose();

        this._children.forEach(c=>{
            c.dispose();
        })
        this._children.length = 0;

        if(this._gBounds) {
            this._gBounds.destroy();
            this._gBounds = null;
        }
    }

    protected checkDirty() {
        if(this.withDirty(EDirtyType.BoundsChanged)) {
            this.updateBounds();
        }

        super.checkDirty();
    }

    public set tint(value: number) {
        if(this.tint != value) {
            super.tint = value;
            for(let c of this._children) {
                c.tint = value;
            }
        }
    }

    /**
     * @internal
     */
    appendChildrenList():void {
        this._container.removeAll();
        this._children.forEach(child => {
            if ((child.displayObject || 
                child.enableBackground || 
                child instanceof ViewGroup && child.children.length > 0) && 
                child.finalVisible) {
                this._container.add(child.rootContainer);
            }
        }, this);
        this._container.sort('depth'); 
    }  

    public get overflowType() {
        return this._overflowType;
    }

    public get scrollPane(): ScrollPaneComponent {
        return this._scrollPane;
    }    

    protected applyOverflow() {
        let filterInput = false;

        switch(this._overflowType) {
            case EOverflowType.Hidden:
                filterInput = true;
                this._updateHideMask();
            break;
            case EOverflowType.Scroll:
                if(!this._scrollPane) {
                    this._scrollPane = this.getComponent(ScrollPaneComponent) as ScrollPaneComponent;
                    if(!this._scrollPane) {
                        this._scrollPane = this.addComponentByType(ScrollPaneComponent) as ScrollPaneComponent;
                    }
                }

                if(!this._scrollContainer) {
                    this._scrollContainer = this.scene.make.container({});
                    this.rootContainer.add(this._scrollContainer);
                    this._scrollContainer.add(this._container);

                    this._scrollContainer.setPosition(this._scrollRect.x, this.scrollRect.y);
                    this._scrollContainer.setSize(this._scrollRect.width, this._scrollRect.height);

                    this._container.setPosition(0, 0);
                }

                filterInput = true;
                this._updateHideMask();
            break;
            default:
                this._updateHideMask(true);
            break;
        }

        if(this._overflowType != EOverflowType.Scroll) {
            this.removeComponent(this._scrollPane);

            if(this._scrollContainer) {
                this.rootContainer.add(this._container);
                this._scrollContainer.destroy();
                this._scrollContainer = null;
            }
        }
            
        this.applyHitArea();
        if(this.rootContainer.input) {
            // 是否通过父节点input过滤子节点的input
            (this.rootContainer.input as any).___filter_input__ = filterInput;
        }
    }

    public set overflowType(val: EOverflowType) {
        if(val != this._overflowType) {
            this._overflowType = val;

            this.applyOverflow();
        }
    }  

    public updateMask() {
        super.updateMask();

        for(let c of this._children) {
            c.updateMask();
        }

        this._container.width = this._scrollRect.width;
        this._container.height = this._scrollRect.height;
        this.updateHideMask();
    }

    private updateHideMask() {
        if(this._overflowType == EOverflowType.Hidden || this._overflowType == EOverflowType.Scroll) {
            this._updateHideMask();
        }
    }

    private _updateHideMask(clear: boolean = false) {
        let scale = this.getLossyScale();
        this.updateGraphicsMask(this._container, this._scrollRect.x, this._scrollRect.y,
                                (this.width - this._margin.left - this._margin.right + this._scrollOffsetSize.x) * scale.x, 
                                (this.height - this._margin.top - this._margin.bottom + this._scrollOffsetSize.y) * scale.y, clear);
    }

    /**@internal */
    get alignOffset(): Point {
        return this._alignOffset;
    }

    set alignOffset(val: Point) {
        if(val.x != this._alignOffset.x || val.y != this._alignOffset.y) {
            this._alignOffset.setTo(val.x, val.y);            
            this.updateScrollRect();
            this.handleSizeChanged();
        }
    }

    /**@internal */
    get scrollRect(): Rectangle {
        return this._scrollRect;
    }

     /**@internal */
    set scrollOffsetSize(val: Point) {
        if(val.x != this._scrollOffsetSize.x ||
            val.y != this._scrollOffsetSize.y) {
            this._scrollOffsetSize.setTo(val.x, val.y);
            this.handleSizeChanged();
        }
    }

     /**@internal */
    get scrollOffsetSize(): Point {
        return this._scrollOffsetSize;
    }

    public get margin(): Margin {
        return this._margin;
    }

    public set margin(val: Margin) {
        if(!this._margin.equal(val)) {
            this._margin.copy(val);
            this.updateScrollRect();
            this.handleSizeChanged();
        }
    }

    protected updateScrollRect() {
        if(this._scrollPane && this._scrollPane.displayOnLeft) {
            this._scrollRect.setTo(
                this._margin.left + this._alignOffset.x - this._scrollOffsetSize.x,
                this._margin.top + this._alignOffset.y, 
                this.width - this._margin.left - this._margin.right + this._scrollOffsetSize.x, 
                this.height - this._margin.top - this._margin.bottom + this._scrollOffsetSize.y);
        }else{
            this._scrollRect.setTo(
                this._margin.left + this._alignOffset.x, 
                this._margin.top + this._alignOffset.y, 
                this.width - this._margin.left - this._margin.right + this._scrollOffsetSize.x, 
                this.height - this._margin.top - this._margin.bottom + this._scrollOffsetSize.y);
        }
        
        this.updateScollContainer();
    }

    private updateScollContainer(){
        if(this._scrollContainer) {
            this._scrollContainer.x = this._scrollRect.x;
            this._scrollContainer.y = this._scrollRect.y;
            this._scrollContainer.width = this._scrollRect.width;
            this._scrollContainer.height = this._scrollRect.height;
        }else{
            this._container.x = this._scrollRect.x;
            this._container.y = this._scrollRect.y;
            this._container.width = this._scrollRect.width;
            this._container.height = this._scrollRect.height;
        }
    }
    
    protected handleSizeChanged() {
        super.handleSizeChanged();

        this.updateScrollRect();
        if(this._scrollPane) {
            this._scrollPane.onOwnSizeChanged();
        }
        this.applyHitArea();
    }

    /**@internal */
    scrollTo(x?: number, y?: number) {
        let dirty = false;
        if(this._container.x != x && x != null && x != undefined) {
            this._container.x = x;
            dirty = true;
        }

        if(this._container.y != y && y != null && y != undefined) {
            this._container.y = y;
            dirty = true;
        }

        this.updateMask();
        if(dirty) {
            this.addDirty(EDirtyType.DebugBoundsChanged);
        }
    }

    protected onComponentChanged() {
        super.onComponentChanged();
        this._scrollPane = this.getComponent(ScrollPaneComponent) as ScrollPaneComponent;
    }

    protected onChildrenChanged() {

    }

    protected relayout() {
        super.relayout();

        this.applyOverflow();
    }

    protected reconstruct() {        
        for(let c of this._children) {
            c.parent = this;
        }        

        this.setDefaultValues();
        this.appendChildrenList();
        this.relayout();
        this.updateComponents();

        for(let c of this._children) {
            c.relations.focusUpdateOwner(c);
        }
        this.onChildrenChanged();       
        
        this.updateScrollRect();
    }
}