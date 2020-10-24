import { ViewScene } from "./ViewScene";
import { View } from "./View";
import { ViewGroup } from "./ViewGroup";
import { ObjectFactory } from "./ObjectFactory";
import { ECategoryType } from "./Defines";

import { IViewConfig, IViewGroupConfig, IUIImageConfig, IUITextFieldConfig, IUITextInputConfig, 
    IUIButtonConfig, IUILabelConfig, IUIScrollBarConfig, IUISliderConfig, 
    IUIProgressBarConfig, IUIRichTextInputConfig, IUIListConfig } from "../types";
    
import { UIButton,UILabel,UIRichTextField,UIProgressBar,
    UISlider,UIScrollBar,UIImage,UITextInput,UITextField, UIList } from "../ui";

export interface IPrefab {
    id: number;
    view: IViewConfig;
}

export class ViewFactory {
    // private static getType: {[key: string]: Function} = {};

    private _scene: ViewScene;
    private _addToRoot: boolean;

    constructor(scene: ViewScene, addToRoot: boolean) {        
        this._scene = scene;
        this._addToRoot = addToRoot;
    }

    public static getType(typeName: string): Function {
       return ObjectFactory.get(ECategoryType.UI, typeName);
    }

    public static regist(viewType: Function) {
        let tName = (viewType as any).TYPE;
        if(tName) {
            ObjectFactory.regist(ECategoryType.UI, tName, viewType);
        }
    }

    private _add(cls: {new (scene:ViewScene, config?:any, template?:any):View}, config?:any, template?: any): View {
        let view = new cls(this._scene);
        view.init(config, template);
        if(this._addToRoot) {
            this._scene.root.addChild(view);
        }else{
            view.setRoot(this._scene.root);
        }
        return view;
    }

    public view(config?:IViewConfig, template?: any): View {
        let type: any = ViewFactory.getType("view");
        return this._add(type, config, template);
    }

    public group(config?:IViewGroupConfig, template?: any): ViewGroup {
        let type: any = ViewFactory.getType("group");
        return this._add(type, config, template) as ViewGroup;
    }

    public image(config?: IUIImageConfig, template?: any): UIImage {
        let type: any = ViewFactory.getType("image");
        return this._add(type, config, template) as UIImage;
    }

    public textField(config?: IUITextFieldConfig, template?: any): UITextField {
        let type: any = ViewFactory.getType("textfield");
        return this._add(type, config, template) as UITextField;
    }

    public richTextField(config?: IUIRichTextInputConfig, template?: any): UIRichTextField {
        let type: any = ViewFactory.getType("richtext");
        return this._add(type, config, template) as UIRichTextField;
    }

    public textInput(config?: IUITextInputConfig, template?: any): UITextInput {
        let type: any = ViewFactory.getType("textinput");
        return this._add(type, config, template) as UITextInput;
    }

    public button(config?: IUIButtonConfig, template?: any): UIButton {
        let type: any = ViewFactory.getType("button");
        return this._add(type, config, template) as UIButton;
    }

    public label(config?: IUILabelConfig, template?: any): UILabel {
        let type: any = ViewFactory.getType("label");
        return this._add(type, config, template) as UILabel;
    }

    public progressBar(config?: IUIProgressBarConfig, template?: any): UIProgressBar {
        let type: any = ViewFactory.getType("progress");
        return this._add(type, config, template) as UIProgressBar;
    } 

    public slider(config?: IUISliderConfig, template?: any): UISlider {
        let type: any = ViewFactory.getType("slider");
        return this._add(type, config, template) as UISlider;
    } 

    public scrollBar(config?: IUIScrollBarConfig, template?: any): UIScrollBar {
        let type: any = ViewFactory.getType("scrollbar");
        return this._add(type, config, template) as UIScrollBar;
    } 

    public list(config?: IUIListConfig, template?: any): UIList {
        let type: any = ViewFactory.getType("list");
        return this._add(type, config, template) as UIList;
    } 

    public create(config?: any, template?: any): View {
        let viewType = (config ? config.__type__ : null) || (template ? template.__type__ : null);
        if(!viewType) {
            throw new Error("must be with view type to create instance!");
        }

        let type: any = ViewFactory.getType(viewType);
        if(!type) {
            throw new Error(`not regist view type:${type}!`);
        }

        return this._add(type, config, template);
    }
}

ViewFactory.regist(View);
ViewFactory.regist(ViewGroup);
ViewFactory.regist(UIImage);
ViewFactory.regist(UIButton);
ViewFactory.regist(UILabel);
ViewFactory.regist(UIProgressBar);
ViewFactory.regist(UISlider);
ViewFactory.regist(UIScrollBar);

ViewFactory.regist(UITextField);
ViewFactory.regist(UIRichTextField);
ViewFactory.regist(UITextInput);
ViewFactory.regist(UIList);