
const defaultType = 'lowerCamelCase';

const fileTypeMaps = {
    'java': 'lowerCamelCase',
    'js': 'lowerCamelCase',
    'json': 'lowerCamelCase',
    'py': 'snake_case',
    'css': 'kebab-case',
    'php':'lowerCamelCase',
}

// "description": "转换成变量模式的格式：\nauto=自动识别\nPascalCase=大驼峰\nlowerCamelCase=小驼峰\nsnake_case=蛇形（下划线）\nspace=空格\nkebab-case=短横线"
const typeMaps = {
    'auto': '自动',
    'PascalCase': '大驼峰',
    'lowerCamelCase': '小驼峰',
    'snake_case': '蛇形',
    'SNAKE_CASE':'蛇形大写',
    'space': '空格',
    'kebab-case': '短横线',
}

// 英文转变成变量名
function e2var(text, filetype = 'js', forceType = '') {
    let type = defaultType;
    if(forceType){
        type = forceType
    }else{
        type = fileTypeMaps[filetype] || defaultType;
    }
    text = text.toLowerCase()
    switch (type) {
        case 'lowerCamelCase':
            // 小驼峰，首个单词小写，其他单词首字母大写
            text = text.replace(/ ([a-z])/g,function(a,b){
                return b.toUpperCase();
            })
            break;
        case 'PascalCase':
            // 大驼峰，每个单词首字母大写
            text = text.replace(/(^|\s)(\w)/g, function(match, p1, p2) {
                return p2.toUpperCase();
            });
        case 'snake_case':
            // 蛇形
            text = text.replace(/ ([a-z])/g,'_$1')
            break;
        case 'SNAKE_CASE':
            // 蛇形大写
            text = text.replace(/ ([a-z])/g,'_$1')
            text = text.toUpperCase()
            break;
        case 'space':
            // 空格
            text = text.replace(/ ([a-z])/g,' $1')
            break;
        case 'kebab-case':
            // 短横线
            text = text.replace(/ ([a-z])/g,'-$1')
            break;
    }
    if(filetype==='php'){
        // PHP替换成$开头的
        return '$' + text
    }
    return text;
}

module.exports = {e2var,typeMaps}