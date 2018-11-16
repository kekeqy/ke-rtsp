/// <reference types="node" />
import { Channel } from './Channel';
import { ChannelConfig } from './ChannelConfig';
import { Server } from 'http';
/** 流媒体服务器 */
export declare class StreamingMediaServer {
    /** 视频通道列表 */
    readonly channels: Channel[];
    private _io;
    /**
     * 实例化一个流媒体服务器对象
     * @param http HTTP服务
     */
    constructor(http: Server);
    private onConnection;
    private onStart;
    /**
     * 判断指定通道是否存在
     * @param channelid 通道编号
     */
    private getChannel;
    /**
     * 创建一个视频通道
     * @param config 通道配置信息
     */
    createChannel(config: ChannelConfig): Channel;
    /**
     * 移除指定的视频通道
     * @param channelid 视频通道编号
     */
    removeChannel(channel: Channel): void;
    /** 空闲检测，通道空闲超过1分钟，则移除对应通道。 */
    private checkFree;
}
