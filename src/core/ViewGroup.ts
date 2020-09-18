import { Container, Scene, Rectangle, Graphics, GeometryMask } from "../phaser";
import { EDirtyType, EOverflowType } from "./Defines";
import { Settings } from "./Setting";
import { ViewRoot } from "./ViewRoot";
import { ViewScene } from "./ViewScene";
import { PoolManager } from "../utils/PoolManager";
import { ScrollPaneComponent } from "../components/ScrollPaneComponent";
import { IComponent } from "../types/IComponent";
import { ISerializeInfo } from "../annotations/Serialize";
import { Deserialize } from "../utils/Serialize";
import { View } from "./View";

export class ViewGroup extends View {
    static TYPE = "group";

    static get SERIALIZABLE_FIELDS(): ISerializeInfo[] {
        let fields = View.SERIALIZABLE_FIELDS;
        fields.push(
            {property: "children",importAs: "_children",default: [], type: View},
        );
        return fields;
    }

    static DESERIALIZE_COMPLETED(source: any, target: any, tpl: any) {
        if(target instanceof ViewGroup) {
            target.reconstruct();
        }
    }

    protected _container: Container;
    protected _children: View[] = [];  
    protected _bounds: Rectangle = new Rectangle(0, 0, 0, 0);

    protected _overflowType: EOverflowType = EOverflowType.Visible;
    private _scrollPane: ScrollPaneComponent = null;

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
            this._container.width = this._width;
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
     * minimum bounds of all children's frame 
     */
    public get bounds(): Rectangle {
        this.checkDirty();
        return this._bounds;
    }

    public ensureBoundsCorrect(): this {
        if (this.withDirty(EDirtyType.BoundsChanged)) {
            this.updateBounds();
        }
        return this;
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
            this._gBounds = this._scene.make.graphics({});
            this._rootContainer.add(this._gBounds);
        }

        this._gBounds.clear();
        let rect = this.bounds;
        this._gBounds.lineStyle(2/Math.min(this.scaleX, this.scaleY), 0x00ff00, 1);
        this._gBounds.strokeRect(rect.x + this._container.x, rect.y + this._container.y, rect.width, rect.height); 
     
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
                child.parent = this;

                if(index == cnt){
                    this._children.push(child);
                }else{
                    this._children.splice(index,0,child);
                }

                this.childStateChanged(child);
                this.addDirty(EDirtyType.BoundsChanged | EDirtyType.DebugBoundsChanged | EDirtyType.DebugFrameChanged);
            }
        }else{
            throw new Error("Invalid child index");
        }

        return this;
    }

    public removeAllChildren(dispose?: boolean, toPool?: boolean): this {
        let children = this._children.slice();
        for(let i=0;i<children.length;i++) {
            this.removeChild(children[i], dispose, toPool);
        }
        this._children = [];
        this.addDirty(EDirtyType.BoundsChanged); 

        return this;
    }

    public removeChild(child: View, dispose?: boolean, toPool?: boolean): View {
        let childIndex: number = this._children.indexOf(child);
        if (childIndex >= 0) {
            return this.removeChildAt(childIndex, dispose, toPool);
        }

        return child;
    }

    _clear() {
        super._clear();

        if(this._gBounds) {
            this._gBounds.destroy();
            this._gBounds = null;
        }
    }

    public removeChildAt(index: number, dispose?: boolean, toPool?: boolean): View {
        if(index >= 0 && index < this._children.length) {
            let child = this._children[index];
            child._parent = null;

            this._children.splice(index, 1);
            if(child.inContainer) {
                this._container.remove(child.rootContainer);
            }

            if(dispose === true) {
                child.dispose(toPool);
            }

            this._clear();

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

    public dispose(toPool?: boolean) {
        super.dispose(toPool);

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

    // public clone(): View {        
    //     let obj = super.clone() as ViewGroup;    
    //     obj._buildingDisplayList = true;

    //     if(this._children) {
    //         this._children.forEach(child=>{
    //             let c = child.clone();
    //             obj.addChild(c);
    //         });
    //     }

    //     obj._buildingDisplayList = false;

    //     this.appendChildrenList();
        
    //     return obj;
    // }

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
        switch(this._overflowType) {
            case EOverflowType.Hidden:
                this._updateHideMask();
            break;
            case EOverflowType.Scroll:
                if(!this._scrollPane) {
                    this._scrollPane = this.getComponent(ScrollPaneComponent) as ScrollPaneComponent;
                    if(!this._scrollPane) {
                        this._scrollPane = this.addComponentByType(ScrollPaneComponent) as ScrollPaneComponent;
                    }
                }
            break;
            default:
                this._updateHideMask(true);
            break;
        }

        if(this._overflowType != EOverflowType.Scroll) {
            this.removeComponent(this._scrollPane);
        }
    }

    public set overflowType(val: EOverflowType) {
        if(val != this._overflowType) {
            this._overflowType = val;

            this.applyOverflow();
        }
    }

    private _updateHideMask(clear: boolean = false) {
        this.updateGraphicsMask(this._container, 0, 0, this.width, this.height, clear);
    }

    protected updateBorder() {
        super.updateBorder();

        this._container.width = this._width;
        this._container.height = this.height;
        if(this._overflowType == EOverflowType.Hidden) {
            this._updateHideMask();
        }
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

        if(dirty) {
            this.addDirty(EDirtyType.DebugBoundsChanged);
        }
    }

    protected updateComponents() {
        super.updateComponents();

        this._scrollPane = this.getComponent(ScrollPaneComponent) as ScrollPaneComponent;
    }

    protected reconstruct() {        
        for(let c of this._children) {
            c.parent = this;
        }        
        this.appendChildrenList();
        this.updateComponents();
        this.relayout();
    }
}