let GameObjectFactory:any = Phaser.GameObjects.GameObjectFactory;
GameObjectFactory.register = function (factoryType:string, factoryFunction:Function)
{
    //if (!GameObjectFactory.prototype.hasOwnProperty(factoryType))
    {
        GameObjectFactory.prototype[factoryType] = factoryFunction;
    }
};
