// 测试存储功能
const { 
    setGlobalContext, 
    getGlobalStorageValue, 
    setGlobalStorageValue,
    getWorkspaceStorageValue,
    setWorkspaceStorageValue,
    shouldShowTip,
    markTipAsShown,
    showInformationMessageOnce,
    clearAllTips,
    clearTip
} = require('../lib/common.js');

// 模拟测试
function testStorageFunctions() {
    console.log('=== 测试存储功能 ===');
    
    // 测试全局存储
    console.log('1. 测试全局存储');
    setGlobalStorageValue('testKey', 'testValue');
    const globalValue = getGlobalStorageValue('testKey');
    console.log('存储值:', globalValue);
    
    // 测试工作区存储
    console.log('2. 测试工作区存储');
    setWorkspaceStorageValue('workspaceKey', 'workspaceValue');
    const workspaceValue = getWorkspaceStorageValue('workspaceKey');
    console.log('工作区值:', workspaceValue);
    
    // 测试提示功能
    console.log('3. 测试提示功能');
    console.log('首次检查提示:', shouldShowTip('testTip'));
    markTipAsShown('testTip');
    console.log('标记后检查提示:', shouldShowTip('testTip'));
    
    // 测试清除功能
    console.log('4. 测试清除功能');
    clearTip('testTip');
    console.log('清除后检查提示:', shouldShowTip('testTip'));
    
    console.log('=== 测试完成 ===');
}

// 实际使用示例
function showWelcomeMessage() {
    showInformationMessageOnce(
        '欢迎使用翻译朗读者插件！这条消息只会显示一次。',
        'welcomeMessage',
        100
    );
}

function showConfigUpgradeMessage() {
    if (shouldShowTip('configUpgrade_v2')) {
        markTipAsShown('configUpgrade_v2');
        // 这里可以显示配置升级的消息
        console.log('显示配置升级消息');
    }
}

// 存储用户偏好示例
function saveUserPreferences() {
    const preferences = {
        autoTranslate: true,
        speakEnabled: true,
        lastUsedApi: 'bing',
        theme: 'dark'
    };
    
    setGlobalStorageValue('userPreferences', preferences);
    console.log('用户偏好已保存');
}

function loadUserPreferences() {
    const defaultPreferences = {
        autoTranslate: false,
        speakEnabled: true,
        lastUsedApi: 'baidu',
        theme: 'light'
    };
    
    const preferences = getGlobalStorageValue('userPreferences', defaultPreferences);
    console.log('加载的用户偏好:', preferences);
    return preferences;
}

module.exports = {
    testStorageFunctions,
    showWelcomeMessage,
    showConfigUpgradeMessage,
    saveUserPreferences,
    loadUserPreferences
};
