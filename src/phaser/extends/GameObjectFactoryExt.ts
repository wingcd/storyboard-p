
export class GameObjectFactoryExt {
    private _scene: any;

    constructor(scene: Phaser.Scene) {
        this._scene = scene;
    }

    richText(x:number, y:number, text: string, config?: any) {
        if(this._scene.add.rexBBCodeText) {
            this._scene.add.rexBBCodeText(x, y, text, config);
        }
    }
}