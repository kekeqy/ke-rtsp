"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Channel_1 = require("./Channel");
var SocketIO = require("socket.io");
/** 流媒体服务器 */
var StreamingMediaServer = /** @class */ (function () {
    /**
     * 实例化一个流媒体服务器对象
     * @param http HTTP服务
     */
    function StreamingMediaServer(http) {
        var _this = this;
        /** 视频通道列表 */
        this.channels = [];
        this._io = SocketIO.listen(http);
        this._io.on('connection', function (client) { return _this.onConnection(client); });
        setInterval(function () { return _this.checkFree(); }, 10000);
    }
    StreamingMediaServer.prototype.onConnection = function (client) {
        var _this = this;
        client.once('start', function (msg) { return _this.onStart(client, msg); });
    };
    StreamingMediaServer.prototype.onStart = function (client, msg) {
        var config = JSON.parse(msg);
        //先检查对应的通道是否存在，如果存在则直接加入到该通道，否则先创建通道再加入
        var channel = this.getChannel(config.channelid);
        if (!channel)
            channel = this.createChannel(config);
        channel.addClient(client);
    };
    /**
     * 判断指定通道是否存在
     * @param channelid 通道编号
     */
    StreamingMediaServer.prototype.getChannel = function (channelid) {
        for (var _i = 0, _a = this.channels; _i < _a.length; _i++) {
            var channel = _a[_i];
            if (channel.config.channelid == channelid)
                return channel;
        }
        return null;
    };
    /**
     * 创建一个视频通道
     * @param config 通道配置信息
     */
    StreamingMediaServer.prototype.createChannel = function (config) {
        var channel = new Channel_1.Channel(config);
        this.channels.push(channel);
        return channel;
    };
    /**
     * 移除指定的视频通道
     * @param channelid 视频通道编号
     */
    StreamingMediaServer.prototype.removeChannel = function (channel) {
        var index = this.channels.indexOf(channel);
        if (index > -1) {
            this.channels.splice(index, 1);
            channel.stopStreamWrap();
        }
    };
    /** 空闲检测，通道空闲超过1分钟，则移除对应通道。 */
    StreamingMediaServer.prototype.checkFree = function () {
        for (var _i = 0, _a = this.channels; _i < _a.length; _i++) {
            var channel = _a[_i];
            if (channel.clients.length > 0)
                channel.freeTime = 0;
            else
                channel.freeTime += 10;
            if (channel.freeTime >= 60)
                this.removeChannel(channel);
        }
    };
    return StreamingMediaServer;
}());
exports.StreamingMediaServer = StreamingMediaServer;
