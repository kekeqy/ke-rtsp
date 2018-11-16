# ke-rtsp
一种基于Media Source Extensions（简称MSE）技术实现的html5实时视频直播方案。Node.js调用ffmpeg包装rtsp流，然后通过socket.io转发包装后的流，前端html5获取流数据并通过MSE把流一点一点喂给video标签进行视频播放。能够支持谷歌浏览器、火狐浏览器、Edge浏览器、安卓原生浏览器，不支持IE。高性能，支持同时转发多路视频，占用硬件资源不多。低延时，延时1s。

# 运行示例项目
    1、克隆或者下载项目到本地。
<br/>

    2、命令行进入到项目目录，执行命令node sample/index.js。
<br/>

    3、修改sample/index.html中的config对象的url参数为你的rtsp测试地址。
<br/>

    4、浏览器打开http://localhost:8080/。

# 集成到你的项目中
## 1、安装模块
    npm i ke-rtsp
## 2、导入模块
    import * as rtsp from 'ke-rtsp';
## 3、创建一个流媒体服务器对象
    new rtsp.StreamingMediaServer(http);
    参数http为http.Server对象。
