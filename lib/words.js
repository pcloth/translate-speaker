const vscode = require("vscode");
const { getConfigValue,isChinese } = require('./common.js');
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
let edited = false // 是否刚结束编辑状态

let origin = cfgOrigin();


class WordVoice {
    constructor() {
        this.WORDRE = /^[a-zA-Z_\s-]+$/;
    }

    onDidChnage() {
        if (cfgVoDisable())
            return;
        // Create as needed
        if (!this._statusBarItem) {
            this._statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
        }
        // Get the current text editor
        let editor = vscode.window.activeTextEditor;
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
            var fname = doc.fileName.replace(/^.*[\\\/]/, "").replace(/[^A-Za-z0-9]/g, ". ") /*.replace(/[.].*$/,"")*/ ;
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
        vscode.window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);
        vscode.window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        // create a combined disposable from both event subscriptions
        this._disposable = vscode.Disposable.from(...subscriptions);
    }
    dispose() {
        this._disposable.dispose();
    }
    _onEvent() {
        this._wordVoice.onDidChnage();
    }
}

module.exports = {
    WordVoice,
    WordVoiceController
}