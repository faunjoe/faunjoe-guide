# consumer主要参数

### session.timeout.ms

​		非常重要的参数之一 ! 很多 Kafka 初学者搞不清楚到底这个参数是做什么用的，下面就来 详细探讨一下。简单来说， session.timeout.ms 是 consumer group 检测组内成员发送崩溃的时间 。假设你设置该参数为 5 分钟，那么当某个 group 成员突然崩攒了(比如被 kill -9 或岩机)， 管理 group 的 Kafka 组件(即消费者组协调者，也称 group coordinator，第 6 章中会详细讨论coordinator 〉有可能需要 5 分钟才能感知到这个崩溃。显然我们想要缩短这个时间，让coordinator 能够更快地检测到 consumer 失败 。遗憾 的是，这个 参数还有另外一重含义 :consumer 消息处理逻辑的最大时间一一倘若 consumer 两次 poll 之间的间隔超过了该 参数所设置的阑值，那么 coordinator 就会认为这个 consumer 己经追不上组内其他成员的消费进度了， 因此会将该 consumer实例“踢出”组，该 consumer负责的分区也会被分配给其他 consumer。在最好的情况下，这会导致不必要的 rebalance，因为 consumer 需要重新加入 groupo 更糟的是， 对于那些在被踢出 group 后处理的消息， consumer 都无法提交位移一一这就意味着这些消息在rebalance 之后会被重新消费 一遍。如果一条消息或一组消息总是需要花费很长的时间处理，那么 consumer甚至无法执行任何消费，除非用户重新调整参数 。

​		这似乎给用户出了一个很大的难题。鉴于以上的“窘境”， Kafka 社区于 0.10.1.0 版本对该参数的含义进行了拆分 。 在该版本及以后的版本中， session.timeout.ms 参数被明确为“coordinator检测失败的时间”。 因此在实际使用中，用户可以为该参数设置一个比较小的值 让 coordinator 能够更快地检测 consumer 崩溃的情况，从而更快地开启 rebalance，避免造成更大的消费滞后( consumer lag) 。 目前该参数的默认值是 10 秒。

### max.poll.interval.ms

​		如前所述， session. neout.ms 中“ consumer 处理逻辑最大时间”的含义被剥离出来了，Kafka为i主部分含义单独开放了一个参数一一max.poll.interval.ms。在一个典型的 consumer使用场景中，用户对于消息的处理可能需要花费很长时间。这个参数就是用于设置消息处理逻辑的 最大时间的 。 假设用户的业务场景中消息处理逻辑是把消息、“落地”到远程数据库中，且这个 过程平均处理时间是 2分钟，那么用户仅需要将 max.poll.interval.ms设置为稍稍大于 2分钟的值 即可，而不必为 session. neout.ms也设置这么大的值。

​		通过将该参数设置成实际的逻辑处理时间再结合较低的 session.timeout.ms 参数值，consumer group 既实现了快速的 consumer崩溃检测，也保证了复杂的事件处理逻辑不会造成不必要的 rebalance。

### auto.offset.reset

​		指定了无位移信息或位移越界(即 consumer 要消费的消息的位移不在当前消息日志的合 理区间范围〉时 Kafka 的应对策略 。 特别要注意这里的无位移信息或位移越界，只有满足这两 个条件中的任何 一个时该参数才有效果 。 关于这一点，我们举一个实际的例子来说明 。 假设你首次运行一个 consumer group并且指定从头消费。 显然该 group会从头消费所有数据，因为此 时该 group 还没有任何位移信息 。 一旦该 group 成功提交位移后，你重启了 group，依然指定 从头消费 。 此时你会发现该 group 并不会真的从头消费一一因为 Kafka 己经保存了该 group 的位移信息，因此它会无视 auto.offset.reset的设置。

目前该参数有如下 3个可能的取值。

- earliest:指定从最早的位移开始消费。 注意这里最早的位移不一定就是0。

- latest:指定从最新处位移开始消费 。

- none:指定如果未发现位移信息或位移越界，则抛出异常。笔者在实际使用过程中几

  乎从未见过将该参数设置为 none 的用法，因此该值在真实业务场景中使用甚少。

### enable.auto.commit

​		该参数指定 consumer是否自动提交位移。 若设置为 true，则 consumer在后台自动提交位 移:否则，用户需要手动提交位移。对于有较强“精确处理一次”语义需求的用户来说，最好将该参数设置为 false，由用户自行处理位移提交问题 。

### fetch.max.bytes

​		一个经常被忽略的参数。它指定了 consumer 端单次获取数据的最大字节数 。 若实际业务 消息很大，则必须要设置该参数为一个较大的值，否则 consumer将无法消费这些消息 。

### max.poll.records

​		该参数控制单次 poll 调用返回的最大消息数 。 比较极端的做法是设置该参数为 l，那么每次 poll 只会返回 1 条消息。如果用户发现 consumer 端的瓶颈在 poll 速度太慢，可以适当地增加该参数的值。如果用户的消息处理逻辑很轻量，默认的 500条消息通常不能满足实际的消息 处理速度 。

### heartbeat.interval.ms

​		该参数和 request.timeout.ms、 max.poll.interval.ms参数是最难理解的 consumer参数。 前面 己经讨论了后两个参数的含义，这里解析一下 h巳artbeat.interval.ms的含义及用法。

​		从表面上看，该参数似乎是心跳的问隔时间，但既然己经有了上面的 session.timeout.ms用 于设置超时，为何还要引入这个参数呢?这里的关键在于要搞清楚 consumer group 的其他成员如何得知要开启新一轮 rebalance-一当 coordinator 决定开启新一轮 rebalance 时，它会将这个 决定以 REBALANCE_IN_PROGRESS 异常的形式“塞进” consumer 心跳请求的 response 中，这样其他成员拿到 response 后才能知道它需要重新加入 group。显然这个过程越快越好，而heartbeat. interval.ms 就是用来做这件事情的 。

​		比较推荐的做法是设置一个比较低的值，让 group 下的其他 consumer 成员能够更快地感知新一轮 rebalance. 开启了 。 注意，该值必须小于 session.timeout.ms!这很容易理解，毕竟如 果 consumer 在 session.timeout.ms 这段时间内都不发送心跳， coordinator 就会认为它已经 dead,因此也就没有必要让它知晓 coor.dinator 的决定了 。

### connections.max.idle.ms

​		这又是一个容易忽略的参数!经常有用户抱怨在生产环境下周期性地观测到请求平均处理时间在飘升，这很有可能是因为 Kafka会定期地关闭空闲 Socket连接导致下次 consumer处理 请求时需要重新创建连向 broker 的 Socket 连接 。 当前默认值是 9 分钟，如果用户实际环境中 不在乎这些 Socket资源开销，比较推荐设置该参数值为-1，即不要关闭这些空闲连接。



### 订阅 topic列表

​		新版本 consumer中 consum巳rgroup订阅 topic列表非常简单，使用下面的语句即可实现:

```java
consumer.subscribe(Arrays .asList (”topicl”,”topic2”,”topic3”));
```

​		如果是使用独立 consumer (standalone consumer)，则可以使用下面的语句实现手动订阅:

```java
TopicPartition tpl =new TopicPartition (”topic-name”, 0) ; 
TopicPartition tp2 =new TopicPartition (”topic-name”, 1) ; 
consumer.assign(Arrays.asList(tpl , tp2)) ;
```

​		不管是哪种方法， consumer订阅是延迟生效的，即订阅信息只有在下次poll调用时才会正 式生效 。 如果在 poll之前打印订阅信息，用户会发现它的订阅信息是空的，表明尚未生效。

### 基于正则表达式订阅 topic

​		新版本 consumer还支持基于正则表达式的订阅方式。利用正则表达式可以达到某种程度上的动态订阅效果.

​		使用基于正则表达式的订阅就必须指定 ConsumerRebalanceListenera 该类是一 个回调接口，用户需要通过实现这个接口来实现 consumer 分区分配方案发生变更时的逻辑。如果用户使用 的是自动提交(即设置 enable.auto.commit=true)，则通常不用理会这个类，使用下列的实现类就可以了:

```java
consumer.subscribe(Pattern.compile (”kafka-*”)， new NoOpConsumerRebalanceListener()) ;
```

​		但是，如果用户是手动提交位移的，则至少要在 ConsumerRebalanceListener 实现类的onPartitionsRevoked方法中处理分区分配方案变更时的位移提交 。

# 消息轮询

### poll 内部原理

​		归根结底， Kafka 的 consumer 是用来读取消息的v，而且要能够同时读取多个 topic 的多个分区的消息 。 若要实现并行的消息读取，一种方法是使用多线程的方式，为每个要读取的分区都创建一个专有的线程去消费(这其实就是旧版本 consumer 采用的方式，本章后面会专 门讨论旧版本 consumer 的设计与使用);另 一种方法是采用类似于 Linux I/O 模型的 poll 或 select等，使用 一个线程来同时管理多个 Socket 连接，即同时与多个 broker 通信实现消息的井行读取一一这就是新版本 consumer最重要的设计改变 。

​		一 旦 consumer 订阅了 topic，所有的消费逻辑包括 coordinator 的协调、消费者组的rebalance 以及数据的获取都会在主逻辑 poll 方法的 一 次调用中被执行 。 这样用户很容易使用 一个线程来管理所有的 consumerI/O操作。

​		有很多 Kafka 初学者对新版本 consumer 到底是否是多线程程序感到困惑 。 这里明确给出 确定的答案:截止到目前，对最新版本的 Kafka Cl.0.0)而言，新版本 Javaconsumer是一个多线程或者说是一个双线程的 Java 进程一一创建 KafkaConsumer 的线程被称为用户主线程，同 时 consumer 在后台会创建 一个心跳线程，该线程被称为后台心跳线程 。 KafkaConsumer 的 poll方法在用户主线程中运行。 这也同时表明: 消费者组执行 rebalance、消息获取、 coordinator管理、异步任务结果的处理甚至位移提交等操作都是运行在用户主线程中的。因此仔细调优这个poll方法相关的各种处理超时时间参数至关重要 。

### poll 使用方法

​		consumer 订阅 topic 之后通常以事件循环的方式来获取订阅方案并开启消息读取。听上去似乎有些复杂，但其实用户要做的仅仅是写 一个循环，然后重复性地调用 poll 方法 。 剩下所有 的工作都交给 poll方法帮用户完成。 每次 poll方法返回的都是订阅分区上的一组消息。 当然如 果某些分区没有准备好，某次 poll 返回的就是空的消息集合。 下面的一段代码展示了常见的poll 调用方式:

```java
try {
		while (isRunning) {
			ConsumerRecords<String, String> records= consumer.poll(lOOO); 
      for (ConsumerRecord<String, String> record : records)
				System.out.printf (”topic = %s, partition=%d, offset=%d”， record.topic() , record.partition() , record.offset());
    }
} finally { 
  	consumer.close() ;
}
```

​		poll方法根据当前 consumer 的消费位移返回消息集合 。 当 poll首次被调用时，新的消费者组会被创建并根据对应的位移 重 设策略( auto.offset.reset)来设定消费者组的位移 。一 旦consumer 开始提交位移，每个后续的 rebalance 完成后都会将位置设置为上次己提交的位移。 传递给 poll 方法的超时设定参数用于控制 consumer 等待消息的最大阻塞时间。由于某些原因，broker端有时候无法立即满足 consumer端的获取请求(比如 consumer要求至少一次获取 lMB的数据，但 broker 端无法立即全部给出〉，那么此时 consumer 端将会阻塞以等待数据不断累积并最终满足 consumer需求。如果用户不想让 consumer一直处于阻塞状态，则需要给定一个超时时间 。 因此 poll方法返回满足以下任意 一个条件即可返回。

- 要么获取了足够多的可用数据 。
- 要么 等 待时间超过了指定的超时设置。

​		前面我们谈到了 consumer是单线程的设计理念(这里暂不考虑后台心跳线程，因为它只 是一个辅助线程，并没有承担过重的消费逻辑〉，因此 consumer 就应该运行在它专属的线程中。 新版本 Java consumer 不是线程安全的!如果没有显式地同步锁保护机制， Kafka 会抛出KatkaConsumer is not safe for multi-threaded access异常。如果用户在调用 poll方法时看到了这样的报错，通常说明用户将同一个 KafkaConsumer 实例用在了多个线程中。至少对于目前的Kafka设计而 言 ，这是不被允许的，用户最好不要这样使用。

​		另外在上面的代码中，我们在 while 的条件语句中指定了 一个布尔变量值 isRunning 来标识是否要退出 consumer 消费循环井结束 consumer 应用 。 具体的做法是，将 isRunning 标识为volatile型，然后在其他线程中设直 isRunning = false来控制 consumer的结束。最后千万不要忘记关闭 consumer。 这不仅会清除 consumer 创建的各种 Socket 资源，还会通知消费者组coordinator主动离组从而更快地开启新一轮 rebalancea 比较推荐的做法是，在 finally代码块中显式调用 consumer.close()，从而保证 consumer总是能够被关闭的。

​		KatkaConsumer 的 poll 方法为什么会有一个超时的参数?实际使用中应该根据什么规则来设定此值?要回答这些问题，我们需要思考 一 下引入这个参数的初衷。诚然，它是超时的设定，但 Kafka社区引入这个参数的目的其实是想让 consumer程序有机会定期“醒来”去做一些其他 的事情 。 假设用户的 consumer 程序除了消费之外还需要定期地执行其他的常规任务(比如每隔10秒需要将消费情况记录到日志啊，那么用户就可以使用 consumer.poll(lOOOO)来让 consumer有机会在等待 Kafka消息的同时还能够定期执行其他任务。这就是使用超时设定的最大意义 。

​		另 一方面，若用 consumer 程序除了消费消息之外没有其他的定时任务需要执行，即consumer程序唯一的目的就是从 Kafka获取消息然后进行处理，那么用户可采用与上面代码完 全不同的 poll调用方法，如下面的代码所示 :

```java
try {
	while (true) {
		ConsurnerRecords<String, String> records= consumer.poll(Long.MAX VALUE);
    for (ConsumerRecord<String, String> record : records) System.out.printf(”topic =%s, partition=%d, offset=%d”， record.topic(), record.partition(), record .offset());
  }
} catch (WakeupException e) { //此处忽略此异常的处理
} finally { 
  consumer . close();
}
```

​		请注意上面这段代码与前 一段代码的区别: consumer.poll(Long.MAX_VALUE); 。在这段代码中我们让 consumer程序在未获取到足够多数据时无限等待，然后通过捕获 Wak:upException异常来判断 consumer是否结束。显然，这是与第一种调用方法完全不同的使用思想 。

​		如果使用这种方式调用 poll，那么需要在另一个线程中调用 consumer.wakeup()方法来触发consumer 的关闭。前面我们说过， KafkaConsumer 不是线程安全的，但是有一个例外:用户可 以安全地在另 一个线程中调用 consumer.wakeup()。注意，只有 wakeup 方法是特例，其他KafkaConsumer方法都不能同时在多线程中使用 。

​		WakeupException 异常是在 poll 方法中被抛出的，因此如果 当前事件循环代码正在执行poll 之后的消息处理逻辑，则它并不会马上响应 wakeup，只会等待下次 poll 调用时才进行响应。 举一个实际的例子，假设每次 poll 返回消息后，用户 consumer 程序都需要为这些消息执 行很繁重的计算工作，那么在计算过程中该 consumer是不会响应另 一个线程调用的 wakeup 的，它只能在下次 poll 时才响应。所以程序表现为不能立即退出，会有一段延迟时间 。 这也是为什 么不推荐用户将很繁重的消息处理逻辑放入 poll主线程执行的原因 。

​		说了这么多，我们简单总结一下 poll 的使用方法 。

​		consumer 需要定期执行其他子任务:推荐 poll (较小超时时间)+运行标识布尔变量的方式。

​		consumer 不需要定期执行子任务:推荐 poll(MAX_VALUE) +捕获 WakeupException的方式。

# consumer位移

​		consumer端需要为每个它要读取的分区保存消费进度，即分区中当前最新消费消息的位置 。该位置就被称为位移(offset) 。 consumer 需要定期地向 Kafka 提交自己的位置信息，实际上，这里的位移值通常是下 一条待消费的消息的位置。假设 consumer 己经读取了某个分区中的第N条消息，那么它应该提交位移值为 N，因为位移是从 0开始的，位移为 N 的消息是第 N+l 条消息 。 这样下次 consumer 重启时会从第 N+l 条消息开始消费。总而言之， offset 就是consumer端维护的位置信息 。

​		offset 对于 consumer 非常重要，因为它是实现消息交付语义保证( message deliverysemantic)的基石 。 常见的 3 种消息交付语义保证如下。

- 最多 一 次( at most once)处理语义:消息可能丢失，但不会被重复处理 。
- 最少 一 次( at least once)处理语义:消息不会丢失，但可能被处理多次。
- 精确一次( exactlyonce)处理语义:消息一定会被处理且只会被处理一次。

​		显然，若 consumer在消息消费之前就提交位移，那么便可以实现 at most once-一因为若consumer 在提交位移与消息消费之间崩溃，则 consumer 重启后会从新的 offset 位置开始消费，前面的那条消息就丢失了 。 相反地，若提交位移在消息消费之后，则可实现 at least once 语义。由于 Kafka没有办法保证这两步操作可以在同一个事务中完成，因此 Kafka默认提供的就是 atleast once 的处理语义。好消息是 Kafka社区己于 0.11.0.0版本正式支持事务以及精确一次处理语义。

​		既然 offset 本质上就是一个位置信息，那么就需要和其他一些位置信息区别开来。图给出了与 consumer相关的多个位置信息。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/kafka/image/consumer-5.6.png)

- 上次提交位移( last committed offset) : consumer最近一次提交的 offset值。
- 当前位置( currentposition) : consumer 己读取但尚未提交时的位置。
- 水位( watermark):也被称为高水位( high watermark 〉，严格来说它不属于consumer 管理的范围，而是属于分区日志的概念。对于处于水位之下(或者说图 5.6中位于水位左边〉的所有消息， consumer 都是可以读取的， consumer 无法读取水位以上(图 5.6 中位于水位右边〉的消息。
- 日志终端位移( Log End Offset , LEO ) :也 被称为日志最新位移。同样不属于consumer 范畴，而是属于分区日志管辖。它表示了某个分区副本当前保存消息对应的最大的位移值。值得注意的是，正常情况下 LEO 不会比水位值小。事实上，只有分区所有副本都保存了某条消息，该分区的 leader副本才会向上移动水位值 。

​		我们只需要关心图 中 offset和当前位置的含义以及关 系就可以了 。 再次强调一下， consumer最多只能读取到水位值标记的消息，而不能读取尚未完 全被“写入成功”的消息，即位于水位值之上的消息。

# 新版本 consumer位移管理

​		consumer 会在 Kafka 集群的所有 broker 中选择 一 个 broker 作为 consumer group 的coordinator，用于实现组成员管理、消费分配方案制定以及提交位移等 。 为每个组选择对应coordinator的依据就是，内部 topicLconsumer二offsets)。 和普通的 Kafka topic相同，该 topic 配置有多个分区，每个分区有多个副本。它存在的唯 一 目的就是保存 consumer提交的位移。

​		当消费者组首次启动时，由于没有初始的位移信息， coordinator 必须为其确定初始位移值， 这就是 consumer 参数 auto.offset. set 的作用。通常情况下， consumer 要么从最早的位移开始读取，要么从最新的位移开始读取 。

​		当 consumer 运行了 一段时间之后，它必须要提交自己的位移值 。 如果 consumer 崩渍或被 关闭，它负责的分区就会被分配给其他 consumer，因此一定要在其他 consumer 读取这些分区 前就做好位移提交工作，否则会出现消息的重复消费。

​		consumer 提交位移的主要机制是通过向所属的 coordinator 发送位移提交请求来实现的 。每个位移提交请求都会往_consumer_offsets 对应分区上追加写入一条消息 。 消息的 key 是group.id、 topic和分区的元组，而 value就是位移值。 如果 consumer为同一个 group的同一个topic 分区提交了多次位移，那么一consumer_offsets 对应的分区上就会有若干条 key 相同但value 不同的消息，但显然我们只关心最新一次提交的那条消息。从某种程度来说，只有最新提交的位移值是有效的，其他消息包含的位移值其实都已经过期了 。 Kafka 通过压实( compact)策略来处理这种消息使用模式。

# __consumer_offsets

​		首先，要明确的是，这个 topic通常情况下都是给新版本 consumer使用的。为什么说是通 常情况?因为旧版本 consumer确实也提供了一个特定的参数让用户在使用旧版本 consumer时把位移提交到这个 topic 上。那就是设置旧版本 consumer 的参数 offsets.storage=kafka。不过笔者很少看到有这样的用法，因此我们可以安全地认为这个内部 topic就是为新版本 consumer保 存位移的。

​		其次’_consumer_offsets 是 Kafka 自行创建的，因此用户不可擅自删除该 topic 的所有信息。很多 Kafka初学者在搭建起 Kafka集群井执行了一些消费操作后，会发现在 Kafka 的日志目录下出现了很多诸如图 5.4这样的文件夹，于是询问是否可以手动删除它们。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/kafka/image/consumer_offsets.png)

​		现在我们知道了这些文件夹是属于 consumer offsets 的，所以 不可以删除它们 。 通常情 况下，这样的文件夹应该有 50个，编号从 0到 49。

​		如果打开图 5.4中的任意一个文件夹，会发现它就是一个正常的 Kafka topic 日志文件目录，里面至少有一个日志文件 Uog)和两个索引文件( .index 和.timeindex) 。 只不过该日志中保存的消息都是 Kafka 集 群上 consumer (特 别 是 consumer group )的位移信息罢了 。

consumer offsets的每条消息格式大致如图 5.5所示。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/kafka/image/consumer_offsets_format.png)

​		你可以把它想象成一个 KV格式的消息， key就是一个三元组: group.id+topic +分区号，而 value就是 offset的值。 每当更新同一个 key的最新 offset值时，该 topic就会写入一条含有 最新 offset 的消息，同时 Kafka会定期地对该 topic执行压实操作(compact)，即为每个消息key 只保存含有最新 offset 的 消息 。 这样既避免了对分区日志消息的修改 ，也 控制住了一consumer_offsets topic总体的日志容量 ，同时还能实时反映最新的消费进度。

​		考虑到一个 Kafka生产环境中可能有很多 consumer或 consumer group，如果这些 consumer同时提交位移， 则必将加重_consumer_offsets的写入负载，因此社区特意为该 topic创建了 50个分区，并且对每个 group.id做哈希求模运算，从而将负载分散到不同的_consumer_offsets分 区上。 这就是说，每个 consumergroup保存的 offset都有极大的概率分别出现在该 topic的不同分区上 。

​		总之,__consumer_offsets是系统内部的 topic，用户应尽量避免执行该 topic的任何操作。我们将会在监控相关章节中介绍如何利用_consumer_offsets 定位并读取 consumer group 的offset信息 。

# 自动提交与手动提交

​		如前所述，位移提交策略对于提供消息交付语义至关重要 。 默认情况下， consumer是自动提交位移的，自动提交间隔是 5秒。这就是说若不做特定的设置， consumer程序在后台自动提 交位移。通过设置 auto.commit.interval.ms参数可以控制自动提交的间隔。

​		自动位移提交的优势是降低了用户的开发成本使得用户不必亲自处理位移提交:劣势是用户不能细粒度地处理位移的提交，特别是在有较强的精确一次处理语义时。在这种情况下，用户可以使用手动位移提交。

​		所谓的手动位移提交就是用户自行确定消息何时被真正处理完并可以提交位移 。 在一个典型的 consumer 应用场景中，用户需要对 poll 方法返回的消息集合中的消息执行业务级的处理。用户想要确保只有消息被真正处理完成后再提交位移。如果使用自动位移提交则无法保证这种 时序性，因此在这种情况下必须使用手动提交位移。设置使用手动提交位移非常简单，仅仅需要在构建 KafkaConsumer 时设置 enable.auto.comrnit=false，然后调用 comrnitSync 或commitAsync 方法即可。 

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/kafka/image/commitsync.png)

​		上面的代码中 consumer 持续消费一批消息并把它们加入一个缓冲区中。当积累了足够多的消息(本例为 500条〉便统一插入到数据库中。只有被成功插入到数据库之后，这些消息才 算是真正被处理完。此时调用 .KafkaConsumer.commitSync 方法进行手动位移提交，然后清空缓冲区以备缓存下一批消息。若在成功插入数据库之后但提交位移语句执行之前 consumer 程 序崩溃，由于未成功提交位移， consumer重启后会重新处理之前的一批消息并将它们再次插入 到数据库中，从而造成消息多次被消费。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/kafka/image/consumersyncAnsAsync.png)

​		手动提交位移 API 进一步细分为同步手动提交和异步手动提交，即 commitSync 和commitAsync 方法 。 如果调用的是 commitSync，用户程序会等待位移提交结束才执行下 一条 语句命令。相反地，若是调用 commitAsync，则是一个异步非阻塞调用。 consumer 在后续 poll调用时轮询该位移提交的结果。特别注意的是，这里的异步提交位移不是指 consumer 使用单独的线程进行位移提交。实际上 consumer 依然会在用户主线程的 poll 方法中不断轮询这次异步提交的结果。只是该提交发起时此方法是不会阻塞的，因而被称为异步提交。

# 旧版本 consumer位移管理

​		旧版本 consumer 的位移默认保存在 ZooKeeper 节点中，与_consumer二~ffsets 完全没有关系 。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/kafka/image/zookeeper-offsets.png)

​		该路径是/consumers/<group.id>/offsets/<topic>/<partitionld>，其中 group.id、 topic 和 partitionld是变化的值，因用户的不同环境而不同。

​		随着 Kafka consumer 在实际场景的不断应用，社区发现旧版本 consumer 把位移提交到ZooKeeper 的做法并不合适。 ZooKeeper 本质上只是一个协调服务组件，它并不适合作为位移信息的存储组件，毕竟频繁高并发的读/写操作并不是 ZooKeeper擅长的事情。因此在 0.9.0.0版本 Kafka推出的新版本 consumer 中，位移提交的方式被彻底颠覆一一新版本 consumer把位移提交到 Kafka 的一个内部 topic C_consumer_offsets)上。注意，这个 topic 名 字的前面有两个下画线!

​		旧版本 consumer 也区分自动提交位移和手动提交位移，只不过区分它们的参数名叫auto.commit.enable，而不是新版本的 enable剧to.commit。 各位读者切记不要混淆。 另外旧版本consumer 默认的提交间隔是 60 秒，而不是新版本的 5 秒。该间隔由参数 auto.commit. interval.ms 控制 。

​		当设置成手动提交位移时，用户需要在 consumer 程序中显式调用 ConsurnerConnector.commitOffsets 方法来提交位移。和新版本 consumer 类似，如果直接调用 commitOffsets()，则会为该 consumer订阅的所有分区都提交位移;若是调用 commitOffsets(Map)版本，则可以实现 细粒度化的位移提交。

# 重平衡( rebalance )

### rebalance概览

​		consumer group 的 rebalance 本质上是一组协议，它规定了一个 consumer group 是如何达成一致来分配订阅 topic 的所有分区的 。 假设某个组下有 20 个 consumer 实例，该组订阅了 一个 有着 100 个分区的 topic。 正常情况下， Kafka 会为每个 consumer 平均分配 5 个分区。这个分 配过程就被称为 rebalance。 当 consumer 成功地执行 rebalance 后，组订阅 topic 的每个分区只会分配给组内的一个 consumer实例。

​		和旧版本 consumer依托于 ZooKeeper进行 rebalance 不同，新版本 consumer使用了 Kafka内置的一个全新的组协调协议( group coordination protocol) 。对于每个组而言， Kafka 的某个broker 会被选举为组协调者( group coordinator) o coordinator 负责对组的状态进行管理，它的主要职责就是当新成员到达时促成组内所有成员达成新的分区分配方案，即 coordinator负责对组执行 rebalance操作。

### rebalance 触发条件

组 rebalance触发的条件有以下 3个。

- 组成员发生变更，比如新 consumer 加入组，或己有 consumer 主动离开组，再或是己 有 consumer崩溃时则触发 rebalance。
- 组订阅 topic 数发生变更，比如使用基于正则表达式的订阅，当匹配正则表达式的新topic被创建时则会触发 rebalance。
- 组订阅 topic 的分区数发生变更，比如使用命令行脚本增加了订阅 topic 的分区数 。

​		真实应用场景中引发 rebalance最常见的原因就是违背了第一个条件，特别是 consumer崩溃的情况。这里的崩横不一定就是指 consumer进程“挂掉”或 consumer进程所在的机器岩机。当 consumer无法在指定的时间内完成消息的处理，那么 coordinator就认为该 consumer 己经崩 溃，从而引发新一轮 rebalance。举一个真实的案例，笔者曾经碰到过一个 Kafka线上环境，发现该环境中的 consumer group 频繁地进行 rebalance，但组内所有 consumer 程序都未出现崩溃的情况，另外消费者组的订阅情况也从未发生过变更。经过一番详细的分析，最后笔者定位了原因:该 group 下的 consumer 处理消息的逻辑过重，而且事件处理时间波动很大，非常不稳定，从而导致 coordinator 会经常性地认为某个 consumer 己经挂掉，引发 rebalance。 而consumer 程序中包含了错误重试的代码，使得落后过多的 consumer 会不断地申请重新加入组，最后表现为 coordinator不停地对 group 执行 rebalance，极大地降低了 consumer端的吞吐量。鉴于目前一次 rebalance 操作的开销很大，生产环境中用户 一定要结合自身业务特点仔细调优consumer 参数 request.timeout.ms、 max.poll.records 和 max.poll.interval.ms，以避免不必要的rebalance 出现。

### rebalance 分区分配

​		之前提到过在 rebalance 时 group 下所有的 .consumer 都会协调在一起共同参与分区分配，这是如何完成的呢? Kafka 新版本 consumer 默认提供了 3 种分配策略，分别是 range 策略、round-robin策略和 sticky策略 。

​		所谓的分配策略决定了订阅 topic 的每个分区会被分配给哪个 consumer。 range策略主要是基于范围的思想。它将单个 topic 的所有分区按照顺序排列，然后把这些分区划分成固定大小的分区段井依次分配给每个 consumer; round-robin 策略则会把所有 topic 的所有分区顺序摆开，然后轮询式地分配给各个 consumer。 最新发布的 sticky策略有效地避免了上述两种策略完全无 视历史分配方案的缺陷，采用了“有黠性”的策略对所有 consumer 实例进行分配，可以规避 极端情况下的数据倾斜并且在两次 rebalance I司最大限度地维持了之前的分配方案 。

​		通常意义上认为，如果 group 下所有 consumer 实例的订阅是相同，那么使用 round-robin会带来更公平的分配方案，否则使用 range策略的效果更好。 此外， sticky策略在 0.11.00版本才被引入，故目前使用的用户并不多 。 新版本 consumer 默认的分配策略是 range。 用户根据consumer参数 partition.assignment.strategy来进行设置。另外 Kafka支持自定义的分配策略，用 户可以创建自己的 consumer分配器( assignor) 。

### rebalance 协议

​		前面提到过 rebalance 本质上是 一 组协议 。 group 与 coordinator 共同使用这组协议完成

group 的 rebalance。 最新版本 Kafka 中提供了下面 5 个协议来处理 rebalance相关事直 。

- JoinGroup请求: consumer请求加入组。
- SyncGroup 请求: group leader把分配方案同步更新到组内所有成员中 。
- Heartbeat请求: consumer定期向 coordinator汇报心跳表明自己依然存活 。
- LeaveGroup请求: consumer主动通知 coordinator该 consumer 即将离组 。
- DescribeGroup 请求:查看组的所有信息，包括成员信息、协议信息、分配方案以及订阅信息等 。该请求类型主要供管理员使用 。 coordinator不使用该请求执行 rebalance。

​		在 rebalance过程中， coordinator主要处理 consumer发过来的 JoinGroup和 SyncGroup请求 。当 consumer主动离组时会发送 LeaveGroup请求给 coordinator。

​		在成功 rebalance之后，组内所有 consumer都需要定期地向 coordinator发送 Heartbeat请求 。而每个 consumer 也是根据 Heartbeat 请求的响应中是否包含 REBALANCE IN PROGRESS 来判断当前 group是否开启了新一轮 rebalance。

### rebalance 流程

​		consumer group在执行 rebalance之前必须首先确定 coordinator所在的 broker，并创建与该broker 相互通信的 Socket 连接 。 确定 coordinator 的算法与确定 offset 被提交到__consumer offsets 目标分区的算法是相同的 。 算法如下 。

- 计算 Math.abs(groupID.hashCode) % offsets.topic.num.partitions参数值(默认是 50) '假设是 10。
- 寻找一consumer_offsets分区 10的 leader副本所在的 broker，该 broker即为这个 group的 coordinator。

​		成功连接 coordinator 之后便可以执行 rebalance 操作 。 目前 rebalance 主要分为两步:加入组和同步更新分配方案 。



**加入组:** 这一步中组内所有 consumer (即 group.id 相同的所有 consumer 实例)向coordinator 发送 JoinGroup 请求 。 当收集全 JoinGroup 请求后， coordinator 从中选择一个 consumer担任 group 的 leader，并把所有成员信息以及它们的订阅信息发送给 leader。特别 需 要 注 意的是， group 的 leader 和 coordinator 不是 一 个概念 。 leader 是某个consumer 实 例， coordinator 通常是 Kafka 集群中的 一 个 broker。 另外 leader 而非coordinator负责为整个 group 的所有成员制定分配方案 。

**同步更新分配方案**: 这一步中 leader 开始制定分配方案，即根据前面提到的分配策略 决定每个 consumer都负责哪些 topic 的哪些分区。 一旦分配完成， leader会把这个分配 方案封装进 SyncGroup 请求并发送给 coordinator。 比较有意思的是，组内所有成员都会发送 SyncGroup 请求，不过只有 leader 发送的 SyncGroup 请求中包含了分配方案 。coordinator 接收到分配方案后把属于每个 consumer 的方案单独抽取出来作为SyncGroup请求的 response返还给各自的 consumer。

