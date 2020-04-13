import { View } from "./View";
import { Container, Scene, Rectangle, Graphics } from "../phaser";
import { EDirtyType } from "./Defines";

export class ViewGroup extends View {
    protected _container: Container;
    protected _children: View[];  
    protected _bounds: Rectangle = new Rectangle(0, 0, 0, 0);

    /**debug */    
    private _gBounds: Graphics;

    bind(scene: Scene) {
        if(super.bind(scene)) {            
            this._container = new Container(scene);
            return true;
        }
        return false;
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
        this._children.splice(index, 1, child);

        if(child.inContainer) {
            let cnt = this._children.length;
            let displayIndex = 0;
            for(let i in this._children) {
                let c = this._children[i];
                if(c.inContainer) {
                    displayIndex++;
                }
            }
            if(cnt > 0 && displayIndex == cnt) {
                displayIndex--;
            }
            this._container.setChildIndex(child.rootContainer, displayIndex);
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

    public addChildAt(child: View, index: number = 0) {
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
    }

    public removeFromParent() {
        
    }

    public removeAllChildren(dispose?: boolean, toPool?: boolean) {
        let children = this._children.slice();
        for(let i=0;i<children.length;i++) {
            this.removeChild(children[i], dispose, toPool);
        }
        this._children = [];
        this.addDirty(EDirtyType.BoundsChanged); 
    }

    public removeChild(child: View, dispose?: boolean, toPool?: boolean): View {
        let childIndex: number = this._children.indexOf(child);
        if (childIndex >= 0) {
            return this.removeChildAt(childIndex, dispose, toPool);
        }

        return child;
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

            // if(child._gFrame) {
            //     child._gFrame.destroy();
            //     child._gFrame = null;
            // }

            // if(child._gBorder) {
            //     child._gBorder.destroy();
            //     child._gBorder = null;
            // }

            // if(child._gBounds) {
            //     child._gBounds.destroy();
            //     child._gBounds = null;
            // }

            this.addDirty(EDirtyType.BoundsChanged);
            
            return child;
        }

        throw new Error("Invalid child index");
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

        // if(this._scrollPane) {
        //     this._scrollPane.setContentSize(maxx, maxy);
        // }
    }   

    protected checkDirty() {
        if(this.withDirty(EDirtyType.BoundsChanged)) {
            this.updateBounds();
        }

        super.checkDirty();
    }
}