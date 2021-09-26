
const defaultType = 'lowerCamelCase';

const typeMaps = {
    'java': 'lowerCamelCase',
    'js': 'lowerCamelCase',
    'json': 'lowerCamelCase',
    'py': 'snake_case',
    'css': 'kebab-case',
    'php':'lowerCamelCase',
}

// 英文转变成变量名
function e2var(text, filetype = 'js') {
    let type = typeMaps[filetype] || defaultType;
    text = text.toLowerCase()
    switch (type) {
        case 'lowerCamelCase':
            text = text.replace(/ ([a-z])/g,function(a,b){
                return b.toUpperCase();
            })
            break;
        case 'snake_case':
            text = text.replace(/ ([a-z])/g,'_$1')
            break;
        case 'kebab-case':
            text = text.replace(/ ([a-z])/g,'-$1')
            break;
    }
    if(filetype==='php'){
        // PHP替换成$开头的
        return '$' + text
    }
    return text;
}

module.exports = e2var