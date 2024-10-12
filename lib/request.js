const axios = require('axios');
const { showInformationMessage } = require('./common.js');

const service = axios.create({
    timeout: 5000,
})

service.interceptors.response.use(
    response => {
        // console.log('拦截器response',response)
        return response.data
    },
    error => {
        const {response} = error
        let message = error.message||'请求失败'
        if(response && response.data){
            // 如果后端返回了错误信息
            message = response.data.message || response.data
        }       
        showInformationMessage(message) 
        return Promise.reject(error)
    }
)
module.exports = {service}