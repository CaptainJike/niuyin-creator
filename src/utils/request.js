import axios from 'axios'
import errorCode from '@/utils/errorCode'
import {getToken} from "@/utils/auth.js";
import {Message, MessageBox} from "element-ui";

const instance = axios.create({
    baseURL: process.env.VUE_APP_DOMAIN_URL,
    timeout: 20000,
});

// 添加请求拦截器
instance.interceptors.request.use(config => {
    const token = getToken()
    if (token) {
        config.headers['Authorization'] = 'Bearer ' + getToken()
    }
    return config;
}, error => {
    return Promise.reject(error);
});
let loginDialog = true
// 添加响应拦截器
instance.interceptors.response.use(res => {
    // 未设置状态码则默认成功状态
    const code = res.data.code || 200;
    // 获取错误信息
    const msg = errorCode[code] || res.data.msg || errorCode['default']
    // 二进制数据则直接返回
    if (res.request.responseType === 'blob' || res.request.responseType === 'arraybuffer') {
        return res.data
    }
    // 未认证
    if (code === 401) {
        // 展示重新登陆逻辑
        if (loginDialog) {
            loginDialog = false
            MessageBox.confirm('登录状态已过期，请重新登录', '系统提示', {
                confirmButtonText: '重新登录',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                location.href = '/login';
            }).catch(() => {
                loginDialog = true
            });
            return Promise.reject(msg)
        }
    } else if (code === 500) {
        Message({
            message: msg,
            type: 'error'
        })
        return Promise.reject(new Error(msg))
    } else if (code !== 200) {
        Notification.error({
            title: msg
        })
        return Promise.reject('error')
    } else {
        return res.data
    }
}, function (error) {
    return Promise.reject(error);
});

export default instance
