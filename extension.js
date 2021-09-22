"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const vscode = require("vscode");
const say = require("say");
const baiduTranslateApi = require('./lib/baiduapi.js');
const freeApi = require('./lib/freeApi.js');
const e2var = require('./lib/englishToVariable.js');

// const youdaoFreeApi = require('./lib/freeApi.js');

let $event = {
    fileExtension:'', // 文件后缀，用来确定输出英文格式
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
function showInformationMessage(message, code){
    return vscode.window.showInformationMessage(message,{title:'知道了',code}).then(res=>{
        console.log(res,'showOpenDialog')
    })
}

// 执行翻译
function getTranslate({ text, from, to }) {
    let apiType = getConfigValue('apiType');
    let appid = getConfigValue('appId');
    let password = getConfigValue('password');

    if(apiType==='youdaoFree'){
        // 有道免费接口
        return freeApi.youdaoFreeApi({ text, from, to, appid, password }).then(res=>{
            let data = JSON.parse(res);
            console.log(res,'>>>>youdaoFree')
            let results = []
            data.translateResult.forEach(row=>{
                for(let i in row){
                    results.push({
                        dst:row[i].tgt
                    })
                }
            })
            translateResults({ text, from, to, results: results || res });
        }).catch(res=>{
            showInformationMessage(res.message||JSON.stringify(res.response))
        })
    }else if(apiType==='googleFree'){
        // 谷歌免费接口
        return freeApi.googleFreeApi({ text, from, to, appid, password }).then(res=>{
            let data = JSON.parse(res);
            console.log(res,'>>>>googleFree')
            let results = []
            data.sentences.forEach(row=>{
                results.push({
                    dst:row.trans
                })
            })
            translateResults({ text, from, to, results: results || res });
        }).catch(res=>{
            showInformationMessage(res.message||JSON.stringify(res.response))
        })
    }else{
        // 以下是注册接口，需要配置id和密钥
        if (!appid || !password) {
            return showInformationMessage('插件参数错误，没有配置appId和password',100)
        }
        if(apiType==='baidu'){
            // 百度注册接口
            return baiduTranslateApi({ text, from, to, appid, password }).then(res => {
                let data = JSON.parse(res);
                translateResults({ text, from, to, results: data.trans_result || data });
            }).catch(res=>{
                showInformationMessage(res.message||JSON.stringify(res.response))
            })
        }
    }
}

// 处理翻译结果
function translateResults({ text, from, to, results }) {
    if (results) {
        let items = [];
        results.forEach((item, index) => {
            let dst = decodeURIComponent(item.dst);
            let num = index + 1;
            items.push({
                label: `${num} [ ${decodeURIComponent(text)} ] 翻译结果： [ ${dst} ]`,
                description: `点击或者输入${num}替换选中字符串`,
                dst: dst,
            });
        })
        vscode.window.showQuickPick(items).then(selection => {
            if (!selection) {
                return;
            }
            let editor = vscode.window.activeTextEditor;
            let newText = selection.dst
            if (to === 'en') {
                if(getConfigValue('formatEnglish')){
                    newText = e2var(selection.dst, $event.fileExtension)
                }
                speakText(selection.dst);
            }
            editor.edit((editBuilder) => {
                editBuilder.replace(editor.selection, newText);
            })
        });
    } else {
        return showInformationMessage(`翻译失败：${JSON.stringify(results)}`,102)
    }
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


// 激活扩展
function activate(context) {
    const command = 'extension.startTranslate';
    const commandHandler = (event) => {
        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        if(doc){
            let g = doc.fileName.split('.')
            $event.fileExtension = g[g.length-1]
        }
        if (editor.selection.isEmpty || !getConfigValue('enable')) {
            // 没有选中文本或者没有启用功能；
            return
        } else {
            let text = doc.getText(editor.selection);
            if (text && text.length > 1) {
                let to = 'zh'
                let from = 'en'
                // 驼峰替换成空格
                if(!/^[A-Z]+$/.test(text)){
                    text = text.replace(/([A-Z])/g," $1");
                }
                // 下划线，连接线，小数点自动替换成空格
                text = text.replace(/_|-|\./g, ' ');
                if (!isChinese(text)) {
                    speakText(text)
                } else {
                    from = 'zh'
                    to = 'en'
                }
                getTranslate({ text, from, to })
            }
        };
    }
    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
    return;
}

exports.activate = activate;

