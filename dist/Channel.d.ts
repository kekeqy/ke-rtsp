import { ChannelConfig } from './ChannelConfig';
import * as SocketIO from 'socket.io';
/** 通道 */
export declare class Channel {
    /** 空闲时间 */
    freeTime: number;
    /** 通道配置信息 */
    readonly config: ChannelConfig;
    /** 客户端列表 */
    readonly clients: SocketIO.Socket[];
    /** 是否正在封装码流 */
    isStreamWrap: boolean;
    /** ffmpeg进程 */
    private _ffmpeg;
    private _mp4Frag;
    /**
     * 实例化一个通道配置信息
     * @param config 通道配置信息
     */
    constructor(config: ChannelConfig);
    /** 开始封装码流 */
    startStreamWrap(): void;
    private broadcast;
    /** 结束封装码流 */
    stopStreamWrap(): void;
    /**
     * 添加客户端
     * @param client 客户端
     */
    addClient(client: SocketIO.Socket): void;
    private initSegment;
    private onDisconnect;
}
