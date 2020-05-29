let GameObjectCreator:any = Phaser.GameObjects.GameObjectCreator;
GameObjectCreator.register = function (factoryType:string, factoryFunction:Function)
{
    //if (!GameObjectCreator.prototype.hasOwnProperty(factoryType))
    {
        GameObjectCreator.prototype[factoryType] = factoryFunction;
    }
};
