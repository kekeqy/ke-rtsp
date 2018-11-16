/// <reference types="node" />
import { Transform, TransformOptions, TransformCallback } from 'stream';
/** MP4片段 */
export declare class Mp4Fragment extends Transform {
    private _callback;
    private _parseChunk;
    private _foundSegment;
    private _initSegment;
    private _codecString;
    private _ftypLength;
    private _ftyp;
    private _moofLength;
    private _mdatBuffer;
    private _moof;
    private _mdatBufferSize;
    private _mdatLength;
    private _readableState;
    /**
     * 实例化一个MP4片段对象
     * @param options 选项
     * @param callback 回调函数
     */
    constructor(options?: TransformOptions, callback?: (data: any) => void);
    /** 获取初始化片段 */
    /** 设置初始化片段 */
    initSegment: any;
    /**
     * 查找ftyp
     * @param chunk 块
     */
    private _findFtyp;
    /**
     * 查找moov
     * @param chunk 块
     */
    private _findMoov;
    /**
     * 查找moof
     * @param chunk 块
     */
    private _findMoof;
    /**
     * 查找mdat
     * @param chunk 块
     */
    private _findMdat;
    /** 重写父类的_transform方法 */
    _transform(chunk: any, encoding: string, callback: TransformCallback): void;
    /** 重写父类_flush的方法 */
    _flush(callback: TransformCallback): void;
}
