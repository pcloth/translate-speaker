// 百度翻译接口
// https://fanyi-api.baidu.com/doc/21
const {service} = require('./request.js');
const md5 = require('./md5.js');
const { showInformationMessage  } = require('./common.js');
const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

const baiduTranslateApi = function ({text, from, to, appid, password}) {
    let salt = Math.random() * new Date().getTime()
    let sign = md5(`${appid}${text}${salt}${password}`);
    let fromData = { q: text, from, to, salt, sign, appid };
    return service({
        url: url,
        method: 'POST',
        data: fromData,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    }).then(res => {
        if (res.error_code) {
            showInformationMessage(res.error_msg, res.error_code)
        }
        return res
    })
}


module.exports = baiduTranslateApi;