var _chars = 'ABCDEFGHJKLMNOPQRSTUVWXYZabcdefghijklmnoprstuvwxyz0123456789';
export function randomString(len: number, enableNumberStart = true) {
　　len = len || 32;
　　var maxPos = _chars.length;
　　var pwd = '';
　　for (let i = 0; i < len; i++) {
        let len = maxPos;
        if(enableNumberStart) {
            len = len - 10;
        }
　　　　pwd += _chars.charAt(Math.floor(Math.random() * len));
　　}
   return pwd;
}