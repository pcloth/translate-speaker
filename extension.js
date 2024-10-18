"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const vscode = require("vscode");
const baiduTranslateApi = require('./lib/baiduapi.js');
const tengxunTranslateApi = require('./lib/txApi.js');
const freeApi = require('./lib/freeApi.js');
const { e2var, typeMaps } = require('./lib/englishToVariable.js');
const { getConfigValue, isChinese, showInformationMessage, speakText, englishClearSelectionText, longTextShowShort } = require('./lib/common.js');

let $event = {
    fileExtension: '', // 文件后缀，用来确定输出英文格式
    results: { text: '', from: '', to: '', results: [] }, // 翻译结果
}

// 执行翻译
function getTranslate({ text, from, to }) {
    let apiType = getConfigValue('apiType');
    // 旧方案
    let appid = getConfigValue('appId');
    let password = getConfigValue('password');
    const apiAccount = getConfigValue('apiAccount') || [];
    if (appid) {
        // console.log('还在使用旧账号配置', appid, password)
        // 提示用户升级配置
        vscode.window.showInformationMessage(
            '插件配置已经升级，请删除translateSpeaker.appId和translateSpeaker.password配置，使用apiAccount配置', 
            { title: '查看文档', code: 100 }
        ).then((res) => {
            if (res && res.code === 100) {
                vscode.env.openExternal(vscode.Uri.parse('https://github.com/pcloth/translate-speaker'));
            }
        })
    }
    const accountList = apiAccount.filter(row => row.split('=')[0] === apiType)
    const apiAccountKey = getConfigValue('apiAccountKey');
    accountList.forEach(row => {
        const group = row.split('=')
        const account = group[1].split(',')
        if (apiAccountKey && account.length === 3) {
            if (account[2] === apiAccountKey) {
                appid = account[0]
                password = account[1]
            }
        } else {
            appid = account[0]
            password = account[1]
        }
    })
    if(!appid && apiType==='bing'){
        // 内置一个外区免费appid（不保证长期可用）
        appid = 'AFC76A66CF4F434ED080D245C30CF1E71C22959C'
    }
    // console.log('apiAccount', appid, password, accountList,apiType,apiAccountKey)
    return new Promise((resolve, reject) => {
        if (apiType === 'googleFree') {
            // 谷歌免费接口
            return freeApi.googleFreeApi({ text, from, to, appid, password }).then(data => {
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
            if (apiType === 'baidu') {
                if (!appid || !password) {
                    return showInformationMessage('插件参数错误，没有配置apiAccount', 100)
                }
                // 百度注册接口
                return baiduTranslateApi({ text, from, to, appid, password }).then(data => {
                    // let data = JSON.parse(res);
                    let params = { text, from, to, results: data.trans_result || data }
                    resolve(params)
                }).catch(res => {
                    showInformationMessage(res.message || JSON.stringify(res.response))
                })
            }
            if (apiType === 'tencent') {
                if (!appid || !password) {
                    return showInformationMessage('插件参数错误，没有配置apiAccount', 100)
                }
                if(appid.length!==36){
                    return showInformationMessage('腾讯翻译接口appid错误，appid位置需要配置SecretId，请检查', 100)
                }
                // 腾讯接口
                return tengxunTranslateApi({ text, from, to, appid, password }).then(data => {
                    let results = [{dst: data}]
                    let params = { text, from, to, results: results || data }
                    resolve(params)
                }).catch(res => {
                    showInformationMessage(res.message || JSON.stringify(res.response))
                })
            }
            if (['bing'].includes(apiType)) {
                if (!appid) {
                    return showInformationMessage('插件参数错误，没有配置apiAccount', 100)
                }
                // 必应接口
                return freeApi.bingFreeApi({ text, from, to, appid, password }).then(res => {
                    const results = [{ dst: res }]
                    const params = { text, from, to, results: results || res }
                    resolve(params)
                }).catch(error => {
                    reject(error)
                })
            }
        }

    })
}

/** 
 * 格式化pickerItem
 */
function formatPickerItem(options) {
    let {
        type,
        typeName='',
        text,
        dst,
        description,
        outText
    } = options    
    let midstr = ''
    if(['coding','replace'].includes(type)){
        midstr='替换'
    }else if(type==='append'){
        midstr='追加'
        outText = `${text} [ ${dst} ]`
    }
    if(typeName){
        typeName =`(${typeName})`
    }
    options.shortOutText = longTextShowShort(outText)
    options.midstr = midstr
    options.typeName = typeName
    options.outText = outText
    const pickLabelFormat = getConfigValue('pickLabelFormat')||'{num} [ {shortText} ] {midstr}{typeName} => [ {shortOutText} ]'
    let label = ''
    // console.log(pickLabelFormat,'pickLabelFormat')
    if(pickLabelFormat){
        label = pickLabelFormat
        // 正则获取变量名称
        const reg = /\{(.*?)\}/g
        const arr = pickLabelFormat.match(reg)
        arr.forEach(row=>{
            const key = row.replace('{','').replace('}','')
            const value = options[key] || ''
            label = label.replace(row,value)
        })
    }
    const showPickDesc = getConfigValue('showPickDesc')
    if(!showPickDesc){
        description = ''
    }
    
    return {
        original: text,
        label: label,
        description: description,
        dst: dst,
        outText: outText,
    }
}

// coding模式处理翻译结果
function translateResultsCodingMode({ text, from, to, results }, options = { replace: true, append: true }) {
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
                    if (codingFormat.length === 0) {
                        codingFormat.push('auto')
                    }
                    let description = ''
                    codingFormat.forEach(fmType => {
                        const typeName = typeMaps[fmType] || '-error-'
                        if (fmType === 'auto') {
                            outText = e2var(dst, $event.fileExtension);
                            description = `根据（当前文件扩展名）确定格式化类型，并替换当前选中字符串`
                        } else {
                            outText = e2var(dst, '', fmType);
                            description = `替换选中字符串为（${typeName}）格式化后的字符串`
                        }
                        items.push(formatPickerItem({
                            type,
                            typeName,
                            text,
                            num,
                            shortText,
                            shortDst,
                            dst,
                            description,
                            outText
                        }))
                        // items.push({
                        //     original: text,
                        //     label: `${num} [ ${shortText} ] 替换(${typeName}) => [ ${longTextShowShort(outText)} ]`,
                        //     description: description,
                        //     dst: dst,
                        //     outText: outText,
                        // });
                        num += 1
                    })
                }
                // 原文替换
                if (type === 'replace' && options.replace) {
                    items.push(formatPickerItem({
                        type,
                        typeName:'',
                        text,
                        num,
                        shortText,
                        shortDst,
                        dst,
                        description: `替换选中字符串`,
                        outText
                    }))

                    // items.push({
                    //     original: text,
                    //     label: `${num} [ ${shortText} ] 替换 => [ ${shortDst} ]`,
                    //     description: `替换选中字符串`,
                    //     dst: dst,
                    //     outText: dst,
                    // });
                    num += 1
                }

                // 原文追加
                if (type === 'append' && options.append) {
                    items.push(formatPickerItem({
                        type,
                        typeName:'',
                        text,
                        num,
                        shortText,
                        shortDst,
                        dst,
                        description: `保留原文并在后方[]中加入翻译`,
                        outText
                    }))
                    // items.push({
                    //     original: text,
                    //     label: `${num} [ ${shortText} ] 追加 => [ ${shortDst} ]`,
                    //     description: `保留原文并在后方[]中加入翻译`,
                    //     dst: dst,
                    //     outText: `${text} [ ${dst} ]`,
                    // });
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
            },
            {
                command: "extension.convertVariableFormat",
                handler: 'startConvertVariableFormat',
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

    // 获取选中文本
    _getSelectionText() {
        const editor = vscode.window.activeTextEditor;
        const doc = editor.document;
        if (doc) {
            const g = doc.fileName.split('.')
            $event.fileExtension = g[g.length - 1]
        }
        if (editor.selection.isEmpty) { return '' }
        return doc.getText(editor.selection)
    }

    // 用户主动点击了翻译按钮
    startTranslateCommandHandler() {
        if (!getConfigValue('enable')) {
            return showInformationMessage('请先启用插件enable参数', 100)
        }
        let text = this._getSelectionText()
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
    }

    // 用户点击了左下角的状态栏
    statusClickcommandHandler() {
        if (!$event.results.text) { return; }
        translateResultsCodingMode($event.results)
    }

    // 用户点击了转换变量格式菜单
    startConvertVariableFormat() {
        if (!getConfigValue('enable')) {
            return showInformationMessage('请先启用插件enable参数', 100)
        }
        const originText = this._getSelectionText()
        let text = originText
        if (originText) {
            text = this._convertVariablesToWords(originText)
            translateResultsCodingMode(
                { text: originText, from: 'en', to: 'en', results: [{ dst: text }] },
                { append: false, replace: false }
            )
        }
    }

    _convertVariablesToWords(text) {
        // 判断命名格式
        if (/^[a-z][a-zA-Z0-9]*$/.test(text)) {
            // 小驼峰命名格式
            return text.replace(/([A-Z])/g, ' $1').toLowerCase();
        } else if (/^[A-Z][a-zA-Z0-9]*$/.test(text)) {
            // 大驼峰命名格式
            return text.replace(/([A-Z])/g, ' $1').trim().toLowerCase();
        } else if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(text)) {
            // 下划线（蛇形）命名格式
            return text.replace(/_/g, ' ').toLowerCase();
        } else if (/^[a-zA-Z][a-zA-Z0-9\-]*$/.test(text)) {
            // 短横线命名格式
            return text.replace(/-/g, ' ').toLowerCase();
        } else {
            // 无法识别的格式，返回原始文本
            return text;
        }
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