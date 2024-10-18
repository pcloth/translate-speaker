# 项目说明

这是一个vscode插件，功能是翻译和朗读，并可以快速的替换翻译内容；

## 更新说明
2024-10-16 升级到 1.7.3 版本
1. 添加了pickerLabel的格式化参数`translateSpeaker.pickLabelFormat`
2. 添加了picker描述字段是否显示参数`translateSpeaker.showPickDesc`

2024-10-12 升级到 1.7.0 版本
1. 添加了全新的账号参数`translateSpeaker.apiAccount`
2. 可以同时添加不同apiType的账号，并可以为同一个apiType添加多个账号

2023-11-02 升级到 1.6.1 版本
1. 添加了 `SNAKE_CASE`=大写蛇形（下划线）

2023-09-16 升级到 1.6.0 版本
1. 添加了`转换变量格式并朗读`菜单功能，当你选中一个变量名的时候，会根据
`codingFormat`参数转换变量格式

2023-09-06 升级到 1.5.2 版本
1. 移除youdaoFree接口
2. 添加bing接口，并设置为了默认


2023-08-23 更新到 1.5.1

1. 添加了`codingFormat`参数，当`pickTypeAndSort`参数中有`coding`的时候生效，将在coding的模式下对字符串进行格式化，如果全部清空将使用`auto`
转换成变量模式的格式：

> `auto`=自动识别

> `PascalCase`=大驼峰

> `lowerCamelCase`=小驼峰

> `snake_case`=小写蛇形（下划线）

> `space`=空格

> `kebab-case`=短横线

2023-04-15 
1. 更新文档

2023-02-23 更新到 1.5.0

1. 添加`pickTypeAndSort`参数，配置拾取器和排序，默认排序和内容如下：

> `coding` = 转换成变量模式

> `replace` = 直接替换原文

> `append` = 在原文后面追加翻译

2. 取消了formatEnglish参数



## 用法：
1. 安装并启用本插件；
2. 选择并配置翻译接口参数，目前支持baidu翻译api;
3. 在编辑器中选中要翻译的中文或者英文内容，鼠标右键点击：翻译并朗读
4. 如果配置正确，会弹出翻译列表，选中一条翻译结果，就可以替换文本了；

## 配置

|参数名字|类型|默认值|<div style="min-width:300px;">说明</div>|
|---|---|---|---|
|enable | boolean | true | 是否启用插件功能 |
|enableSpeak | boolean | true | 是否启用语音朗读 |
|apiType | string | 'bing'| 接口类型，目前支持：`baidu`=百度翻译api(需要账号)，`bing`=必应(可以添加账号)，`tencent`=腾讯(需要账号)，`googleFree`=谷歌（需要VPN） |
|appId  | string | 无 | 翻译API的账号 |
|password  | string | 无 | 翻译API的密钥 |
|mode|string|manual|工作模式：manual=手动，autoEnglish=自动翻译英文，autoChinese=自动翻译中文，auto=自动中英文转换|
|translateTimeout|number|15000|翻译结果在左下角状态栏显示多长时间（毫秒）|
|wordMaxLength|number|34|超过这个长度的字符串不处理|
|pickTypeAndSort|array|["coding","replace","append"]|配置拾取器排序|
|codingFormat|array|["auto","PascalCase","lowerCamelCase","snake_case","space","kebab-case"]|配置当pickTypeAndSort中包含有coding的时候的格式化拾取器排序|
|apiAccount|array|["bing=AFC76A66CF4F434ED080D245C30CF1E71C22959C,,1"]|多账号配置|
|pickLabelFormat|string|`{num} [ {shortText} ] {midstr}{typeName} => [ {shortOutText} ]`|拾取器的显示格式|
|showPickDesc|boolean|true|是否显示拾取器的描述|

### 多账号配置参数格式

`apiType=appId,password,key`

其中：apiType就是`apiType`参数的内容，appId和password就是该接口需要的配置
`key`是如果存在多个账号切换，需要配置`apiAccountKey`和这个key对照。
比如：
```json
{
    "translateSpeaker.apiAccount":[
        "baidu=你的appid,你的password,",
        "tencent=你的SecretId,你的SecretKey,",
        "bing=AFC76A66CF4F434ED080D245C30CF1E71C22959C,,1",
        "bing=A4D660A48A6A97CCA791C34935E4C02BBB1BEC1C,,2",
    ],
    "translateSpeaker.apiAccountKey":"2"
}
```

apiAccountKey="2"表示，当如果apiType切换到了bing，使用第2个appid作为配置（配置中最后一段的字符串）

### 目前支持的几种apiType
|apiType|提供方|免费额度|官方文档|
|---|---|---|---|
|baidu|百度|标准版：每月5万字符（QPS=1），高级版：每月100万字符(QPS=10)，尊享版:每月200万字符(QPS=100)|https://api.fanyi.baidu.com/product/112|
|tencent|腾讯|每月500万字符(QPS=5)|https://cloud.tencent.com/document/api/551/15619
|bing|微软bing|内置了需要vpn的appid，你也可以自己申请（找一个）账号|V2版本已经绝版，且用且珍惜|
|googleFree|谷歌|需要vpn||





