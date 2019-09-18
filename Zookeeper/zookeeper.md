### Zookeeper序列化

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuliehua-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuliehua-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuliehua-003.png)

### Jute序列化

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/jute-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/jute-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/jute-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/jute-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/jute-005.png)

### Zookeeper数据模型

```shell
// 创建test节点
create /test testinfo

// 查看test节点
get /test

// 查看test节点数据状态
ls -s /test  或 stat /test

// 更新test节点状态
set /test test

// 删除节点状态
delete /test

// 查看test节点权限
getAcl /test

// 修改test节点权限
setAcl /test world:anyone:cdrwa
```

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/data-node-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/data-node-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/znode-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/znode-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/znode-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/znode-004.png)

```shell
// 创建永久节点
create /test_node1 testinfo

// 创建临时节点
create -e /eph_node1 test

// 创建顺序节点
create -s /sql_node1 1000

//创建临时 顺序节点
create -e -s /uuid 1000
```

### Watch通知机制

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/watch-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/watch-002.png)

```shell
// 监听world
stat /world watch

// 监听world子节点
ls /world watch
```

### 权限控制-ACL

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/acl-001.png)

scheme 授权策略

id 验证方式

permission	权限的分类

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/acl-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/acl-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/acl-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/acl-005.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/acl-006.png)

```shell
[zk: localhost:2181(CONNECTED) 60] addauth digest test:123456
[zk: localhost:2181(CONNECTED) 62] getAcl /test
'world,'anyone
: cdrwa
[zk: localhost:2181(CONNECTED) 63] setAcl /test auth:test:123456:cdrwa
[zk: localhost:2181(CONNECTED) 64] getAcl /test
'digest,'test:PbXQT4DQMDcaYC1X0EY0B2RZCwM=
: cdrwa
[zk: localhost:2181(CONNECTED) 65] 
```

```shell
[zk: localhost:2181(CONNECTED) 0] get /test
org.apache.zookeeper.KeeperException$NoAuthException: KeeperErrorCode = NoAuth for /test
[zk: localhost:2181(CONNECTED) 1] addauth digest test:123456
[zk: localhost:2181(CONNECTED) 2] get /test
test
[zk: localhost:2181(CONNECTED) 3] 
```

### DataTree数据模型

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/dataTree-struct-0001.png)



### DataNode序列化

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/DataNode-001.png)

### DataTree序列化

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/DataTree-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/datatree-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/datatree-003.png)

### Zookeeper 持久化

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-005.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-006.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-007.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/chijiuhua-008.png)

### Zookeeper 客户端

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/client-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/client-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/client-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/client-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/client-005.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/client-006.png)

### Zookeeper 服务器启动

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/zookeeper-server-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/zookeeper-server-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/zookeeper-server-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/zookeeper-server-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/zookeeper-server-005.png)



### Zookeeper 会话管理

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-005.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-006.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-007.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-008.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-009.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/huihua-010.png)



### Zookeeper 选举流程

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-006.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-007.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-008.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-009.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-010.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-011.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-012.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-013.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-014.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/xuanju-015.png)

### Zookeeper 请求处理流程

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/liucheng-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/liucheng-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/liucheng-003.png)

### 二阶段提交

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/erjieduan-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/leader-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/leader-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/leader-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/follower-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/follower-002.png)

### Zookeeper实现分布式锁

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/lock-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/lock-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/lock-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/lock-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/lock-005.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/lock-006.png)

### Zookeeper客户端Curator

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-001.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-002.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-003.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-004.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-005.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-006.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-007.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/curator-008.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/Zookeeper/image/zoo-cfg-001.png)