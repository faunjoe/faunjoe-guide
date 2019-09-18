## 第一分部 数据结构与对象

### 简单动态字符串(simple dynamic string,SDS)

![sds-1](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/sds-1.png)

##### 1.常数复杂度获取字符串长度

​		因为C字符串并不记录自身的长度信息，所以为了获取一个C字符串的长度，程序必须遍历整个字符串，对遇到的每个字符进行计数，直到遇到代表字符串结尾的空字符为止这个操作的复杂度为O(n)

通过使用SDS而不是C字符串，Redis将获取字符串长度所需的复杂度从O(n)降低到了O(1)，这确保了获取字符串长度的工作不会成为Redis的性能瓶颈。例如，因为字符串键在底层使用SDS来实现,所以即使我们对一个非常长的字符串键反复执行`STRLEN`命令，也不会对系统性能造成任何影响，因为`STRLEN`命令的复杂度仅为O(1)。

##### 2.杜绝缓冲区溢出	

​		除了获取字符串长度的复杂度高高之外，C字符串不记录自身长度带来的另一个问题是容易造成缓冲区溢出(buffer overflow)。因为C字符串不记录自身的长度，所以strcat假定用户在执行这个函数时，已经为desc分配了足够多的内存，可以容纳src字符串中的所有内容，而一旦这个假定不成立时，就会产生缓冲区溢出。

​		与C字符串不同，SDS的空间分配策略完全杜绝了发生缓冲区溢出的可能性：当SDS API需要对SDS进行修改时，API会先检查SDS的空间十分满足修改所需的要求，如果不满足的话，API会自动将SDS的空间扩展至执行修改所需的大小，然后才执行实际的修改操作，所有使用SDS既不需要手动修改SDS的空间大小，也不会出现前面所说的缓冲区溢出的问题。

##### 3.减少修改字符串时带来的内存重分配次数

​		为了避免C字符串的这种缺陷，SDS通过为使用空间解除了字符串长度和底层数组长度之间的关联：在SDS中，buf数组的长度不一定就是字符数量加一，数组里面可以包含未使用的字节，而这些字节的数据量就由SDS的free属性记录。

​	通过为使用空间，SDS实现了空间预分配和惰性空间释放两种优化策略。

- 空间预分配

​		空间预分配用于优化SDS的字符串增长操作：当SDS的API对一个SDS进行修改，并且需要对SDS进行空间扩展的时候，程序不仅会为SDS分配修改所必须要的空间，还会为SDS分配额外的未使用空间。

​		其中，额外分配的未使用空间数量由以下公式决定：

​		如果对SDS进行修改之后，SDS的长度(也即是len属性的值)将小于1MB，那么程序分配和len属性同样大小的未使用空间，这时SDS len属性的值将和free属性的值相同。举个例子，如果进行修改之后，SDS的len将变成13字节，那么程序也会分配13字节的未使用空间，SDS的buf数组的实际长度将变成13 + 13 +1 =27 字节(额外的一字节用于保存空字符)。

​		如果对SDS进行修改之后，SDS的长度将大于等于1MB,那么程序会分配1MB的未使用空间。举个例子，如果进行修改之后，SDS的len将变成30MB，那么程序会分配1MB的未使用空间，SDS的buf数据的实际长度将为30MB + 1MB + 1byte。

​		通过空间预分配策略，Redis可以减少连续执行字符串增长操作所需的内存重分配次数。

- 惰性空间释放

  ​		惰性空间释放用于优化SDS的字符串缩短操作：当SDS的API需要缩短SDS保存的字符串时，程序并不立即使用内存重分配来回收缩短后多出来的字节，而是使用free属性将这些字节的数量记录起来，并等待将来使用。

  ​		通过惰性空间释放策略，SDS避免了缩短字符串时所需的内存重分配操作，并未将来可能有的增长操作提供了优化。

  ​		与此同时，SDS也提供了响应的API，让我们可以在有需要时，真正地释放SDS的未使用空间，所以不用担心惰性空间释放策略会造成内存浪费。

##### 4.二进制安全

​		C字符串中的字符必须符合某种编码(比如ASCII),并且除了字符串的末尾之外，字符串里面不能包含空字符，否则最先被程序读入的空字符将被误认为是字符串结尾，这些限制使得C字符串只能保持文本数据，而不能保存像图片、音频、视频、压缩文件这样的二进制数据。

### 对象

##### 1.对象的类型与编码

​		Redis使用对象来表示数据库中的建和值，每次当我们在Redis的数据库中新创建一个键值对时,我们至少会创建两个对象,一个对象用作键值对的键(键对象),另一个对象用作键值对的值(值对象)。

​		举个例子，以下SET命令在数据库中创建了一个新的键值对，其中键值对的键是一个包含了字符串值"msg"的对象，而键值对的值则是一个包含了字符串值"hello world"的对象。

```shell
redis> SET msg "hello world"
OK
```

​		Redis中的每个对象都由一个redisObject结构表示，该结构中和保存数据有关的三个属性分别是`type`属性、`encoding`属性和`ptr`属性：

```c
typedef struct redisObject {
  	//类型
  	unsigned type:4;
  	//编码
  	unsigned encoding:4;
  	//指向底层实现数据结构的指针
  	void *ptr;
  	// ...
} robj;
```

##### 1.1 类型

​		对象的`type`属性记录了对象的类型，这个属性的值可以是表列出的常量的其中一个。

| 类型常量     | 对象的名称   |
| ------------ | ------------ |
| REDIS_STRING | 字符串对象   |
| REDIS_LIST   | 列表对象     |
| REDIS_HASH   | 哈希对象     |
| REDIS_SET    | 集合对象     |
| REDIS_ZSET   | 有序集合对象 |

​		对于Redis数据库保存的键值对来说，键总是一个字符串对象，二值则可以是字符串对象、列表对象、哈希对象、集合对象或者有序集合对象的其中一种。

​		`TYPE`命令的实现方式也与此类似，当我们对一个数据库键执行`TYPE`命令时，命令返回的结果为数据库键对应的值对象的类型，而不是键对象的类型：

```c
# 键为字符串对象，值为字符串对象
redis> SET msg "hello world"
OK

redis> TYPE msg
string

# 键为字符串对象，值为列表对象
redis> RPUSH numbers 1 3 5
  
redis> TYPE numbers
list

# 键为字符串对象，值为哈希对象
redis> HMSET profile name tom age 25 career programmer
OK

redis> TYPE profile
hash

# 键为字符串对象，值为集合对象
redis> SADD fruits apple banana cherry
(integer) 3
  
redis> TYPE fruits
set

# 键为字符串对象，值为有序集合对象
redis> ZADD price 8.5 apple 5.0 banana 6.0 

redis> TYPE price
zset
```

| 对象         | 对象type属性值 | TYPE命令的输出 |
| ------------ | -------------- | -------------- |
| 字符串对象   | REDIS_STRING   | "String"       |
| 列表对象     | REDIS_LIST     | "List"         |
| 哈希对象     | REDIS_HASH     | "Hash"         |
| 集合对象     | REDIS_SET      | "Set"          |
| 有序集合对象 | REDIS_ZSET     | "zset"         |

##### 1.2 编码和底层实现

​		对象的ptr指针指向对象的底层实现数据结构，而这些数据结构由对象的`encoding`属性决定。

​		`encoding`属性记录了对象所使用的编码，也即是说这个对象使用了什么数据结构作为对象的底层实现，这个属性的值可以是表列出的常量的其中一个。

| 编码常量                  | 编码所对应的底层数据结构   |
| ------------------------- | -------------------------- |
| REDIS_ENCODING_INT        | long类型的整数             |
| REDIS_ENCODING_EMBSTR     | embstr编码的简单动态字符串 |
| REDIS_ENCODING_RAW        | 简单动态字符串             |
| REDIS_ENCODING_HT         | 字典                       |
| REDIS_ENCODING_LINKEDLIST | 双端链表                   |
| REDIS_ENCODING_ZIPLIST    | 压缩列表                   |
| REDIS_ENCODING_INTSET     | 整数集合                   |
| REDIS_ENCODING_SKIPLIST   | 跳跃表和字典               |

​		每种类型的对象都至少



# 第9章 数据库

##### 9.1 服务器中的数据库

​		Redis服务器将所有数据库都保存在服务器状态`redis.h/redisServer`结构的db数组中,db数组的每个项都已一个`redis.h/redisDb`结构，每个redisDb结构代表一个数据库：

```c
struct redisServer {
  // ...
  // 一个数组,保存着服务器中的所有数据库
  redisDb *db;
  // 服务器的数据库数量
  int dbnum;
  // ...
}
```

​		在初始化服务器时，程序会根据服务器状态的dbnum属性来决定应该创建多少个数据库，dbnum属性的默认为16。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-1-database.png)

##### 9.2 切换数据库

​		每个Redis客户端都有自己的目标数据库，每当客户端执行数据库写命令或者数据库读命令的时候，目标数据库就会成为这些命令的操作对象。

​		默认情况下，Redis客户端的目标数据库为0号数据库，但客户端可以通过执行`select`命令来切换目标数据库。

```shell
redis> set msg "hello world"
OK
redis> select 2
OK
redis[2]> get msg
(nil)
redis[2]> set msg "another world"
OK
redis[2]> get msg
"another world"
```

​		在服务器内部，客户端状态`redisClient`结构的db属性记录了客户端当前的目标数据库，这个属性是一个指向`redisDb`结构的指针：

```c
typedef struct redisClient {
  // ...
  // 记录客户端当前正在使用的数据库
  redisDb *db;
  // ...
} redisClient
```

​		redisClient.db指针指向redisServer.db数组的其中一个元素，而被指向的元素就是客户端的目标数据库。

​		比如说，如果某个客户端的目标数据库为1号数据库，那么这个客户端所对应的客户端状态和服务器状态之间的关系如果所示。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-1-redisClient-1.png)

​		通过修改redisClient.db指针，让它指向服务器中的不同数据库，从而实现切换目标数据库的功能—这就是select命令的实现原理。

> # 						谨慎处理多数据库程序
>
> ​		到目前为止,Redis 仍然没有可以返回客户端目标数据库的命令。虽然redis-cli客户端会在输入符旁边提示当前所使用的目标数据库。但如果在其他语言的客户端中执行Redis命令，并且该客户端没有像redis-cli那样一直显示目标数据库的号码，那么在数次切换数据库之后，你很可能会忘记自己当前正在使用的是哪个数据库。当出现这种情况时，为了避免对数据库进行误操作，在执行Redis命令特别是像flushdb这样的危险命令之前，最好先执行一个select命令，显示的切换到指定的数据库，然后才执行别的命令。

##### 9.3 数据库键空间

​		Redis是一个键值对(key-value pair)数据库服务器，服务器中的每个数据库都由一个`redis.h/redisDb`结构表示，其中，redisDb结构的dict 字典保存了数据库中的所有键值对，我们将这个字典称为键空间(key space):

```c
typedef struct redisDb {
  // ...
  // 数据库键空间，保存着数据库中的所有键值对
  dict *dict;
  // ...
} redisDb;	
```

​		键空间和用户所见的数据库是直接对应的：

- 键空间的键也就是数据库的键，每个键都是一个字符串对象。

- 键空间的值也就是数据库的值，每个值可以是字符串对象、列表对象、哈希表对象、集合对象和有序集合对象中的任意一种Redis对象。

  举个例子，如果我们在空白的数据库中执行以下命令：

  ```c
  redis> set message "hello world"
  OK
  redis> rpush alphabet "a" "b" "c"
  (integer) 3
  redis> hset book anthor "Josiah L. Carlson"
  (integer) 1
  redis> hset book publisher "Manning"
  (integer) 1
  ```

- alphabet 是一个列表键，键的名字是一个包含字符串”alphabet“的字符串对象，键的值则是一个包含三个元素的列表对象。

- book是一个哈希表键，键的名字是一个包含字符串”book“的字符串对象,键的值则是一个包含三个键值对的哈希表对象。

- message是一个字符串键，键的名字是一个包含字符串”message“的字符串对象，键的值则是一个包含字符串”hello world“的字符串对象。

  ![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-1-dict-1.png)

  ​	因为数据库的键空间是一个字典，所以所有针对数据库的操作，比如添加一个键值对到数据库，或者从数据库中删除一个键值对，又或者在数据库中获取某个键值对等，实际上都是通过对键空间字典进行操作来实现的。

##### 9.3.1 添加新键

​		添加一个新键值对到数据库,实际上就是将一个新键值对添加键空间字典里面,其中键为字符串对象，而值则为任意一种类型的Redis对象。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-1-dict-add-1.png)

##### 9.3.2 删除键

​		删除数据库中的一个键，实际上就是在键空间里面删除键所对应的键值对对象。

```c
redis> del book
(integer) 1
```

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-1-dict-del-1.png)

##### 9.3.3 更新键

​		对一个数据库键进行更新，实际上就是对键空间里面键所对应的值对象进行更新，根据值对象的类型不同，更新的具体方法也会有所不同。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-3-update-1.png)

##### 9.3.4  对键取值

​		对一个数据库键进行取值，实际上就是在键空间中取出键所对应的值对象，根据值对象的类型不同，具体的取值方法也会有所不同。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-4-get-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-4-lrange-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-4-lrange-2.png)

##### 9.3.5 其他键空间操作

​		除了上面列出的添加、删除、更新、取值操作之外，还有很多针对数据库本身的Redis命令,也是通过对键空间进行处理来完成的。

​		flushdb清空整个数据库命令，通过删除键空间中所有键值对来实现的。

​		randomkey随机返回数据库中某个键，通过在键空间中随机返回一个键来实现的。

​		dbsize数据库键数量，就是通过返回键空间中包含的键值对的数量来实现的。类似的命令还有exists、rename、keys等，这些命令都是通过对键空间进行操作来实现的。

##### 9.3.6 读写键空间时的维护操作

​	![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-6-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-3-6-2.png)

##### 9.4 设置键的生存时间或过期时间

​		通过expire命令或者pexpire命令,客户端可以以秒或者毫秒精度为数据库中的某个键设置生存时间(Time To Live,TTL),在经过指定的秒数或者毫秒数之后，服务器就会自动删除生存时间为0的键：

```c
redis> set key value
OK
redis> expire key 5
(integer)	1
redis> get key // 5秒之后
"value"
redis> get key // 5秒之后
(nil)
```

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-4-ttl-1.png)

数据库如何保存键的生存时间和过期时间，以及服务器如何自动删除那些带有生存时间和过期时间的键。

##### 9.4.1 设置过期时间

​		Redis有四个不同的命令可以用于设置键的生存时间。

- expire <key> <ttl> 命令用于将键key的生存时间设置为ttl秒。
-  pexpire <key> <ttl> 命令用于将键key的生存时间设置为ttl毫秒。
- expireat <key> <timestamp> 命令用于将键key的过期时间设置为timestamp所指定的秒数的时间戳。
- pexpireat <key> <timestamp> 命令用于将键key的过期时间设置为timestamp所指定的毫秒数的时间戳。

##### 9.4.2 保存过期时间

​		redisDb结构的expires字典保存了数据库中所有键的过期时间，我们称这个字典为过期字典：

- 过期字典的键是一个指针，这个指针指向键空间中的某个键对象(也即是某个数据库键)。

- 过期字典的值是一个long类型的整数，这个整数保存了键所指向的数据库键的过期时间--一个毫秒精度的unix时间戳。

  ```c
  typedef struct redisDb {
    // ...
    // 过期字典，保存着键的过期时间
    dict *expires;
    // ...
  } redisDb;
  ```

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-4-2-expires-1.png)

- 第一个键值对的键为alphabet键对象，值为1385877600000，这表示数据库键alphabet的过期时间为1385877600000(2013-12-1 日零时)。
- 第二个键值对的键为book键对象，值为1388556000000，这表示数据库键book的过期时间为1388556000000(2014-1-1日零时)。

##### 9.4.3 移除过期时间

​		![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-4-3-persist-1.png)

##### 9.4.5 过期键的判定

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-4-5-1.png)

##### 9.5 过期键删除策略

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-5-del-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-5-1-del-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-5-2-del-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-5-3-del-1.png)

##### 9.6 Redis的过期键删除策略

​		Redis服务器实际使用的是惰性删除和定期删除两种策略,服务器可以很好地在合理使用cpu时间和避免浪费内存空间之间取得平衡。

9.6.1 惰性删除策略的实现

​	![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-6-1-del-1.png)

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-6-1-del-2.png)

##### 9.6.2 定期删除策略的实现

​		过期键的定期删除策略由redis.c/activeExpireCycle函数实现，每当redis的服务器周期性操作redis.c/serverCron函数执行时，activeExpireCycle函数就会被调用，它在规定的时间内，分多次遍历服务器中的各个数据库，从数据库的expires字典中随机检查一部分键的过期时间，并删除其中的过期键。

![](/Users/faunjoe/MyCode/GitHub/faunjoe-guide/DB/Redis/redis-design-images/9-6-del-3.png)

##### 9.7 AOF、RDB和复制功能对过期键的处理

