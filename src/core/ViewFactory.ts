import { Scene } from "../phaser";
import { View, IView } from "./View";
import { ViewGroup, IViewGroup } from "./ViewGroup";
import { ViewScene } from "./ViewScene";
import { UIImage, IUIImage } from "../ui/UIImage";
import { ITextField, UITextField } from "../ui/UITextField";
import { ITextInput, UITextInput } from "../ui/UITextInput";

export interface IPrefab {
    id: number;
    view: IView;
}

export class ViewFactory {
    private _scene: ViewScene;
    private _addToRoot: boolean;

    constructor(scene: ViewScene, addToRoot: boolean) {        
        this._scene = scene;
        this._addToRoot = addToRoot;
    }

    private _add(cls: {new (scene:ViewScene):View}, config?:any, template?: any): View {
        let view = new cls(this._scene);
        view.fromJSON(config, template);
        if(this._addToRoot) {
            this._scene.root.addChild(view);
        }
        return view;
    }

    public view(config?:any, template?: any): View {
        return this._add(View, config, template);
    }

    public group(config?:any, template?: any): ViewGroup {
        return this._add(ViewGroup, config, template) as ViewGroup;
    }

    public image(config?:IUIImage, template?: any): UIImage {
        return this._add(UIImage, config, template) as UIImage;
    }

    public textfield(config?: ITextField, template?: any): UITextField {
        return this._add(UITextField, config, template) as UITextField;
    }

    public textinput(config?: ITextInput, template?: any): UITextInput {
        return this._add(UITextInput, config, template) as UITextInput;
    }
}