## Spring HtmlUtils把HTML编码转义，可将HTML标签互相转义



org.springframework.web.util.HtmlUtils 可以实现HTML标签及转义字符之间的转换。 



[代码](http://www.xuebuyuan.com/)如下： 

```java
/** HTML转义 **/  
String s = HtmlUtils.htmlEscape("<div>hello world</div><p>&nbsp;</p>");  
System.out.println(s);  
String s2 = HtmlUtils.htmlUnescape(s);  
System.out.println(s2);  
```



输出的结果如下：

```java
&lt;div&gt;hello world&lt;/div&gt;&lt;p&gt;&amp;nbsp;&lt;/p&gt;  
  
<div>hello world</div><p>&nbsp;</p>  
```

