# MongoDB 副本集

​		在MongoDB中，创建一个副本集之后就可以使用复制功能了。副本集是一组服务器，其中有一个是主服务器(primary),用于处理客户端请求，还有多个备份服务器(secondary)，用于保存主服务器的数据副本。如果主服务器崩溃了，备份服务器会自动将其中一个成员升级为新的主服务器。

​		连接到主节点执行isMaster命令

```shell
db.isMaster()
```

```json
/* 1 */
{
    "hosts" : [ 
        "192.168.54.29:27017", 
        "192.168.54.27:27017", 
        "192.168.54.26:27017"
    ],
    "setName" : "testdb",
    "setVersion" : 3,
    "ismaster" : true,
    "secondary" : false,
    "primary" : "192.168.54.29:27017",
    "me" : "192.168.54.29:27017",
    "electionId" : ObjectId("7fffffff000000000000002e"),
    "lastWrite" : {
        "opTime" : {
            "ts" : Timestamp(1562692502, 1),
            "t" : NumberLong(46)
        },
        "lastWriteDate" : ISODate("2019-07-09T17:15:02.000Z"),
        "majorityOpTime" : {
            "ts" : Timestamp(1562692502, 1),
            "t" : NumberLong(46)
        },
        "majorityWriteDate" : ISODate("2019-07-09T17:15:02.000Z")
    },
    "maxBsonObjectSize" : 16777216,
    "maxMessageSizeBytes" : 48000000,
    "maxWriteBatchSize" : 100000,
    "localTime" : ISODate("2019-07-09T17:15:02.501Z"),
    "logicalSessionTimeoutMinutes" : 30,
    "minWireVersion" : 0,
    "maxWireVersion" : 7,
    "readOnly" : false,
    "ok" : 1.0,
    "operationTime" : Timestamp(1562692502, 1)
}
```

- ##### 客户端在单台服务器上可以执行的请求，都可以发送到主节点执行(读、写、执行命令、创建索引等)。

- ##### 客户端不能在备份节点上执行写操作

- ##### 默认情况下，客户端不能从备份节点中读取数据。在备份节点上显示的执行setSlaveOk之后，客户端就可以从备份节点中读取数据了。

  ##### rs辅助函数

  ```shell
  // 查看可用的辅助函数
  rs.help() 
  ```

  