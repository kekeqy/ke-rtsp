import { Channel } from './Channel';
import { ChannelConfig } from './ChannelConfig';
import * as SocketIO from 'socket.io';
import { Server } from 'http';

/** 流媒体服务器 */
export class StreamingMediaServer {
    /** 视频通道列表 */
    public readonly channels: Channel[] = [];
    private _io: SocketIO.Server;
    /**
     * 实例化一个流媒体服务器对象
     * @param http HTTP服务
     */
    public constructor(http: Server) {
        this._io = SocketIO.listen(http);
        this._io.on('connection', client => this.onConnection(client));
        setInterval(() => this.checkFree(), 10000);
    }
    private onConnection(client: SocketIO.Socket): void {
        client.once('start', msg => this.onStart(client, msg));
    }
    private onStart(client: SocketIO.Socket, msg: string): void {
        let config: ChannelConfig = JSON.parse(msg);
        //先检查对应的通道是否存在，如果存在则直接加入到该通道，否则先创建通道再加入
        let channel: Channel = this.getChannel(config.channelid);
        if (!channel) channel = this.createChannel(config);
        channel.addClient(client);
    }
    /**
     * 判断指定通道是否存在
     * @param channelid 通道编号
     */
    private getChannel(channelid: string): Channel {
        for (let channel of this.channels) {
            if (channel.config.channelid == channelid) return channel;
        }
        return null;
    }
    /**
     * 创建一个视频通道
     * @param config 通道配置信息
     */
    public createChannel(config: ChannelConfig): Channel {
        let channel: Channel = new Channel(config);
        this.channels.push(channel);
        return channel;
    }
    /**
     * 移除指定的视频通道
     * @param channelid 视频通道编号
     */
    public removeChannel(channel: Channel): void {
        let index: number = this.channels.indexOf(channel);
        if (index > -1) {
            this.channels.splice(index, 1);
            channel.stopStreamWrap();
        }
    }
    /** 空闲检测，通道空闲超过1分钟，则移除对应通道。 */
    private checkFree(): void {
        for (let channel of this.channels) {
            if (channel.clients.length > 0) channel.freeTime = 0;
            else channel.freeTime += 10;
            if (channel.freeTime >= 60) this.removeChannel(channel);
        }
    }
}