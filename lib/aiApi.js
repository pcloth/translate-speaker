const {service} = require('./request.js');

const systemPrompt = "你是一个专业的翻译助手MCP。\n"+           
            "请将以下文本翻译成目标语言，并按照翻译质量从高到低的顺序提供最多3个翻译结果。\n\n" +
            "要求：\n" +
            "1. 翻译要准确、自然、符合目标语言的表达习惯 \n"+
            "2. 按照翻译质量优先级排序，最好提供一个翻译最好的结果\n" +
            "3. 搜索时请不要丢失用户提问信息，尽量保持提问内容的完整性。\n"+
            "4. 当用户提问中涉及日期相关内容时，请直接使用搜索功能进行搜索，禁止插入具体时间。\n"+
            "5. 返回结果必须是合法的JSON字符串，不得包含其他的任何描述！\n\n" +
            "请直接返回JSON格式的翻译结果数组，格式如下：\n" +
            "[\n" +
            "  {\"translation\": \"最优翻译结果\"},\n" +
            "  {\"translation\": \"次优翻译结果\"},\n" +
            "  {\"translation\": \"第三优翻译结果\"}\n" +
            "]";


/**
 * 本地AI大模型翻译请求
 * @param {Object} params - 翻译参数
 * @param {string} params.text - 需要翻译的文本
 * @param {string} params.from - 源语言 
 * @param {string} params.to - 目标语言
 * @param {string} params.appid - LLM模型服务URL
 * @param {string} params.password - LLM模型服务token
 * @returns {Promise<Array>} 翻译结果数组
 */
function translateWithLLM(params) {
    var text = params.text;
    var from = params.from;
    var to = params.to;
    var appid = params.appid;
    var password = params.password;

    // appid构造可以 modelName@host:port
    // 例如：gemma-2-9b-it@http://localhost:your-port
    if (!appid || !appid.includes('@')) {
        return Promise.reject(new Error('无效的appid格式，appid构造格式：modelName@host:port,例如 gemma-2-9b-it@http://127.0.0.1:1234'));
    }
    var modelName = appid.split('@')[0];
    var host = appid.split('@')[1];
    return new Promise(function(resolve, reject) {
        // 构造OpenAI兼容的提示词
        var prompt = `请将原文[${text}]从[${from}]翻译成[${to}]`;

        // 构造OpenAI兼容的请求体
        var requestBody = {
            model: modelName,//"gemma-2-9b-it", // 可以根据实际模型调整
            messages: [
                {
                    role: "system",
                    content: systemPrompt
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.2, // 降低随机性，提高翻译一致性
            max_tokens: 2000,
            top_p: 1,
            frequency_penalty: 0,
            presence_penalty: 0,
            stream: false // 明确指定不使用流式响应
        };

        // 发送请求到本地AI模型服务
        var headers = {
            'Content-Type': 'application/json'
        };
        if(password){
            headers['Authorization'] = 'Bearer ' + password;
        }
        
        // 使用service发送请求，设置更长的超时时间
        service({
            method: 'POST',
            url: host + '/v1/chat/completions',
            headers: headers,
            data: requestBody,
            timeout: 60000 // 60秒超时
        })
            .then(function(response) {
                // 解析响应
                if (response && response.choices && response.choices.length > 0) {
                    var content = response.choices[0].message.content;
                    
                    try {
                        // 尝试解析JSON响应
                        var translations = JSON.parse(content);
                        
                        // 验证响应格式
                        if (Array.isArray(translations)) {
                            var result = translations.map(function(item) {
                                return {
                                    dst: item.translation || item.text || item
                                };
                            }).slice(0, 3); // 确保最多3个结果
                            resolve(result);
                        } else {
                            // 如果不是数组格式，将整个内容作为单个翻译结果
                            resolve([{ dst: content }]);
                        }
                    } catch (parseError) {
                        // 如果JSON解析失败，将内容作为单个翻译结果
                        resolve([{ dst: content }]);
                    }
                } else {
                    reject(new Error('AI模型返回了无效的响应'));
                }
            })
            .catch(function(error) {
                console.error('本地AI翻译请求失败:', error);
                reject(new Error('翻译失败: ' + error.message));
            });
    });
}

module.exports = {
    translateWithLLM: translateWithLLM
};