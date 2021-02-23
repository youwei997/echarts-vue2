export default class SocketService {
    /**
     * 单例
     */
    static instance = null
    static get Instance() {
        if (!this.instance) {
            this.instance = new SocketService()
        }
        return this.instance
    }

    // 和服务端连接的socket对象
    ws = null

    // 存储回调函数
    callBackMapping = {}

    //标识是否连接成功
    connected = false
    //记录重试次数
    cendRetryCount = 0

    //重新连接尝试的次数
    connectRetryCount = 0

    //定义连接服务器的方法
    connect() {
        //连接服务器
        if (!window.WebSocket) {
            return console.log('浏览器不支持WebSocket');
        }
        this.ws = new WebSocket('ws://localhost:9998')

        //连接成功的事件
        this.ws.onopen = () => {
            console.log('连接服务端成功');
            this.connected = true

            //重置重新连接的次数
            this.connectRetryCount = 0
        }
        //1.连接服务端失败,2.当连接成功后，服务器关闭的情况
        this.ws.onclose = () => {
            console.log('连接服务端失败');
            this.connected = false
            this.connectRetryCount++
            setTimeout(() => {
                this.connect()
            }, this.connectRetryCount * 500);
        }
        //得到服务端发送过来的数据事件
        this.ws.onmessage = (msg) => {
            console.log('从服务端获取到了数据');
            //真正从服务端发送过来的原始数据 msg.data
            // console.log(msg.data);
            const recvData = JSON.parse(msg.data)
            const socketType = recvData.socketType
            //判断回调函数是否存在
            if (this.callBackMapping[socketType]) {
                const action = recvData.action;
                if (action === 'getData') {
                    const realData = JSON.parse(recvData.data)
                    this.callBackMapping[socketType].call(this, realData)
                } else if (action === 'fullScreen') {
                    this.callBackMapping[socketType].call(this, recvData)
                } else if (action === 'themeChange') {
                    this.callBackMapping[socketType].call(this, recvData)

                }
            }
        }
    }
    //回调函数注册
    registerCallBack(socketType, callBack) {
        this.callBackMapping[socketType] = callBack
    }
    //取消回调函数
    unRegisterCallBack(socketType) {
        this.callBackMapping[socketType] = null
    }

    //发送数据
    send(data) {
        //判断此时有没有连接成功
        if (this.connected) {
            this.cendRetryCount = 0
            this.ws.send(JSON.stringify(data))
        } else {
            //延迟重试操作
            this.cendRetryCount++
            setTimeout(() => {
                this.send(data)
            }, this.cendRetryCount * 500);
        }
    }
}