"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const vscode_1 = require("vscode");
const vscode = require("vscode");
const say = require("say");

const baiduTranslateApi = require('./lib/baiduapi.js');

// 获取配置参数
const getConfigValue = function (name) {
    return vscode.workspace.getConfiguration('translateSpeaker').get(name);
}


// 检测是否中文
function isChinese(text) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(text)
}

function encodeUnicode(str) {
    var res = [];
    for (var i = 0; i < str.length; i++) {
        res[i] = ("00" + str.charCodeAt(i).toString(16)).slice(-4);
    }
    return "\\u" + res.join("\\u");
}


function getTranslate({text, from, to}) {
    console.log(text, from, to, '>>>>')
    let appid = getConfigValue('appId');
    let password = getConfigValue('password');
    if(!appid || !password){
        return vscode.window.showInformationMessage('插件参数错误，没有配置appId和password')
    }
    baiduTranslateApi({text, from, to, appid, password}).then(res => {
        let data = JSON.parse(res);
        console.log(res, '>>>>')
        let items = [];
        data.trans_result.forEach(item => {
            let dst = decodeURIComponent(item.dst);
            items.push({
                label: `[ ${decodeURIComponent(text)} ] 翻译结果： [ ${dst} ]`,
                description: `点击替换`,
                dst: dst,
            });
        })
        vscode.window.showQuickPick(items).then(selection => {
            if (!selection) {
                return;
            }
            let editor = vscode_1.window.activeTextEditor;
            if(to==='en'){
                speakText(selection.dst);
            }
            editor.edit((editBuilder) => {
                editBuilder.replace(editor.selection, selection.dst);
            })
        });

    })
    return
}

function speakText(text){
    if(getConfigValue('enableSpeak')){
        say.stop();
        setTimeout(() => {
            say.speak(text);
        }, 10);
    }
}

function activate(context) {
    const command = 'extension.sayHello';
    const commandHandler = (filename) => {
        let editor = vscode_1.window.activeTextEditor;
        let doc = editor.document;
        if (editor.selection.isEmpty || !getConfigValue('enable')) {
            // 没有选中文本或者没有启用功能；
            return
        } else {
            let text = doc.getText(editor.selection);
            if (text && text.length > 1) {
                let to = 'zh'
                let from = 'en'
                // 下划线，连接线，小数点自动替换成空格
                text = text.replace(/_|-|\./g, ' ');
                if (!isChinese(text)) {
                    speakText(text)
                } else {
                    from = 'zh'
                    to = 'en'
                }
                getTranslate({text, from, to})
            }
        };
    }
    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
    return;
}

exports.activate = activate;

