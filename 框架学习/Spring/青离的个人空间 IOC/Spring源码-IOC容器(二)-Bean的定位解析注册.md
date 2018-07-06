# Demo
spring中不管是`ApplicationContext`还是`BeanFactory`，要想实现IOC容器，都必须将bean在外部定义的配置信息加载到spring IOC容器中来。而这个处理过程在spring中概括起来就是：定位、解析和注册。那么在spring怎么才能完成这一操作呢，来看下面的代码(sample.xml为spring配置文件，并且放在classpath路径下)。
```
// 1.创建一个ioc配置文件的抽象资源
ClassPathResource resource = new ClassPathResource("sample.xml");
// 2.创建一个BeanFactory实现
DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
// 3.创建一个载入xml文件形式的BeanDefinition读取器，并将beanFactory通过构造函数传递进去
XmlBeanDefinitionReader reader = new XmlBeanDefinitionReader(beanFactory);
// 4.读取资源配置信息，并在XmlBeanDefinitionReader中解析，将解析完的BeanDefinition注册到beanFactory中
reader.loadBeanDefinitions(resource);
```
这就是spring加载xml配置文件的核心代码，也就包括了上面所说的定位解析注册三大操作。同时可以看到实例化了一个`DefaultListableBeanFactory`，因为`BeanFactory`是IOC容器的基本实现，而`DefaultListableBeanFactory`实现了`BeanFactory`，它被用来维护IOC容器中bean的信息和关系。下面就来具体分析spring是如何实现Bean的定位解析和注册的。

# 定位
定位，顾名思义，就是找到对应的位置。而在spring中，就是获得资源的输入流。
```
// 1.创建一个ioc配置文件的抽象资源
ClassPathResource resource = new ClassPathResource("sample.xml");
```
ClassPathResource实现了Resource接口
```
public interface Resource extends InputStreamSource
```
Resource接口继承自org.springframework.core.io.InputStreamSource接口
```
public interface InputStreamSource {
    InputStream getInputStream() throws IOException;
}
```
因而可以从ClassPathResource获取配置文件的输入流，来看下具体实现
```
public InputStream getInputStream() throws IOException {
	InputStream is;
	// 判断class对象是否为null，存在就通过getResourceAsStream获取classpath文件输入流
	if (this.clazz != null) {
		is = this.clazz.getResourceAsStream(this.path);
	}
	// 判断class类加载器是否为null，存在就通过getResourceAsStream获取classpath文件输入流
	else if (this.classLoader != null) {
		is = this.classLoader.getResourceAsStream(this.path);
	}
	// 否则就通过系统类加载器(Bootstrap类加载器)获取classpath文件输入流
	else {
		is = ClassLoader.getSystemResourceAsStream(this.path);
	}
	if (is == null) {
		throw new FileNotFoundException(getDescription() + " cannot be opened because it does not exist");
	}
	return is;
}
```
# 解析
解析指的是将spring的配置文件解析成spring内容存储的数据结构。这里的数据结构可以理解成`BeanDefinition`。`BeanDefinition`是spring中的重要接口，它维护了bean的信息在spring内部的映射。
```
/**
 * BeanDefinition用来描述一个bean的定义，
 * 包括bean的属性、构造函数参数以及
 * 一些具体的信息(单 实例还是多实例，是否懒加载，依赖beans)。
 *
 * @author Juergen Hoeller
 * @author Rob Harrop
 * @since 19.03.2004
 * @see ConfigurableListableBeanFactory#getBeanDefinition
 * @see org.springframework.beans.factory.support.RootBeanDefinition
 * @see org.springframework.beans.factory.support.ChildBeanDefinition
 */
public interface BeanDefinition extends AttributeAccessor, BeanMetadataElement {

    /**
     * 单实例
     */
    String SCOPE_SINGLETON = ConfigurableBeanFactory.SCOPE_SINGLETON;

    /**
     * 多实例
     */
    String SCOPE_PROTOTYPE = ConfigurableBeanFactory.SCOPE_PROTOTYPE;

    /**
     * 父BeanDefinition的name
     */
    String getParentName();

    /**
     * bean的实现的全路径名称
     */
    String getBeanClassName();

    /**
     * 工厂bean的名称
     */
    String getFactoryBeanName();

    /**
     * 工厂方法名称
     */
    String getFactoryMethodName();

    /**
     * bean的作用域
     */
    String getScope();

    /**
     * 是否懒加载
     */
    boolean isLazyInit();

    /**
     * 依赖的beans
     */
    String[] getDependsOn();

    /**
     * 是否允许被自动装配
     */
    boolean isAutowireCandidate();

    /**
     * 是否优先自动装配
     */
    boolean isPrimary();

    /**
     * 构造方法参数值
     */
    ConstructorArgumentValues getConstructorArgumentValues();

    /**
     * 属性名称与值
     */
    MutablePropertyValues getPropertyValues();


    /**
     * 是否单实例
     */
    boolean isSingleton();

    /**
     * 是否多实例
     */
    boolean isPrototype();

    /**
     * 是否抽象
     */
    boolean isAbstract();

    /**
     * 角色提示
     */
    int getRole();

    /**
     * 描述
     */
    String getDescription();

    /**
     * 资源描述
     */
    String getResourceDescription();

    /**
     * 返回原始bean，如果没有返回null
     */
    BeanDefinition getOriginatingBeanDefinition();

}
```
可以看到`BeanDefinition`定义了许多bean的重要信息，比如beanClassName，单例还是多例，是否懒加载等。在解析之前实例化了两个对象：
```
// 2.创建一个BeanFactory实现
DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
// 3.创建一个载入xml文件形式的BeanDefinition读取器，并将beanFactory通过构造函数传递进去
XmlBeanDefinitionReader reader = new XmlBeanDefinitionReader(beanFactory);
```
`DefaultListableBeanFactory`是`BeanFactory`的实现，`BeanFactory`是spring另一个重要的接口，它定义了从spring获取实例化后的bean对象的方法。
```
 public interface BeanFactory {

    // 标识一个FactoryBean
    String FACTORY_BEAN_PREFIX = "&";
    
    // 五种获取bean实例对象的方法
    Object getBean(String name) throws BeansException;
    <T> T getBean(String name, Class<T> requiredType) throws BeansException;
    <T> T getBean(Class<T> requiredType) throws BeansException;
    Object getBean(String name, Object... args) throws BeansException;
    <T> T getBean(Class<T> requiredType, Object... args) throws BeansException;
    
    // 是否存在name的bean
    boolean containsBean(String name);
    
    // bean是否为单例
    boolean isSingleton(String name) throws NoSuchBeanDefinitionException;
    
    // bean是否为多例
    boolean isPrototype(String name) throws NoSuchBeanDefinitionException;
    
    // bean是否为指定的Class类型
    boolean isTypeMatch(String name, Class<?> targetType) throws NoSuchBeanDefinitionException;
    
    // 获取bean的Class类型
    Class<?> getType(String name) throws NoSuchBeanDefinitionException;
    
    // bean的昵称
    String[] getAliases(String name);
}
```
来XmlBeanDefinitionReader的构造函数
```
public XmlBeanDefinitionReader(BeanDefinitionRegistry registry) {
	super(registry);
}
```
它的父类是`AbstractBeanDefinitionReader`
```
protected AbstractBeanDefinitionReader(BeanDefinitionRegistry registry) {
    // 设置BeanDefinitionRegistry，用于注册Bean
    this.registry = registry;
    
    // 决定要使用的ResourceLoader 
    if (this.registry instanceof ResourceLoader) {
    	this.resourceLoader = (ResourceLoader) this.registry;
    }
    else {
    	this.resourceLoader = new PathMatchingResourcePatternResolver();
    }
    
    // 决定要使用的Environment
    if (this.registry instanceof EnvironmentCapable) {
    	this.environment = ((EnvironmentCapable) this.registry).getEnvironment();
    }
    else {
    	this.environment = new StandardEnvironment();
    }
}
```
真正的解析从下面开始
```
reader.loadBeanDefinitions(resource);
```
调用的是`XmlBeanDefinitionReader`的loadBeanDefinitions方法
```
public int loadBeanDefinitions(Resource resource) throws BeanDefinitionStoreException {
	return loadBeanDefinitions(new EncodedResource(resource));
}
```
将Resource封装成EncodedResource
```
public int loadBeanDefinitions(EncodedResource encodedResource) throws BeanDefinitionStoreException {
    try {
        // 拿到配置文件的输入流
    	InputStream inputStream = encodedResource.getResource().getInputStream();
    	try {
    	    // 封装成InputSource，设置编码
    		InputSource inputSource = new InputSource(inputStream);
    		if (encodedResource.getEncoding() != null) {
    			inputSource.setEncoding(encodedResource.getEncoding());
    		}
    		// 实际调用方法
    		return doLoadBeanDefinitions(inputSource, encodedResource.getResource());
    	}
    	finally {
    		inputStream.close();
    	}
    }
    catch (IOException ex) {
    	throw new BeanDefinitionStoreException(
    			"IOException parsing XML document from " + encodedResource.getResource(), ex);
    }
}
```
实际调用的还是doLoadBeanDefinitions方法
```
protected int doLoadBeanDefinitions(InputSource inputSource, Resource resource)
	throws BeanDefinitionStoreException {
    try {
        // 解析xml文件获得Document对象
    	Document doc = doLoadDocument(inputSource, resource);
    	// 解析Document为BeanDefinition并注册到BeanFactory
    	return registerBeanDefinitions(doc, resource);
    }
}
```
可以看到registerBeanDefinitions方法其实综合了解析和注册两个功能。先看下解析Document。
```
protected Document doLoadDocument(InputSource inputSource, Resource resource) throws Exception {
	return this.documentLoader.loadDocument(inputSource, getEntityResolver(), this.errorHandler,
			getValidationModeForResource(resource), isNamespaceAware());
}
```
this.documentLoader其实是已经实例化的类变量
```
private DocumentLoader documentLoader = new DefaultDocumentLoader();
```
来看下loadDocument的实现
```
public Document loadDocument(InputSource inputSource, EntityResolver entityResolver,
		ErrorHandler errorHandler, int validationMode, boolean namespaceAware) throws Exception {

	DocumentBuilderFactory factory = createDocumentBuilderFactory(validationMode, namespaceAware);
	if (logger.isDebugEnabled()) {
		logger.debug("Using JAXP provider [" + factory.getClass().getName() + "]");
	}
	DocumentBuilder builder = createDocumentBuilder(factory, entityResolver, errorHandler);
	return builder.parse(inputSource);
}
```
spring默认使用了DOM的解析方式，通过创建`DocumentBuilder`来解析`Document`对象。再来看registerBeanDefinitions方法。
```
public int registerBeanDefinitions(Document doc, Resource resource) throws BeanDefinitionStoreException {
	BeanDefinitionDocumentReader documentReader = createBeanDefinitionDocumentReader();
	documentReader.setEnvironment(getEnvironment());
	int countBefore = getRegistry().getBeanDefinitionCount();
	documentReader.registerBeanDefinitions(doc, createReaderContext(resource));
	return getRegistry().getBeanDefinitionCount() - countBefore;
}
```
`XmlBeanDefinitionReader`将真正的解析过程委托给了`BeanDefinitionDocumentReader`的实现类`DefaultBeanDefinitionDocumentReader`。
```
public void registerBeanDefinitions(Document doc, XmlReaderContext readerContext) {
	this.readerContext = readerContext;
	logger.debug("Loading bean definitions");
	Element root = doc.getDocumentElement();
	doRegisterBeanDefinitions(root);
}
```
从Document拿到根元素，交给doRegisterBeanDefinitions方法
```
protected void doRegisterBeanDefinitions(Element root) {
    // 获取父BeanDefinitionParserDelegate
    BeanDefinitionParserDelegate parent = this.delegate;
    // 创建当前BeanDefinitionParserDelegate
    this.delegate = createDelegate(getReaderContext(), root, parent);
    
    //对<beans>的profile属性进行校验
    if (this.delegate.isDefaultNamespace(root)) {
    	String profileSpec = root.getAttribute(PROFILE_ATTRIBUTE);
    	if (StringUtils.hasText(profileSpec)) {
    		String[] specifiedProfiles = StringUtils.tokenizeToStringArray(
    				profileSpec, BeanDefinitionParserDelegate.MULTI_VALUE_ATTRIBUTE_DELIMITERS);
    		if (!getReaderContext().getEnvironment().acceptsProfiles(specifiedProfiles)) {
    			return;
    		}
    	}
    }
    
    // 解析前扩展点
    preProcessXml(root);
    // 解析根元素
    parseBeanDefinitions(root, this.delegate);
    // 解析后扩展点
    postProcessXml(root);
    
    this.delegate = parent;
}
```
解析的核心就是对根元素的处理
```
protected void parseBeanDefinitions(Element root, BeanDefinitionParserDelegate delegate) {
    // 判断元素是否为默认Namespace，即http://www.springframework.org/schema/beans
    if (delegate.isDefaultNamespace(root)) {
    	NodeList nl = root.getChildNodes();
    	for (int i = 0; i < nl.getLength(); i++) {
    		Node node = nl.item(i);
    		if (node instanceof Element) {
    			Element ele = (Element) node;
    			if (delegate.isDefaultNamespace(ele)) {
    				parseDefaultElement(ele, delegate);
    			}
    			else {
    				delegate.parseCustomElement(ele);
    			}
    		}
    	}
    }
    else {
    	delegate.parseCustomElement(root);
    }
}
```
这个方法决定了对元素的解析是默认的还是自定义的。spring定义了_http://www.springframework.org/schema/beans_为默认命名空间，其他的都是自定义命名空间，包括context,aop,mvc。这种方式让spring可以兼容任何其他扩展，只需要实现NamespaceHandler接口，自定义解析方式。目前其他框架支持spring配置一般都是通过此种方式实现的。这个以后再专门地进行讲解，这里先来看默认的beans的解析。通过获取根元素的每个子节点，交给parseDefaultElement方法处理。
```
private void parseDefaultElement(Element ele, BeanDefinitionParserDelegate delegate) {
    // import标签解析
	if (delegate.nodeNameEquals(ele, IMPORT_ELEMENT)) {
		importBeanDefinitionResource(ele);
	}
	// alias标签解析
	else if (delegate.nodeNameEquals(ele, ALIAS_ELEMENT)) {
		processAliasRegistration(ele);
	}
	// bean标签解析
	else if (delegate.nodeNameEquals(ele, BEAN_ELEMENT)) {
		processBeanDefinition(ele, delegate);
	}
	// 嵌套的beans标签解析
	else if (delegate.nodeNameEquals(ele, NESTED_BEANS_ELEMENT)) {
		// recurse
		doRegisterBeanDefinitions(ele);
	}
}
```
我们主要关注的是bean标签的解析
```
protected void processBeanDefinition(Element ele, BeanDefinitionParserDelegate delegate) {
	// 委托BeanDefinitionParserDelegate解析bean标签
	BeanDefinitionHolder bdHolder = delegate.parseBeanDefinitionElement(ele);
	if (bdHolder != null) {
		// 对自定义属性和自定义子节点进行处理
		bdHolder = delegate.decorateBeanDefinitionIfRequired(ele, bdHolder);
		try {
			// 注册得到的BeanDefinitionHolder到BeanFactory中
			BeanDefinitionReaderUtils.registerBeanDefinition(bdHolder, getReaderContext().getRegistry());
		}
		catch (BeanDefinitionStoreException ex) {
			getReaderContext().error("Failed to register bean definition with name '" +
					bdHolder.getBeanName() + "'", ele, ex);
		}
		// 发送注册完成事件通知
		getReaderContext().fireComponentRegistered(new BeanComponentDefinition(bdHolder));
	}
}
```
委托`BeanDefinitionParserDelegate`来解析bean标签
```
public BeanDefinitionHolder parseBeanDefinitionElement(Element ele, BeanDefinition containingBean) {
	// id属性，定义bean的name
	String id = ele.getAttribute(ID_ATTRIBUTE);
	// name属性，定义bean的昵称
	String nameAttr = ele.getAttribute(NAME_ATTRIBUTE);

	List<String> aliases = new ArrayList<String>();
	if (StringUtils.hasLength(nameAttr)) {
		String[] nameArr = StringUtils.tokenizeToStringArray(nameAttr, MULTI_VALUE_ATTRIBUTE_DELIMITERS);
		aliases.addAll(Arrays.asList(nameArr));
	}

	String beanName = id;
	if (!StringUtils.hasText(beanName) && !aliases.isEmpty()) {
		beanName = aliases.remove(0);
		if (logger.isDebugEnabled()) {
			logger.debug("No XML 'id' specified - using '" + beanName +
				"' as bean name and " + aliases + " as aliases");
		}
	}

	if (containingBean == null) {
		checkNameUniqueness(beanName, aliases, ele);
	}
	// 解析bean的属性及字节点
	AbstractBeanDefinition beanDefinition = parseBeanDefinitionElement(ele, beanName, containingBean);
	if (beanDefinition != null) {
		String[] aliasesArray = StringUtils.toStringArray(aliases);
		// 创建BeanDefinitionHolder保存信息
		return new BeanDefinitionHolder(beanDefinition, beanName, aliasesArray);
	}

		return null;
}
```    
bean的属性和子节点的解析
```
	public AbstractBeanDefinition parseBeanDefinitionElement(
			Element ele, String beanName, BeanDefinition containingBean) {

		this.parseState.push(new BeanEntry(beanName));

		String className = null;
		// class属性解析
		if (ele.hasAttribute(CLASS_ATTRIBUTE)) {
			className = ele.getAttribute(CLASS_ATTRIBUTE).trim();
		}

		try {
			String parent = null;
			// parent属性解析
			if (ele.hasAttribute(PARENT_ATTRIBUTE)) {
				parent = ele.getAttribute(PARENT_ATTRIBUTE);
			}
			AbstractBeanDefinition bd = createBeanDefinition(className, parent);
			
			// 其他属性的解析
			parseBeanDefinitionAttributes(ele, beanName, containingBean, bd);
			// bean的描述信息
			bd.setDescription(DomUtils.getChildElementValueByTagName(ele, DESCRIPTION_ELEMENT));
			// meta信息
			parseMetaElements(ele, bd);
			// lookup-method设置
			parseLookupOverrideSubElements(ele, bd.getMethodOverrides());
			// replaced-method设置
			parseReplacedMethodSubElements(ele, bd.getMethodOverrides());

			// 构造函数设置
			parseConstructorArgElements(ele, bd);
			// property信息
			parsePropertyElements(ele, bd);
			// qualifier信息
			parseQualifierElements(ele, bd);

			bd.setResource(this.readerContext.getResource());
			bd.setSource(extractSource(ele));

			return bd;
		}
		catch (ClassNotFoundException ex) {
			error("Bean class [" + className + "] not found", ele, ex);
		}
		catch (NoClassDefFoundError err) {
			error("Class that bean class [" + className + "] depends on not found", ele, err);
		}
		catch (Throwable ex) {
			error("Unexpected failure during bean definition parsing", ele, ex);
		}
		finally {
			this.parseState.pop();
		}

		return null;
	}
```    
先来看常见的属性的解析
```
public AbstractBeanDefinition parseBeanDefinitionAttributes(Element ele, String beanName,
		BeanDefinition containingBean, AbstractBeanDefinition bd) {

	// singleton属性，早期使用，被scope取代
	if (ele.hasAttribute(SINGLETON_ATTRIBUTE)) {
		error("Old 1.x 'singleton' attribute in use - upgrade to 'scope' declaration", ele);
	}
	// scope属性,默认为singleton单例
	else if (ele.hasAttribute(SCOPE_ATTRIBUTE)) {
		bd.setScope(ele.getAttribute(SCOPE_ATTRIBUTE));
	}
	else if (containingBean != null) {
		// Take default from containing bean in case of an inner bean definition.
		bd.setScope(containingBean.getScope());
	}

	// abstract属性，为true则不会实例化
	if (ele.hasAttribute(ABSTRACT_ATTRIBUTE)) {
		bd.setAbstract(TRUE_VALUE.equals(ele.getAttribute(ABSTRACT_ATTRIBUTE)));
	}

	// lazy-init属性，是否懒加载
	String lazyInit = ele.getAttribute(LAZY_INIT_ATTRIBUTE);
	if (DEFAULT_VALUE.equals(lazyInit)) {
		lazyInit = this.defaults.getLazyInit();
	}
	bd.setLazyInit(TRUE_VALUE.equals(lazyInit));

	// autowire属性,这里并不是@Autowired的配置
	String autowire = ele.getAttribute(AUTOWIRE_ATTRIBUTE);
	bd.setAutowireMode(getAutowireMode(autowire));

	// dependency-check属性
	String dependencyCheck = ele.getAttribute(DEPENDENCY_CHECK_ATTRIBUTE);
	bd.setDependencyCheck(getDependencyCheck(dependencyCheck));

	// depends-on属性
	if (ele.hasAttribute(DEPENDS_ON_ATTRIBUTE)) {
		String dependsOn = ele.getAttribute(DEPENDS_ON_ATTRIBUTE);
		bd.setDependsOn(StringUtils.tokenizeToStringArray(dependsOn, MULTI_VALUE_ATTRIBUTE_DELIMITERS));
	}

	// autowire-candidate属性
	String autowireCandidate = ele.getAttribute(AUTOWIRE_CANDIDATE_ATTRIBUTE);
	if ("".equals(autowireCandidate) || DEFAULT_VALUE.equals(autowireCandidate)) {
		String candidatePattern = this.defaults.getAutowireCandidates();
		if (candidatePattern != null) {
			String[] patterns = StringUtils.commaDelimitedListToStringArray(candidatePattern);
			bd.setAutowireCandidate(PatternMatchUtils.simpleMatch(patterns, beanName));
		}
	}
	else {
		bd.setAutowireCandidate(TRUE_VALUE.equals(autowireCandidate));
	}

	// primary属性
	if (ele.hasAttribute(PRIMARY_ATTRIBUTE)) {
		bd.setPrimary(TRUE_VALUE.equals(ele.getAttribute(PRIMARY_ATTRIBUTE)));
	}

	// init-method, 实例化后执行
	if (ele.hasAttribute(INIT_METHOD_ATTRIBUTE)) {
		String initMethodName = ele.getAttribute(INIT_METHOD_ATTRIBUTE);
		if (!"".equals(initMethodName)) {
			bd.setInitMethodName(initMethodName);
		}
	}
	else {
		if (this.defaults.getInitMethod() != null) {
			bd.setInitMethodName(this.defaults.getInitMethod());
			bd.setEnforceInitMethod(false);
		}
	}

	// destroy-method属性，对象销毁前执行
	if (ele.hasAttribute(DESTROY_METHOD_ATTRIBUTE)) {
		String destroyMethodName = ele.getAttribute(DESTROY_METHOD_ATTRIBUTE);
		if (!"".equals(destroyMethodName)) {
			bd.setDestroyMethodName(destroyMethodName);
		}
	}
	else {
		if (this.defaults.getDestroyMethod() != null) {
			bd.setDestroyMethodName(this.defaults.getDestroyMethod());
			bd.setEnforceDestroyMethod(false);
		}
	}

	// factory-method属性，可以通过工厂方法创建实例
	if (ele.hasAttribute(FACTORY_METHOD_ATTRIBUTE)) {
		bd.setFactoryMethodName(ele.getAttribute(FACTORY_METHOD_ATTRIBUTE));
	}
	// factory-bean属性
	if (ele.hasAttribute(FACTORY_BEAN_ATTRIBUTE)) {
		bd.setFactoryBeanName(ele.getAttribute(FACTORY_BEAN_ATTRIBUTE));
	}

	return bd;
}
```    
然后是property标签的解析
```
public void parsePropertyElement(Element ele, BeanDefinition bd) {
	// Property的名称
	String propertyName = ele.getAttribute(NAME_ATTRIBUTE);
	if (!StringUtils.hasLength(propertyName)) {
		error("Tag 'property' must have a 'name' attribute", ele);
		return;
	}
	this.parseState.push(new PropertyEntry(propertyName));
	try {
		if (bd.getPropertyValues().contains(propertyName)) {
			error("Multiple 'property' definitions for property '" + propertyName + "'", ele);
			return;
		}
		// 解析property的值
		Object val = parsePropertyValue(ele, bd, propertyName);
		// 组装PropertyValue对象
		PropertyValue pv = new PropertyValue(propertyName, val);
		parseMetaElements(ele, pv);
		pv.setSource(extractSource(ele));
		// 添加到BeanDefinition的PropertyValues集合中
		bd.getPropertyValues().addPropertyValue(pv);
	}
	finally {
		this.parseState.pop();
	}
}
```    
property的值可以是value或者ref或者是子节点
```
public Object parsePropertyValue(Element ele, BeanDefinition bd, String propertyName) {
	String elementName = (propertyName != null) ?
					"<property> element for property '" + propertyName + "'" :
					"<constructor-arg> element";

	// Should only have one child element: ref, value, list, etc.
	NodeList nl = ele.getChildNodes();
	Element subElement = null;
	for (int i = 0; i < nl.getLength(); i++) {
		Node node = nl.item(i);
		if (node instanceof Element && !nodeNameEquals(node, DESCRIPTION_ELEMENT) &&
				!nodeNameEquals(node, META_ELEMENT)) {
			// Child element is what we're looking for.
			if (subElement != null) {
				error(elementName + " must not contain more than one sub-element", ele);
			}
			else {
				subElement = (Element) node;
			}
		}
	}
		
	// ref属性
	boolean hasRefAttribute = ele.hasAttribute(REF_ATTRIBUTE);
	// value属性
	boolean hasValueAttribute = ele.hasAttribute(VALUE_ATTRIBUTE);
	if ((hasRefAttribute && hasValueAttribute) ||
			((hasRefAttribute || hasValueAttribute) && subElement != null)) {
		error(elementName +
				" is only allowed to contain either 'ref' attribute OR 'value' attribute OR sub-element", ele);
	}

	if (hasRefAttribute) {
		String refName = ele.getAttribute(REF_ATTRIBUTE);
		if (!StringUtils.hasText(refName)) {
			error(elementName + " contains empty 'ref' attribute", ele);
		}
		// 如果是ref属性，返回RuntimeBeanReference对象
		RuntimeBeanReference ref = new RuntimeBeanReference(refName);
		ref.setSource(extractSource(ele));
		return ref;
	}
	else if (hasValueAttribute) {
		// 如果是value属性，转化成String
		TypedStringValue valueHolder = new TypedStringValue(ele.getAttribute(VALUE_ATTRIBUTE));
		valueHolder.setSource(extractSource(ele));
		return valueHolder;
	}
	else if (subElement != null) {
		// 如果有子节点，继续解析
		return parsePropertySubElement(subElement, bd);
	}
	else {
		// Neither child element nor "ref" or "value" attribute found.
		error(elementName + " must specify a ref or value", ele);
		return null;
	}
}
```    
对于存在子节点的继续解析
```
public Object parsePropertySubElement(Element ele, BeanDefinition bd, String defaultValueType) {
	// 自定义的标签调用自定义的解析方法
	if (!isDefaultNamespace(ele)) {
		return parseNestedCustomElement(ele, bd);
	}
	// bean标签
	else if (nodeNameEquals(ele, BEAN_ELEMENT)) {
		BeanDefinitionHolder nestedBd = parseBeanDefinitionElement(ele, bd);
		if (nestedBd != null) {
			nestedBd = decorateBeanDefinitionIfRequired(ele, nestedBd, bd);
		}
		return nestedBd;
	}
	// ref标签
	else if (nodeNameEquals(ele, REF_ELEMENT)) {
		// A generic reference to any name of any bean.
		String refName = ele.getAttribute(BEAN_REF_ATTRIBUTE);
		boolean toParent = false;
		if (!StringUtils.hasLength(refName)) {
			// A reference to the id of another bean in the same XML file.
			refName = ele.getAttribute(LOCAL_REF_ATTRIBUTE);
			if (!StringUtils.hasLength(refName)) {
				// A reference to the id of another bean in a parent context.
				refName = ele.getAttribute(PARENT_REF_ATTRIBUTE);
				toParent = true;
				if (!StringUtils.hasLength(refName)) {
					error("'bean', 'local' or 'parent' is required for <ref> element", ele);
					return null;
				}
			}
		}
		if (!StringUtils.hasText(refName)) {
			error("<ref> element contains empty target attribute", ele);
			return null;
		}
		RuntimeBeanReference ref = new RuntimeBeanReference(refName, toParent);
		ref.setSource(extractSource(ele));
		return ref;
	}
	// idref标签
	else if (nodeNameEquals(ele, IDREF_ELEMENT)) {
		return parseIdRefElement(ele);
	}
	// value标签
	else if (nodeNameEquals(ele, VALUE_ELEMENT)) {
		return parseValueElement(ele, defaultValueType);
	}
	// null标签
	else if (nodeNameEquals(ele, NULL_ELEMENT)) {
		// It's a distinguished null value. Let's wrap it in a TypedStringValue
		// object in order to preserve the source location.
		TypedStringValue nullHolder = new TypedStringValue(null);
		nullHolder.setSource(extractSource(ele));
		return nullHolder;
	}
	// array标签
	else if (nodeNameEquals(ele, ARRAY_ELEMENT)) {
		return parseArrayElement(ele, bd);
	}
	// list标签
	else if (nodeNameEquals(ele, LIST_ELEMENT)) {
		return parseListElement(ele, bd);
	}
	// set标签	
	else if (nodeNameEquals(ele, SET_ELEMENT)) {
		return parseSetElement(ele, bd);
	}
	// map标签
	else if (nodeNameEquals(ele, MAP_ELEMENT)) {
		return parseMapElement(ele, bd);
	}
	// props标签
	else if (nodeNameEquals(ele, PROPS_ELEMENT)) {
		return parsePropsElement(ele);
	}
	else {
		error("Unknown property sub-element: [" + ele.getNodeName() + "]", ele);
		return null;
	}
}
```    
至此所有xml的解析就完成了，接下来就是Bean Definition的注册。

# 注册
在`DefaultBeanDefinitionDocumentReader`的processBeanDefinition中，解析完xml后会拿到`BeanDefinition`信息的持有类`BeanDefinitionHolder`。
```
protected void processBeanDefinition(Element ele, BeanDefinitionParserDelegate delegate) {
	// 委托BeanDefinitionParserDelegate解析bean标签
	BeanDefinitionHolder bdHolder = delegate.parseBeanDefinitionElement(ele);
	if (bdHolder != null) {
		// 对自定义属性和自定义子节点进行处理
		bdHolder = delegate.decorateBeanDefinitionIfRequired(ele, bdHolder);
		try {
			// 注册得到的BeanDefinitionHolder到BeanFactory中
			BeanDefinitionReaderUtils.registerBeanDefinition(bdHolder, getReaderContext().getRegistry());
		}
		catch (BeanDefinitionStoreException ex) {
			getReaderContext().error("Failed to register bean definition with name '" +
					bdHolder.getBeanName() + "'", ele, ex);
		}
		// 发送注册完成事件通知
		getReaderContext().fireComponentRegistered(new BeanComponentDefinition(bdHolder));
	}
}
```
通过BeanDefinitionReaderUtils.registerBeanDefinition注册到BeanFactory。
```
public static void registerBeanDefinition(
		BeanDefinitionHolder definitionHolder, BeanDefinitionRegistry registry)
		throws BeanDefinitionStoreException {

	// bean的名称
	String beanName = definitionHolder.getBeanName();
	// 注册BeanDefinition到DefaultListableBeanFactory
	registry.registerBeanDefinition(beanName, definitionHolder.getBeanDefinition());

	// 注册bean的昵称
	String[] aliases = definitionHolder.getAliases();
	if (aliases != null) {
		for (String alias : aliases) {
			registry.registerAlias(beanName, alias);
		}
	}
}
```    
这里的registry其实就是`DefaultListableBeanFactory`，它实现了`BeanDefinitionRegistry`接口，并被一直传递到这里。`DefaultListableBeanFactory`的registerBeanDefinition实现：
```
public void registerBeanDefinition(String beanName, BeanDefinition beanDefinition)
		throws BeanDefinitionStoreException {

	if (beanDefinition instanceof AbstractBeanDefinition) {
		try {
			((AbstractBeanDefinition) beanDefinition).validate();
		}
		catch (BeanDefinitionValidationException ex) {
			throw new BeanDefinitionStoreException(beanDefinition.getResourceDescription(), beanName,
					"Validation of bean definition failed", ex);
		}
	}

	BeanDefinition oldBeanDefinition;

	oldBeanDefinition = this.beanDefinitionMap.get(beanName);
	if (oldBeanDefinition != null) {
		// 校验部分省略
	}
	else {
		this.beanDefinitionNames.add(beanName);
		this.manualSingletonNames.remove(beanName);
		this.frozenBeanDefinitionNames = null;
	}
	// 添加到BeanDefinitionMap
	this.beanDefinitionMap.put(beanName, beanDefinition);

	if (oldBeanDefinition != null || containsSingleton(beanName)) {
		resetBeanDefinition(beanName);
	}
}
```    
这里的beanDefinitionMap就是存储BeanDefinition数据的核心Map.
```
private final Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<String, BeanDefinition>(64);
```    
至此spring的xml配置文件经过定位，解析和注册，映射成为spring内部的数据结构。上面我们曾提到spring的BeanFactory核心接口，其中的核心方法就是getBean,spring如何实例化、配置以及组装Bean对象，以及Bean对象之间的依赖关系是如何注入，请看下一章。