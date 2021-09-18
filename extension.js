"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
const vscode_1 = require("vscode");
const vscode = require("vscode");
const say = require("say");


const cfgVoDisable = () => vscode.workspace.getConfiguration('translateSpeaker').get('disableAll');
const cfgVoFilename = () => vscode.workspace.getConfiguration('translateSpeaker').get('voiceFilename');
const cfgVoEditing = () => vscode.workspace.getConfiguration('translateSpeaker').get('voiceEditing');
const cfgVoCursor = () => vscode.workspace.getConfiguration('translateSpeaker').get('voiceCursor');
const cfgVoSelection = () => vscode.workspace.getConfiguration('translateSpeaker').get('voiceSelection');

const cfgTranslateEnabled = () => vscode.workspace.getConfiguration('translateSpeaker').get('translateEnabled');
const cfgTranslateTimeout = () => vscode.workspace.getConfiguration('translateSpeaker').get('translateTimeout');
const cfgWordMaxLength = () => vscode.workspace.getConfiguration('translateSpeaker').get('wordMaxLength');
const cfgDebug = () => vscode.workspace.getConfiguration('translateSpeaker').get('debug');
const cfgOrigin = () => vscode.workspace.getConfiguration('translateSpeaker').get('origin');

// const translate = require('google-translate-cn-api');

const baiduTranslateApi = require('./lib/baiduapi.js');

// const translate = require('./lib/google');
const md5 = require('./lib/md5.js');

// 获取配置参数
const getConfigValue = function (name) {
    return vscode.workspace.getConfiguration('translateSpeaker').get(name);
}

const appid = '20180606000172773'
const salt = 't)rans(late_Spe&ak$e!r#'
const q = 'hello'
const password = '_i2M0ux3_7rfZfSzj7BA'

let sign = md5.hex_md5(`${appid}${q}${salt}${password}`)


let edited = false // 是否刚结束编辑状态

let origin = cfgOrigin();

// 检测是否中文
function isChinese(text) {
    return /[\u4E00-\u9FA5\uF900-\uFA2D]/.test(text)
}

function getTranslate(text, from = 'auto', to = 'zh') {
    console.log(text,from,to,'>>>>')
    baiduTranslateApi(text, from, to).then(res => {
        let data = JSON.parse(res);
        console.log(res,'>>>>')
        let dst = data.trans_result[0].dst
        vscode.window.setStatusBarMessage(dst, cfgTranslateTimeout())
    })
    return
}

function activate(context) {

    const command = 'extension.sayHello';
    const commandHandler = (filename) => {
        let editor = vscode_1.window.activeTextEditor;
        let doc = editor.document;
        if (editor.selection.isEmpty) {
            return
        } else {
            let stext = doc.getText(editor.selection);
            say.stop();

            if (stext && stext.length > 1) {
                let to = 'zh'
                let from ='en'
                stext = stext.replace(/_|-/g, ' ');
                edited = false
                if (!isChinese(stext)) {
                    console.log('朗读', stext)
                    say.stop();
                    setTimeout(() => {
                        say.speak(stext);
                    }, 50);
                } else {
                    from ='zh'
                    to = 'en'
                }
                getTranslate(stext, from, to)
            }
        };
    }

    context.subscriptions.push(vscode.commands.registerCommand(command, commandHandler));
    return;
    // create a new word voice
    let wordVoice = new WordVoice();
    let controller = new WordVoiceController(wordVoice);
    // Add to a list of disposables which are disposed when this extension is deactivated.
    context.subscriptions.push(controller);
    context.subscriptions.push(wordVoice);
}

exports.activate = activate;
// exports.sayHello = sayHello;
class WordVoice {
    constructor() {
        this.WORDRE = /^[a-zA-Z_\s-]+$/;
    }

    onDidChnage() {
        if (cfgVoDisable())
            return;
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode_1.window.createStatusBarItem(vscode_1.StatusBarAlignment.Left);
        }
        // Get the current text editor
        let editor = vscode_1.window.activeTextEditor;
        if (!editor) {
            this._statusBarItem.hide();
            return;
        }
        let doc = editor.document;
        // this._statusBarItem.text = doc.fileName + " : " + doc.version;
        // this._statusBarItem.show();
        // this._statusBarItem.hide();
        //changing active editor        
        if (doc.fileName !== this._prevFilename) {
            var fname = doc.fileName.replace(/^.*[\\\/]/, "").replace(/[^A-Za-z0-9]/g, ". ") /*.replace(/[.].*$/,"")*/;
            //to avoid stopped by cursor voice, so it should voice later
            setTimeout(() => {
                say.stop(); //stop cursor voice
                if (cfgVoFilename())
                    say.speak(fname);
            }, 1);
            this._prevFilename = doc.fileName;
            this._prevVersion = doc.version;
            return;
        }
        var editing = this._prevVersion !== doc.version;
        this._prevVersion = doc.version;
        var stext;
        if (editor.selection.isEmpty) {
            var pos = editor.selection.active;
            if (pos.line == 0 && pos.character == 0)
                return;
            var char = '\n';
            if (pos.character > 0) {
                char = (doc.lineAt(pos.line).text)[pos.character - 1];
            }
            //on editing
            if (editing) {

                if (!cfgVoEditing())
                    return;
                //move back one character if cursor not in a word
                if (!this.WORDRE.test(char)) {
                    pos = new vscode.Position(pos.line + (pos.character == 0 ? -1 : 0), pos.character > 0 ? (pos.character - 1) : (doc.lineAt(pos.line - 1).text.length));
                } else {
                    edited = true
                    clearTimeout(this._delaycall);
                    this._delaycall = setTimeout(() => this.onDidChnage(), 500);
                    return;
                }
            } else if (!cfgVoCursor() && edited === false)
                return;
            var range = doc.getWordRangeAtPosition(pos, this.WORDRE);
            if (range) {
                stext = doc.getText(range);


                // vscode.window.showInformationMessage(stext)
            }
        } else {
            if (cfgVoSelection())
                stext = doc.getText(editor.selection);
        }
        if (stext && stext.length > 1500)
            return;
        //split text if has both lower and upper case
        if (stext && (stext !== stext.toLowerCase() && stext !== stext.toUpperCase())) {
            var arr = [];
            var word = "";
            for (var s of stext) {
                if (s === s.toUpperCase()) {
                    arr.push(word);
                    word = "";
                }
                word += s;
            }
            arr.push(word);
            stext = arr.join(" ");
        }
        say.stop();
        if (stext && stext.length > 1 && stext.length <= cfgWordMaxLength() && this.WORDRE.test(stext)) {
            stext = stext.replace(/_|-/g, ' ');
            edited = false
            if (!isChinese(stext)) {

                setTimeout(() => {
                    say.stop(); //stop cursor voice
                    say.speak(stext);
                }, 50);
                // say.speak(stext);
            }
            if (cfgTranslateEnabled()) {
                // 显示翻译
                getTranslate(stext)
            }

        }
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
        vscode_1.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        vscode_1.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        // create a combined disposable from both event subscriptions
        this._disposable = vscode_1.Disposable.from(...subscriptions);
    }
    dispose() {
        this._disposable.dispose();
    }
    _onEvent() {
        this._wordVoice.onDidChnage();
    }
}
//# sourceMappingURL=extension.js.map