const vscode = require("vscode");
const say = require("say");

// 存储上下文引用
let globalContext = null;

// 设置全局上下文
function setGlobalContext(context) {
    globalContext = context;
}

// 获取全局存储的值
function getGlobalStorageValue(key, defaultValue = null) {
    if (!globalContext) {
        console.warn('Global context not set');
        return defaultValue;
    }
    return globalContext.globalState.get(key, defaultValue);
}

// 设置全局存储的值
function setGlobalStorageValue(key, value) {
    if (!globalContext) {
        console.warn('Global context not set');
        return;
    }
    return globalContext.globalState.update(key, value);
}

// 获取工作区存储的值
function getWorkspaceStorageValue(key, defaultValue = null) {
    if (!globalContext) {
        console.warn('Global context not set');
        return defaultValue;
    }
    return globalContext.workspaceState.get(key, defaultValue);
}

// 设置工作区存储的值
function setWorkspaceStorageValue(key, value) {
    if (!globalContext) {
        console.warn('Global context not set');
        return;
    }
    return globalContext.workspaceState.update(key, value);
}

// 检查是否应该显示某个提示（只显示一次）
function shouldShowTip(tipKey) {
    const shownTips = getGlobalStorageValue('shownTips', {});
    return !shownTips[tipKey];
}

// 标记提示已显示
function markTipAsShown(tipKey) {
    const shownTips = getGlobalStorageValue('shownTips', {});
    shownTips[tipKey] = true;
    setGlobalStorageValue('shownTips', shownTips);
}

// 获取配置参数
const getConfigValue = function (name) {
    return vscode.workspace.getConfiguration('translateSpeaker').get(name);
}
// 检测是否中文
function isChinese(text) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(text)
}

// 显示信息框
function showInformationMessage(message, code, title = '知道了') {
    return vscode.window.showInformationMessage(message, { title, code })
}

// 显示只显示一次的信息框
function showInformationMessageOnce(message, tipKey, code, title) {
    // 检查是否有tipsOnce参数，如果有则强制显示
    const tipsOnce = getConfigValue('tipsOnce');
    if (!tipsOnce || shouldShowTip(tipKey)) {
        markTipAsShown(tipKey);
        return showInformationMessage(message, code, title);
    }
    return Promise.resolve();
}

// 清除所有已显示的提示记录（用于测试）
function clearAllTips() {
    setGlobalStorageValue('shownTips', {});
}

// 清除特定提示记录（用于测试）
function clearTip(tipKey) {
    const shownTips = getGlobalStorageValue('shownTips', {});
    delete shownTips[tipKey];
    setGlobalStorageValue('shownTips', shownTips);
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
    if (!text) {
        return text;
    }
    const englishNotCodingMode = getConfigValue('englishNotCodingMode');
    if (englishNotCodingMode) {
        return text;
    }
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
    setGlobalContext,
    getGlobalStorageValue,
    setGlobalStorageValue,
    getWorkspaceStorageValue,
    setWorkspaceStorageValue,
    shouldShowTip,
    markTipAsShown,
    clearAllTips,
    clearTip,
    getConfigValue,
    isChinese,
    showInformationMessage,
    showInformationMessageOnce,
    speakText,
    englishClearSelectionText,
    longTextShowShort
};

