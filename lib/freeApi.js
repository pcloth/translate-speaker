const {service} = require('./request.js');

const googleFreeApi = function({text, from, to, appid, password}){
    const params = {
        client: 'gtx',
        dt: 't',
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
    const params = {
        appId: appid,
        from: from,
        to: to,
        text: text,
    }
    // console.log('bingFreeApi',params)
    const baseurl = 'https://api.microsofttranslator.com/v2/Http.svc/Translate'
    return service({
        url: baseurl,
        method: 'GET',
        params
    }).then(xml=>{
        // console.log('bingFreeApi',xml)
        const regex = /<string[^>]*>([^<]+)<\/string>/;
        const match = regex.exec(xml);
        const content = match&&match.length > 1?match[1]:'-没有获取到翻译内容-';
        return content
    })
}

module.exports = {googleFreeApi,bingFreeApi}