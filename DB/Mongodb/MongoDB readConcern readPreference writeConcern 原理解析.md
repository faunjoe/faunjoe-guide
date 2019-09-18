# MongoDB readConcern readPreference writeConcern 原理解析

​		MongoDB支持客户端灵活配置写入策略（[writeConcern](https://docs.mongodb.com/manual/reference/write-concern/)），以满足不同场景的需求。

```shell
db.collection.insert({x: 1}, {writeConcern: {w: 1}})
```

## writeConcern选项

MongoDB支持的WriteConncern选项如下

1.w: <number>，数据写入到number个节点才向用客户端确认。

- {w: 0} 对客户端的写入不需要发送任何确认，适用于性能要求高，但不关注正确性的场景。
- {w: 1} 默认的writeConcern，数据写入到Primary就向客户端发送确认。
- {w: "majority"} 数据写入到副本集大多数成员后向客户端发送确认，适用于对数据安全性要求比较高的场景，该选项会降低写入性能。

2.j: <boolean> ，写入操作的journal持久化后才向客户端确认。

- 默认为"{j: false}，如果要求Primary写入持久化了才向客户端确认，则指定该选项为true。

3.wtimeout: <millseconds>，写入超时时间，仅w的值大于1时有效。

- 当指定{w: }时，数据需要成功写入number个节点才算成功，如果写入过程中有节点故障，可能导致这个条件一直不能满足，从而一直不能向客户端发送确认结果，针对这种情况，客户端可设置wtimeout选项来指定超时时间，当写入过程持续超过该时间仍未结束，则认为写入失败。

## {w: "majority"}解析

​		{w: 1}、{j: true}等writeConcern选项很好理解，Primary等待条件满足发送确认；但{w: 
"majority"}则相对复杂些，需要确认数据成功写入到大多数节点才算成功，而MongoDB的复制是通过Secondary不断拉取oplog并重放来实现的，并不是Primary主动将写入同步给Secondary，那么Primary是如何确认数据已成功写入到大多数节点的？

1.Client向Primary发起请求，指定writeConcern为{w: "majority"}，Primary收到请求，本地写入并记录写请求到oplog，然后等待大多数节点都同步了这条批oplog（Secondary应用完oplog会向主报告最新进度)。

2.Secondary拉取到Primary上新写入的oplog，本地重放并记录oplog。为了让Secondary能在第一时间内拉取到主上的oplog，find命令支持一个[awaitData的选项](https://docs.mongodb.com/manual/reference/command/find/#dbcmd.find)，当find没有任何符合条件的文档时，并不立即返回，而是等待最多maxTimeMS(默认为2s)时间看是否有新的符合条件的数据，如果有就返回；所以当新写入oplog时，备立马能获取到新的oplog。

3.Secondary上有单独的线程，当oplog的最新时间戳发生更新时，就会向Primary发送replSetUpdatePosition命令更新自己的oplog时间戳。

4.当Primary发现有足够多的节点oplog时间戳已经满足条件了，向客户端发送确认。



MongoDB 可以通过 [writeConcern](https://yq.aliyun.com/articles/54367?spm=5176.100239.blogcont60553.7.InidvP) 来定制写策略，3.2版本后又引入了 `readConcern` 来灵活的定制读策略。

## readConcern vs readPreference

​		MongoDB 控制读策略，还有一个 `readPreference` 的设置，为了避免混淆，先简单说明下二者的区别。

#### [readPreference](https://docs.mongodb.com/manual/core/read-preference/?spm=5176.100239.blogcont60553.8.InidvP) 主要控制客户端 Driver 从复制集的哪个节点读取数据，这个特性可方便的实现读写分离、就近读取等策略。

- `primary` 只从 primary  节点读数据，这个是默认设置
- `primaryPreferred` 优先从  primary 读取，primary 不可服务，从 secondary 读
- `secondary` 只从 scondary  节点读数据
- `secondaryPreferred` 优先从  secondary 读取，没有 secondary 成员时，从 primary 读取
- `nearest` 根据网络距离就近读取

#### [readConcern](https://docs.mongodb.com/manual/reference/read-concern/?spm=5176.100239.blogcont60553.9.InidvP) 决定到某个读取数据时，能读到什么样的数据。

- `local` 能读取任意数据，这个是默认设置

- `majority` 只能读取到『成功写入到大多数节点的数据』

  

  `readPreference` 和 `readConcern` 可以配合使用。

## readConcern 解决什么问题？

​		 `readConcern` 的初衷在于解决『脏读』的问题，比如用户从 MongoDB 的 primary 上读取了某一条数据，但这条数据并没有同步到大多数节点，然后  primary 就故障了，重新恢复后 这个primary 节点会将未同步到大多数节点的数据回滚掉，导致用户读到了『脏数据』。

 		当指定 readConcern 级别为 majority 时，能保证用户读到的数据『已经写入到大多数节点』，而这样的数据肯定不会发生回滚，避免了脏读的问题。

 		需要注意的是，`readConcern` 能保证读到的数据『不会发生回滚』，但并不能保证读到的数据是最新的，这个官网上也有说明。

 		有用户误以为，`readConcern` 指定为 majority 时，客户端会从大多数的节点读取数据，然后返回最新的数据。

​		 实际上并不是这样，无论何种级别的 `readConcern`，客户端都只会从『某一个确定的节点』（具体是哪个节点由  readPreference 决定）读取数据，该节点根据自己看到的同步状态视图，只会返回已经同步到大多数节点的数据。

## readConcern 实现原理

​		MongoDB 要支持 majority 的 readConcern 级别，必须设置`replication.enableMajorityReadConcern`参数，加上这个参数后，MongoDB
会起一个单独的snapshot 线程，会周期性的对当前的数据集进行 snapshot，并记录 snapshot 时最新 oplog的时间戳，得到一个映射表。

| 最新 oplog 时间戳 | snapshot  | 状态        |
| ----------------- | --------- | ----------- |
| t0                | snapshot0 | committed   |
| t1                | snapshot1 | uncommitted |
| t2                | snapshot2 | uncommitted |
| t3                | snapshot3 | uncommitted |

​		只有确保 oplog 已经同步到大多数节点时，对应的 snapshot 才会标记为 commmited，用户读取时，从最新的 commited 状态的 snapshot 读取数据，就能保证读到的数据一定已经同步到的大多数节点。

**primary 节点**

 secondary 节点在 自身oplog发生变化时，会通过 replSetUpdatePosition 命令来将 oplog 进度立即通知给  primary，另外心跳的消息里也会包含最新 oplog 的信息；通过上述方式，primary 节点能很快知道 oplog  同步情况，知道『最新一条已经同步到大多数节点的 oplog』，并更新 snapshot  的状态。比如当t2已经写入到大多数据节点时，snapshot1、snapshot2都可以更新为 commited 状态。（不必要的  snapshot也会定期被清理掉）

 **secondary 节点**

 secondary 节点拉取 oplog 时，primary 节点会将『最新一条已经同步到大多数节点的 oplog』的信息返回给 secondary 节点，secondary 节点通过这个oplog时间戳来更新自身的 snapshot 状态。

