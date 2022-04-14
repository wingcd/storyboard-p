import { IView, IViewConfig } from "../IView";

export interface IMovieClipConfig extends IViewConfig {
    
}

export interface IMovieClip extends IView, IMovieClipConfig{

}