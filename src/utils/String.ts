var _uppers = "ABCDEFGHJKLMNOPQRSTUVWXYZ";
var _lowers = "abcdefghijklmnoprstuvwxyz";
var _numbers = '0123456789';
export function randomString(len: number, lowerCase = true, upperCase = true, numbers = true, enableNumberStart = false) {
    var chars = "";
    if(lowerCase) {
        chars += _lowers;
    }
    if(upperCase) {
        chars += _uppers;
    }
    if(numbers) {
        chars += _numbers;
    }

　　len = len || 32;
　　var maxPos = chars.length;
　　var pwd = '';
　　for (let i = 0; i < len; i++) {
        let len = maxPos;
        if(numbers && enableNumberStart) {
            len = len - 10;
        }
　　　　pwd += chars.charAt(Math.floor(Math.random() * len));
　　}
   return pwd;
}