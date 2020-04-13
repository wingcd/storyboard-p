export class Browser {
    static userAgent: string;
    static onMobile: boolean;
    static onIOS: boolean;
    static onMac: boolean;
    static onIPhone: boolean;
    static onIPad: boolean;
    static onAndroid: boolean;
    static onWP: boolean;
    static onQQBrowser: boolean;
    static onMQQBrowser: boolean;
    static onSafari: boolean;
    static onIE: boolean;
    static onWeiXin: boolean;
    static onPC: boolean;
    static onMiniGame: boolean;
    static onBDMiniGame: boolean;
    static onKGMiniGame: boolean;
    static onQGMiniGame: boolean;
    static onVVMiniGame: boolean;
    static onAlipayMiniGame: boolean;
    static onQQMiniGame: boolean;
    /** @private */
    static onFirefox: boolean;
    /** @private */
    static onEdge: boolean;

    private static _window: Window;
    private static _document: Document;

    private static _pixelRatio: number = -1;

    /**@internal */
    static __init() {
        if (Browser._window) return Browser._window;

        var win: any = Browser._window = window;
        var doc: any = Browser._document = win.document;
        var u: string = Browser.userAgent = win.navigator.userAgent;
        var maxTouchPoints: number = win.navigator.maxTouchPoints || 0;
        var platform:string = win.navigator.platform;

        Browser.onMobile = (window as any).isConchApp ? true : u.indexOf("Mobile") > -1;
        Browser.onIOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
        Browser.onIPhone = u.indexOf("iPhone") > -1;
        Browser.onMac = u.indexOf("Mac OS X") > -1;
        Browser.onIPad = u.indexOf("iPad") > -1 || ( platform === 'MacIntel' && maxTouchPoints >1 );//"platform === 'MacIntel' && maxTouchPoints >1" is a temporary solution，maybe accidentally injure other platform.
        Browser.onAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1;
        Browser.onWP = u.indexOf("Windows Phone") > -1;
        Browser.onQQBrowser = u.indexOf("QQBrowser") > -1;
        Browser.onMQQBrowser = u.indexOf("MQQBrowser") > -1 || (u.indexOf("Mobile") > -1 && u.indexOf("QQ") > -1);
        Browser.onIE = !!win.ActiveXObject || "ActiveXObject" in win;
        Browser.onWeiXin = u.indexOf('MicroMessenger') > -1;
        Browser.onSafari = u.indexOf("Safari") > -1;
        Browser.onPC = !Browser.onMobile;
        Browser.onMiniGame = u.indexOf('MiniGame') > -1;
        Browser.onBDMiniGame = u.indexOf('SwanGame') > -1;
        Browser.onVVMiniGame = u.indexOf('VVGame') > -1;//vivo
        Browser.onKGMiniGame = u.indexOf('QuickGame') > -1;//xiao mi game
        if (u.indexOf('AlipayMiniGame') > -1) {
            Browser.onAlipayMiniGame = true;//alipay game
            Browser.onMiniGame = false;
        }
    }    

    static get pixelRatio(): number {
        if (Browser._pixelRatio < 0) {
            if (Browser.userAgent.indexOf("Mozilla/6.0(Linux; Android 6.0; HUAWEI NXT-AL10 Build/HUAWEINXT-AL10)") > -1) {
                Browser._pixelRatio = 2;
            }
            else {
                Browser._pixelRatio = (Browser._window.devicePixelRatio || 1);
                if (Browser._pixelRatio < 1) Browser._pixelRatio = 1;
            }
        }
        return Browser._pixelRatio;
    }

    static get window(): any {
        return Browser._window;
    }

    static get document(): any {
        return Browser._document;
    }
}

Browser.__init();