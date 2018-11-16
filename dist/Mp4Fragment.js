"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var stream_1 = require("stream");
/** MP4片段 */
var Mp4Fragment = /** @class */ (function (_super) {
    __extends(Mp4Fragment, _super);
    /**
     * 实例化一个MP4片段对象
     * @param options 选项
     * @param callback 回调函数
     */
    function Mp4Fragment(options, callback) {
        var _this = _super.call(this, options) || this;
        if (typeof callback === 'function') {
            _this._callback = callback;
        }
        _this._parseChunk = _this._findFtyp;
        _this._foundSegment = false;
        return _this;
    }
    Object.defineProperty(Mp4Fragment.prototype, "initSegment", {
        /** 获取初始化片段 */
        get: function () {
            if (this._initSegment) {
                return this._initSegment;
            }
            else {
                return null;
                //初始化片段没有创建完成
            }
        },
        /** 设置初始化片段 */
        set: function (value) {
            this._initSegment = value;
            var audioString = '';
            if (this._initSegment.indexOf('mp4a') !== -1) {
                audioString = ', mp4a.40.2';
            }
            var index = this._initSegment.indexOf('avcC') + 5;
            if (index === -1) {
                console.log('头部没有包含编码解码器信息！');
            }
            this._codecString = "video/mp4; codecs=\"avc1." + this._initSegment.slice(index, index + 3).toString('hex').toUpperCase() + audioString + "\"";
            //初始化片段成功
        },
        enumerable: true,
        configurable: true
    });
    /**
     * 查找ftyp
     * @param chunk 块
     */
    Mp4Fragment.prototype._findFtyp = function (chunk) {
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
    };
    /**
     * 查找moov
     * @param chunk 块
     */
    Mp4Fragment.prototype._findMoov = function (chunk) {
        if (chunk[4] !== 0x6D || chunk[5] !== 0x6F || chunk[6] !== 0x6F || chunk[7] !== 0x76) {
            console.log('找不到moov！');
        }
        var chunkLength = chunk.length;
        var moovLength = chunk.readUIntBE(0, 4);
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
    };
    /**
     * 查找moof
     * @param chunk 块
     */
    Mp4Fragment.prototype._findMoof = function (chunk) {
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
        var chunkLength = chunk.length;
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
    };
    /**
     * 查找mdat
     * @param chunk 块
     */
    Mp4Fragment.prototype._findMdat = function (chunk) {
        if (this._mdatBuffer) {
            this._mdatBuffer.push(chunk);
            this._mdatBufferSize += chunk.length;
            if (this._mdatLength === this._mdatBufferSize) {
                this._foundSegment = true;
                //mdat长度等于mdat缓冲区大小
                var data = Buffer.concat([this._moof].concat(this._mdatBuffer), (this._moofLength + this._mdatLength));
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
                var data = Buffer.concat([this._moof].concat(this._mdatBuffer), (this._moofLength + this._mdatLength));
                var sliceIndex = this._mdatBufferSize - this._mdatLength;
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
            var chunkLength = chunk.length;
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
    };
    /** 重写父类的_transform方法 */
    Mp4Fragment.prototype._transform = function (chunk, encoding, callback) {
        this._parseChunk(chunk);
        callback();
    };
    /** 重写父类_flush的方法 */
    Mp4Fragment.prototype._flush = function (callback) {
        this._parseChunk = this._findFtyp;
        callback();
    };
    return Mp4Fragment;
}(stream_1.Transform));
exports.Mp4Fragment = Mp4Fragment;
