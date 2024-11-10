const vscode = require("vscode");
const say = require("say");

// 获取配置参数
const getConfigValue = function (name) {
    return vscode.workspace.getConfiguration('translateSpeaker').get(name);
}
// 检测是否中文
function isChinese(text) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(text)
}

// 显示信息框
function showInformationMessage(message, code) {
    return vscode.window.showInformationMessage(message, { title: '知道了', code }).then(() => {
        // 点击信息框知道了按钮
    })
}

// 语音播报
function speakText(text) {
    if (getConfigValue('enableSpeak')) {
        say.stop();
        setTimeout(() => {
            say.speak(text);
        }, 10);
    }
}

// 选中的英文文本清洗干净
function englishClearSelectionText(text) {
    // 下划线，连接线，小数点自动替换成空格
    text = text.replace(/_|-|\./g, ' ');
    const group = text.split(' ').map((txt) => {
        // 连续的大写字母，不需要处理
        const txtGroup = []
        for(const i in txt){
            const numI = parseInt(i)
            if(txt[i].toUpperCase() === txt[i]){
                // 当前是大写字母
                if(numI === 0){
                    // 第一个字母是大写字母，不处理
                    // continue
                }else if(numI>0 && txt[numI-1].toUpperCase() === txt[numI-1]){
                    // 上一个字母也是大写字母，不处理
                    // continue
                } else {
                    // 上一个字母是小写字母，需要添加一个空格
                    txtGroup.push(' ')
                }
            }
            txtGroup.push(txt[i])
        }
        // 如果是全部大写，不需要处理
        return txtGroup.join('')
    })
    let str = ''
    group.forEach((txt,idx) => {
        if(idx === group.length-1){
            // 最后一个不需要空格
            str += txt.trim()
        }else{
            str += txt.trim() + ' '
        }
    })
    return str
}

/**把一个长的字符串转成短的带...的 */
function longTextShowShort(text,size=15){
    if(!text){return text}
    let shortText = text.substring(0,size)
    if(shortText.length<text.length){
        shortText += '...'
    }
    return shortText
}



module.exports = {
    getConfigValue,
    isChinese,
    showInformationMessage,
    speakText,
    englishClearSelectionText,
    longTextShowShort
};

