const rp = require('request-promise');
const googleFreeUrl = 'http://translate.google.com/translate_a/single?client=gtx&dt=t&dj=1&ie=UTF-8'

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

const bingFreeApi = function({text, from, to, appid, password}){
    if(isChinese(text)){
        text = encodeURIComponent(text)
    }
    const params = {
        appId: appid&&appid.length==40?appid:'AFC76A66CF4F434ED080D245C30CF1E71C22959C',
        from: from,
        to: to,
        text: text,
    }
    const baseurl = 'https://api.microsofttranslator.com/v2/Http.svc/Translate'
    let paramsStr = []
    Object.keys(params).forEach(key=>{
        paramsStr.push(`${key}=${params[key]}`)
    })
    const url = baseurl+'?'+paramsStr.join('&')
    return rp.get(url).then(xml=>{
        // <string xmlns="http://schemas.microsoft.com/2003/10/Serialization/">书</string>
        // 正则提取xml内容
        const regex = /<string[^>]*>([^<]+)<\/string>/;
        const match = regex.exec(xml);
        const content = match&&match.length > 1?match[1]:'-没有获取到翻译内容-';
        return content
    })
}

module.exports = {googleFreeApi,bingFreeApi}