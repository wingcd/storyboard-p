import { ViewScene } from "./ViewScene";
import { View } from "./View";
import { ViewGroup } from "./ViewGroup";
import { ObjectFactory } from "./ObjectFactory";
import { ECategoryType } from "./Defines";

import { IViewConfig, IViewGroupConfig, IImageConfig, ITextFieldConfig, ITextInputConfig, 
    IButtonConfig, ILabelConfig, IScrollBarConfig, ISliderConfig, 
    IProgressBarConfig, IRichTextInputConfig, IListConfig, IGraphicConfig } from "../types";
    
import { Button,Label,RichTextField,ProgressBar,
    Slider,ScrollBar,Image,TextInput,TextField, List } from "../views";
import { Graphic } from "../views/Graphic";

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

    public image(config?: IImageConfig, template?: any): Image {
        let type: any = ViewFactory.getType("image");
        return this._add(type, config, template) as Image;
    }

    public textField(config?: ITextFieldConfig, template?: any): TextField {
        let type: any = ViewFactory.getType("textfield");
        return this._add(type, config, template) as TextField;
    }

    public richTextField(config?: IRichTextInputConfig, template?: any): RichTextField {
        let type: any = ViewFactory.getType("richtext");
        return this._add(type, config, template) as RichTextField;
    }

    public textInput(config?: ITextInputConfig, template?: any): TextInput {
        let type: any = ViewFactory.getType("textinput");
        return this._add(type, config, template) as TextInput;
    }

    public button(config?: IButtonConfig, template?: any): Button {
        let type: any = ViewFactory.getType("button");
        return this._add(type, config, template) as Button;
    }

    public label(config?: ILabelConfig, template?: any): Label {
        let type: any = ViewFactory.getType("label");
        return this._add(type, config, template) as Label;
    }

    public progressBar(config?: IProgressBarConfig, template?: any): ProgressBar {
        let type: any = ViewFactory.getType("progress");
        return this._add(type, config, template) as ProgressBar;
    } 

    public slider(config?: ISliderConfig, template?: any): Slider {
        let type: any = ViewFactory.getType("slider");
        return this._add(type, config, template) as Slider;
    } 

    public scrollBar(config?: IScrollBarConfig, template?: any): ScrollBar {
        let type: any = ViewFactory.getType("scrollbar");
        return this._add(type, config, template) as ScrollBar;
    } 

    public list(config?: IListConfig, template?: any): List {
        let type: any = ViewFactory.getType("list");
        return this._add(type, config, template) as List;
    } 

    public graphic(config?: IGraphicConfig, template?: any): Graphic {
        let type: any = ViewFactory.getType("graphic");
        return this._add(type, config, template) as Graphic;
    } 

    public createByName(viewType: string, config?: IGraphicConfig, template?: any): View {
        let type: any = ViewFactory.getType(viewType);
        if(!type) {
            throw new Error(`not regist view type:${type}!`);
        }

        return this._add(type, config, template);
    }

    public create(config?: any, template?: any): View {
        let viewType = (config ? config.__type__ : null) || (template ? template.__type__ : null);
        if(!viewType) {
            throw new Error("must be with view type to create instance!");
        }

        return this.createByName(viewType, config, template);
    }
}

ViewFactory.regist(View);
ViewFactory.regist(ViewGroup);
ViewFactory.regist(Image);
ViewFactory.regist(Button);
ViewFactory.regist(Label);
ViewFactory.regist(ProgressBar);
ViewFactory.regist(Slider);
ViewFactory.regist(ScrollBar);

ViewFactory.regist(TextField);
ViewFactory.regist(RichTextField);
ViewFactory.regist(TextInput);
ViewFactory.regist(List);
ViewFactory.regist(Graphic);