# MongoDb  MongoClientOptions 常用配置信息

```java
MongoClientOptions.Builder addClusterListener(ClusterListener clusterListener)
Adds the given cluster listener.//添加给定的集群监听器


MongoClientOptions.Builder addCommandListener(CommandListener commandListener)
Adds the given command listener.//添加给定的命令监听器


MongoClientOptions.Builder addConnectionPoolListener(ConnectionPoolListener connectionPoolListener)
Adds the given connection pool listener.//添加给定的连接池侦听器。


MongoClientOptions.Builder addServerListener(ServerListener serverListener)
Adds the given server listener.//添加给定的服务器侦听器。


MongoClientOptions.Builder addServerMonitorListener(ServerMonitorListener serverMonitorListener)
Adds the given server monitor listener.//添加给定的服务器监视器侦听器。


MongoClientOptions.Builder alwaysUseMBeans(boolean alwaysUseMBeans)
Sets whether JMX beans registered by the driver should always be MBeans, regardless of whether the VM is Java 6 or greater.
//设置由驱动程序注册的JMX bean是否应该始终是mbean，而不管VM是Java 6还是更大。


MongoClientOptions.Builder applicationName(String applicationName)
Sets the logical name of the application using this MongoClient.//设置MongoClient应用程序的逻辑名称。


MongoClientOptions build()
Build an instance of MongoClientOptions.//构建一个MongoClientOptions 实例


MongoClientOptions.Builder codecRegistry(CodecRegistry codecRegistry)
Sets the codec registry//设置注册表编解码器


MongoClientOptions.Builder connectionsPerHost(int connectionsPerHost)
Sets the maximum number of connections per host.//设置每个主机的最大连接数。


MongoClientOptions.Builder connectTimeout(int connectTimeout)
Sets the connection timeout.//设置连接超时。


MongoClientOptions.Builder cursorFinalizerEnabled(boolean cursorFinalizerEnabled)
Sets whether cursor finalizers are enabled.//设置是否启用游标终结器。


MongoClientOptions.Builder dbDecoderFactory(DBDecoderFactory dbDecoderFactory)
Sets the decoder factory.//设置集译码器工厂。


MongoClientOptions.Builder dbEncoderFactory(DBEncoderFactory dbEncoderFactory)
Sets the encoder factory.//设置编码器工厂。


MongoClientOptions.Builder description(String description)
Sets the description.//设置描述。


MongoClientOptions.Builder heartbeatConnectTimeout(int connectTimeout)
Sets the connect timeout for connections used for the cluster heartbeat.//为用于集群心跳的连接设置连接超时。


MongoClientOptions.Builder heartbeatFrequency(int heartbeatFrequency)
Sets the heartbeat frequency.//设置心跳频率。


MongoClientOptions.Builder heartbeatSocketTimeout(int socketTimeout)
Sets the socket timeout for connections used for the cluster heartbeat.//为用于集群心跳的连接设置套接字超时。


MongoClientOptions.Builder legacyDefaults()
Sets defaults to be what they are in MongoOptions.//设置默认设置为MongoOptions。


MongoClientOptions.Builder localThreshold(int localThreshold)
Sets the local threshold.//设置本地阈值。


MongoClientOptions.Builder maxConnectionIdleTime(int maxConnectionIdleTime)
Sets the maximum idle time for a pooled connection.//设置池连接的最大空闲时间。


MongoClientOptions.Builder maxConnectionLifeTime(int maxConnectionLifeTime)
Sets the maximum life time for a pooled connection.//设置池连接的最大生命时间。


MongoClientOptions.Builder maxWaitTime(int maxWaitTime)
Sets the maximum time that a thread will block waiting for a connection.//设置的最长时间，线程阻塞等待连接。


MongoClientOptions.Builder minConnectionsPerHost(int minConnectionsPerHost)
Sets the minimum number of connections per host.//设置每个主机的最小连接数。


MongoClientOptions.Builder minHeartbeatFrequency(int minHeartbeatFrequency)
Sets the minimum heartbeat frequency.//设置最小的心跳频率。


MongoClientOptions.Builder readConcern(ReadConcern readConcern)
Sets the read concern.


MongoClientOptions.Builder readPreference(ReadPreference readPreference)
Sets the read preference.


MongoClientOptions.Builder requiredReplicaSetName(String requiredReplicaSetName)
Sets the required replica set name for the cluster.//为集群设置所需的副本集名称。


MongoClientOptions.Builder serverSelectionTimeout(int serverSelectionTimeout)
Sets the server selection timeout in milliseconds, which defines how long the driver will wait for server selection to succeed before throwing an exception.//设置服务器选择超时以毫秒为间隔，这定义了在抛出异常之前，驱动程序等待服务器选择成功的时间。


MongoClientOptions.Builder socketFactory(SocketFactory socketFactory)
Sets the socket factory.//设置套接字工厂。


MongoClientOptions.Builder socketKeepAlive(boolean socketKeepAlive)
Deprecated. //默认为true
configuring keep-alive has been deprecated. It now defaults to true and disabling it is not recommended.


MongoClientOptions.Builder socketTimeout(int socketTimeout)
Sets the socket timeout.//设置套接字超时。


MongoClientOptions.Builder sslContext(SSLContext sslContext)
Sets the SSLContext to be used with SSL is enabled.//设置启用SSL的SSL上下文。


MongoClientOptions.Builder sslEnabled(boolean sslEnabled)
Sets whether to use SSL.//设置是否使用 SSL。


MongoClientOptions.Builder sslInvalidHostNameAllowed(boolean sslInvalidHostNameAllowed)
Define whether invalid host names should be allowed.//定义是否允许使用无效的主机名。


MongoClientOptions.Builder threadsAllowedToBlockForConnectionMultiplier(int threadsAllowedToBlockForConnectionMultiplier)
Sets the multiplier for number of threads allowed to block waiting for a connection.//设置允许阻塞等待连接的线程数量的倍数。


MongoClientOptions.Builder writeConcern(WriteConcern writeConcern)
Sets the write concern.

常用配置信息：

MongoClientOptions.Builder connectionsPerHost(int connectionsPerHost)
Sets the maximum number of connections per host.//设置每个主机的最大连接数。


MongoClientOptions.Builder connectTimeout(int connectTimeout)
Sets the connection timeout.//设置连接超时。


MongoClientOptions.Builder maxConnectionIdleTime(int maxConnectionIdleTime)
Sets the maximum idle time for a pooled connection.//设置池连接的最大空闲时间。


MongoClientOptions.Builder maxConnectionLifeTime(int maxConnectionLifeTime)
Sets the maximum life time for a pooled connection.//设置池连接的最大生命时间。


MongoClientOptions.Builder maxWaitTime(int maxWaitTime)
Sets the maximum time that a thread will block waiting for a connection.//设置的最长时间，线程阻塞等待连接。


MongoClientOptions.Builder minConnectionsPerHost(int minConnectionsPerHost)
Sets the minimum number of connections per host.//设置每个主机的最小连接数。


MongoClientOptions.Builder socketTimeout(int socketTimeout)
Sets the socket timeout.//设置套接字超时。


MongoClientOptions.Builder threadsAllowedToBlockForConnectionMultiplier(int threadsAllowedToBlockForConnectionMultiplier)
Sets the multiplier for number of threads allowed to block waiting for a connection.//设置允许阻塞等待连接的线程数量的倍数。
```





