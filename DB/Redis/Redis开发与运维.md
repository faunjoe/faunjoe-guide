# 第一章	认识Redis

1. ##### Redis特性

   Redis之所以受到如此多公司的青睐,必然有之过人之处,下面是关于Redis的8个重要特性。

   1.速度快

   
   
   
   
   

# 第5章 持久化的取舍和选择

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/what-rdb.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/triger-rdb.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/save-rdb.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/save-rdb-2.png)

​	bgsave

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/bgsave-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/bgsave-2.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/save-and-bgsave.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/auto-rdb-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/config-rdb.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/save-example-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/save-get-block.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/save-rdb-3.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/bgsave-3.png)

bgsave非阻塞

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/bgsave-4.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/rdb-bgsave.png)

redis-rdb-bgsave子进程

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/temp-rdb.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/rdb-summary.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/rdb-defect-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/rdb-defect-2.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-create.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-recover.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-strategy.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-always.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-everysec.png)

丢失最后1秒的数据

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-no.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-summary.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-overwrite.png)

aof重写作用

- 减少硬盘占用量
- 加速恢复速度

aof重写实现两种方式

- bgrewriteaof
- aof重写配置

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-bgrewriteaof.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-overwrite-config.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-overwrite-config1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-overwrite-flow.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/image/aof-config.png)

RDB与AOF

| 命令       | RDD    | AOF          |
| ---------- | ------ | ------------ |
| 启动优先级 | 低     | 高           |
| 体积       | 小     | 大           |
| 恢复速度   | 快     | 慢           |
| 数据安全性 | 丢数据 | 根据策略决定 |
| 轻重       | 重     | 轻           |



# 第9章 哨兵

​		Redis的主从复制模式下,一旦主节点由于故障不能提供服务,需要人工将从节点晋升为主节点,同时还要通知应用方更新主节点地址,对于很多应用场景这种故障处理的方式是无法接受的。可喜的是Redis从2.8开始正式提供了Redis Sentinel(哨兵)架构来解决这个问题。

##### 9.1 基本概念

​		由于对Redis的许多概念都有不同的名词解释，所以在介绍Redis Sentinel之前，先对几个名词进行说明，这样便于在后面的介绍中达成一致

| 名词             | 逻辑结构                   | 物理结构                            |
| ---------------- | -------------------------- | ----------------------------------- |
| 主节点(master)   | Redis主服务/数据库         | 一个独立的Redis进程                 |
| 从节点(slave)    | Redis从服务/数据库         | 一个独立的Redis进程                 |
| Redis数据节点    | 主节点和从节点             | 主节点和从节点的进程                |
| Sentinel节点     | 监控Redis数据节点          | 一个独立的Sentinel进程              |
| Sentinel节点集合 | 若干Sentinel节点的抽象组合 | 若干Sentinel节点进程                |
| Redis Sentinel   | Redis高可用实现方案        | Sentinel节点集合和Redis数据节点进程 |
| 应用方           | 泛指一个或多个客户端       | 一个或者多个客户端进程或者线程      |

​		Redis Sentinel是Redis的高可用实现方案，在实际的生产环境中，对提高整个系统的高可用性是非常有帮助的，本节首先会回顾主从复制模式下故障处理可能产生的问题，而后引出高可用的概念。

##### 9.1.1 主从复制的问题

​		Redis的主从复制模式可以将主节点的数据改变同步给从节点，这样从节点就可以起到两个作用：

​		第一，作为主节点的一个备份，一旦主节点出了故障不可达的情况，从节点可以作为后备"顶"上来，并且保证数据尽量不丢失(主从复制是最终一致性)。

​		第二，从节点可以扩展主节点读能力，一旦主节点不能支撑住大并发量的读操作，从节点可以在一定程度上帮助主节点分担读压力。

​		但是主从复制也带来了以下问题：

​		1.一旦主节点出现故障，需要手动将一个从节点晋升为主节点，同时需要修改应用方的主节点地址，还需要命令其他节点去复制新的主节点，整个过程都需要人工干预。

​		2.主节点的写能力受到单机的限制。

​		3.主节点的存储能力受到单机的限制。

​		其中第一个问题就是Redis的`高可用问题`，第二、第三个问题属于`Redis的分布式`问题。