import { Transform, TransformOptions, TransformCallback } from 'stream';

/** MP4片段 */
export class Mp4Fragment extends Transform {
    private _callback: (data: any) => void;
    private _parseChunk: (chunk: any) => void;
    private _foundSegment: any;
    private _initSegment: any;
    private _codecString: any;
    private _ftypLength: any;
    private _ftyp: any;
    private _moofLength: any;
    private _mdatBuffer: any;
    private _moof: any;
    private _mdatBufferSize: any;
    private _mdatLength: any;
    private _readableState: any;
    /**
     * 实例化一个MP4片段对象
     * @param options 选项
     * @param callback 回调函数
     */
    public constructor(options?: TransformOptions, callback?: (data: any) => void) {
        super(options);
        if (typeof callback === 'function') {
            this._callback = callback;
        }
        this._parseChunk = this._findFtyp;
        this._foundSegment = false;
    }
    /** 获取初始化片段 */
    public get initSegment() {
        if (this._initSegment) {
            return this._initSegment;
        } else {
            return null;
            //初始化片段没有创建完成
        }
    }
    /** 设置初始化片段 */
    public set initSegment(value) {
        this._initSegment = value;
        let audioString = '';
        if (this._initSegment.indexOf('mp4a') !== -1) {
            audioString = ', mp4a.40.2';
        }
        const index = this._initSegment.indexOf('avcC') + 5;
        if (index === -1) {
            console.log('头部没有包含编码解码器信息！');
        }
        this._codecString = `video/mp4; codecs="avc1.${this._initSegment.slice(index, index + 3).toString('hex').toUpperCase()}${audioString}"`;
        //初始化片段成功
    }
    /**
     * 查找ftyp
     * @param chunk 块
     */
    private _findFtyp(chunk: any): void {
        if (chunk[4] !== 0x66 || chunk[5] !== 0x74 || chunk[6] !== 0x79 || chunk[7] !== 0x70) {
            console.log('找不到fty！');
        }
        this._ftypLength = chunk.readUIntBE(0, 4);
        if (this._ftypLength < chunk.length) {
            this._ftyp = chunk.slice(0, this._ftypLength);
            this._parseChunk = this._findMoov;
            this._parseChunk(chunk.slice(this._ftypLength));
        }
        else if (this._ftypLength === chunk.length) {
            this._ftyp = chunk;
            this._parseChunk = this._findMoov;
        }
        else {
            //因为ftyp很小，不可能到达这里
            console.log('ftyp的长度比块的长度大！');
        }
    }
    /**
     * 查找moov
     * @param chunk 块
     */
    private _findMoov(chunk: any): void {
        if (chunk[4] !== 0x6D || chunk[5] !== 0x6F || chunk[6] !== 0x6F || chunk[7] !== 0x76) {
            console.log('找不到moov！');
        }
        const chunkLength = chunk.length;
        const moovLength = chunk.readUIntBE(0, 4);
        if (moovLength < chunkLength) {
            //moov的长度小于块的长度
            this.initSegment = Buffer.concat([this._ftyp, chunk], (this._ftypLength + moovLength));
            delete this._ftyp;
            delete this._ftypLength;
            this._parseChunk = this._findMoof;
            this._parseChunk(chunk.slice(moovLength));
        }
        else if (moovLength === chunkLength) {
            //moov的长度等于块的长度
            this.initSegment = Buffer.concat([this._ftyp, chunk], (this._ftypLength + moovLength));
            delete this._ftyp;
            delete this._ftypLength;
            this._parseChunk = this._findMoof;
        }
        else {
            //不可能到达这里，如果我们这样做了，我们将不得不储存大块直到大到足以拥有整个moov块。
            console.log('moov的长度大于块的长度！');
        }
    }
    /**
     * 查找moof
     * @param chunk 块
     */
    private _findMoof(chunk: any): void {
        if (chunk[4] !== 0x6D || chunk[5] !== 0x6F || chunk[6] !== 0x6F || chunk[7] !== 0x66) {
            //以前没有解析完整的段
            if (this._foundSegment === false) {
                console.log('立即找不到moof！');
            }
            else {
                //必须执行字符串搜索moof或mdat和开始循环，有时ffmpeg得到大量数据并通过破坏发送
                if (chunk.toString().indexOf('moof') !== 1) {
                    console.log('找到 moof 在 ', chunk.toString().indexOf('moof'));
                }
                if (chunk.toString().indexOf('mdat') !== 1) {
                    console.log('找到 mdat 在 ', chunk.toString().indexOf('mdat'));
                }
                console.log('没找到moof后已经跑得不错了！');
            }
        }
        const chunkLength = chunk.length;
        this._moofLength = chunk.readUIntBE(0, 4);
        if (this._moofLength < chunkLength) {
            //moof长度小于块的长度
            this._moof = chunk.slice(0, this._moofLength);
            this._parseChunk = this._findMdat;
            this._parseChunk(chunk.slice(this._moofLength));
        }
        else if (this._moofLength === chunkLength) {
            //还没有发生
            this._moof = chunk;
            this._parseChunk = this._findMdat;
        }
        else {
            //还没有发生
            console.log('moof长度小于块的长度！');
        }
    }
    /**
     * 查找mdat
     * @param chunk 块
     */
    private _findMdat(chunk: any): void {
        if (this._mdatBuffer) {
            this._mdatBuffer.push(chunk);
            this._mdatBufferSize += chunk.length;
            if (this._mdatLength === this._mdatBufferSize) {
                this._foundSegment = true;
                //mdat长度等于mdat缓冲区大小
                const data = Buffer.concat([this._moof, ...this._mdatBuffer], (this._moofLength + this._mdatLength));
                delete this._moof;
                delete this._mdatBuffer;
                delete this._moofLength;
                delete this._mdatLength;
                delete this._mdatBufferSize;
                if (this._readableState.pipesCount > 0) {
                    this.push(data);
                }
                if (this._callback) {
                    this._callback(data);
                }
                if (this.listenerCount('segment') > 0) {
                    this.emit('segment', data);
                }
                this._parseChunk = this._findMoof;
            }
            else if (this._mdatLength < this._mdatBufferSize) {
                this._foundSegment = true;
                //mdat长度小于mdat缓冲区大小
                const data = Buffer.concat([this._moof, ...this._mdatBuffer], (this._moofLength + this._mdatLength));
                const sliceIndex = this._mdatBufferSize - this._mdatLength;
                delete this._moof;
                delete this._mdatBuffer;
                delete this._moofLength;
                delete this._mdatLength;
                delete this._mdatBufferSize;
                if (this._readableState.pipesCount > 0) {
                    this.push(data);
                }
                if (this._callback) {
                    this._callback(data);
                }
                if (this.listenerCount('segment') > 0) {
                    this.emit('segment', data);
                }
                this._parseChunk = this._findMoof;
                this._parseChunk(chunk.slice(sliceIndex));
            }
        }
        else {
            //mdat第一遍
            //第一遍为了确保mdat的启动和获得其大小，很可能块不会包含整个mdat
            if (chunk[4] !== 0x6D || chunk[5] !== 0x64 || chunk[6] !== 0x61 || chunk[7] !== 0x74) {
                console.log('无法找到mdat！');
            }
            const chunkLength = chunk.length;
            this._mdatLength = chunk.readUIntBE(0, 4);
            if (this._mdatLength > chunkLength) {
                //几乎100%保证超过单个块的大小
                this._mdatBuffer = [chunk];
                this._mdatBufferSize = chunkLength;
            }
            else {
                console.log('mdat的长度不大于块的长度！');
            }
        }
    }
    /** 重写父类的_transform方法 */
    public _transform(chunk: any, encoding: string, callback: TransformCallback): void {
        this._parseChunk(chunk);
        callback();
    }
    /** 重写父类_flush的方法 */
    public _flush(callback: TransformCallback): void {
        this._parseChunk = this._findFtyp;
        callback();
    }
}