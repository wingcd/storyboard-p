Phaser.Tweens.TweenManager.prototype.getAllTweens = function ()
{
    var that = this as any;
    //add _add list to final list, so we can remove tween after after create it now
    var list = that._active.slice().concat(that._add);
    var output = [];

    for (var i = 0; i < list.length; i++)
    {
        output.push(list[i]);
    }

    return output;
};

Phaser.Tweens.TweenManager.prototype.getTweensOf = function (target: any)
{
    var that = this as any;
    //add _add list to final list, so we can remove tween after after create it now
    var list = that._active.slice().concat(that._add);
    var tween;
    var output = [];
    var i;

    if (Array.isArray(target))
    {
        for (i = 0; i < list.length; i++)
        {
            tween = list[i];

            for (var t = 0; t < target.length; t++)
            {
                if (tween.hasTarget(target[t]))
                {
                    output.push(tween);
                }
            }
        }
    }
    else
    {
        for (i = 0; i < list.length; i++)
        {
            tween = list[i];

            if (tween.hasTarget(target))
            {
                output.push(tween);
            }
        }
    }

    return output;
}

