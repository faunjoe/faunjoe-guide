## 你不得不知的Golang线程模型

> 原创：加多 技术原始积累   【公众号】

# 一、前言

​		本节我们来探讨Go的线程模型，首先我们先来回顾下常见的三种线程模型，然后在介绍Go中独特的线程模型。

# 二、三种线程模型

​		线程的并发执行是有操作系统来进行调度的，操作系统一般都都在内核提供对线程的支持。而我们在使用高级语言编写程序时候创建的线程是用户线程，那么用户线程与内核线程是什么关系那？其实下面将要讲解的三种线程模型就是根据用户线程与内核线程关系的不同而划分的。

## 2.1 一对一模型

​		这种线程模型下用户线程与内核线程是一一对应的，当从程序入口点（比如main函数）启动后，操作系统就创建了一个进程，这个main函数所在的线程就是主线程，在main函数内当我们使用高级语言创建一个用户线程的时候，其实对应创建了一个内核线程，如下图：