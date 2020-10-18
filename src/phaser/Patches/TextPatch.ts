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
    var lineHeights = [];
    var maxLineWidth = 0;
    var drawnLines = lines.length;

    if (style.maxLines > 0 && style.maxLines < lines.length)
    {
        drawnLines = style.maxLines;
    }

    style.syncFont(canvas, context);

    //  Text Width

    let height = 0;
    for (var i = 0; i < drawnLines; i++)
    {
        var lineWidth = style.strokeThickness;
        let line = lines[i];
        let strArr = Array.from ? Array.from(line) : line.split('')
        let letterSpacing = (style as any).letterSpacing || 0;        

        let maxLineHeight = 0;
        if(letterSpacing) {
            if(line) {
                for(let char of line) {
                    let measure = context.measureText(char);
                    let enableCalcHeight = measure.actualBoundingBoxAscent && measure.actualBoundingBoxDescent;
                    lineWidth += measure.width + (char != ' ' ? letterSpacing : 0);
                    maxLineHeight = Math.max(enableCalcHeight ? measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent : 0, maxLineHeight, size.fontSize);
                }
            }
        }else{       
            let measure = context.measureText(lines[i]);     
            let enableCalcHeight = measure.actualBoundingBoxAscent && measure.actualBoundingBoxDescent;
            lineWidth += measure.width;
            maxLineHeight =  Math.max(enableCalcHeight ? measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent : 0, size.fontSize);
        }

        if(style.strokeThickness) {
            maxLineHeight += + style.strokeThickness;
        }

        // Adjust for wrapped text
        if ((style as any).wordWrap)
        {
            lineWidth -= context.measureText(' ').width;
        }

        lineWidths[i] = Math.ceil(lineWidth);
        lineHeights[i] = maxLineHeight;
        
        if(style.shadowOffsetX) {
            maxLineWidth += style.shadowOffsetX;
        }  

        maxLineWidth = Math.max(maxLineWidth, lineWidths[i]);
        height += maxLineHeight;
    }

    if((style as any).minWidth) {
        maxLineWidth = Math.max(maxLineWidth, (style as any).minWidth);
    }

    //  Text Height

    // var lineHeight = size.fontSize + style.strokeThickness;
    var lineSpacing = text.lineSpacing;

    //  Adjust for line spacing
    if (drawnLines > 1)
    {
        height += lineSpacing * (drawnLines - 1);
    }      

    if(style.shadowOffsetY) {
        height += style.shadowOffsetY;
    }

    if(style.fontStyle == 'italic' || style.fontStyle == "oblique") {
        maxLineWidth += size.fontSize * Math.sin(MathUtils.angleToRadian(15)) * 0.5;
    }

    return {
        width: maxLineWidth,
        height: height,
        lines: drawnLines,
        lineWidths: lineWidths,
        lineSpacing: lineSpacing,
        lineHeights: lineHeights,
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
    width: number,
};

type VerticalLineInfo = {
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle,
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
    var warpHeight: number = style.wordWrapWidth != undefined ? style.wordWrapWidth : 0;

    var maxLineHeight = 0;
    var drawnLines = 0;
    var lineSpacing = text.lineSpacing || 0;

    style.syncFont(canvas, context);

    // 计算每个字符的尺寸信息
    let charInfo: Array<Array<CharInfo>> = [];
    let allP = style.punctuation || code.ALLBIAODIAN;    
 
    // 计算每一列
    let lineInfo = [];
    let width = 0;
    for(let line of lines) {
        let lineChars: Array<CharInfo> = [];
        var stringArray = Array.from ? Array.from(line) : line.split('');
        let curLineHeight = style.strokeThickness;
        let indexInLine = 0;   
        let spliteLine = '';

        let maxLineWidth = 0;
        for (let i=0;i<stringArray.length;i++) {
            if(style.maxLines) {
                if(charInfo.length < style.maxLines) {
                    break;
                }
            }

            let char = stringArray[i];
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

            let matrics = context.measureText(char);            
            if (cInfo.rotate) {
                [cInfo.width, cInfo.height] = [size.fontSize, matrics.width];
            } else {
                [cInfo.width, cInfo.height] = [matrics.width, size.fontSize];
            }
            maxLineWidth = Math.max(cInfo.width, maxLineWidth);

            let curHeight = curLineHeight + cInfo.height;
            if(indexInLine > 0) {
                curHeight += style.letterSpacing;
            }            
            
            spliteLine += cInfo.char;
            curLineHeight += cInfo.height; // + matrics.actualBoundingBoxDescent            
            lineChars.push(cInfo);
            if(indexInLine > 0) {
                curHeight += style.letterSpacing;
            }
            indexInLine++;
            
            if(warpHeight && curHeight > warpHeight || i == stringArray.length - 1) {
                (lineChars as any).text = spliteLine;            
                charInfo.push(lineChars);
                lineInfo.push({
                    text: spliteLine,
                    charInfo: lineChars,
                    height: curLineHeight,
                    width: maxLineWidth,
                });

                maxLineHeight = Math.max(maxLineHeight, curLineHeight);
                // reset
                curLineHeight = 0;
                lineChars = [];
                charInfo = [];
                indexInLine = 0;
                spliteLine = "";
            }
        }   

        width += maxLineWidth + style.strokeThickness + lineSpacing;
    }
    drawnLines = lineInfo.length;

    if(style.shadowOffsetY) {
        maxLineHeight += style.shadowOffsetY;
    }

    //miniHeight
    if((style as any).miniHeight) {
        maxLineHeight = Math.max(maxLineHeight, (style as any).miniHeight);
    }
    var height = maxLineHeight;

    var lineWidth: number = size.fontSize + style.strokeThickness + lineSpacing;
    // var width = size.fontSize + ((drawnLines - 1) * lineWidth);
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
        lineInfo,
    };
}

export interface ITextStyle {
    /**
     * The font the Text object will render with. This is a Canvas style font string.
     */
    fontFamily?: string;
    
    fontSize?: number;
    /**
     * Any addition font styles, such as 'strong'.
     */
    fontStyle?: string;
    /**
     * A solid fill color that is rendered behind the Text object. Given as a CSS string color such as `#ff0`.
     */
    backgroundColor?: number;
    /**
     * The color the Text is drawn in. Given as a CSS string color such as `#fff` or `rgb()`.
     */
    color?: number;
    /**
     * The color used to stroke the Text if the `strokeThickness` property is greater than zero.
     */
    stroke?: number;
    /**
     * The thickness of the stroke around the Text. Set to zero for no stroke.
     */
    strokeThickness?: number;
    /**
     * The Text shadow configuration object.
     */
    shadow?: Phaser.Types.GameObjects.Text.TextShadow;
    /**
     * A Text Padding object.
     */
    padding?: Phaser.Types.GameObjects.Text.TextPadding;
    /**
     * The alignment of the Text. This only impacts multi-line text.
     *  Either `left`, `right`, `center` or `justify` in horizontal model.
     *  Either `top`, `middle`, `bottom` or `justify` in vertical model.
     */
    align?: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'justify' ; 

    /**
     * The maximum number of lines to display within the Text object.
     */
    maxLines?: integer;
    /**
     * Force the Text object to have the exact width specified in this property. Leave as zero for it to change accordingly to content.
     */
    fixedWidth?: number;
    /**
     * Force the Text object to have the exact height specified in this property. Leave as zero for it to change accordingly to content.
     */
    fixedHeight?: number;
    /**
     * Sets the resolution (DPI setting) of the Text object. Leave at zero for it to use the game resolution.
     */
    resolution?: number;
    /**
     * Set to `true` if this Text object should render from right-to-left.
     */
    rtl?: boolean;
    /**
     * Set to `true` if this Text object should render from right-to-left by words when rtl is true.
     */
    rtlByWord?: boolean;
    /**
     * This is the string used to aid Canvas in calculating the height of the font.
     */
    testString?: string;
    /**
     * The amount of horizontal padding added to the width of the text when calculating the font metrics.
     */
    baselineX?: number;
    /**
     * The amount of vertical padding added to the height of the text when calculating the font metrics.
     */
    baselineY?: number;
    /**
     * The Text Word wrap configuration object.
     */
    wordWrap?: Phaser.Types.GameObjects.Text.TextWordWrap;
    /**
     * A Text Metrics object. Use this to avoid expensive font size calculations in text heavy games.
     */
    metrics?: Phaser.Types.GameObjects.Text.TextMetrics;

    lineSpacing?: number;
    letterSpacing?: number;

    vertical?: {
        enable?: boolean,
        // this array will support punctuations to roate, or all punctuations will rotate
        punctuation?: string[],
        // when in vertical mode, need to rotate punctuation
        rotateP?: boolean,
        // when in vertical mode, need to rotate western character
        rotateWC?: boolean,
        // set mini width in horizontal mode
        minWidth?: number,
        // set mini height in vertical mode
        miniHeight?: number,
    };

    // for rich text
    underline?: {
        color?: number,
        thickness?: number,
        offset?: number,
    };
    // in horizontal model 
    halign?: 'left'|'center'|'right'|'justify',
    // in vertical model
    valign?: 'top'|'center'|'bottom'|'justify',

    [key:string]:any;
}

export class Text extends Phaser.GameObjects.Text {
    private _lock = false;
    private _useCanvasRTL = false;

    constructor(scene:Phaser.Scene, x:number, y:number,text:string|string[], style:ITextStyle | any)
    {
        super(scene, x, y, text, style);        
        this.setStyle(style);
    }

    public setStyle(style: ITextStyle | any) {
        this._lock = true;

        super.setStyle(style);

        style = style || {};

        (this as any).__style__ = style;

        let customStyle: any = this.style;
        customStyle.rtlByWord = style.rtlByWord;
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

        customStyle.halign = style.halign || style.align;
        if(['left', 'center', 'right', 'justify'].indexOf(customStyle.halign) < 0) {
            customStyle.halign = 'left';
        }

        customStyle.valign = style.valign || style.align;
        if(['top','center','bottom','justify']. indexOf(customStyle.valign) < 0) {
            customStyle.valign = 'top';
        }
        
        this._lock = false;
        this.updateText();

        return this;
    }

    initRTL() {
        if(this._useCanvasRTL) {
            let style: ITextStyle = this.style as any;
            if(!(style.vertical && style.vertical.enable)) {
                let that = this as any;
                that.__old_canvas_display = this.canvas.style.display;

                super.initRTL();
                this.originX = 0;
            }
        }
    }

    basicWordWrap (text: string, context: CanvasRenderingContext2D, wordWrapWidth: number)
    {
        var result = '';
        var lines = text.split(this.splitRegExp as any);
        var lastLineIndex = lines.length - 1;
        var whiteSpaceWidth = context.measureText(' ').width;
        var letterSpacing = (this.style as any).letterSpacing || 0;

        for (var i = 0; i <= lastLineIndex; i++)
        {
            var spaceLeft = wordWrapWidth;
            var words = lines[i].split(' ');
            var lastWordIndex = words.length - 1;

            for (var j = 0; j <= lastWordIndex; j++)
            {
                var word = words[j];
                var wordWidth = 0;
                if(letterSpacing) {
                    for(let char of word) {
                        wordWidth += context.measureText(char).width + letterSpacing;
                    }
                }else{
                    wordWidth = context.measureText(word).width;
                }
                var wordWidthWithSpace = wordWidth + whiteSpaceWidth;

                if (wordWidthWithSpace > spaceLeft)
                {
                    // Skip printing the newline if it's the first word of the line that is greater
                    // than the word wrap width.
                    if (j > 0)
                    {
                        result += '\n';
                        spaceLeft = wordWrapWidth;
                    }
                }

                result += word;

                if (j < lastWordIndex)
                {
                    result += ' ';
                    spaceLeft -= wordWidthWithSpace;
                }
                else
                {
                    spaceLeft -= wordWidth;
                }
            }

            if (i < lastLineIndex)
            {
                result += '\n';
            }
        }

        return result;
    }

    advancedWordWrap(text: string, context: CanvasRenderingContext2D, wordWrapWidth: number)
    {
        var output = '';

        // Condense consecutive spaces and split into lines
        var lines = text
            .replace(/ +/gi, ' ')
            .split((this as any).splitRegExp);

        var linesCount = lines.length;
        var letterSpacing = (this.style as any).letterSpacing || 0;

        for (var i = 0; i < linesCount; i++)
        {
            var line = lines[i];
            var out = '';

            // Trim whitespace
            line = line.replace(/^ *|\s*$/gi, '');

            // If entire line is less than wordWrapWidth append the entire line and exit early
            var lineWidth = 0;//context.measureText(line).width;

            if(letterSpacing) {
                for(let char of line) {
                    lineWidth += context.measureText(char).width + letterSpacing;
                }
            }else{
                lineWidth = context.measureText(line).width;
            }

            if (lineWidth < wordWrapWidth)
            {
                output += line + '\n';
                continue;
            }

            // Otherwise, calculate new lines
            var currentLineWidth = wordWrapWidth;

            // Split into words
            var words = line.split(' ');

            for (var j = 0; j < words.length; j++)
            {
                var word = words[j];
                var wordWithSpace = word + ' ';
                var wordWidth = 0; //context.measureText(wordWithSpace).width;
                if(letterSpacing) {
                    for(let char of wordWithSpace) {
                        wordWidth += context.measureText(char).width + (char != ' ' ? letterSpacing : 0);
                    }
                }else{
                    wordWidth = context.measureText(wordWithSpace).width;
                }

                if (wordWidth > currentLineWidth)
                {
                    // Break word
                    if (j === 0)
                    {
                        // Shave off letters from word until it's small enough
                        var newWord = wordWithSpace;
                        wordWidth = 0;

                        while (newWord.length)
                        {
                            newWord = newWord.slice(0, -1);
                            // wordWidth = context.measureText(newWord).width;
                            if(letterSpacing) {
                                for(let char of newWord) {
                                    wordWidth += context.measureText(char).width + (char != ' ' ? letterSpacing : 0);
                                }
                            }else{
                                wordWidth = context.measureText(newWord).width;
                            }

                            if (wordWidth <= currentLineWidth)
                            {
                                break;
                            }
                        }

                        // If wordWrapWidth is too small for even a single letter, shame user
                        // failure with a fatal error
                        if (!newWord.length)
                        {
                            throw new Error('This text\'s wordWrapWidth setting is less than a single character!');
                        }

                        // Replace current word in array with remainder
                        var secondPart = word.substr(newWord.length);

                        words[j] = secondPart;

                        // Append first piece to output
                        out += newWord;
                    }

                    // If existing word length is 0, don't include it
                    var offset = (words[j].length) ? j : j + 1;

                    // Collapse rest of sentence and remove any trailing white space
                    var remainder = words.slice(offset).join(' ')
                        .replace(/[ \n]*$/gi, '');

                    // Prepend remainder to next line
                    lines[i + 1] = remainder + ' ' + (lines[i + 1] || '');
                    linesCount = lines.length;

                    break; // Processing on this line

                    // Append word with space to output
                }
                else
                {
                    out += wordWithSpace;
                    currentLineWidth -= wordWidth;
                }
            }

            // Append processed line to output
            output += out.replace(/[ \n]*$/gi, '') + '\n';
        }

        // Trim the end of the string
        output = output.replace(/[\s|\n]*$/gi, '');

        return output;
    }

    updateTextHorizontal()
    {
        if(this._useCanvasRTL) {
            if(this.canvas.dir == 'rtl' && !this.style.rtl) {
                this.canvas.dir = 'ltr';
                this.context.direction = 'ltr';
                this.canvas.style.display = (this as any).__old_canvas_display;
                Phaser.DOM.RemoveFromDOM(this.canvas);
            }else if((this.canvas.dir == 'ltr' || this.canvas.dir == '') && this.style.rtl) {
                this.initRTL();
            }
        }

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
        if (!this._useCanvasRTL && style.rtl)
        {
            for(let i=0;i<lines.length;i++) {
                let line = lines[i];
                if(Array.from) {
                    if(style.rtlByWord) {
                        lines[i] = line.split(' ').reverse().join(' ');
                    }else{
                        lines[i] = Array.from(line).reverse().join('');
                    }
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
        let sumY = 0;
        for (var i = 0; i < textSize.lines; i++)
        {
            linePositionX = style.strokeThickness / 2;
            linePositionY = (style.strokeThickness / 2 + sumY) + size.ascent;
            sumY += textSize.lineHeights[i];

            if (i > 0)
            {
                linePositionY += (textSize.lineSpacing * i);
            }

            // if (style.rtl)
            // {
            //     linePositionX = w - linePositionX;
            // } //else  
            
            if(style.halign === 'left') {
                if (this._useCanvasRTL && style.rtl) {
                    linePositionX = textSize.lineWidths[i] - linePositionX;
                }
            }
            else if (style.halign === 'right')
            {
                if (this._useCanvasRTL && style.rtl) {
                    linePositionX = w - linePositionX;
                }else {
                    linePositionX += textWidth - textSize.lineWidths[i];
                }
            }
            else if (style.halign === 'center')
            {
                if (this._useCanvasRTL && style.rtl) {
                    linePositionX = w - (textWidth - textSize.lineWidths[i]) / 2 - linePositionX;
                }else {
                    linePositionX += (textWidth - textSize.lineWidths[i]) / 2;
                }
            }
            else if (style.halign === 'justify')
            {
                if (this._useCanvasRTL && style.rtl) {
                    linePositionX = w - linePositionX;
                }

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
        //  Split text into lines
        var lines = outputText.split(this.splitRegExp);   
        var textSize = GetTextSizeVertical(this, size, lines);        
        if (style.rtl)
        {
            textSize.lineInfo = textSize.lineInfo.reverse();
        }

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
        let sumX = 0;
        for (var i = 0; i < textSize.lines; i++)
        {
            linePositionX = (style.strokeThickness / 2) + sumX;
            linePositionY = (style.strokeThickness / 2) + size.ascent;
            sumX += textSize.lineInfo[i].width;

            if (i > 0)
            {
                linePositionX += (textSize.lineSpacing * i);
            }

            // if (style.rtl)
            // {
            //     linePositionX = w - linePositionX;
            // }
            
            
            if (style.valign === 'bottom')
            {
                linePositionY += height - textSize.lineInfo[i].height;
            }
            else if (style.valign === 'middle')
            {
                linePositionY += (height - textSize.lineInfo[i].height) / 2;
            }
            else if (style.valign === 'justify')
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
            currentWidth = this.context.measureText(currentChar).width;
            if(this._useCanvasRTL && style.rtl) {
                currentPosition -= currentWidth;
            }

            if (isStroke)
            {
                this.context.strokeText(currentChar, currentPosition, y);
            }
            else
            {
                this.context.fillText(currentChar, currentPosition, y);
            }

            let space = currentChar != ' ' ? letterSpacing : 0;
            if(this._useCanvasRTL && this.style.rtl) {
                currentPosition -= space;
                if(currentPosition <= 0) {
                    break;
                }
            }else{
                currentPosition += currentWidth + space;            
                if(currentPosition > this.canvas.width) {
                    break;
                }
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

            let newX = x + (line.width - cInfo.width) * 0.5;
    
            if (cInfo.rotate) {    
                this.context.translate(newX, currentPosition);            
                this.context.rotate(Math.PI / 2);
                this.context.translate(-newX - size.ascent, -currentPosition - size.descent);
            }
            // 画一个字符
            if (isStroke) {
                this.context.strokeText(cInfo.char, newX, currentPosition);
            }else{
                this.context.fillText(cInfo.char, newX, currentPosition);
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
        if(this._lock) {
            return;
        }

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