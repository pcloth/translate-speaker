"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const vscode = require("vscode");
const baiduTranslateApi = require('./lib/baiduapi.js');
const freeApi = require('./lib/freeApi.js');
const {e2var,typeMaps} = require('./lib/englishToVariable.js');
const { getConfigValue, isChinese, showInformationMessage, speakText, englishClearSelectionText, longTextShowShort } = require('./lib/common.js');

let $event = {
    fileExtension: '', // 文件后缀，用来确定输出英文格式
    results: { text: '', from: '', to: '', results: [] }, // 翻译结果
}

// 执行翻译
function getTranslate({ text, from, to }) {
    let apiType = getConfigValue('apiType');
    let appid = getConfigValue('appId');
    let password = getConfigValue('password');
    return new Promise((resolve, reject) => {
        if (apiType === 'youdaoFree') {
            // 有道免费接口
            return freeApi.youdaoFreeApi({ text, from, to, appid, password }).then(res => {
                let data = JSON.parse(res);
                let results = []
                data.translateResult.forEach(row => {
                    for (let i in row) {
                        results.push({
                            dst: row[i].tgt
                        })
                    }
                })
                let params = { text, from, to, results: results || res }
                resolve(params)
            }).catch(res => {
                showInformationMessage(res.message || JSON.stringify(res.response))
            })
        } else if (apiType === 'googleFree') {
            // 谷歌免费接口
            return freeApi.googleFreeApi({ text, from, to, appid, password }).then(res => {
                let data = JSON.parse(res);
                let results = []
                data.sentences.forEach(row => {
                    results.push({
                        dst: row.trans
                    })
                })
                let params = { text, from, to, results: results || res }
                resolve(params)
            }).catch(res => {
                showInformationMessage(res.message || JSON.stringify(res.response))
            })
        } else {
            // 以下是注册接口，需要配置id和密钥
            if (!appid || !password) {
                return showInformationMessage('插件参数错误，没有配置appId和password', 100)
            }
            if (apiType === 'baidu') {
                // 百度注册接口
                return baiduTranslateApi({ text, from, to, appid, password }).then(res => {
                    let data = JSON.parse(res);
                    let params = { text, from, to, results: data.trans_result || data }
                    resolve(params)
                }).catch(res => {
                    showInformationMessage(res.message || JSON.stringify(res.response))
                })
            }
        }

    })
}

// coding模式处理翻译结果
function translateResultsCodingMode({ text, from, to, results }) {
    if (results) {
        let items = [];
        let num = 1;
        text = decodeURIComponent(text)
        const shortText = longTextShowShort(text, 5)
        const pickTypeAndSort = getConfigValue('pickTypeAndSort') || [];
        if (!pickTypeAndSort.length) {
            // 预防用户配置空
            pickTypeAndSort.push('replace')
        }

        results.forEach(item => {
            let dst = decodeURIComponent(item.dst).toLowerCase();
            let shortDst = longTextShowShort(dst)
            let outText = dst;

            // 根据类型排序生成pick数据
            pickTypeAndSort.forEach(type => {
                // coding 模式
                if (type === 'coding' && to === 'en') {
                    const codingFormat = getConfigValue('codingFormat') || [];
                    if(codingFormat.length===0){
                        codingFormat.push('auto')
                    }
                    let description = ''
                    codingFormat.forEach(fmType=>{
                        const typeName = typeMaps[fmType]||'-error-'
                        if(fmType==='auto'){
                            outText = e2var(dst, $event.fileExtension);
                            description = `根据（当前文件扩展名）确定格式化类型，并替换当前选中字符串`
                        }else{
                            outText = e2var(dst, '', fmType);
                            description = `替换选中字符串为（${typeName}）格式化后的字符串`
                        }
                        items.push({
                            original: text,
                            label: `${num} [ ${shortText} ] 替换(${typeName}) => [ ${longTextShowShort(outText)} ]`,
                            description: description,
                            dst: dst,
                            outText: outText,
                        });
                        num += 1
                    })
                }
                // 原文替换
                if (type === 'replace') {
                    items.push({
                        original: text,
                        label: `${num} [ ${shortText} ] 替换 => [ ${shortDst} ]`,
                        description: `替换选中字符串`,
                        dst: dst,
                        outText: dst,
                    });
                    num += 1
                }

                // 原文追加
                if (type === 'append') {
                    items.push({
                        original: text,
                        label: `${num} [ ${shortText} ] 追加 => [ ${shortDst} ]`,
                        description: `保留原文并在后方[]中加入翻译`,
                        dst: dst,
                        outText: `${text} [ ${dst} ]`,
                    });
                    num += 1
                }
            })
        })
        // 点击了快速选择框
        vscode.window.showQuickPick(items).then(selection => {
            if (!selection) {
                showInformationMessage('请选中一个项目')
                return;
            }
            let editor = vscode.window.activeTextEditor;
            let newText = selection.outText
            if (to === 'en' && getConfigValue('enableSpeak')) {
                try {
                    speakText(selection.dst);
                } catch (error) {

                }
            }
            editor.edit((editBuilder) => {
                editBuilder.replace(editor.selection, newText);
            })
        });
    } else {
        return showInformationMessage(`翻译失败：${JSON.stringify(results)}`, 102)
    }
}

class WordVoice {
    constructor(context) {
        this.results = {}
        this.context = context
        this.timer = null
        this._commands = [
            {
                command: 'extension.startTranslate',
                handler: 'startTranslateCommandHandler',
            },
            {
                command: 'extension.statusBarClick',
                handler: 'statusClickcommandHandler',
            }
        ]
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
            this._statusBarItem.command = 'extension.statusBarClick'
            this.initStatusBarItemText()
            this._statusBarItem.show();
        }
        this._commandsInstantiateObject = this._initCommand()
    }

    // 执行翻译并显示结果
    startWorking(text, showQuickPick = false) {
        let to = 'zh'
        let from = 'en'
        if (!isChinese(text)) {
            text = englishClearSelectionText(text)
            speakText(text)
        } else {
            from = 'zh'
            to = 'en'
        }
        getTranslate({ text, from, to }).then(res => {
            let { text, from, to, results } = res
            let outDst = ''
            results.forEach((item, index) => {
                let dst = decodeURIComponent(item.dst);
                outDst = dst;
            })
            $event.results = res;
            this.setStatusBarItemText(`${text} | ${outDst}`)
            // 显示quickpick菜单
            if (showQuickPick) {
                translateResultsCodingMode(res)
            }
        })
    }

    // 初始化状态栏
    initStatusBarItemText() {
        this._statusBarItem.text = `翻译朗读者就绪( ${getConfigValue('mode')} | ${getConfigValue('apiType')} )`;
        $event.results = { text: '', from: '', to: '', results: [] } // 翻译结果清空
    }

    // 设置状态栏
    setStatusBarItemText(text) {
        let dt = getConfigValue('translateTimeout');
        this._statusBarItem.text = text
        setTimeout(() => {
            this.initStatusBarItemText()
        }, dt)
    }

    // 用户主动点击了翻译按钮
    startTranslateCommandHandler() {
        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        if (doc) {
            let g = doc.fileName.split('.')
            $event.fileExtension = g[g.length - 1]
        }
        if (editor.selection.isEmpty || !getConfigValue('enable')) {
            // 没有选中文本或者没有启用功能；
            return
        } else {
            let text = doc.getText(editor.selection);
            if (text && text.length > 1 && text.length <= getConfigValue('wordMaxLength')) {
                let to = 'zh'
                let from = 'en'
                if (!isChinese(text)) {
                    text = englishClearSelectionText(text)
                    speakText(text)
                } else {
                    from = 'zh'
                    to = 'en'
                }

                this.throttleRun(text, true)
            }
        };
    }

    // 用户点击了左下角的状态栏
    statusClickcommandHandler() {
        if (!$event.results.text) { return; }
        translateResultsCodingMode($event.results)
    }

    // 初始化指令
    _initCommand() {
        let arr = []
        this._commands.forEach(cmd => {
            let obj = vscode.commands.registerCommand(cmd.command, () => {
                this[cmd.handler]()
            })
            this.context.subscriptions.push(obj);
            arr.push(obj)
        })
        return arr;
    }

    onDidChanage() {
        let editor = vscode.window.activeTextEditor;
        let doc = editor.document;
        if (editor.selection.isEmpty || !getConfigValue('enable')) {
            // 没有选中文本或者没有启用功能；
            return
        }
        // 手动不执行
        let mode = getConfigValue('mode');
        if (mode === 'manual') { return; }
        // Create as needed
        var text = doc.getText(editor.selection);
        if (
            text && text.length > 1 && text.length <= getConfigValue('wordMaxLength') && (
                // 全自动|| 自动英文 || 自动中文
                mode === 'auto' || (mode === 'autoEnglish' && !isChinese(text)) || (mode === 'autoChinese' && isChinese(text))
            )
        ) {
            // if($event.results.from===text||)
            this.throttleRun(text, false)
        }
        return
    }

    throttleRun(text, showQuickPick) {
        let results = $event.results.results;
        if (!showQuickPick && ($event.results.text == text || results.length && results[0].dst == text)) {
            // 如果不是手动要求翻译，判断一下是否已经翻译过了，翻译过了的词不处理。
            return
        }

        if (this.timer) {
            clearTimeout(this.timer)
        }
        this.timer = setTimeout(() => {
            this.startWorking(text, showQuickPick)
        }, 500)
    }

    dispose() {
        this._statusBarItem.dispose();
    }
}

class WordVoiceController {
    constructor(wordVoice) {
        this._wordVoice = wordVoice;
        // subscribe to selection change and editor activation events
        let subscriptions = [];
        // vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }
    dispose() {
        this._disposable.dispose();
    }
    _startTranslateCommandHandler() {
        this._wordVoice.startTranslateCommandHandler();
    }
    _onEvent(e) {
        this._wordVoice.onDidChanage();
    }
}

// 激活扩展
function activate(context) {

    let wordVoice = new WordVoice(context);
    let controller = new WordVoiceController(wordVoice);
    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(controller);
    context.subscriptions.push(wordVoice);
}

exports.activate = activate;