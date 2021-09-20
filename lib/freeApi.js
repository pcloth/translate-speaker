const rp = require('request-promise');

const googleFreeUrl = 'http://translate.google.cn/translate_a/single?client=gtx&dt=t&dj=1&ie=UTF-8'

// 检测是否中文
function isChinese(text) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(text)
}

const googleFreeApi = function({text, from, to, appid, password}){
    if(isChinese(text)){
        text = encodeURIComponent(text)
    }
    let url = `${googleFreeUrl}&sl=${from}&tl=${to}&q=${text}`
    return rp.get(url);
}

const youdaoFreeApi = function({text, from, to, appid, password}){
    /*
    ZH_CN2EN 中文　»　英语
    ZH_CN2JA 中文　»　日语
    ZH_CN2KR 中文　»　韩语
    ZH_CN2FR 中文　»　法语
    ZH_CN2RU 中文　»　俄语
    ZH_CN2SP 中文　»　西语
    EN2ZH_CN 英语　»　中文
    JA2ZH_CN 日语　»　中文
    KR2ZH_CN 韩语　»　中文
    FR2ZH_CN 法语　»　中文
    RU2ZH_CN 俄语　»　中文
    SP2ZH_CN 西语　»　中文
    */
    let type = 'auto'
    if(from==='en' && to ==='zh'){
        type = 'EN2ZH_CN'
    }
    if(from==='zh' && to ==='en'){
        type = 'ZH_CN2EN'
    }
    if(isChinese(text)){
        text = encodeURIComponent(text)
    }
    let url = `http://fanyi.youdao.com/translate?&doctype=json&type=${type}&i=${text}`
    return rp.get(url);
}

module.exports = {googleFreeApi,youdaoFreeApi}