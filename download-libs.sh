#!/bin/bash
# 下载本目录下的web程序依赖的JavaScript库，从而使得每次运行它们时，无需从网络下载这些JS库。
# d3.js：一个用于数据可视化的JavaScript库，支持生成各种交互式图表和数据驱动的DOM操作
# dagre-d3：在d3.js基础上，专门用于绘制有向图（如流程图、依赖图）的JavaScript库，提供自动布局和节点连接功能，区别于d3.js的通用数据可视化
# jszip：一个用于在浏览器端创建、读取和解压ZIP压缩文件的JavaScript库，主要用于文件压缩与解压

curdir=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)

wget https://cdn.jsdelivr.net/npm/d3@7.8.5/dist/d3.min.js

wget https://cdn.jsdelivr.net/npm/dagre-d3@0.6.4/dist/dagre-d3.min.js

wget https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js

echo "All dependencies have been downloaded successfully"
