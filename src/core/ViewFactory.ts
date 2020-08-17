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
    private static _TYPES: {[key: string]: Function} = {};

    private _scene: ViewScene;
    private _addToRoot: boolean;

    constructor(scene: ViewScene, addToRoot: boolean) {        
        this._scene = scene;
        this._addToRoot = addToRoot;

        ViewFactory.regist(View);
        ViewFactory.regist(ViewGroup);
    }

    public static regist(viewType: Function) {
        ViewFactory._TYPES[(viewType as any).TYPE] = viewType;
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

    public create(config?: any, template?: any): View {
        if(!config || !config.type) {
            throw new Error("must be with view type to create instance!");
        }

        let type: any = ViewFactory._TYPES[config.type];
        if(!type) {
            throw new Error(`not regist view type:${type}!`);
        }

        return this._add(type, config, template);
    }
}