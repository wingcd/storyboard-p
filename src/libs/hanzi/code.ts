// code from: https://github.com/Icemic/huozi.js

export const DIANHAO = `。，、．：；！‼？⁇ .,;:~\`?!`;
export const BIAOHAO = `「」『』“”‘’（）()【】〖〗〔〕［］｛｝⸺—…●•–～~～～·﹏《》〈〉＿/／\\ {}[]()<>"'`;
export const BIAODIAN = `${BIAOHAO}${DIANHAO} `;
export const BIAODIANVALIDATEND = `。，、．：；！‼？⁇」』”’）】〗〕］｝》〉 .,)!;]}'>"?`
export const BIAODIANVALIDATSTART = `「『“‘（【〖〔［｛《〈 ({['"<`
export const INCOMPRESSIBLE = '‼⁇⸺—';
export const COMPRESSLEFT = '「『“‘（【〖〔［｛《〈 ({[\'"<';
export const ALLBIAODIAN = [...BIAODIAN, ...BIAODIANVALIDATEND];