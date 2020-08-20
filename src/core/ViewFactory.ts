import { ViewScene } from "./ViewScene";
import { IViewConfig, IViewGroupConfig, IUIImageConfig, IUITextFieldConfig, IUITextInputConfig, } from "../types";
import { View } from "./View";
import { ViewGroup } from "./ViewGroup";
import { UIImage } from "../ui/UIImage";
import { UITextInput } from "../ui/UITextInput";
import { UITextField } from "../ui/UITextField";

export interface IPrefab {
    id: number;
    view: IViewConfig;
}

export class ViewFactory {
    private static _TYPES: {[key: string]: Function} = {};

    private _scene: ViewScene;
    private _addToRoot: boolean;

    constructor(scene: ViewScene, addToRoot: boolean) {        
        this._scene = scene;
        this._addToRoot = addToRoot;
    }

    public static regist(viewType: Function) {
        let tName = (viewType as any).TYPE;
        if(tName) {
            ViewFactory._TYPES[tName] = viewType;
        }
    }

    private _add(cls: {new (scene:ViewScene):View}, config?:any, template?: any): View {
        let view = new cls(this._scene);
        view.fromJSON(config, template);
        if(this._addToRoot) {
            this._scene.root.addChild(view);
        }
        return view;
    }

    public view(config?:IViewConfig, template?: any): View {
        let type: any = ViewFactory._TYPES["view"];
        return this._add(type, config, template);
    }

    public group(config?:IViewGroupConfig, template?: any): ViewGroup {
        let type: any = ViewFactory._TYPES["group"];
        return this._add(type, config, template) as ViewGroup;
    }

    public image(config?: IUIImageConfig, template?: any): UIImage {
        let type: any = ViewFactory._TYPES["image"];
        return this._add(type, config, template) as UIImage;
    }

    public textfield(config?: IUITextFieldConfig, template?: any): UITextField {
        let type: any = ViewFactory._TYPES["textfield"];
        return this._add(type, config, template) as UITextField;
    }

    public textinput(config?: IUITextInputConfig, template?: any): UITextInput {
        let type: any = ViewFactory._TYPES["textinput"];
        return this._add(type, config, template) as UITextInput;
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

ViewFactory.regist(View);
ViewFactory.regist(ViewGroup);
ViewFactory.regist(Image);

ViewFactory.regist(UITextField);
ViewFactory.regist(UITextInput);