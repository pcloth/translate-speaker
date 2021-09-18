// https://fanyi-api.baidu.com/doc/21
const rp = require('request-promise');
const md5 = require('./md5.js');

const appid = '20180606000172773'
const salt = 't)rans(late_Spe&ak$e!r#'
const password = '_i2M0ux3_7rfZfSzj7BA'

const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

const baiduTranslateApi = function (text, from = 'auto', to = 'zh') {
    let sign = md5.hex_md5(`${appid}${text}${salt}${password}`)
    let fromData = { q: text, from, to, salt, sign, appid };
    console.log(fromData)
    return rp.post(url, {
        form: fromData,
        encoding: 'UTF-8'
    });
}


module.exports = baiduTranslateApi;