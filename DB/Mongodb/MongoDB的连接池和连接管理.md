### MongoDB的连接池和连接管理

​		在关系型数据库中，我们总是需要关闭使用的数据库连接，不然大量的创建连接会导致资源的浪费甚至于数据库宕机。		

​		通常我们习惯于new 一个connection并且通常在finally语句中调用connection的close()方法将其关闭。正巧，mongoDB中当我们new一个Mongo的时候，会发现它也有一个close()方法。所以会出现这样的情况：我们在需要DB操作的方法中new一个mongo实例，然后调用mongo.getDB()方法拿到对应的连接，操作完数据之后再调用mongo.close()方法来关闭连接。看起来貌似是没有什么问题，但是如果你再研究一下mongo的API，其实当你new Mongo()的时候，就创建了一个连接池，而且线程安全,可以被多线程共享，getDB()只是从这个连接池中拿一个可用的连接。而连接池是不需要我们及时关闭的，我们可以在程序的生命周期中维护一个这样的单例，至于从连接池中拿出的连接，我们需要关闭吗？答案是NO。你会发现DB根本没有close()之类的方法。在mongoDB中，一个连接池会维持一定数目的连接，当你需要的时候调用getDB()去连接池中拿到连接，而mongo会在这个DB执行完数据操作时候自动收回连接到连接池中待用。所以在mongoDB中大家不必担心连接没有关闭的问题，在你需要在所有操作结束或者整个程序shutdown的时候调用mongo的close()方法即可。MongoClient被设计成线程安全、可以被多线程共享的，通常访问数据库集群的应用只需要一个实例。

​		内部实现了一个连接池。Mongo对象是线程安全的，因此可以只创建一个，在多线程环境下安全使用。因此，我们可以用将Mongo变量作为一个Singleton类的成员变量，从而保证只创建一个连接池。Mongo.close方法将关闭当前所有活跃的连接。

​		DB对象可以通过Mongo.get方法获得，代表了和数据库的一个连接。默认情况下，当执行完数据库的查询或者更新操作后，连接将自动回到连接池中。不需要我们手动调用代码放回池中。

​		mongo实例其实已经是一个现成的连接池了，而且线程安全。这个内置的连接池默认初始了10个连接，每一个操作（增删改查等）都会获取一个连接，执行操作后释放连接。



**连接池的重要参数**

内置连接池有多个重要参数，分别是：

- connectionsPerHost：每个主机的连接数
- threadsAllowedToBlockForConnectionMultiplier：线程队列数，它以上面connectionsPerHost值相乘的结果就是线程队列最大值。如果连接线程排满了队列就会抛出“Out  of semaphores to get db”错误。
- maxWaitTime:最大等待连接的线程阻塞时间
- connectTimeout：连接超时的毫秒。0是默认和无限
- socketTimeout：socket超时。0是默认和无限
- autoConnectRetry：这个控制是否在一个连接时，系统会自动重试

```java
/*
 * mongodb数据库链接池
 */
public class MongoDBDaoImpl implements MongoDBDao
{
    private MongoClient mongoClient = null;
    private static final MongoDBDaoImpl mongoDBDaoImpl = new MongoDBDaoImpl();// 饿汉式单例模式

    private MongoDBDaoImpl()
    {
        if (mongoClient == null)
        {
            MongoClientOptions.Builder buide = new MongoClientOptions.Builder();
            buide.connectionsPerHost(100);// 与目标数据库可以建立的最大链接数
            buide.connectTimeout(1000 * 60 * 20);// 与数据库建立链接的超时时间
            buide.maxWaitTime(100 * 60 * 5);// 一个线程成功获取到一个可用数据库之前的最大等待时间
            buide.threadsAllowedToBlockForConnectionMultiplier(100);
            buide.maxConnectionIdleTime(0);
            buide.maxConnectionLifeTime(0);
            buide.socketTimeout(0);
            buide.socketKeepAlive(true);
            MongoClientOptions myOptions = buide.build();
            try
            {
                mongoClient = new MongoClient(new ServerAddress("127.0.0.1", 27017), myOptions);
            } catch (UnknownHostException e)
            {
                e.printStackTrace();
            }
        }
    }

    public static MongoDBDaoImpl getMongoDBDaoImpl()
    {
        return mongoDBDaoImpl;
    }
}
```

