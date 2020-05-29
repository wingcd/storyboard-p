import { MathUtils } from "../../utils/Math";
import * as code from '../../libs/hanzi/code';
import { isCJK } from '../../libs/hanzi/isCJK';
import { Scene } from "..";
var GetAdvancedValue = Phaser.Utils.Objects.GetAdvancedValue;
var GetValue = Phaser.Utils.Objects.GetValue;

const isEmojiChar = function(charCode:number, nextCharCode:number):number {
    const hs = charCode;
    const nextCharValid = typeof nextCharCode === 'number' && !isNaN(nextCharCode) && nextCharCode > 0;

    // surrogate pair
    if (hs >= 0xd800 && hs <= 0xdbff)    {
        if (nextCharValid)        {
            const uc = ((hs - 0xd800) * 0x400) + (nextCharCode - 0xdc00) + 0x10000;

            if (uc >= 0x1d000 && uc <= 0x1f77f)            {
                return 2;
            }
        }
    }
    // non surrogate
    else if ((hs >= 0x2100 && hs <= 0x27ff)
        || (hs >= 0x2B05 && hs <= 0x2b07)
        || (hs >= 0x2934 && hs <= 0x2935)
        || (hs >= 0x3297 && hs <= 0x3299)
        || hs === 0xa9 || hs === 0xae || hs === 0x303d || hs === 0x3030
        || hs === 0x2b55 || hs === 0x2b1c || hs === 0x2b1b
        || hs === 0x2b50 || hs === 0x231a)    {
        return 1;
    }
    else if (nextCharValid && (nextCharCode === 0x20e3 || nextCharCode === 0xfe0f || nextCharCode === 0xd83c))  {
        return 2;
    }
    return 0;
}

const trimEmoji = function(text: string): {text: string, count: number} {
    let result = [];
    let count = 0;
    for(let i=0;i<text.length;i++) {
        let cur = text[i];
        let next = i < text.length - 1 ? text[i+1] : '';
        let emoji = isEmojiChar(cur.charCodeAt(0), next.charCodeAt(0));
        if(emoji == 0) {
            result.push(cur);
        }else{
            i+=(emoji-1);
            count++;
        }
    }

    return {
        text: result.join(''),
        count,
    };
}

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
        let line = lines[i];
        let strArr = Array.from ? Array.from(line) : line.split('')
        lineWidth += context.measureText(lines[i]).width + ((strArr.length - 1) * (style as any).letterSpacing);

        // Adjust for wrapped text
        if ((style as any).wordWrap)
        {
            lineWidth -= context.measureText(' ').width;
        }

        lineWidths[i] = Math.ceil(lineWidth);
        
        if(style.shadowOffsetX) {
            maxLineWidth += style.shadowOffsetX;
        }
        maxLineWidth = Math.max(maxLineWidth, lineWidths[i]);
    }

    if((style as any).minWidth) {
        maxLineWidth = Math.max(maxLineWidth, (style as any).minWidth);
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

    if(style.shadowOffsetY) {
        height += style.shadowOffsetY;
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
    let allP = style.punctuation || code.ALLBIAODIAN;

    for(let i=0;i<drawnLines;i++) {
        let line = lines[i];
        let lineChars: Array<CharInfo> = [];
        var stringArray = Array.from ? Array.from(line) : line.split('');
        for (let i=0;i<stringArray.length;i++) {
            let char = stringArray[i];
            let nextChar = i < stringArray.length - 1 ? stringArray[i+1] : '';
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
        let curLineHeight = style.strokeThickness;
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

        // Adjust for wrapped text
        if ((style as any).wordWrap)
        {
            curLineHeight -= context.measureText(' ').width;
        }
        maxLineHeight = Math.max(maxLineHeight, curLineHeight);
    }

    if(style.shadowOffsetY) {
        maxLineHeight += style.shadowOffsetY;
    }

    //miniHeight
    if((style as any).miniHeight) {
        maxLineHeight = Math.max(maxLineHeight, (style as any).miniHeight);
    }
    var height = maxLineHeight;

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

        style = style || {};

        (this as any).__style__ = style;

        let customStyle: any = this.style;
        /**
         * {Number} spacing of ever letters
         */
        customStyle.letterSpacing = style.letterSpacing || 0;

        customStyle.vertical = style.vertical;
        style.vertical = style.vertical || {};
        /**
         * {Boolean} support vertical layout
         */
        customStyle.enableVertical = style.vertical.enable;
        /**
         * {Array<string>} this array will support punctuations to roate, or all punctuations will rotate
         */
        customStyle.punctuation = style.vertical.punctuation;
        /**
         * {Boolean} when in vertical mode, need to rotate punctuation
         */
        customStyle.rotateP = style.vertical.rotateP;
        /**
         * {Array<string>} when in vertical mode, need to rotate western character
         */
        customStyle.rotateWC = style.vertical.rotateWC;
        /**
         * set mini width in horizontal mode
         */
        customStyle.minWidth = style.minWidth;
        /**
         * set mini height in vertical mode
         */
        customStyle.miniHeight = style.vertical.miniHeight;

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
                let line = lines[i];
                if(Array.from) {
                    lines[i] = Array.from(line).reverse().join('');
                }else{
                    let reverse = new Array<string>(line.length);
                    for(let j=0;j<line.length;j++) {
                        let cur = line[j];
                        let next = (j<line.length-1) ? line[j+1] : '';
                        let emoji = isEmojiChar(cur.charCodeAt(0), next.charCodeAt(0));
                        if(emoji == 0 || emoji == 1) {
                            reverse[line.length - j - 1] = cur;
                        }else{
                            reverse[line.length - j - 2] = cur;
                            reverse[line.length - j - 1] = next;
                            j++;
                        }
                    }
                    lines[i] = reverse.join('');
                }
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
                this.drawLetterHorizontal(lines[i], linePositionX, linePositionY, true);
            }

            if (style.color)
            {
                this.style.syncShadow(context, style.shadowFill);
                this.drawLetterHorizontal(lines[i], linePositionX, linePositionY, false);
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
            lines = lines.reverse();
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
            if (style.strokeThickness)
            {
                this.style.syncShadow(context, style.shadowStroke);

                this.drawLetterSpacingVertical(
                    lineInfo,
                    linePositionX,
                    linePositionY,
                    true,
                );
            }

            if (style.color)
            {
                this.style.syncShadow(context, style.shadowFill);

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

    drawLetterHorizontal (text: string, x: number, y: number, isStroke: boolean)
    {
        if ( isStroke === void 0 ) { isStroke = false; }

        var style:any = this.style;

        // letterSpacing of 0 means normal
        var letterSpacing = style.letterSpacing;

        if (letterSpacing === 0)
        {
            if (isStroke)
            {
                this.context.strokeText(text, x, y);
            }
            else
            {
                this.context.fillText(text, x, y);
            }

            return;
        }

        var currentPosition = x;

        // Using Array.from correctly splits characters whilst keeping emoji together.
        // This is not supported on IE as it requires ES6, so regular text splitting occurs.
        // This also doesn't account for emoji that are multiple emoji put together to make something else.
        // Handling all of this would require a big library itself.
        // https://medium.com/@giltayar/iterating-over-emoji-characters-the-es6-way-f06e4589516
        // https://github.com/orling/grapheme-splitter
        var stringArray = Array.from ? Array.from(text) : text.split('');
        var currentWidth = 0;

        for (var i = 0; i < stringArray.length; ++i)
        {
            var currentChar = stringArray[i];

            if (isStroke)
            {
                this.context.strokeText(currentChar, currentPosition, y);
            }
            else
            {
                this.context.fillText(currentChar, currentPosition, y);
            }
            currentWidth = this.context.measureText(currentChar).width;
            currentPosition += currentWidth + letterSpacing;
            
            if(currentPosition > this.canvas.width) {
                break;
            }
        }
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
        if((style as any).enableVertical === true) {
            that.updateTextVertical();
        }else{
            that.updateTextHorizontal();
        }
    
        return this;
    }

    toJSON ()
    {
        var out = super.toJSON();

        (out.data as any).style =  (this as any).__style__;
        
        return out;
    }
}

Phaser.GameObjects.GameObjectFactory.register('text', function (this:Phaser.GameObjects.GameObjectFactory, x:number, y:number,text:string|string[], style:any)
{
    return this.displayList.add(new Text(this.scene, x, y, text, style));
});

(Phaser.GameObjects.GameObjectCreator as any).register('text', function (this:Phaser.GameObjects.GameObjectCreator, config:any, addToScene: Scene)
{
    if (config === undefined) { config = {}; }

    // style Object = {
    //     font: [ 'font', '16px Courier' ],
    //     backgroundColor: [ 'backgroundColor', null ],
    //     fill: [ 'fill', '#fff' ],
    //     stroke: [ 'stroke', '#fff' ],
    //     strokeThickness: [ 'strokeThickness', 0 ],
    //     shadowOffsetX: [ 'shadow.offsetX', 0 ],
    //     shadowOffsetY: [ 'shadow.offsetY', 0 ],
    //     shadowColor: [ 'shadow.color', '#000' ],
    //     shadowBlur: [ 'shadow.blur', 0 ],
    //     shadowStroke: [ 'shadow.stroke', false ],
    //     shadowFill: [ 'shadow.fill', false ],
    //     align: [ 'align', 'left' ],
    //     maxLines: [ 'maxLines', 0 ],
    //     fixedWidth: [ 'fixedWidth', false ],
    //     fixedHeight: [ 'fixedHeight', false ],
    //     rtl: [ 'rtl', false ]
    // }

    var content = GetAdvancedValue(config, 'text', '');
    var style = GetAdvancedValue(config, 'style', null);

    //  Padding
    //      { padding: 2 }
    //      { padding: { x: , y: }}
    //      { padding: { left: , top: }}
    //      { padding: { left: , right: , top: , bottom: }}

    var padding = GetAdvancedValue(config, 'padding', null);

    if (padding !== null)
    {
        style.padding = padding;
    }

    var text = new Text(this.scene, 0, 0, content, style);

    if (addToScene !== undefined)
    {
        config.add = addToScene;
    }

    Phaser.GameObjects.BuildGameObject(this.scene, text, config);

    //  Text specific config options:

    text.autoRound = GetAdvancedValue(config, 'autoRound', true);
    (text as any).resolution = GetAdvancedValue(config, 'resolution', 1);

    return text;
});