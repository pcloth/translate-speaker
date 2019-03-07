# 项目说明

这是一个vscode插件，功能是翻译和朗读;

项目基础代码来自于wovo插件，在wovo基础上增加了翻译功能。

朗读功能来自于say.js项目。

## 功能

翻译和朗读

## 安装方法

下载translate-speaker的vsix文件，在vscode的扩展面板里安装这个文件即可。

## 配置

  // 禁用全部功能
  "translateSpeaker.disableAll": false,

  // 允许在状态栏显示翻译。
  "translateSpeaker.translateEnabled": true,

  // 翻译显示时间
  "translateSpeaker.translateTimeout": 5000,

  // 移动光标时发声
  "translateSpeaker.voiceCursor": false,

  // 输入单词时发声
  "translateSpeaker.voiceEditing": true,

  // 切换文件时发声
  "translateSpeaker.voiceFilename": true,

  // 选定单词发声
  "translateSpeaker.voiceSelection": true
  
  // 访问google翻译站点后缀
  "translateSpeaker.origin": "cn" （ "com" or "hk"）
/**
 * 通过domain 参数修改翻译网址，默认值为cn
 * com => https://translate.google.com
 * cn => https://translate.google.cn
 * hk => https://translate.google.hk
 */
 
  // 开启调试模式
  "translateSpeaker.debug": false,
                    


