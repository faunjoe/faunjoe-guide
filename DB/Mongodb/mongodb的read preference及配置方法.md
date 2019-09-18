# mongodb的read preference及配置方法

​		在副本集Replica Set中才涉及到ReadPreference的设置，默认情况下，读写都是分发都Primary节点执行，但是对于写少读多的情况，我们希望进行读写分离来分摊压力，所以希望使用Secondary节点来进行读取，Primary只承担写的责任（实际上写只能分发到Primary节点，不可修改）。

- `primary` 默认值，此时只会从主节点读取数据。主节点不可用时会报错或者抛出异常。
- `primaryPreferred` 首选主节点，大多情况下读操作在主节点，如果主节点不可用，如故障转移，读操作在从节点。
- `secondary`  只会到从节点(secondary)读取数据。写少读多的场景可以考虑使用这个值。
- `secondaryPreferred` 大多数情况下到从节点读取数据，从节点不可用时到主节点读取数据。写少读多的场景可以考虑使用这个值。
- `nearest` 到网络延迟最低的节点读取数据，不用管该节点是主节点还是从节点。

# 程序中通过Java Config配置read preference

主要可以通过2种方式配置:

- uri中配置
- MongoClientOptions中配置

### 开发环境

jar包版本为org.mongodb.mongodb-driver 3.6.4，服务端版本为3.6.6

### uri中配置

可以在uri中拼接`readPreference=primaryPreferred`：

```java
@Bean
public MongoClient mongoClient() {
		String uriString = "mongodb://username:password@cluster0-shard-00-00-75shm.gcp.mongodb.net:27017,"
                + "cluster0-shard-00-01-75shm.gcp.mongodb.net:27017,"
                + "cluster0-shard-00-02-75shm.gcp.mongodb.net:27017/?"
                + "ssl=true&replicaSet=Cluster0-shard-0&authSource=admin"
                + "&retryWrites=true&readPreference=primaryPreferred";
		MongoClientURI uri = new MongoClientURI(uriString);
    MongoClient mongoClient = new MongoClient(uri);
    
    return mongoClient;
}

```

readPreference的其它值参考[MongoClientURI](http://api.mongodb.com/java/current/com/mongodb/MongoClientURI.html)。实际上，通过这种方式不止可以配置readPreference,还可以配置很多其它选项，参考[MongoClientURI](http://api.mongodb.com/java/current/com/mongodb/MongoClientURI.html)。

### MongoClientOptions中配置

```java
@Bean
public MongoClient mongoClient() {
        List<ServerAddress> saList = new ArrayList<>();
        saList.add(new ServerAddress("cluster0-shard-00-00-75shm.gcp.mongodb.net", 27017));
        saList.add(new ServerAddress("cluster0-shard-00-01-75shm.gcp.mongodb.net", 27017));
        saList.add(new ServerAddress("cluster0-shard-00-02-75shm.gcp.mongodb.net", 27017));
        
        char[] pwd =  "password".toCharArray();
                //第二个参数“admin”对应authSource,也就是authentication database.
        MongoCredential credential = MongoCredential.createCredential("username", "admin", pwd);
    
        //必须设置sslEnabled为true,否则会报MongoSocketReadException: Prematurely reached end of stream错误
        MongoClientOptions options = MongoClientOptions.builder()
                .readPreference(ReadPreference.primaryPreferred())
                .retryWrites(true)
                .requiredReplicaSetName("Cluster0-shard-0")
                .maxConnectionIdleTime(6000)
                .sslEnabled(true)
                .build();
        
        MongoClient mongoClient = new MongoClient(saList, credential, options);     
        return mongoClient;
}
```

关于MongoClientOptions.builder所有选项参考[Class MongoClientOptions.Builder](http://mongodb.github.io/mongo-java-driver/3.6/javadoc/com/mongodb/MongoClientOptions.Builder.html#readPreference-com.mongodb.ReadPreference-),关于MongoCredential使用参考[MongoCredential](http://api.mongodb.com/java/current/com/mongodb/MongoCredential.html)。

### Spring中的设置ReadPreference

```xml
<!-- mongodb配置 -->
<mongo:mongo id="mongo"  host="${mongo.host}" port="${mongo.port}" write-concern="NORMAL" >
    <mongo:options 
        connections-per-host="${mongo.connectionsPerHost}"
        threads-allowed-to-block-for-connection-multiplier="${mongo.threadsAllowedToBlockForConnectionMultiplier}"
        connect-timeout="${mongo.connectTimeout}" 
        max-wait-time="${mongo.maxWaitTime}"
        auto-connect-retry="${mongo.autoConnectRetry}" 
        socket-keep-alive="${mongo.socketKeepAlive}"
        socket-timeout="${mongo.socketTimeout}" 
        slave-ok="${mongo.slaveOk}"
        write-number="1" 
        write-timeout="0" 
        write-fsync="false"
    />
</mongo:mongo>

<!-- mongo的工厂，通过它来取得mongo实例,dbname为mongodb的数据库名，没有的话会自动创建 -->
<mongo:db-factory id="mongoDbFactory" dbname="uba" mongo-ref="mongo" />

<!-- 读写分离级别配置  -->
<!-- 首选主节点，大多情况下读操作在主节点，如果主节点不可用，如故障转移，读操作在从节点。 -->
<bean id="primaryPreferredReadPreference" class="com.mongodb.TaggableReadPreference.PrimaryPreferredReadPreference" />
<!-- 最邻近节点，读操作在最邻近的成员，可能是主节点或者从节点。  -->
<bean id="nearestReadPreference" class="com.mongodb.TaggableReadPreference.NearestReadPreference" />
<!-- 从节点，读操作只在从节点， 如果从节点不可用，报错或者抛出异常。存在的问题是secondary节点的数据会比primary节点数据旧。  -->
<bean id="secondaryReadPreference" class="com.mongodb.TaggableReadPreference.SecondaryReadPreference" />
<!-- 优先从secondary节点进行读取操作，secondary节点不可用时从主节点读取数据  -->
<bean id="secondaryPreferredReadPreference" class="com.mongodb.TaggableReadPreference.SecondaryPreferredReadPreference" />
<!-- mongodb的主要操作对象，所有对mongodb的增删改查的操作都是通过它完成 -->
<bean id="mongoTemplate" class="org.springframework.data.mongodb.core.MongoTemplate">
    <constructor-arg name="mongoDbFactory" ref="mongoDbFactory" />
    <property name="readPreference" ref="primaryPreferredReadPreference" />
</bean>
```

