Spring通过资源加载器加载相应的XML文件，使用读取器读取资源加载器中的文件到读取器中，在读取过程中，解析相应的xml文件元素，转化为spring定义的数据结BeanDefinition，把相应的BeanDefinition注册到注册表中。注册表中包含的BeanDefinition的数据结构，没有经过加工处理过，无法得到我们想要的bean对象。

我们如何得到Bean对象，spring都做了那些工作？BeanFactory提供了多种方式得到bean对象，getBean()方法是最核心得到bean对象
getBean主要由AbstractBeanFactory、AbstractAutowireCapableBeanFactory、以及DefaultListableBeanFactory实现
AbstractBeanFactory 实现了依赖关系处理
AbstractAutowireCapableBeanFactory 实现了bean的create过程
DefaultListableBeanFactory 实现了BeanDefinition的管理

自己看源码画出了这张流程图，根据这张图来介绍spring是怎么一步步的得到bean对象的。

![](../../image/spring/spirng-getBean-2.png)

以下是getBean方法的实现流程。

getBean经过方法重载后，最终调用的是doGetBean方法，

需要的方法参数如下：
1.name 你要得到bean对象的名称 不能为空
2.requiredType 这个bean对象的Class类型，可以为null
3.args 可以为null，如果有参数，则代表在找到这个bean定义后，通过构造方法或工厂方法或其他方法传入args参数来改变这个bean实例。
spring 工厂开始自动化处理了：
1.name参数的处理： --xml中的alias属性
    如果有&开头的name代表了FactoryBean的实例名称，则要去掉这个前缀
    从别名注册表中解析出规范的名称。这个别名注册表是一个final map，在加载xml时读入bean的别名到该final map中。
2.BeanDefinition的查找： --xml中的name属性
    得到规范的名字，然后拿去检索BeanDefinitionRegistry注册表中是否存在该BeanDefinition，这个BeanDefinitionRegistry注册表，也是一个 final map,里面已经存在了用户定义的BeanDefinition，也是在加载xml时读入BeanDefinition到注册表中的。
  如果不存在该BeanDefinition，并且没有相应的父工厂则抛出异常。
  有相应的父工厂，该工厂就把参数交给了父工厂去处理，父工厂就进入自己的doGetBean方法，重复步骤1工作，就形成递归循环处理。
  如果存在BeanDefinition.查询该BeanDefinition开始进行合并属性到RootBeanDefinition中。
3.合并BeanDefinition为RootBeanDefinition --xml中的parent属性
  #1 如果BeanDefinition没有定义父bean名称，则创建一个新的RootBeanDefinition，并把BeanDefinition赋给新的RootBeanDefinition。
  #2如果这个BeanDefinition是一个RootBeanDefinition，则使用RootBeanDefinition clone出一个。
   如果BeanDefinition存在定义的父bean名称，则通过这个父bean名称查询到父BeanDefinition重复步骤3递归循环处理。
   如果父bean名称和当前的BeanDefinition名称相同则使用父工厂的步骤3，递归循环处理。
   最后，创建一个新的RootBeanDefinition，并把父的BeanDefinition赋给新的RootBeanDefinition，
   并把当前BeanDefinition合并到这个新的RootBeanDefinition
 内部RootBeanDefinition在合并到外部的RootBeanDefinition的时候，但内部bean如果不是单例的，而外部的RootBeanDefinition是单例的，
这时候就需要把内部RootBeanDefinition的scope属性赋值给外部RootBeanDefinition的scope属性上。
4.是否是抽象的  --xml中的abstract属性
  如果是抽象的直接抛异常，不能为实例化bean对象
  否则继续
5.初始化bean的依赖关系 --xml中的depends-on属性
 查询该bean对应的所有依赖关系bean名称，循环依赖bean名称，注册依赖关系，再次getBean递归查询依赖bean。重复步骤1工作。
 它使用final ConcurrentHashMap线程安全的hash表来维护依赖关系
  1.dependentBeanMap key是bean name value是Set<String>包含了该beanname对应的bean依赖的bean名称集合
  2.dependenciesForBeanMap key是bean name value是Set<String>包含了依赖该bean的bean名称集合
6.Scope属性决定创建bean时在不同的条件下进行 --xml中的scope属性
当scope=singleton时，必须保证线程安全的创建单例bean。
当scope=prototype时，必须保证创建的bean是新的实例。
当scope为其他时这个暂时没有研究怎么，好像request session 使用Scope接口的方式进行。
创建的过程时基本相同的。

注：
从上面看，如果解析依赖很多的话，等待其他依赖bean创建完，是非常消耗性能的一件事，比如：单例创建需要加锁。
所以spring使用DefaultSingletonBeanRegistry来本地缓存来保存创建过的对象。
1.final Map<String, Object> singletonObjects = new ConcurrentHashMap<String, Object>(256)
缓存单例对象表，key beanname value是创建的单例对象，所有的单例对象都使用它来维护，它一般带同步光环的，线程安全是首要任务。
2.final Map<String, ObjectFactory<?>> singletonFactories 简单的缓存singleton ObjectFactory，是为了提前曝光单例对象
3.final Map<String, Object> earlySingletonObjects key beanname vlaue缓存提早曝光的对象，
该对象在创建期间只做了简单创建过的对象，未初始化属性及后续处理。即为单例，依赖关系建立指向引用就好了。
(满足条件 1. 单例 2.当前的对象是在创建期间 3.允许曝光对象) 
4.final Set<String> registeredSingletons 注册过的单例名称集合
5.final Set<String> singletonsCurrentlyInCreation当前正创建的单例集合名称
6.final Map<String, Set<String>> containedBeanMap key外部beanname value 内部beanname集合
7.dependentBeanMap key是bean name value是Set<String>包含了我依赖的bean名称集合
8.dependenciesForBeanMap key是bean name value是Set<String>包含了依赖我的bean名称集合
以上的缓存对性能做了优化，有兴趣可以去了解下。并且在线程安全方面是一个很好的例子。
比如：首先就是先去查缓存singletonObjects存在，存在则直接使用，否则查earlySingletonObjects，
满足条件了直接从缓存中取，当然spring在创建复杂的bean时可以通过提前曝光简单的对象，供依赖或后置处理程序使用，来加快访问速度。

上面对查找BeanDefinition、合并RootBeanDefinition及依赖关系建立后，就开始准备创建bean对象了。
7.确定类型  --xml class=""
  创建bean过程获取该bean的类型是必须的。
  如何确定RootBeanDefinition的Class类型
      bean定义 
      1.如果存在BeanClass类型，则直接返回该类型     
      2.不存在就使用className，
    如果配置了BeanExpressionResolver 解析器，使用evaluate方法进行解析类型，(这个接口可以自定义来扩展
       解析定义的表达式，如SpringEL表达式)
    解析的对象是Class类型则返回该类型。
    如果返回的String 则使用工厂类加载器加载该className返回class类型
    这里会尝试多个类型加载器进行加载直到加载成功，比如当前工厂的类加载器、RootBeanDefinition的类加载，默认的类加载器等。
    在解析完类型后spring使用了缓存来保存className对应的类型，以便在以后中使用。
8.实例化之前的工作
  拷贝一个新的RootBeanDefinition供初始化使用。
  设置定义的覆盖方法标记为已经加载过,避免参数类型检查的开销。这里的覆盖方法 --xml:lookup-method或replace-method
  下面该给客户机会参与进来的机会了
  
   在实例化对象之前，spring设置了实例化后置处理器InstantiationAwareBeanPostProcessor，供外部控制或处理一些业务。
   比如代理这个对象，不需要spring实例化创建bean等，这是一个扩展点。用户可以自己加入自己的实例化后置处理器，来处理一些业务。
   首先满足合成的RootBeanDefinition不是应用程序本身定义的，并且工厂中已经包含一个或多个InstantiationAwareBeanPostProcessor处理器，
   满足条件后，为了供InstantiationAwareBeanPostProcessor的方法postProcessBeforeInstantiation(Class<?> beanClass, String beanName)调用，
   需要确定 beanClass的目标类型，即要返回的bean对象的类型，如果返回null将不会调用当前循环中后续的BeanPostProcessor
   1.如果定义bean创建使用普通方式来创建就和上面的步骤7一样，找到对应的beanClass返回
   2.使用(静态)工厂方法定义则使用下面的流程来确定类型： factory-bean="carFactory" factory-method="getCar"
    1.如果RootBeanDefinition.resolvedFactoryMethodReturnType为class类型，则返回
        2.如果不是，得到 factory-bean对应的名称carFactory，
    如果没有定义factory-bean则说明使用了当前类做工厂，则调用7的步骤得到工厂类型
    确定carFactory类型
            1.如果carFactory存在则先从单例池中查询有没对应工厂bean对象，如果有返回该工厂bean的class类型，
         如果类型是FactoryBean类型则调用FactoryBean.getObjectType方法返回工厂bean类型，
        如果查询的carFactory存在但值为null 则返回null
        2.如果单例中没有这个对象，则使用父工厂中找,
        没有父工厂，用carFactory这个名字查询RootBeanDefinition
               然后得到这个RootBeanDefinition的BeanName进行7的步骤,得到工厂bean的返回类型，
               如果类型是FactoryBean类型则调用FactoryBean.getObjectType方法得到工厂bean的返回类型，    
 
        通过上面得到工厂bean的类型，但无法知道工厂方法返回的类型，通过反射，查询到工厂bean的所有方法，
    如果有多个方法重载，则需要匹配设定的参数与方法参数那个最匹配，然后得到对应方法的返回类型。
       看完这个都晕了  太饶了可以跳过这段。
  确定完成RootBeanDefinition的beanClass以后，循环工厂中所有的BeanPostProcessor后置处理器集合,如果存在InstantiationAwareBeanPostProcessor
  实例，就调用该处理器的postProcessBeforeInstantiation方法返回一个Object对象，这个对象可以为空，也可以是用户代理的一个对象。
   如果返回的对象不为null，说明你已经初始化过了对象，确定你要循环调用工厂中配置的BeanPostProcessor处理器集合中每一个
   postProcessAfterInitialization(Object bean, String beanName)方法，它是在对象初始化以后调用的。
  参数bean代表初始化后的bean，就是上面postProcessBeforeInstantiation返回的对象，返回值为Object。
  不管这两个处理器怎么处理，返回的最终对象为Object，如果不为空，将不会处理后续循环中的BeanPostProcessor，跳过bean创建过程。
  否则开始bean的实例化
8.开始实例化 ，相当于new一个对象
   首先对象是否是单例的，是的话就从单例缓存中取是否存在该包装过的实例BeanWrapper，如果存在就使用，否则就实例化。
   验证beanClass是否可以实例化
   1.beanClass不能为null
   2.beanClass是public的或者是允许访问的
9.自动注入实例化带参的构造函数. 过程比较复杂我从网上看到分析的非常好

################################################################################
（1）构造函数参数的确定。

根据explicitArgs参数判断。

如果传入的参数explicitArgs不为空，那边可以直接确定参数，因为explicitArgs参数是在调用Bean的时候用户指定的，在BeanFactory类中存在这样的方法：
 

    Object getBean(String name, Object... args) throws BeansException; 

在获取bean的时候，用户不但可以指定bean的名称还可以指定bean所对应类的构造函数或者工厂方法的方法参数，主要用于静态工厂方法的调用，而这里是需要给定完全匹配的参数的，所以，便可以判断，如果传入参数explicitArgs不为空，则可以确定构造函数参数就是它。

缓存中获取。

除此之外，确定参数的办法如果之前已经分析过，也就是说构造函数参数已经记录在缓存中，那么便可以直接拿来使用。而且，这里要提到的是，在缓存中缓存的可能是参数的最终类型也可能是参数的初始类型，例如：构造函数参数要求的是int类型，但是原始的参数值可能是String类型的"1"，那么即使在缓存中得到了参数，也需要经过类型转换器的过滤以确保参数类型与对应的构造函数参数类型完全对应。

配置文件获取。

如果不能根据传入的参数explicitArgs确定构造函数的参数也无法在缓存中得到相关信息，那么只能开始新一轮的分析了。

分析从获取配置文件中配置的构造函数信息开始，经过之前的分析，我们知道，Spring中配置文件中的信息经过转换都会通过BeanDefinition实例承载，也就是参数mbd中包含，那么可以通过调用mbd.getConstructorArgumentValues()来获取配置的构造函数信息。有了配置中的信息便可以获取对应的参数值信息了，获取参数值的信息包括直接指定值，如：直接指定构造函数中某个值为原始类型String类型，或者是一个对其他bean的引用，而这一处理委托给resolveConstructorArguments方法，并返回能解析到的参数的个数。

（2）构造函数的确定。

经过了第一步后已经确定了构造函数的参数，接下来的任务就是根据构造函数参数在所有构造函数中锁定对应的构造函数，而匹配的方法就是根据参数个数匹配，所以在匹配之前需要先对构造函数按照public构造函数优先参数数量降序、非public构造函数参数数量降序。这样可以在遍历的情况下迅速判断排在后面的构造函数参数个数是否符合条件。

由于在配置文件中并不是唯一限制使用参数位置索引的方式去创建，同样还支持指定参数名称进行设定参数值的情况，如<constructor-arg name="aa">，那么这种情况就需要首先确定构造函数中的参数名称。

获取参数名称可以有两种方式，一种是通过注解的方式直接获取，另一种就是使用Spring中提供的工具类ParameterNameDiscoverer来获取。构造函数、参数名称、参数类型、参数值都确定后就可以锁定构造函数以及转换对应的参数类型了。

（3）根据确定的构造函数转换对应的参数类型。

主要是使用Spring中提供的类型转换器或者用户提供的自定义类型转换器进行转换。

（4）构造函数不确定性的验证。

当然，有时候即使构造函数、参数名称、参数类型、参数值都确定后也不一定会直接锁定构造函数，不同构造函数的参数为父子关系，所以Spring在最后又做了一次验证。

（5）根据实例化策略以及得到的构造函数及构造函数参数实例化Bean。
###########################################################################################
10.实例化策略
首先判断如果beanDefinition.getMethodOverrides()为空也就是用户没有使用replace或者lookup的配置方法，那么直接使用反射的方式，简单快捷，但是如果使用了这两个特性，在直接使用反射的方式创建实例就不妥了，因为需要将这两个配置提供的功能切入进去，所以就必须要使用动态代理的方式将包含两个特性所对应的逻辑的拦截增强器设置进去，这样才可以保证在调用方法的时候会被相应的拦截器增强，返回值为包含拦截器的代理实例。
 
11.工厂方法实例化bean 自己理解写的比较简陋看看就好了。
   创建一个BeanWapper对象，设置类型转换器，属性编辑器。
  如果定义的bean是使用工厂方法实例化：在xml中表示
    <!-- 
        静态工厂方法创建实例 
        factory-method 静态的工厂方法名字 
        constructor-arg静态的工厂方法参数
     -->    
    <bean id="carFactory" class="com.zghw.spring.demo.demo.CarFactory" factory-method="getInstance" scope ="prototype">
        <constructor-arg name="factoryName" type="java.lang.String" value="static factory method"></constructor-arg>
    </bean>
    <!-- 动态工厂方式创建对象
        factory-bean 工厂对象
        factory-method 工厂方法名字 
        constructor-arg 工厂方法参数
     -->
     <bean id="carSub" class="com.zghw.spring.demo.demo.CarSub" scope ="prototype" factory-bean="carFactory" factory-method="getCar">
          <constructor-arg name="namefactory" type="java.lang.String"  value="AAAAAA"></constructor-arg>
          <constructor-arg name="countfactory" type="int" value="11122"></constructor-arg>
     </bean>
  1.得到工厂bean，
    如果定了factory-bean名称 使用名称通过getBean方法factory bean对象,代表这个方法是通过工厂方法创建非static方法
    如果没有定义则则为null，说明静态工厂方法 static方法
  2.工厂方法参数
     用户传入的参数：如果给定的参数不为空则使用该参数作为工厂方法参数
     则使用构造方法参数对象 缓存中取：如果解析过的工厂方法参数对象存在，并且如果解析过的构造器参数对象也存在,就是用构造器参数对象
     缓存中取不到，从BeanDefinition的原型参数对象，把eanDefinition的原型参数对象转换为新的参数对象。 
    
  3.工厂方法
   通过beanClass类型，反射出方法集合，挑选出符合条件的方法(静态工厂就匹配静态方法否则匹配非静态方法 然后匹配与定义的工厂方法名一样的方法)
  然后使用反射机制 factoryMethod.invoken(factoryBean,args)得到返回的对象包装成BeanWapper对象返回。
  这里简单的说了下，spring做的处理较复杂，有些点你没有碰到过你不知道为什么那么多弯弯道道。
######################################################得到BeanWapper############################################################################

12.在实例化对象后包装成了BeanWapper，接下来spring提供了一个扩展点，MergedBeanDefinitionPostProcessor.postProcessMergedBeanDefinition(RootBeanDefinition beanDefinition, Class<?> beanType, String beanName),实现MergedBeanDefinitionPostProcessor接口的处理器，可以使用合并过的RootBeanDefinition做一些需要的业务，具体怎么做spring是不操心的，在这个阶段spring把工厂中所有的BeanPostProcessor后置处理器循环，如果是MergedBeanDefinitionPostProcessor的实例就调用该实例的方法postProcessMergedBeanDefinition帮你运行。

13.提前曝光bean对象   ref
   为什么要提前曝光对象？
   在上面介绍地依赖关系创建的时候，对象如果依赖与另一个对象，则先创建依赖的对象。
如果对象A依赖与<单例>对象B，则先创建B对象，A就停留在上面步骤创建依赖关系的阶段，等待B对象创建完成，
在B对象创建过程中，如果出现如下情况：
  1.B对象中有依赖A对象的属性，如果A是单例的，B对象等待A创建完成，两个互相等就形成了死循环。
  2.如果B对象，在初始化过程非常复杂，会导致性能问题。
可能还有其他情况。
总结出：提前曝光bean对象满足条件：
    1.当前的bean是单例的，（原型对象是不会出现这问题的）
    2.并且支持循环引用 (spring提供设置是否支持循环引用，默认是允许的)
    3.当前的bean正在创建
为了解决上面的问题，我们在这个阶段提前暴露对象，那么对刚刚实例化的对象(如果你允许,spring提供设置是否支持循环引用)就可以暴露对象的引用供其他对象使用,不用需要等到该对象的初始完成后才使用。
   对象暴露在那，怎么使用，单例注册表中有。对于对象依赖关系，暴露后的对象集合、及当前有哪些bean在创建、当前所有单例bean对象，都保存在不同的final Map中，在上面我们已经简单说过。有兴趣可以网上查询下该方面的信息。
暴露这个bean对象固然好，但我想要对这个bean处理下在暴露行不，spring最懂你，它提供了SmartInstantiationAwareBeanPostProcessor接口，你可以实现该接口的方法：Object getEarlyBeanReference(Object bean, String beanName)
参数Object bean:BeanWapper中实例对象的引用，不关心你怎么处理，不过方法返回的对象会在后续一直使用。

回到流程来，当满足了提前曝光实例的条件后，spring循环工厂中所有的BeanPostProcessor，如果存在SmartInstantiationAwareBeanPostProcessor的实例，则调用getEarlyBeanReference方法返回对象，并把这个对象放入单例表中供提前使用，如果返回null将不会调用后续的BeanPostProcessor

14.注入属性值之前
这个时候有用户说对象已经实例化，不想注入属性我想跳过或者我想在自动注入属性之前做点什么然后在注入属性？
spring说好的没问题，主动权给你，你需要实现InstantiationAwareBeanPostProcessor接口并实现方法boolean postProcessAfterInstantiation(Object bean, String beanName)，你不想注入属性就返回false，我们不会给你注入属性的。想要注入属性就返回true。参数bean如果值被改变了，以后我们就按照改变过的bean进行填充哦！
因为它是一个引用，注意哦！
在此阶段spring工厂中存在后置处理器，会循环所有的BeanPostProcessor实例，如果是InstantiationAwareBeanPostProcessor的一个实例则调用postProcessAfterInstantiation方法，返回false就直接跳过填充属性。
否则继续填充bean属性吧！
15.依赖注入：自动注入bean属性  --xml autowire
首先检查是否需要设置了自动注入
设置了自动注入，根据设置的依赖注入的方式不同，分为：
 1.根据属性的名称注入
 2.根据属性的类型注入
  ==根据属性名称注入属性bean：
    1.循环所有bean中的所有属性描述符PropertyDescriptor
      取的满足如下要求的属性名：
    1.getWriteMethod即setter方法必须存在
        2.不是CGlib生成的属性类型,也不存在ignoredDependencyTypes(可配置的)集合中的属性类型，并且不是忽略接口(spring说是不能使用springbean工厂中接口作为属性，比如BeanFactoryAware ApplicationContextAware)实现的属性中包含有的方法
        3.定义的RootBeanDefition中不包含该属性名字，因为是自动注入不会把定义的修改掉，所以才不包含的。
    4.这个属性不能是“简单的基本类型”，“简单的基本类型”，包括了基本类型、包装类型，String or other CharSequence, a Number, a Date,a URI, a URL, a Locale, a Class, or a corresponding array,BeanWapper拥有强大的属性管理功能，它有PropertyEditor和TypeCovernt,很好处理这些"简单基本类型"，当然你可以扩展，自己的基本类型编辑器或转化器。
筛选完不满意的属性，得到满意的属性名以后，
    确定属性名称是否存在bean
    1.(如果单例表中包含该bean || 有这个BeanDefinition定义) &&（属性名称不是&开头的FactoryBean名称 || 属性是FactoryBean实例）
    2.如果存在父工厂，就去父工厂中去找
 1和2有一个返回true只代表存在该bean，但并不代表你得到的这个bean就是想要的。
 存在就使用依赖属性名称直接getBean就循环查找吧。查找完成注入属性对象PropertyValue中，注册类和属性的依赖关系。
  ==根据属性类型注入 这部分代码我是看晕了，道道太多，和注解的注入方式有关，这个简单说下
   属性类型注入和属性名称注入区别在于，属性类型注入得到属性名称以后不是直接getBean对象返回，而以下筛选方式来匹配的。
    //1.如果这个类型是ObjectFactory的即我们之前在曝光的对象实例，则返回一个实现了ObjectFactory的描述府实例懒加载。
        2.查询当前工厂中所有beanDefinition,排除一些不会存在的比如抽象的、没有初始化过的等，然后匹配是否曝光的对象，
    FactoryBean对象，单例池中继续匹配，最后才匹配名字相同的和类型相同的，然后当前工厂有父类工厂的话就去父类工厂匹配，
    合并当前工厂和父工厂匹配到的名字集合。匹配多个相同的bean名字就看那个bean是否定义了primary，只有一个的时候，然后getBean。否则就抛异常。
    这里还牵涉到注解自动装配的条件，这里就不介绍了。
16.自动注入完属性值后会合并RootBeanDefintion中定义的属性值为一个新的属性值集合，这个新的属性值集合供以后解析和转化到BeanWapper中。

到了该阶段，spring为你提供了可以修改属性参数的机会，实现InstantiationAwareBeanPostProcessor接口中的PropertyValues postProcessPropertyValues(
            PropertyValues pvs, PropertyDescriptor[] pds, Object bean, String beanName)方法，spring会循环工厂中配置过的每一个BeanPostProcessor实例，如果该实例是InstantiationAwareBeanPostProcessor，则会调用该接口的postProcessPropertyValues方法。
参数 pvs是上面说的新的属性集合，pds代表了bean对应类的属性描述符，不包含CGLib属性或设置忽略的接口等，bean是BeanWapper包含的实例。你可以修改或移除
pvs，或者设置一些必须的参数，或者操作描述符pds，具体如何使用spring不关心。但最会使用你设定的返回的PropertyValues集合，来填充BeanWapper，如果你返回的PropertyValues为null，则跳过填充属性，到初始化Bean。
如果设置了依赖检查，对属性进行依赖检查，依赖检查分三种：
    如果属性描述符pds中的属性有写方法说明这个属性可以使用，但PropertyValues pvs不包含此属性时检查：
    1.检测全部，不符合，则抛出异常。
        2.检测简单的属性 不包含的这个属性不是”简单的类型“则抛出异常。不符合
    3.检查对象引用   包含的这个属性是”简单的类型“则抛出异常。不符合
依赖检测有问题则抛出异常。

17.解析转化bean属性填充到BeanWapper    --xml <property>

依赖检查成功后，就开始转换返回的属性集合PropertyValues pvs,它是RootBeanDefinition中的属性集合，可能有的属性并未做过解析转换过，如果这个集合之前已经转化过，则把属性集合设置到BeanWapper中，跳过填充属性，到初始化Bean。

没有转换，循环属性集合PropertyValues pvs，取得值和name属性,把原始的属性转化为Object
RuntimeBeanReference ==>使用getBean方式得到object
BeanDefinitionHolder ===>内部bean解析，有bean工厂创建的object
BeanDefinition        ===>内部bean解析，有bean工厂创建的object
ManagedArray       ===>Object 递归循环解析，都会调用evaluate(Object)
ManagedList        ===>List<Object> 递归循环解析，都会调用evaluate(Object)
ManagedSet         ===>Set<Object> 递归循环解析，都会调用evaluate(Object)
ManagedMap      ===>Map<Object, Object> 递归循环解析，都会调用evaluate(Object)
evaluate(Object)  ===>不管数组还是集合或map等它们最终都会调用这个方法来解析对象，这个方法使用了
BeanExpressionResolver来解析定义的字符串可以解析的对象，你可以自己配置一个。spring的EL表达式就是实现了此接口。

解析过的属性值如果是BeanWrapperImpl可以转化的就把该属性转化为PropertyValue对象。
BeanWrapperImpl拥有TypeConvernt和PropertyEdit接口功能，对属性操作易如反掌。你可以定制这两个接口的功能。
所有属性转化以后的,，标记转化后属性集合为已转换并填充到BeanWrapperImpl，属性填充结束。

18.调用Aware接口实例的方法
1.如果这个bean实现了BeanNameAware，则调用其实现的bean.setBeanName(String beanName)方法，设置在工厂中该bean真实的name。
2.如果这个bean实现了BeanClassLoaderAware，则调用其实现的bean.setBeanClassLoader(ClassLoader classLoader)方法,设置加载当前bean的类加载器
3.如果这个bean实现了BeanFactoryAware，则调用bean.setBeanFactory(BeanFactory beanFactory);设置当前工厂给bean使用。
spring为什么要这样设计？有什么用？
个人理解：
如果该bean在上下文环境中，我想用当前bean对应的工厂BeanFactory来填充自己的业务方法，或者想用当前工厂的某些保存的状态，我并不知道该Bean是那个工厂创建的，或许我要写很多代码才能获得到beanFactory。现在你只需要实现BeanFactoryAware接口,提供一个setBeanFactory(BeanFactory beanFactory)方法的实现，配置这个bean，spring在初始化时就为你注入该BeanFactory了。BeanFactory别问我能干什么？你可以使用 instanceof 来判断是否是ListableBeanFactory、HierarchicalBeanFactory、SingletonBeanRegistry、ConfigurableBeanFactory,甚至是AbstractAutowireCapableBeanFactory、DefaultListableBeanFactory、BeanDefinitionRegistry中的某个实例，相当于拥有了整个工厂，说不定它还有父工厂，及爷工厂....^_^别问我它们这些接口能干什么？可以创无限，只要你可以。

19.初始化之前的后置处理器
   循环工厂中所有实现了BeanPostProcessor的实例，调用其Object postProcessBeforeInitialization(Object bean, String beanName)方法，该方法允许你包装参数bean返回一个包装过的bean对象或者原来这个参数bean对象,如果返回null，后续循环的BeanPostProcessor将不会被调用。

20.调用初始化方法
如果当前的bean是InitializingBean实例，则调用该bean的afterPropertiesSet()方法。这个方法用于你可以配置使用上面设置的BeanFactoryAware接口的返回的BeanFactory，或者初始化一些你需要的工作。

21.调用配置的初始化方法，如果你在bean定义中设置了init-method,就会使用反射机制调用定义的初始化方法。这个和上面的功能差不多，看情况合理使用。

22.初始化完成以后，调用后置处理器BeanPostProcessor实例的Object postProcessAfterInitialization(Object bean, String beanName)方法;给你一个已经完全可以使用的bean看你怎么处理了，或者包装这个bean或者返回这个bean，这个时候的bean基本已经定型了。如果你返回的object为null，正在循环的后置处理器将会跳过。
如果该bean是FactoryBean,将调用这个回调FactoryBean实例和FactoryBean创建的对象。这个处理器可以决定是使用FactoryBean实例还是创建过的对象或者这个两个。通过返回的对象是否是FactoryBean的实例来检查。
22.单例曝光对象后续处理
 1.如果新bean是曝光对象，则从池中取出该真实对象引用，如果新的bean对象和之前的放入单例池中的对象是同一实例，也就是经过后置处理器等操作的都是同一实例bean，则把最新bean指向真实的对象应用。
 2.如果已经改变了这个单例bean，则把单例池中的依赖关系解除掉，即从map中清除依赖。
23.注册销毁方法
 销毁方法只能应用于单例bean，所以注册单例的销毁方法。
 注册销毁方法的条件：
  1.该bean是单例的 
  下面任意一种方式都可以 
  2.如果DisposableBean实例bean
  3.设置的beanDifition的销毁方法==(inferred)则自动查询该bean的close方法关闭
  4.设置了销毁方法
  5.当前工厂存在实现了DestructionAwareBeanPostProcessor接口的后置处理器。
  然后把这些给定的参数设置构造一个DisposableBeanAdapter，放入销毁注册表Map<String, Object> disposableBeans中，缓存在该工厂中，
 这不是在这阶段执行：我记录下：
    销毁单例对象方式：
   1.把单例缓存中存在的所有该bean的信息删除
   2.把bean在销毁注册表中的销毁器删除
   3.销毁在该工厂中缓存的所有bean的依赖对象
   4.如果该bean实现了DisposableBean则调用该接口的void destroy()，进行销毁。
   5.触发销毁包含过该bean的单例bean。
   6.删除其他bean对象对该对象的依赖关系
24.当bean是FactoryBean
判断工厂是否是FactoryBean实例，如果beanName开头不是&，并且该bean是BeanFactory的实例。则代表这个bean需要使用BeanFactory的getObject()方法。
如果是不是FactoryBean则直接返回该bean。
判断得到bean是工厂方法返回对象还是FactoryBean对象：
使用&+beanName访问的是FactoryBean实例返回的当前bean，否则使用beanName就是工厂方法getObject()返回的对象。
否则该bean就是FactoyrBean，就调用其实例实现接口的getObject()返回的bean对象。
GameOver！！！好累！！