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

Phaser.Tweens.Timeline.prototype.calcDuration = function ()
{
    var prevEnd = 0;
    var totalDuration = 0;
    var offsetDuration = 0;

    var targets:any[] = [];
    for (var i = 0; i < this.totalData; i++)
    {
        var tween = this.data[i];
        tween.init();

        for(let t of tween.targets) {
            if(targets.indexOf(t) < 0) {
                t.____total_druation____ = 0;
                targets.push(t);
            }
        }

        if (this.hasOffset(tween))
        {
            if (this.isOffsetAbsolute(tween.offset))
            {
                //  An actual number, so it defines the start point from the beginning of the timeline
                tween.calculatedOffset = tween.offset;

                if (tween.offset === 0)
                {
                    offsetDuration = 0;
                }
            }
            else if (this.isOffsetRelative(tween.offset))
            {
                //  A relative offset (i.e. '-=1000', so starts at 'offset' ms relative to the PREVIOUS Tweens ending time)
                tween.calculatedOffset = this.getRelativeOffset(tween.offset, prevEnd);
            }
        }
        else
        {
            //  Sequential
            tween.calculatedOffset = offsetDuration;
        }

        prevEnd = tween.totalDuration + tween.calculatedOffset;

        // totalDuration += tween.totalDuration;
        offsetDuration += tween.totalDuration;

        for(let t of tween.targets) {
            t.____total_druation____ += tween.totalDuration;
        }
    }

    totalDuration = targets.reduce((maxvalue, current)=>{
        let vlaue = Math.max(maxvalue, current.____total_druation____);
        delete current.____total_druation____;
        return vlaue;
    }, 0);

    //  Excludes loop values
    this.duration = totalDuration;

    this.loopCounter = (this.loop === -1) ? 999999999999 : this.loop;

    if (this.loopCounter > 0)
    {
        this.totalDuration = this.duration + this.completeDelay + ((this.duration + this.loopDelay) * this.loopCounter);
    }
    else
    {
        this.totalDuration = this.duration + this.completeDelay;
    }
}

