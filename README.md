# 项目说明

这是一个vscode插件，功能是翻译和朗读，并可以快速的替换翻译内容；

## 更新说明
2023-09-06 升级到 1.5.2 版本
1. 移除youdaoFree接口
2. 添加bing接口，并设置为了默认


2023-08-23 更新到 1.5.1

1. 添加了`codingFormat`参数，当`pickTypeAndSort`参数中有`coding`的时候生效，将在coding的模式下对字符串进行格式化，如果全部清空将使用`auto`
转换成变量模式的格式：

> `auto`=自动识别

> `PascalCase`=大驼峰

> `lowerCamelCase`=小驼峰

> `snake_case`=蛇形（下划线）

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

|参数名字|类型|默认值|说明|
|---|---|---|---|
|enable | boolean | true | 是否启用插件功能 |
|enableSpeak | boolean | true | 是否启用语音朗读 |
|apiType | string | 'bing'| 接口类型，目前支持：baidu=百度翻译api(需要账号)，bing=必应，googleFree=谷歌（需要VPN） |
|appId  | string | 无 | 翻译API的账号 |
|password  | string | 无 | 翻译API的密钥 |
|mode|string|manual|工作模式：manual=手动，autoEnglish=自动翻译英文，autoChinese=自动翻译中文，auto=自动中英文转换|
|translateTimeout|number|15000|翻译结果在左下角状态栏显示多长时间（毫秒）|
|wordMaxLength|number|34|超过这个长度的字符串不处理|
|pickTypeAndSort|array|["coding","replace","append"]|配置拾取器排序
|codingFormat|array|["auto","PascalCase","lowerCamelCase","snake_case","space","kebab-case"]|配置当pickTypeAndSort中包含有coding的时候的格式化拾取器排序

### 百度翻译API配置
如何获取百度翻译API的账号
https://blog.csdn.net/zhebushibiaoshifu/article/details/115682054

百度翻译接口文档
https://api.fanyi.baidu.com/product/113



