function searchAllInputChildren(result: any[], gameObject: Phaser.GameObjects.GameObject,  camera: Phaser.Cameras.Scene2D.Camera, dropZone: boolean = false) {
    let go = gameObject as any;
    if(go.list) {
        for(let gi in go.list) {
            let g = go.list[gi];
            if(g.input && (g.input.enabled || g.input.alwaysEnabled && gameObject.willRender(camera)) && (!dropZone || dropZone && g.input.dropZone)) {
                result.push(g);
            }

            if(g.list) {
                searchAllInputChildren(result, g, camera, dropZone);
            }
        }
    }
}

/**
 * 主要修复父节点有Input时并且子节点超出范围后还能继续响应事件的问题
 */
Phaser.Input.InputManager.prototype.hitTest = function (pointer, gameObjects, camera, output)
{
    let that: any = this;
    let thatCamera: any = camera;

    if (output === undefined) { output = that._tempHitTest; }

    var tempPoint = that._tempPoint;

    var csx = camera.scrollX;
    var csy = camera.scrollY;

    output.length = 0;

    var x = pointer.x;
    var y = pointer.y;

    if (camera.resolution !== 1)
    {
        x += thatCamera._x;
        y += thatCamera._y;
    }

    //  Stores the world point inside of tempPoint
    camera.getWorldPoint(x, y, tempPoint);

    pointer.worldX = tempPoint.x;
    pointer.worldY = tempPoint.y;

    var point = { x: 0, y: 0 };

    var matrix = that._tempMatrix;
    var parentMatrix = that._tempMatrix2;

    var ignores :any[] = [];
    for (var i = 0; i < gameObjects.length; i++)
    {
        var gameObject = gameObjects[i];

        // 过滤父节点都没通过的子节点
        if(ignores.indexOf(gameObject) >= 0) {
            continue;
        }

        //  Checks if the Game Object can receive input (isn't being ignored by the camera, invisible, etc)
        //  and also checks all of its parents, if any
        if (!that.inputCandidate(gameObject, camera))
        {         
            continue;
        }

        var px = tempPoint.x + (csx * gameObject.scrollFactorX) - csx;
        var py = tempPoint.y + (csy * gameObject.scrollFactorY) - csy;

        if (gameObject.parentContainer)
        {
            gameObject.getWorldTransformMatrix(matrix, parentMatrix);

            matrix.applyInverse(px, py, point);
        }
        else
        {
            Phaser.Math.TransformXY(px, py, gameObject.x, gameObject.y, gameObject.rotation, gameObject.scaleX, gameObject.scaleY, point);
        }

        if (this.pointWithinHitArea(gameObject, point.x, point.y) )
        {
            output.push(gameObject);
        }
        else if(gameObject.list && gameObject.input.___filter_input__)
        {
            //temp close child input
            searchAllInputChildren(ignores, gameObject, camera, false);
        }
    }

    return output;
};