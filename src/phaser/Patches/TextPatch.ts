import { MathUtils } from "../../utils/Math";
import * as code from '../../libs/hanzi/code';
import { isCJK } from '../../libs/hanzi/isCJK';
var GetAdvancedValue = Phaser.Utils.Objects.GetAdvancedValue;
var GetValue = Phaser.Utils.Objects.GetValue;

var propertyMap:any = {
    fontFamily: [ 'fontFamily', 'Courier' ],
    fontSize: [ 'fontSize', '16px' ],
    fontStyle: [ 'fontStyle', '' ],
    backgroundColor: [ 'backgroundColor', null ],
    color: [ 'color', '#fff' ],
    stroke: [ 'stroke', '#fff' ],
    strokeThickness: [ 'strokeThickness', 0 ],
    shadowOffsetX: [ 'shadow.offsetX', 0 ],
    shadowOffsetY: [ 'shadow.offsetY', 0 ],
    shadowColor: [ 'shadow.color', '#000' ],
    shadowBlur: [ 'shadow.blur', 0 ],
    shadowStroke: [ 'shadow.stroke', false ],
    shadowFill: [ 'shadow.fill', false ],
    align: [ 'align', 'left' ],
    maxLines: [ 'maxLines', 0 ],
    fixedWidth: [ 'fixedWidth', 0 ],
    fixedHeight: [ 'fixedHeight', 0 ],
    resolution: [ 'resolution', 0 ],
    rtl: [ 'rtl', false ],
    testString: [ 'testString', '|MÃ‰qgy' ],
    baselineX: [ 'baselineX', 1.2 ],
    baselineY: [ 'baselineY', 1.4 ],
    wordWrapWidth: [ 'wordWrap.width', null ],
    wordWrapCallback: [ 'wordWrap.callback', null ],
    wordWrapCallbackScope: [ 'wordWrap.callbackScope', null ],
    wordWrapUseAdvanced: [ 'wordWrap.useAdvancedWrap', false ]
};

var GetTextSizeHorizontal = function (text: Phaser.GameObjects.Text, size:Phaser.Types.GameObjects.Text.TextMetrics, lines: string[])
{
    var canvas = text.canvas;
    var context = text.context;
    var style = text.style;

    var lineWidths = [];
    var maxLineWidth = 0;
    var drawnLines = lines.length;

    if (style.maxLines > 0 && style.maxLines < lines.length)
    {
        drawnLines = style.maxLines;
    }

    style.syncFont(canvas, context);

    //  Text Width

    for (var i = 0; i < drawnLines; i++)
    {
        var lineWidth = style.strokeThickness;

        lineWidth += context.measureText(lines[i]).width;

        // Adjust for wrapped text
        if ((style as any).wordWrap)
        {
            lineWidth -= context.measureText(' ').width;
        }

        lineWidths[i] = Math.ceil(lineWidth);
        maxLineWidth = Math.max(maxLineWidth, lineWidths[i]);
    }

    //  Text Height

    var lineHeight = size.fontSize + style.strokeThickness;
    var height = lineHeight * drawnLines;
    var lineSpacing = text.lineSpacing;

    //  Adjust for line spacing
    if (drawnLines > 1)
    {
        height += lineSpacing * (drawnLines - 1);
    }

    return {
        width: maxLineWidth,
        height: height,
        lines: drawnLines,
        lineWidths: lineWidths,
        lineSpacing: lineSpacing,
        lineHeight: lineHeight
    };
}

type CharInfo  = {
    width: number,
    height: number,
    char: string,
    rotate: boolean,
};

type VerticalLine = {
    text: string,
    charInfo: CharInfo[],
    height: number,
};

type VerticalLineInfo = {
    text: string,
    style: Phaser.GameObjects.TextStyle,
    width: number,
    height: number,
    lines: string[],
    lineInfo: VerticalLine[],
    lineWidth: number,
    fontProperties: Phaser.Types.GameObjects.Text.TextMetrics,
};

var GetTextSizeVertical = function (text: Phaser.GameObjects.Text, size:Phaser.Types.GameObjects.Text.TextMetrics, lines: string[])
{
    var canvas = text.canvas;
    var context = text.context;

    var style: any = text.style;

    var maxLineHeight = 0;
    var drawnLines = lines.length;
    var lineSpacing = text.lineSpacing || 0;

    if (style.maxLines > 0 && style.maxLines < lines.length)
    {
        drawnLines = style.maxLines;
    }

    style.syncFont(canvas, context);

    var maxLineHeight = 0;

    // 计算每个字符的尺寸信息
    let charInfo: Array<Array<CharInfo>> = [];
    let allP = (style as any).punctuation || code.ALLBIAODIAN;

    for(let i=0;i<drawnLines;i++) {
        let line = lines[i];
        let lineChars: Array<CharInfo> = [];
        var stringArray = Array.from ? Array.from(line) : line.split('');
        for (let char of stringArray) {
            let isP = allP.indexOf(char) >= 0;
            let needRotate = false;
            if(!(style as any).rotateP && isP) {
                needRotate = false;
            }else{
                needRotate = (style as any).rotateP && isP || (style as any).rotateWC && !isP && !isCJK(char); // cjk not rotate
            }
            let cInfo = {
                width: 0,
                height: 0,
                char: char,
                rotate: needRotate,
            };

            if (cInfo.rotate) {
                [cInfo.width, cInfo.height] = [size.fontSize, context.measureText(char).width];
            } else {
                [cInfo.width, cInfo.height] = [context.measureText(char).width, size.fontSize];
            }
            lineChars.push(cInfo);
        }
        (lineChars as any).text = line;
        charInfo.push(lineChars);
    }

    // 计算每一列
    let lineInfo = [];
    for (let lineCharInfo of charInfo) {
        let curLineHeight = 0;
        for(let i =0;i<lineCharInfo.length;i++) {
            let info = lineCharInfo[i];
            curLineHeight += info.height;
            if(i > 0) {
                curLineHeight += style.letterSpacing;
            }
        }

        lineInfo.push({
            text: (lineCharInfo as any).text,
            charInfo: lineCharInfo,
            height: curLineHeight
        })

        maxLineHeight = Math.max(maxLineHeight, curLineHeight);
    }

    //miniHeight
    if((style as any).miniHeight) {
        maxLineHeight = Math.max(maxLineHeight, (style as any).miniHeight);
    }
    var height = maxLineHeight + style.strokeThickness;

    var lineWidth: number = size.fontSize + style.strokeThickness + lineSpacing;
    var width = Math.max(lineWidth, size.fontSize + style.strokeThickness)
        + ((lines.length - 1) * lineWidth);
    if (style.shadowOffsetX)
    {
        width += style.shadowOffsetX;
    }
    
    if(style.fontStyle == 'italic' || style.fontStyle == "oblique") {
        width += size.fontSize * Math.sin(MathUtils.angleToRadian(15)) * 0.5;
    }

    return {
        text,
        style,
        width,
        height,
        lineSpacing,
        lines: drawnLines,
        lineStrings: lines,
        lineInfo,
        lineWidth,
    };
}

class Text extends Phaser.GameObjects.Text {
    constructor(scene:Phaser.Scene, x:number, y:number,text:string|string[], style:any)
    {
        super(scene, x, y, text, style);

        let customStyle: any = this.style;
        customStyle.letterSpacing = style.letterSpacing || 0;
        customStyle.vertical = style.vertical || false;    

        this.updateText();
    }

    initRTL() {

    }

    updateTextHorizontal()
    {
        let that:any = this;
        var canvas = this.canvas;
        var context = this.context;
        var style:any = this.style;
        var resolution = style.resolution;
        var size = style.metrics;

        style.syncFont(canvas, context);

        var outputText = that._text;

        if (style.wordWrapWidth || style.wordWrapCallback)
        {
            outputText = this.runWordWrap(that._text);
        }

        //  Split text into lines
        var lines = outputText.split(this.splitRegExp);   
        if (style.rtl)
        {
            for(let i=0;i<lines.length;i++) {
                lines[i] = lines[i].split("").reverse().join("");
            }
        }

        var textSize = GetTextSizeHorizontal(this, size, lines);

        var padding:any = this.padding;

        var textWidth;

        if (style.fixedWidth === 0)
        {
            this.width = textSize.width + padding.left + padding.right;

            textWidth = textSize.width;
        }
        else
        {
            this.width = style.fixedWidth;

            textWidth = this.width - padding.left - padding.right;

            if (textWidth < textSize.width)
            {
                textWidth = textSize.width;
            }
        }

        if (style.fixedHeight === 0)
        {
            this.height = textSize.height + padding.top + padding.bottom;
        }
        else
        {
            this.height = style.fixedHeight;
        }

        var w = this.width;
        var h = this.height;

        this.updateDisplayOrigin();

        w *= resolution;
        h *= resolution;

        w = Math.max(w, 1);
        h = Math.max(h, 1);

        if (canvas.width !== w || canvas.height !== h)
        {
            canvas.width = w;
            canvas.height = h;

            this.frame.setSize(w, h);

            //  Because resizing the canvas resets the context
            style.syncFont(canvas, context);
        }
        else
        {
            context.clearRect(0, 0, w, h);
        }

        context.save();

        context.scale(resolution, resolution);

        if (style.backgroundColor)
        {
            context.fillStyle = style.backgroundColor;
            context.fillRect(0, 0, w, h);
        }

        style.syncStyle(canvas, context);

        context.textBaseline = 'alphabetic';

        //  Apply padding
        context.translate(padding.left, padding.top);

        var linePositionX;
        var linePositionY;

        //  Draw text line by line
        for (var i = 0; i < textSize.lines; i++)
        {
            linePositionX = style.strokeThickness / 2;
            linePositionY = (style.strokeThickness / 2 + i * textSize.lineHeight) + size.ascent;

            if (i > 0)
            {
                linePositionY += (textSize.lineSpacing * i);
            }

            // if (style.rtl)
            // {
            //     linePositionX = w - linePositionX;
            // }
            
            
            if (style.align === 'right')
            {
                linePositionX += textWidth - textSize.lineWidths[i];
            }
            else if (style.align === 'center')
            {
                linePositionX += (textWidth - textSize.lineWidths[i]) / 2;
            }
            else if (style.align === 'justify')
            {
                //  To justify text line its width must be no less than 85% of defined width
                var minimumLengthToApplyJustification = 0.85;

                if (textSize.lineWidths[i] / textSize.width >= minimumLengthToApplyJustification)
                {
                    var extraSpace = textSize.width - textSize.lineWidths[i];
                    var spaceSize = context.measureText(' ').width;
                    var trimmedLine = lines[i].trim();
                    var array = trimmedLine.split(' ');
            
                    extraSpace += (lines[i].length - trimmedLine.length) * spaceSize;
            
                    var extraSpaceCharacters = Math.floor(extraSpace / spaceSize);
                    var idx = 0;

                    while (extraSpaceCharacters > 0)
                    {
                        array[idx] += ' ';
                        idx = (idx + 1) % (array.length - 1 || 1);
                        --extraSpaceCharacters;
                    }
            
                    lines[i] = array.join(' ');
                }
            }

            if (this.autoRound)
            {
                linePositionX = Math.round(linePositionX);
                linePositionY = Math.round(linePositionY);
            }

            if (style.strokeThickness)
            {
                this.style.syncShadow(context, style.shadowStroke);

                context.strokeText(lines[i], linePositionX, linePositionY);
            }

            if (style.color)
            {
                this.style.syncShadow(context, style.shadowFill);

                context.fillText(lines[i], linePositionX, linePositionY);
            }
        }

        context.restore();

        let renderer:any = this.renderer;
        if (renderer && renderer.gl)
        {
            this.frame.source.glTexture = renderer.canvasToTexture(canvas, this.frame.source.glTexture, true);

            this.frame.glTexture = this.frame.source.glTexture;
        }

        this.dirty = true;

        var input = this.input;

        if (input && !input.customHitArea)
        {
            input.hitArea.width = this.width;
            input.hitArea.height = this.height;
        }

        return this;
    }

    updateTextVertical()
    {
        let that:any = this;
        var canvas = this.canvas;
        var context = this.context;
        var style:any = this.style;
        var resolution = style.resolution;
        var size = style.metrics;

        style.syncFont(canvas, context);

        var outputText = that._text;

        if (style.wordWrapWidth || style.wordWrapCallback)
        {
            outputText = this.runWordWrap(that._text);
        }

        //  Split text into lines
        var lines = outputText.split(this.splitRegExp);   
        if (style.rtl)
        {
            for(let i=0;i<lines.length;i++) {
                lines[i] = lines[i].split("").reverse().join("");
            }
        }

        var textSize = GetTextSizeVertical(this, size, lines);

        var padding:any = this.padding;

        var textHeight;

        if (style.fixedHeight === 0)
        {
            this.height = textSize.height + padding.top + padding.bottom;

            textHeight = textSize.height;
        }
        else
        {
            this.height = style.fixedHeight;

            textHeight = this.height - padding.top - padding.bottom;

            if (textHeight < textSize.height)
            {
                textHeight = textSize.height;
            }
        }

        if (style.fixedWidth === 0)
        {
            this.width = textSize.width + padding.right + padding.left;
        }
        else
        {
            this.width = style.fixedWidth;
        }

        var w = this.width;
        var h = this.height;

        this.updateDisplayOrigin();

        w *= resolution;
        h *= resolution;

        w = Math.max(w, 1);
        h = Math.max(h, 1);

        w = Math.min(document.body.clientWidth * style.resolution * 3, Math.ceil((Math.max(1, w) + (padding.left + padding.right)) * style.resolution));
        h = Math.min(document.body.clientHeight * style.resolution * 3, Math.ceil((Math.max(1, h) + (padding.top + padding.bottom)) * style.resolution));
        
        if (canvas.width !== w || canvas.height !== h)
        {  
            canvas.width = w;
            canvas.height = h;

            this.frame.setSize(w, h);

            //  Because resizing the canvas resets the context
            style.syncFont(canvas, context);
        }
        else
        {
            context.clearRect(0, 0, w, h);
        }

        context.save();

        context.scale(resolution, resolution);

        if (style.backgroundColor)
        {
            context.fillStyle = style.backgroundColor;
            context.fillRect(0, 0, w, h);
        }

        style.syncStyle(canvas, context);

        context.textBaseline = 'alphabetic';

        //  Apply padding
        context.translate(padding.left, padding.top);

        let width = textSize.width;
        let height = textSize.height;

        var linePositionX;
        var linePositionY;

        //  Draw text line by line
        for (var i = 0; i < textSize.lines; i++)
        {
            linePositionX = (style.strokeThickness / 2) + (i * textSize.lineWidth);
            linePositionY = (style.strokeThickness / 2) + size.ascent;

            if (i > 0)
            {
                linePositionX += (textSize.lineSpacing * i);
            }

            // if (style.rtl)
            // {
            //     linePositionX = w - linePositionX;
            // }
            
            
            if (style.align === 'bottom')
            {
                linePositionY += height - textSize.lineInfo[i].height;
            }
            else if (style.align === 'middle')
            {
                linePositionY += (height - textSize.lineInfo[i].height) / 2;
            }
            else if (style.align === 'justify')
            {
                //  To justify text line its width must be no less than 85% of defined width
                var minimumLengthToApplyJustification = 0.85;

                if (textSize.lineInfo[i].height / textSize.height >= minimumLengthToApplyJustification)
                {
                    var extraSpace = textSize.height - textSize.lineInfo[i].height;
                    var spaceSize = context.measureText(' ').width;
                    var trimmedLine = lines[i].trim();
                    var array = trimmedLine.split(' ');
            
                    extraSpace += (lines[i].length - trimmedLine.length) * spaceSize;
            
                    var extraSpaceCharacters = Math.floor(extraSpace / spaceSize);
                    var idx = 0;

                    while (extraSpaceCharacters > 0)
                    {
                        array[idx] += ' ';
                        idx = (idx + 1) % (array.length - 1 || 1);
                        --extraSpaceCharacters;
                    }
            
                    lines[i] = array.join(' ');
                }
            }

            if (this.autoRound)
            {
                linePositionX = Math.round(linePositionX);
                linePositionY = Math.round(linePositionY);
            }

            let lineInfo = textSize.lineInfo[i];
            if (style.stroke && style.strokeThickness)
            {
                this.drawLetterSpacingVertical(
                    lineInfo,
                    linePositionX,
                    linePositionY,
                    true,
                );
            }

            if (style.color)
            {
                this.drawLetterSpacingVertical(
                    lineInfo,
                    linePositionX,
                    linePositionY,
                    false,
                );
            }
        }

        context.restore();

        let renderer:any = this.renderer;
        if (renderer && renderer.gl)
        {
            this.frame.source.glTexture = renderer.canvasToTexture(canvas, this.frame.source.glTexture, true);

            this.frame.glTexture = this.frame.source.glTexture;
        }

        this.dirty = true;

        var input = this.input;

        if (input && !input.customHitArea)
        {
            input.hitArea.width = this.width;
            input.hitArea.height = this.height;
        }

        return this;
    }

    drawLetterSpacingVertical(line: VerticalLine, x: number, y: number, isStroke?: boolean) { 
        if ( isStroke === void 0 ) { isStroke = false; }
    
        var style:any = this.style;
        var resolution = style.resolution;
        var size = style.metrics;
    
        // letterSpacing of 0 means normal
        var letterSpacing = style.letterSpacing;
    
        // 画一列文本
        var currentPosition = y;
        // let lastRotated = false;
        for (let cInfo of line.charInfo) {
            // to do: add single rotate style to fixed fill style error
            // if(lastRotated != cInfo.rotate) {
            //     this.context.fillStyle = this._generateFillStyleVertical(style, lines, cInfo.rotate);
            // }
            // lastRotated = cInfo.rotate;
    
            if (cInfo.rotate) {    
                this.context.translate(x, currentPosition);            
                this.context.rotate(Math.PI / 2);
                this.context.translate(-x - size.ascent, -currentPosition - size.descent);
            }
            // 画一个字符
            if (isStroke) {
                this.context.strokeText(cInfo.char, x, currentPosition);
            }else{
                this.context.fillText(cInfo.char, x, currentPosition);
            }
            if (cInfo.rotate) {
                this.context.setTransform(resolution, 0, 0, resolution, 0, 0);
            }
    
            currentPosition += cInfo.height + letterSpacing;
    
            if(currentPosition > this.canvas.height) {
                break;
            }
        }
    } 
    
    updateText()
    {
        let that: any = this;
        let style = this.style;
        if((style as any).vertical === true) {
            that.updateTextVertical();
        }else{
            that.updateTextHorizontal();
        }
    
        return this;
    }
}

Phaser.GameObjects.GameObjectFactory.register('text', function (this:any, x:number, y:number,text:string|string[], style:any)
{
    return this.displayList.add(new Text(this.scene, x, y, text, style));
});