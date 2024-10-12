const {service} = require('./request.js');

// 检测是否中文
function isChinese(text) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(text)
}

const googleFreeApi = function({text, from, to, appid, password}){
    if(isChinese(text)){
        text = encodeURIComponent(text)
    }
    const params = {
        client: 'gtx',
        dt: new Date().getTime(),
        dj: 1,
        ie: 'UTF-8',
        sl: from,
        tl: to,
        q: text
    }
    return service({
        url: 'http://translate.google.com/translate_a/single',
        method: 'GET',
        params
    })
}

const bingFreeApi = function({text, from, to, appid, password}){
    if(isChinese(text)){
        text = encodeURIComponent(text)
    }
    const params = {
        appId: appid,
        from: from,
        to: to,
        text: text,
    }
    const baseurl = 'https://api.microsofttranslator.com/v2/Http.svc/Translate'
    return service({
        url: baseurl,
        method: 'GET',
        params
    }).then(xml=>{
        const regex = /<string[^>]*>([^<]+)<\/string>/;
        const match = regex.exec(xml);
        const content = match&&match.length > 1?match[1]:'-没有获取到翻译内容-';
        return content
    })
}

module.exports = {googleFreeApi,bingFreeApi}