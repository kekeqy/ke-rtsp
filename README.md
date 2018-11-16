# ke-rtsp
一种基于Media Source Extensions（简称MSE）技术实现的html5实时视频直播方案。Node.js调用ffmpeg包装rtsp流，然后通过socket.io转发包装后的流，前端html5获取流数据并通过MSE把流一点一点喂给video标签进行视频播放。能够支持谷歌浏览器、火狐浏览器、Edge浏览器、安卓原生浏览器，不支持IE。高性能，支持同时转发多路视频，占用硬件资源不多。低延时，延时1s。
