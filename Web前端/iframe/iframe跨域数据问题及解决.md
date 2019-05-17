# 跨域数据问题及解决

​		遇到需要使用窗口的功能，是这样的 ，A站点的a1页面为主要显示页面，但是需要调用B站点的b1界面用来保存数据到B站点上，然后再将b1页面获取的地址体现到a1页面上，在调用页面的关闭事件的时候遇到问题：

```java
Uncaught DOMException: Blocked a frame with origin 
```

[跨域数据问题及解决](https://blog.csdn.net/weixin_42973143/article/details/85098305)



# [html5 postMessage解决跨域、跨窗口消息传递](https://www.cnblogs.com/dolphinX/p/3464056.html)





使用监听方式发送数据给父页面，当父页面接收到相关的数据后执行操作，解决了无法调用父页面的操作。

```javascript
子页面：
var message = {s:"close",filePath:filePath}
                window.parent.postMessage(message, '*');
父页面：
window.addEventListener('message', function (e) {
            //let target = e.target;
            let data = e.data;
            console.log(data);
            if (true)
            {
             	//****
            }           
        }, false);
```


