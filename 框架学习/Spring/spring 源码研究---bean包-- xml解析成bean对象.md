![](../../image/spring/spring-xml-1.png)

# BeanDefinitionReader
BeanDefinitionReader 把一个Resource资源或者一个String定位符加载成一个BeanDefinition对象
实现该接口可以设置不同的加载实现，及对BeanDefinition的format 当然你也不一定非要实现这个接口，可以通过其他方式加载bean

### 接口方法： 

1.加在一个资源Resource

2.加载多个资源Resource 

3.加载一个String location定位符

4.加载多个String location定位符 

5.返回BeanDefinition注册表 

6.返回资源加载器 

7.返回类加载器

8.返回beanname生成器

# BeanNameGenerator

BeanNameGenerator 接口 BeanDefinition的name生成器 

接口方法： 1.放入BeanDefinition及BeanDefinitionResitory注册表 生成一个name

DefaultBeanNameGenerator实现了BeanNameGenerator接口 

1.得到beanclassname 然后如果为空使用父类的classname+$child 

如果父类classname为空就用工厂中bean的名称+$created

判断得到的最后name在注册表中的数量 最后得到BeanName#counter

# AbstractBeanDefinitionReader
AbstractBeanDefinitionReader抽象类实现BeanDefinitionReader大部分工作，并且实现了EnvironmentCapable运行环境属性 

提供了共同的属性,比如bean工厂工作和使用的类加载器加载bean类。

他通过构造方法参数BeanDefinitionRegistry来创建该对象，使读到的BeanDefinition注入到注册器中
XmlBeanDefinitionReader类继承了AbstractBeanDefinitionReader
它主要把工作委托给BeanDefinitionDocumentReader来工作

# PropertiesBeanDefinitionReader

PropertiesBeanDefinitionReader继承了AbstractBeanDefinitionReader

这个读取器可以读取属性格式的BeanDefinition 也可以读取map然后把属性值或map循环取值匹配到BeanDefinition中，然后放入注册表中。 

在spring中有很多final map,它们在spring容器中就像一个个数据结构一样或者说是数据库把

DocumentLoader接口 xml文档加载器 策略模式加载xml文档对象
 
它加在xml为一个文档的方法需要三个参数 

第一个参数 资源输入流 这个客户端给定 

第二个参数 EntityResolver 实体解析器 

第三个参数 errorHandler 错误处理器 

第四个参数 验证模式 是验证DTD还是XSD 

第五个参数 XML解析器是否应该被XML名称空间感知的

第一个参数通过包装客户端给的url成为一个inputstream

第二个参数是替换网络的url systemId 为本地的systemId

spring实现EntityResolver接口有以下类：

`BeansDtdResolver` ：它为了转化带有.dtd的systemId,从访问网络的url转换为本地的url的dtd文件

`PluggableSchemaResolver`:它为了转化带有.xsd的systemId,从访问网络的url转换为本地的url的.xsd文件

它把META-INF/spring.schemas循环放入map中 然后比较你定义的xsd是否在map中存在，如果存在则取出对应的url把它转换为输入流放入Inputsource中

1.`DelegatingEntityResolver` 使用委托的方式，根据xml文件的systemId的后缀.dtd还是.xsd判断用`BeansDtdResolver`还是`PluggableSchemaResolver`来处理。

`ResourceEntityResolver`继承了`DelegatingEntityResolver`主要解决好像是空systemId路径是默认当前系统的路径

第三个参数 ：使用默认的SimpleSaxErrorHandler 就是抛异常

第四个参数 ：验证是DTD还是XSD，默认自动验证，使用了XmlValidationModeDetector来自动验证，判断是否包含Document。

第五个参数 ：XML解析器是否应该被XML名称空间感知的。默认设置是“假”。

就是前一个是publicID，后一个是SystemId，是一一对应的

http://www.springframework.org/schema/beans publicID

http://www.springframework.org/schema/beans/spring-beans-2.5.xsd SystemId

`DefaultDocumentLoader`默认实现`DocumentLoader`它使用了标准的JAXP-configured来解析XML文档它设置了自动感知.xsd的文档


# BeanDefinitionDocumentReader

BeanDefinitionDocumentReader接口从xmldocument对象中读取bean对象读取的bean对象保存在了beanDefinition注册表中

### 接口方法：

void registerBeanDefinitions(Document doc, XmlReaderContext readerContext)读取Document文档注册，保存在了beanDefinition注册表中

DefaultBeanDefinitionDocumentReader实现了BeanDefinitionDocumentReader        

1.设置readerContext

2.开始document文档解析，查找根元素

3.首先使用XmlReaderContext创建BeanDefinitionParserDelegate委托对象,初始化委托对象，读取root属性，填充默认的DocumentDefaultsDefinition

```
 1.default-lazy-init    默认为false
 2.default-merge    默认为false
 3.default-autowire 默认为no
 4.设置default-dependency-check
 5.存在就设置default-autowire-candidates
 6.存在就设置default-init-method
 7.存在就设置default-destroy-method
 ```
 
 4.查询
 如果root不是默认的命名空间：则通过该root元素查找到namespaceURI,通过namespaceURI查找到NamespaceHandler，然后调用parse解析为BeanDefinition对象返回。
 
 如果是默认的命名空间
 8.存在就取profile设置环境
 循环root下的子元素
 如果子元素不是默认的命名空间则像上面一样处理
 如果子元素是默认命名空间
 <beans>下的节点：    
 1.import
 2.alias
 3.bean
 4.beans  重复之前的步骤
 
 1.import节点
 resource属性,解析location有占位符时，e.g. "${user.dir}"
 如果resource的资源定位正确，则reader.loadBeanDefinitions加载
 2.alias节点
 name属性：
 alias属性：
 注册器注册
 
 ##### 3.bean元素
 
 属性：

 1.id

 2.name

 3.class

 4.parent 开始创建AbstractBeanDefinition，仅仅设置了父类名称和class类型

 5.scope

 6.abstract

 7.lazy-init 默认就是用root<beans>下的

 8.autowire 0不自动装配 1 byname 2 bytype 3.by constructor

 9.dependency-check

 10.有就设置depends-on

 11.autowire-candidate

 12.存在就设置primary

 13.有就设置init-method没有就看root是否有

 14.destroy-method有就设置看root是否有

 15.factory-method工厂方法

 16.factory-bean
 
 ##### bean子节点元素

 1.description

 2.meta 属性：1.key 2.value 放入了BeanMetadataAttributeAccessor中 0-*

 3.lookup-method 属性：1.name 2.bean 创建LookupOverride对象    0-*

 4.replaced-method 属性：1.name 2.replacer 创建ReplaceOverride对象

 5.arg-type 属性match

 6.constructor-arg 属性1.index 2.type 3.name

 7.property 属性1.name 这个复杂 有空在看

 8.qualifier 属性1.type2.value 子元素：attribute属性1.key2.value

 这样一个bean就组合好了返回这个BeanDefinitionHolder

 如果定制的要包装bean的则包装

 最后一步就是注册BeanDefinition及别名
 
 
 ### property

 ##### 属性：

 name

 ref | value | 元素

 ref  ---RuntimeBeanReference

 value  ---TypedStringValue

##### 元素

 1.bean   ---BeanDefinitionHolder

 2.ref 属性bean    --RuntimeBeanReference

 3.id-ref 属性bean   --RuntimeBeanNameReference

 4.null  --TypedStringValue

 5.array 属性 value-type merge   ---ManagedArray

 6.list  属性value-type merge    ---ManagedList<Object>

 7.set   属性value-type merge    ---ManagedSet<Object>

 8.map    属性key-type value-type merge ---ManagedMap<Object, Object>

 元素： entry 属性： key key-ref value value-ref value-type

   entry元素：
      key 属性key-ref     --TypedStringValue 或RuntimeBeanReference
      value
 
 9.props 属性            ---ManagedProperties

 元素：prop 属性 key        --TypedStringValue
 
DefaultsDefinition接口继承了BeanMetadataElement具体实现通常是基于文档的默认值,例如在根标记级别进行指定在一个XML文档。

DocumentDefaultsDefinition类实现了DefaultsDefinition接口，它持有默认指定<beans>基本的spring bean定义属性

比如：default-lazy-init default-autowire

# ReaderContext  XmlReaderContext

ReaderContext 定义读取容器，主要用于保存读取状态及资源

ProblemReporter 用于解析document出现问题时问题反馈

ReaderEventListener spring只提供了EmptyReaderEventListener空实现，如果需要你可以自定义

SourceExtractor 这是个提取：解析document后返回的原生bean定义，如果你需要则可以实现这个接口，放入到ReaderContext中，读取信息后就可以使用这些资源了。就像访问器一样。

spring提供了NullSourceExtractor空实现，PassThroughSourceExtractor简单实现返回了对象资源。

如果需要你可以自定义XmlReaderContext类继承自ReaderContext

它还加入xml中命名空间的解析器NamespaceHandlerResolver和XmlBeanDefinitionReader实现类
 
# NamespaceHandlerResolver

NamespaceHandlerResolver接口给定一个命名空间的URL解析本地实现了NamespaceHandler的处理器

DefaultNamespaceHandlerResolver类实现了NamespaceHandlerResolver

默认的会查询所有的jar包下的META-INF/spring.handlers文件，解析为map key--命名空间URL value-class类名（转换为对象判断是否是处理器实例），

然后使用命名空间URL可以查询里面对应的NamespaceHandler

当然你也可以使用DefaultNamespaceHandlerResolver的构造器DefaultNamespaceHandlerResolver(ClassLoader, String)来为自己构造
 
# NamespaceHandler

 NamespaceHandler接口用来处理spring的xml文件命名空间
 比如：在xml文中引入了bean工厂不认识，也就是你定制的命名空间，在beans元素下使用了该
 命名空间下的元素，则你需要提供一个实现了NamespaceHandler接口的处理器，来处理该
 命名空间下的元素。

`SimpleConstructorNamespaceHandler`直接继承自 `BeanDefinitionParser`用于解析构造器参数 这样简便的定义
 ```
 <bean id="author" class="..TestBean" c:name="Enescu" c:work-ref="compositions"/>
 ```
 
`SimplePropertyNamespaceHandler`直接继承自BeanDefinitionParser解析属性值 简便定义
```
 <bean id="rob" class="..TestBean" p:name="Rob Harrop" p:spouse-ref="sally"/>
```
 
 开发人员编写自己的定制元素扩展通常不会直接实现这个接口,而是利用所提供的`NamespaceHandlerSupport`类。

 接口方法：

 1.初始化方法，用于在需要定制的NamespaceHandler实现类时进行初始化

 2.调用parse方法解析元素为一个BeanDefinition

 3.装饰一个节点或属性为BeanDefinitionHolder

 NamespaceHandlerSupport抽象类，使用了final map 作为注册表

 定义了三个注册表

 1.key-elementName(元素的名称) value -BeanDefinitionParser（命名处理器对应元素的转化器）

 2.key-elementName(元素的名称) value -BeanDefinitionDecorator（命名处理器对应元素的包装器）

 3.key-attrName(属性的名称) value -BeanDefinitionDecorator（命名处理器对应元素属性的包装器）

 让实现的子类通过以下方法注入到注册表中,这个设计有点意思。

`registerBeanDefinitionParser`

`registerBeanDefinitionDecorator`

`registerBeanDefinitionDecoratorForAttribute`

 子类要实现初始化方法。

在查找处理器时，通过解析后的命名空间名称查找到对应的处理器，使用转化器进行转换为BeanDefinition实现 
可以参考ContextNamespaceHandlerUtilNamespaceHandler 实现了NamespaceHandlerSupport
它使用初始化方法 把key “constant” "property-path" "list" "set" "map" "properties"元素
及内部类实现了AbstractSingleBeanDefinitionParser的对象，来注册到父类注册表中

# BeanDefinitionParser

 BeanDefinitionParser接口用来转换xml文件中的元素为一个BeanDefinition
 
# ProblemReporter 
Location在解析资源出问题时可以得到本地资源位置，ParseState 是一个轨迹栈，在解析深层次xml元素时，如果出错需要记录一层一层的错误记录。

使用ParseState把元素压入栈，用完出栈，在出现问题时，从Stack中读取统计的栈信息以树的形式。

元素继承ParseState的内部接口Entry,其中BeanEntry、ConstructorArgumentEntry、PropertyEntry、和QualiflerEntry

每当读取这些元素就把相应的元素入栈和出栈

Problem 对象使用ParseState Location组合信息输出

ProblemReporter接口接受一个Problem定义了问题的性质

1.致命的

2.错误

3.提醒

FailFastProblemReporter类实现了ProblemReporter接口对于致命和错误的抛出BeanDefinitionParsingException（Problem）提醒的使用了日志记录
