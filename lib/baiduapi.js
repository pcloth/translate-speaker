// 百度翻译接口
// https://fanyi-api.baidu.com/doc/21
const rp = require('request-promise');
const md5 = require('./md5.js');

const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

const baiduTranslateApi = function ({text, from, to, appid, password}) {
    let salt = Math.random() * new Date().getTime()
    let sign = md5(`${appid}${text}${salt}${password}`);
    let fromData = { q: text, from, to, salt, sign, appid };
    return rp.post(url, {
        form: fromData,
        encoding: 'UTF-8'
    });
}


module.exports = baiduTranslateApi;