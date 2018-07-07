IOC容器最基本也是最重要的特性，就是管理bean的生命周期。配置好bean的约定，bean的创建和销毁都由spring来管理。当我们需要bean对象时，通过BeanFactory的getBean方法就可以拿到实例化好的对象实例。getBean方法究竟是如何做到的呢？spring中实现BeanFactory接口的getBean方法是AbstractBeanFactory。
```
public Object getBean(String name) throws BeansException {
	return doGetBean(name, null, null, false);
}
```
doGetBean方法是spring中获取bean的通用方法，负责bean的实例化，以及支持各种bean的特性。doGetBean做的事情很多，我粗略地分解为一下几个部分。

# 1.转换name参数
```
// 转换传入的name
// 如果是FactoryBean,去掉“&”前缀
// 如果是bean的昵称，返回bean真正的name
final String beanName = transformedBeanName(name);
```
进入transformedBeanName方法
```
protected String transformedBeanName(String name) {
	return canonicalName(BeanFactoryUtils.transformedBeanName(name));
}
```
做了两个事情，一个是BeanFactoryUtils.transformedBeanName，就是判断name是否以&开头，是的话就去掉&
```
public static String transformedBeanName(String name) {
	Assert.notNull(name, "'name' must not be null");
	String beanName = name;
	// 判断是否以&开头
	while (beanName.startsWith(BeanFactory.FACTORY_BEAN_PREFIX)) {
		beanName = beanName.substring(BeanFactory.FACTORY_BEAN_PREFIX.length());
	}
	return beanName;
}
```
另一个是canonicalName方法
```
public String canonicalName(String name) {
	String canonicalName = name;
	// Handle aliasing...
	String resolvedName;
	do {
		// 判断是否为昵称
		resolvedName = this.aliasMap.get(canonicalName);
		if (resolvedName != null) {
			canonicalName = resolvedName;
		}
	}
	while (resolvedName != null);
	return canonicalName;
}
```
判断参数name是否为昵称，如果是，返回真正的beanName

# 2.查询缓存是否存在
```
Object sharedInstance = getSingleton(beanName);
```
getSingleton方法由SingletonBeanRegistry接口定义，AbstractBeanFactory继承了SingletonBeanRegistry的实现类DefaultSingletonBeanRegistry。
```
protected Object getSingleton(String beanName, boolean allowEarlyReference) {
	// 从实例化好的对象Map中查询beanName是否存在
	Object singletonObject = this.singletonObjects.get(beanName);
	// 如果缓存对象不存在，判断beanName是否正在创建
	if (singletonObject == null && isSingletonCurrentlyInCreation(beanName)) {
		synchronized (this.singletonObjects) {
			// 如果beanName正在创建，说明bean之间相互依赖
			// 从预实例化对象Map中获取bean对象
			singletonObject = this.earlySingletonObjects.get(beanName);
			if (singletonObject == null && allowEarlyReference) {
				// 如果预实例化对象Map也不存在，则从单例工厂Map中获取bean的ObjectFactory
				// 并通过ObjectFactory的getObject方法返回bean对象
				ObjectFactory<?> singletonFactory = this.singletonFactories.get(beanName);
				if (singletonFactory != null) {
					singletonObject = singletonFactory.getObject();
					this.earlySingletonObjects.put(beanName, singletonObject);
					this.singletonFactories.remove(beanName);
				}
			}
		}
	}
	return (singletonObject != NULL_OBJECT ? singletonObject : null);
}
```
# 3.校验&标记
```
// 1.校验正在创建的实例是否有相同beanName
if (isPrototypeCurrentlyInCreation(beanName)) {
	throw new BeanCurrentlyInCreationException(beanName);
}

// 如果当前BeanFactory不包含beanName的定义，且存在父BeanFactory
// 递归调用父BeanFactory的getBean方法
BeanFactory parentBeanFactory = getParentBeanFactory();
if (parentBeanFactory != null && !containsBeanDefinition(beanName)) {
	// 重新转换beanName
	String nameToLookup = originalBeanName(name);
	if (args != null) {
		// 如果有参数，先按照参数查询
		return (T) parentBeanFactory.getBean(nameToLookup, args);
	}
	else {
		// 没有参数，按传入的bean的Type查询
		return parentBeanFactory.getBean(nameToLookup, requiredType);
	}
}

if (!typeCheckOnly) {
	// 标记beanName已经被创建过至少一次
	markBeanAsCreated(beanName);
}
```
这段代码主要做了以下内容

- 校验是否已存在相同beanName的正在被创建。spring不允许多个相同beanName同时创建，如果存在，则抛出异常
- 如果父BeanFactory存在，且当前BeanFactory不包含beanName的BeanDefinition，则递归调用父BeanFactory的getBean方法获取bean对象
- 将beanName加入到alreadyCreated集合中，标识beanName至少已经创建过一次
# 4.合并并校验BeanDefinition
```
final RootBeanDefinition mbd = getMergedLocalBeanDefinition(beanName);
checkMergedBeanDefinition(mbd, beanName, args);
```
### (1)合并BeanDefinition
```
protected RootBeanDefinition getMergedLocalBeanDefinition(String beanName) throws BeansException {
	// 从mergedBeanDefinitions缓存Map中查询
	RootBeanDefinition mbd = this.mergedBeanDefinitions.get(beanName);
	if (mbd != null) {
		return mbd;
	}
	return getMergedBeanDefinition(beanName, getBeanDefinition(beanName));
}
```
如果缓存不存在，getBeanDefinition方法先根据beanName获取BeanDefinition。getBeanDefinition方法的具体实现在DefaultListableBeanFactory中。
```
public BeanDefinition getBeanDefinition(String beanName) throws NoSuchBeanDefinitionException {
	BeanDefinition bd = this.beanDefinitionMap.get(beanName);
	if (bd == null) {
		if (this.logger.isTraceEnabled()) {
			this.logger.trace("No bean named '" + beanName + "' found in " + this);
		}
		throw new NoSuchBeanDefinitionException(beanName);
	}
	return bd;
}
```
然后将BeanDefinition合并成RootBeanDefinition
```
protected RootBeanDefinition getMergedBeanDefinition(
		String beanName, BeanDefinition bd, BeanDefinition containingBd)
		throws BeanDefinitionStoreException {

	// 同步锁保证beanName对应唯一的RootBeanDefinition
	synchronized (this.mergedBeanDefinitions) {
		RootBeanDefinition mbd = null;

		// 再次查询缓存
		if (containingBd == null) {
			mbd = this.mergedBeanDefinitions.get(beanName);
		}

		if (mbd == null) {
			if (bd.getParentName() == null) {
				// 如果bd是RootBeanDefinition类型，则copy出新的RootBeanDefinition对象
				if (bd instanceof RootBeanDefinition) {
					mbd = ((RootBeanDefinition) bd).cloneBeanDefinition();
				}
				else {
					// bd只是BeanDefinition，构造一个新的RootBeanDefinition对象
					mbd = new RootBeanDefinition(bd);
				}
			}
			else {
				// BeanDefinition的parentName存在，合并父BeanDefinition和子BeanDefinition
				BeanDefinition pbd;
				try {
					String parentBeanName = transformedBeanName(bd.getParentName());
					if (!beanName.equals(parentBeanName)) {
						pbd = getMergedBeanDefinition(parentBeanName);
					}
					else {
						if (getParentBeanFactory() instanceof ConfigurableBeanFactory) {
							pbd = ((ConfigurableBeanFactory) getParentBeanFactory()).getMergedBeanDefinition(parentBeanName);
						}
						else {
							throw new NoSuchBeanDefinitionException(bd.getParentName(),
									"Parent name '" + bd.getParentName() + "' is equal to bean name '" + beanName +
									"': cannot be resolved without an AbstractBeanFactory parent");
						}
					}
				}
				catch (NoSuchBeanDefinitionException ex) {
					throw new BeanDefinitionStoreException(bd.getResourceDescription(), beanName,
							"Could not resolve parent bean definition '" + bd.getParentName() + "'", ex);
				}
				// Deep copy with overridden values.
				mbd = new RootBeanDefinition(pbd);
				mbd.overrideFrom(bd);
			}

			// 如果scope没配置，默认为singleton
			if (!StringUtils.hasLength(mbd.getScope())) {
				mbd.setScope(RootBeanDefinition.SCOPE_SINGLETON);
			}
		}

		return mbd;
	}
}
```
### (2)校验MergedBeanDefinition，如果BeanDefinition设置了abstract=true，抛出异常
```
protected void checkMergedBeanDefinition(RootBeanDefinition mbd, String beanName, Object[] args)
		throws BeanDefinitionStoreException {

	if (mbd.isAbstract()) {
		throw new BeanIsAbstractException(beanName);
	}
}
```
# 5.判断bean是否指定依赖bean
```
String[] dependsOn = mbd.getDependsOn();
if (dependsOn != null) {
	for (String dependsOnBean : dependsOn) {
		if (isDependent(beanName, dependsOnBean)) {
			throw new BeanCreationException(mbd.getResourceDescription(), beanName,
					"Circular depends-on relationship between '" + beanName + "' and '" + dependsOnBean + "'");
		}
		registerDependentBean(dependsOnBean, beanName);
		getBean(dependsOnBean);
	}
}
```
如果指定了依赖的bean，则循环遍历，注册依赖bean
```
public void registerDependentBean(String beanName, String dependentBeanName) {
	// 转换dependsOnBean的beanName
	String canonicalName = canonicalName(beanName);
	Set<String> dependentBeans = this.dependentBeanMap.get(canonicalName);
	// 判断dependsOnBean的被依赖的beanName集合包含当前要实例化的beanName
	// 则直接返回
	if (dependentBeans != null && dependentBeans.contains(dependentBeanName)) {
		return;
	}

	// dependsOnBean的被依赖的beanName集合增加当前要实例化的beanName
	synchronized (this.dependentBeanMap) {
		dependentBeans = this.dependentBeanMap.get(canonicalName);
		if (dependentBeans == null) {
			dependentBeans = new LinkedHashSet<String>(8);
			this.dependentBeanMap.put(canonicalName, dependentBeans);
		}
		dependentBeans.add(dependentBeanName);
	}
	// 当前要实例化的beanName的依赖beanName集合增加dependsOnBean
	synchronized (this.dependenciesForBeanMap) {
		Set<String> dependenciesForBean = this.dependenciesForBeanMap.get(dependentBeanName);
		if (dependenciesForBean == null) {
			dependenciesForBean = new LinkedHashSet<String>(8);
			this.dependenciesForBeanMap.put(dependentBeanName, dependenciesForBean);
		}
		dependenciesForBean.add(canonicalName);
	}
}
```
同时递归调用getBean实例化dependsOnBean

# 6.创建bean对象
首先判断BeanDefinition的scope

- 单例(singleton) IOC容器中有且只有一个对象，多次调用getBean返回同一个对象
- 多例(prototype) 每次调用getBean返回一个新对象
- HTTP Request 每次HTTP请求共用同一个对象
- HTTP Session 每个HTTP会话共用同一个对象
- Application ServletContext共用一个对象
### scope为单例
```
sharedInstance = getSingleton(beanName, new ObjectFactory<Object>() {
	[@Override](https://my.oschina.net/u/1162528)
	public Object getObject() throws BeansException {
		try {
			return createBean(beanName, mbd, args);
		}
		catch (BeansException ex) {
			// Explicitly remove instance from singleton cache: It might have been put there
			// eagerly by the creation process, to allow for circular reference resolution.
			// Also remove any beans that received a temporary reference to the bean.
			destroySingleton(beanName);
			throw ex;
		}
	}
});
```
getSingleton方法的第二个参数是一个匿名内部类，匿名内部类实现的getObject方法中调用的createBean就是真正创建bean对象的方法。不过还是先来看getSingleton方法，凡是单例的操作都是在DefaultSingletonBeanRegistry中。
```
public Object getSingleton(String beanName, ObjectFactory<?> singletonFactory) {
	// 以singletonObjects作为同步锁，保证bean对象的创建不会并发
	synchronized (this.singletonObjects) {
		// 再次校验缓存是否存在
		Object singletonObject = this.singletonObjects.get(beanName);
		if (singletonObject == null) {
			// 如果BeanFactory正在销毁，抛出异常
			// 不要在destroy方法中请求getBean
			if (this.singletonsCurrentlyInDestruction) {
				throw new BeanCreationNotAllowedException(beanName,
						"Singleton bean creation not allowed while the singletons of this factory are in destruction " +
						"(Do not request a bean from a BeanFactory in a destroy method implementation!)");
			}
			if (logger.isDebugEnabled()) {
				logger.debug("Creating shared instance of singleton bean '" + beanName + "'");
			}
			// 单例创建前的回调扩展点
			// 默认添加beanName到singletonsCurrentlyInCreation集合中
			beforeSingletonCreation(beanName);
			// 成功创建单例标识
			boolean newSingleton = false;
			boolean recordSuppressedExceptions = (this.suppressedExceptions == null);
			if (recordSuppressedExceptions) {
				this.suppressedExceptions = new LinkedHashSet<Exception>();
			}
			try {
				// 真正创建单例对象方法
				singletonObject = singletonFactory.getObject();
				// 创建单例成功，设置标识为true
				newSingleton = true;
			}
			catch (IllegalStateException ex) {
				// Has the singleton object implicitly appeared in the meantime ->
				// if yes, proceed with it since the exception indicates that state.
				singletonObject = this.singletonObjects.get(beanName);
				if (singletonObject == null) {
					throw ex;
				}
			}
			catch (BeanCreationException ex) {
				if (recordSuppressedExceptions) {
					for (Exception suppressedException : this.suppressedExceptions) {
						ex.addRelatedCause(suppressedException);
					}
				}
				throw ex;
			}
			finally {
				if (recordSuppressedExceptions) {
					this.suppressedExceptions = null;
				}
				// 单例创建后的回掉扩展点
				// 默认从singletonsCurrentlyInCreation集合中移除beanName
				afterSingletonCreation(beanName);
			}
			if (newSingleton) {
				// 单例创建成功
				// 添加bean对象到缓存，并移除临时状态集合中的beanName
				addSingleton(beanName, singletonObject);
			}
		}
		return (singletonObject != NULL_OBJECT ? singletonObject : null);
	}
}
```
重点来关注下singletonFactory.getObject()，就是上面提到的匿名内部类中的方法
```
public Object getObject() throws BeansException {
	try {
		return createBean(beanName, mbd, args);
	}
	catch (BeansException ex) {
		// Explicitly remove instance from singleton cache: It might have been put there
		// eagerly by the creation process, to allow for circular reference resolution.
		// Also remove any beans that received a temporary reference to the bean.
		destroySingleton(beanName);
		throw ex;
	}
}
```
实际调用的createBean方法，而在AbstractBeanFactory中是抽象方法，真正实现的在AbstractAutowireCapableBeanFactory中
```
protected Object createBean(final String beanName, final RootBeanDefinition mbd, final Object[] args)
		throws BeanCreationException {

	if (logger.isDebugEnabled()) {
		logger.debug("Creating instance of bean '" + beanName + "'");
	}
	// 解析beanClass
	resolveBeanClass(mbd, beanName);

	// 处理methodOverride配置
	try {
		mbd.prepareMethodOverrides();
	}
	catch (BeanDefinitionValidationException ex) {
		throw new BeanDefinitionStoreException(mbd.getResourceDescription(),
				beanName, "Validation of method overrides failed", ex);
	}

	try {
		// 在初始化bean之前，查看是否有InstantiationAwareBeanPostProcessor后置处理器
		// 如果存在，则直接返回代理对象
		Object bean = resolveBeforeInstantiation(beanName, mbd);
		if (bean != null) {
			return bean;
		}
	}
	catch (Throwable ex) {
		throw new BeanCreationException(mbd.getResourceDescription(), beanName,
				"BeanPostProcessor before instantiation of bean failed", ex);
	}

	// bean实例化真正执行方法
	Object beanInstance = doCreateBean(beanName, mbd, args);
	if (logger.isDebugEnabled()) {
		logger.debug("Finished creating instance of bean '" + beanName + "'");
	}
	return beanInstance;
}
```
来看resolveBeanClass方法
```
protected Class<?> resolveBeanClass(final RootBeanDefinition mbd, String beanName, final Class<?>... typesToMatch)
		throws CannotLoadBeanClassException {
	// BeanDefinition存在beanClass，直接返回
	if (mbd.hasBeanClass()) {
		return mbd.getBeanClass();
	}
	
	return doResolveBeanClass(mbd, typesToMatch);
}
```
跳转到doResolveBeanClass方法
```
private Class<?> doResolveBeanClass(RootBeanDefinition mbd, Class<?>... typesToMatch) throws ClassNotFoundException {
	return mbd.resolveBeanClass(getBeanClassLoader());
}
```
执行的是RootBeanDefinition的resolveBeanClass方法，实际是RootBeanDefinition的父类AbstractBeanDefinition
```
public Class<?> resolveBeanClass(ClassLoader classLoader) throws ClassNotFoundException {
	String className = getBeanClassName();
	if (className == null) {
		return null;
	}
	Class<?> resolvedClass = ClassUtils.forName(className, classLoader);
	this.beanClass = resolvedClass;
	return resolvedClass;
}
```
拿到beanClass后，重点来看doCreateBean方法
```
protected Object doCreateBean(final String beanName, final RootBeanDefinition mbd, final Object[] args) {
	// Instantiate the bean.
	BeanWrapper instanceWrapper = null;
	if (mbd.isSingleton()) {
		// 单例的bean移除FactoryBean name的缓存
		instanceWrapper = this.factoryBeanInstanceCache.remove(beanName);
	}
	if (instanceWrapper == null) {
		// 实例化bean对象
		instanceWrapper = createBeanInstance(beanName, mbd, args);
	}
	final Object bean = (instanceWrapper != null ? instanceWrapper.getWrappedInstance() : null);
	Class<?> beanType = (instanceWrapper != null ? instanceWrapper.getWrappedClass() : null);

	// Allow post-processors to modify the merged bean definition.
	synchronized (mbd.postProcessingLock) {
		if (!mbd.postProcessed) {
			// 执行MergedBeanDefinitionPostProcessor后置处理器postProcessMergedBeanDefinition方法
			// 允许PostProcessor修改MergedBeanDefinition，即mbd
			applyMergedBeanDefinitionPostProcessors(mbd, beanType, beanName);
			mbd.postProcessed = true;
		}
	}

	// Eagerly cache singletons to be able to resolve circular references
	// even when triggered by lifecycle interfaces like BeanFactoryAware.
	// 提前缓存实例化的单例对象，用来解决循环引用
	boolean earlySingletonExposure = (mbd.isSingleton() && this.allowCircularReferences &&
			isSingletonCurrentlyInCreation(beanName));
	if (earlySingletonExposure) {
		if (logger.isDebugEnabled()) {
			logger.debug("Eagerly caching bean '" + beanName +
					"' to allow for resolving potential circular references");
		}
		// 将ObjectFactory对象存储到singletonFactories工厂Map中
		addSingletonFactory(beanName, new ObjectFactory<Object>() {
			[@Override](https://my.oschina.net/u/1162528)
			public Object getObject() throws BeansException {
				return getEarlyBeanReference(beanName, mbd, bean);
			}
		});
	}

	// Initialize the bean instance.
	Object exposedObject = bean;
	try {
		// 填充bean对象，主要是依赖属性的注入
		populateBean(beanName, mbd, instanceWrapper);
		if (exposedObject != null) {
			// 初始化bean对象
			// 1.执行bean的初始化方法
			// 2.触发所有BeanPostProcessors的初始化前置和初始化后置方法
			exposedObject = initializeBean(beanName, exposedObject, mbd);
		}
	}
	catch (Throwable ex) {
		if (ex instanceof BeanCreationException && beanName.equals(((BeanCreationException) ex).getBeanName())) {
			throw (BeanCreationException) ex;
		}
		else {
			throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Initialization of bean failed", ex);
		}
	}

	// 允许单例循环引用，单独处理和校验
	if (earlySingletonExposure) {
		Object earlySingletonReference = getSingleton(beanName, false);
		if (earlySingletonReference != null) {
			if (exposedObject == bean) {
				exposedObject = earlySingletonReference;
			}
			else if (!this.allowRawInjectionDespiteWrapping && hasDependentBean(beanName)) {
				String[] dependentBeans = getDependentBeans(beanName);
				Set<String> actualDependentBeans = new LinkedHashSet<String>(dependentBeans.length);
				for (String dependentBean : dependentBeans) {
					if (!removeSingletonIfCreatedForTypeCheckOnly(dependentBean)) {
						actualDependentBeans.add(dependentBean);
					}
				}
				if (!actualDependentBeans.isEmpty()) {
					throw new BeanCurrentlyInCreationException(beanName,
							"Bean with name '" + beanName + "' has been injected into other beans [" +
							StringUtils.collectionToCommaDelimitedString(actualDependentBeans) +
							"] in its raw version as part of a circular reference, but has eventually been " +
							"wrapped. This means that said other beans do not use the final version of the " +
							"bean. This is often the result of over-eager type matching - consider using " +
							"'getBeanNamesOfType' with the 'allowEagerInit' flag turned off, for example.");
				}
			}
		}
	}

	// Register bean as disposable.
	try {
		// 注册bean的销毁方法
		registerDisposableBeanIfNecessary(beanName, bean, mbd);
	}
	catch (BeanDefinitionValidationException ex) {
		throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Invalid destruction signature", ex);
	}

	return exposedObject;
}
```
在doCreateBean中所做的操作非常多，我们主要来关注三个方法

- createBeanInstance，bean对象的实例化
- populateBean，bean的依赖注入
- initializeBean，bean的初始化
先来看bean对象的实例化
```
protected BeanWrapper createBeanInstance(String beanName, RootBeanDefinition mbd, Object[] args) {
	// Make sure bean class is actually resolved at this point.
	Class<?> beanClass = resolveBeanClass(mbd, beanName);

	if (beanClass != null && !Modifier.isPublic(beanClass.getModifiers()) && !mbd.isNonPublicAccessAllowed()) {
		throw new BeanCreationException(mbd.getResourceDescription(), beanName,
				"Bean class isn't public, and non-public access not allowed: " + beanClass.getName());
	}

	// 如果bean设置了工厂方法，通过工厂方法获取bean对象
	if (mbd.getFactoryMethodName() != null)  {
		return instantiateUsingFactoryMethod(beanName, mbd, args);
	}

	// Shortcut when re-creating the same bean...
	boolean resolved = false;
	boolean autowireNecessary = false;
	if (args == null) {
		synchronized (mbd.constructorArgumentLock) {
			if (mbd.resolvedConstructorOrFactoryMethod != null) {
				resolved = true;
				autowireNecessary = mbd.constructorArgumentsResolved;
			}
		}
	}

	if (resolved) {
		// 如果有配置构造方法
		if (autowireNecessary) {
			return autowireConstructor(beanName, mbd, null, null);
		}
		else {
			return instantiateBean(beanName, mbd);
		}
	}

	// Need to determine the constructor...
	// 检查所有SmartInstantiationAwareBeanPostProcessor后置处理器，是否有当前bean的候选构造方法
	Constructor<?>[] ctors = determineConstructorsFromBeanPostProcessors(beanClass, beanName);
	if (ctors != null ||
			mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_CONSTRUCTOR ||
			mbd.hasConstructorArgumentValues() || !ObjectUtils.isEmpty(args))  {
		return autowireConstructor(beanName, mbd, ctors, args);
	}

	// No special handling: simply use no-arg constructor.
	// 没有任何配置，直接通过无参构造函数实例化
	return instantiateBean(beanName, mbd);
}
```
进入instantiateBean方法
```
protected BeanWrapper instantiateBean(final String beanName, final RootBeanDefinition mbd) {
	try {
		Object beanInstance;
		final BeanFactory parent = this;
		if (System.getSecurityManager() != null) {
			beanInstance = AccessController.doPrivileged(new PrivilegedAction<Object>() {
				[@Override](https://my.oschina.net/u/1162528)
				public Object run() {
					return getInstantiationStrategy().instantiate(mbd, beanName, parent);
				}
			}, getAccessControlContext());
		}
		else {
			beanInstance = getInstantiationStrategy().instantiate(mbd, beanName, parent);
		}
		BeanWrapper bw = new BeanWrapperImpl(beanInstance);
		initBeanWrapper(bw);
		return bw;
	}
	catch (Throwable ex) {
		throw new BeanCreationException(mbd.getResourceDescription(), beanName, "Instantiation of bean failed", ex);
	}
}
```
getInstantiationStrategy()方法返回实例化的策略类，在AbstractAutowireCapableBeanFactory中默认是CglibSubclassingInstantiationStrategy
```
private InstantiationStrategy instantiationStrategy = new CglibSubclassingInstantiationStrategy();
```
但最终执行instantiate方法的是CglibSubclassingInstantiationStrategy的父类SimpleInstantiationStrategy
```
public Object instantiate(RootBeanDefinition bd, String beanName, BeanFactory owner) {
	// Don't override the class with CGLIB if no overrides.
	// 没有methodOverrides配置，使用java自带的JDK实例化方法
	// 如果存在methodOverrides配置，则使用CGLIB
	if (bd.getMethodOverrides().isEmpty()) {
		Constructor<?> constructorToUse;
		synchronized (bd.constructorArgumentLock) {
			constructorToUse = (Constructor<?>) bd.resolvedConstructorOrFactoryMethod;
			if (constructorToUse == null) {
				final Class<?> clazz = bd.getBeanClass();
				if (clazz.isInterface()) {
					throw new BeanInstantiationException(clazz, "Specified class is an interface");
				}
				try {
					if (System.getSecurityManager() != null) {
						constructorToUse = AccessController.doPrivileged(new PrivilegedExceptionAction<Constructor<?>>() {
							[@Override](https://my.oschina.net/u/1162528)
							public Constructor<?> run() throws Exception {
								return clazz.getDeclaredConstructor((Class[]) null);
							}
						});
					}
					else {
						constructorToUse =	clazz.getDeclaredConstructor((Class[]) null);
					}
					bd.resolvedConstructorOrFactoryMethod = constructorToUse;
				}
				catch (Exception ex) {
					throw new BeanInstantiationException(clazz, "No default constructor found", ex);
				}
			}
		}
		// JDK方式实例化对象
		return BeanUtils.instantiateClass(constructorToUse);
	}
	else {
		// Must generate CGLIB subclass.
		return instantiateWithMethodInjection(bd, beanName, owner);
	}
}
```
来看BeanUtils.instantiateClass方法，就是无参构造函数反射创建对象。对于CGLIB的方式，大家有兴趣的可以深入了解，再次就不多说了。
```
public static <T> T instantiateClass(Constructor<T> ctor, Object... args) throws BeanInstantiationException {
	ReflectionUtils.makeAccessible(ctor);
	return ctor.newInstance(args);
}
```
创建完对象，接下来就是填充对象。populateBean方法中主要对依赖属性进行处理，也就是常说的依赖注入
```
protected void populateBean(String beanName, RootBeanDefinition mbd, BeanWrapper bw) {
	// 拿到bean的依赖属性
	PropertyValues pvs = mbd.getPropertyValues();

	// Give any InstantiationAwareBeanPostProcessors the opportunity to modify the
	// state of the bean before properties are set. This can be used, for example,
	// to support styles of field injection.
	boolean continueWithPropertyPopulation = true;

	// 这里是在bean实例化后依赖属性处理前可以修改bean的状态的回调操作点
	// 是InstantiationAwareBeanPostProcessor后置处理器postProcessAfterInstantiation方法的执行
	// 执行完后置处理器的postProcessAfterInstantiation方法，可以返回true或false。如果返回false，代表将跳过之后的所有的InstantiationAwareBeanPostProcessor后置处理器并返回
	if (!mbd.isSynthetic() && hasInstantiationAwareBeanPostProcessors()) {
		for (BeanPostProcessor bp : getBeanPostProcessors()) {
			if (bp instanceof InstantiationAwareBeanPostProcessor) {
				InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
				if (!ibp.postProcessAfterInstantiation(bw.getWrappedInstance(), beanName)) {
					continueWithPropertyPopulation = false;
					break;
				}
			}
		}
	}

	// 如果continueWithPropertyPopulation为false，直接返回
	if (!continueWithPropertyPopulation) {
		return;
	}

	// 如果bean配置了autowire的方式，则通过byName或byType去容器中匹配依赖对象
	if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_NAME ||
			mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_TYPE) {
		MutablePropertyValues newPvs = new MutablePropertyValues(pvs);

		// Add property values based on autowire by name if applicable.
		if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_NAME) {
			autowireByName(beanName, mbd, bw, newPvs);
		}

		// Add property values based on autowire by type if applicable.
		if (mbd.getResolvedAutowireMode() == RootBeanDefinition.AUTOWIRE_BY_TYPE) {
			autowireByType(beanName, mbd, bw, newPvs);
		}

		pvs = newPvs;
	}

	boolean hasInstAwareBpps = hasInstantiationAwareBeanPostProcessors();
	boolean needsDepCheck = (mbd.getDependencyCheck() != RootBeanDefinition.DEPENDENCY_CHECK_NONE);

	if (hasInstAwareBpps || needsDepCheck) {
		PropertyDescriptor[] filteredPds = filterPropertyDescriptorsForDependencyCheck(bw, mbd.allowCaching);
		// 如果存在InstantiationAwareBeanPostProcessor后置处理器，调用postProcessPropertyValues可以对属性进行校验、修改甚至是替换
                    // 可以支持属性注入，比如@Autowired注解对应的AutowiredAnnotationBeanPostProcessor后置处理器就是在这里进行依赖注入
		// 如@Required注解就在此处进行校验
		if (hasInstAwareBpps) {
			for (BeanPostProcessor bp : getBeanPostProcessors()) {
				if (bp instanceof InstantiationAwareBeanPostProcessor) {
					InstantiationAwareBeanPostProcessor ibp = (InstantiationAwareBeanPostProcessor) bp;
					pvs = ibp.postProcessPropertyValues(pvs, filteredPds, bw.getWrappedInstance(), beanName);
					if (pvs == null) {
						return;
					}
				}
			}
		}
		// 如果bean配置了dependency-check，进行依赖校验
		if (needsDepCheck) {
			checkDependencies(beanName, mbd, filteredPds, pvs);
		}
	}

	// 属性依赖注入
	applyPropertyValues(beanName, mbd, bw, pvs);
}
```
来看applyPropertyValues方法
```
protected void applyPropertyValues(String beanName, BeanDefinition mbd, BeanWrapper bw, PropertyValues pvs) {
	BeanDefinitionValueResolver valueResolver = new BeanDefinitionValueResolver(this, beanName, mbd, converter);

	// Create a deep copy, resolving any references for values.
	List<PropertyValue> deepCopy = new ArrayList<PropertyValue>(original.size());
	boolean resolveNecessary = false;
	for (PropertyValue pv : original) {
		String propertyName = pv.getName();
		Object originalValue = pv.getValue();
		// 解析PropertyValue，返回String值或依赖的对象或者其他类型比如Array，Set的值
		Object resolvedValue = valueResolver.resolveValueIfNecessary(pv, originalValue);
		Object convertedValue = resolvedValue;
		resolveNecessary = true;
		deepCopy.add(new PropertyValue(pv, convertedValue));
	}

	// Set our (possibly massaged) deep copy.
	try {
		// 注入解析完的值到对象中
		bw.setPropertyValues(new MutablePropertyValues(deepCopy));
	}
	catch (BeansException ex) {
		throw new BeanCreationException(
				mbd.getResourceDescription(), beanName, "Error setting property values", ex);
	}
}
```
在解析PropertyValue，我们来关注下依赖bean的处理
```
if (value instanceof RuntimeBeanReference) {
	RuntimeBeanReference ref = (RuntimeBeanReference) value;
	return resolveReference(argName, ref);
}
```
resolveReference方法中递归调用了getBean方法获得了依赖bean的对象。
```
private Object resolveReference(Object argName, RuntimeBeanReference ref) {
	try {
		String refName = ref.getBeanName();
		refName = String.valueOf(doEvaluate(refName));
		if (ref.isToParent()) {
			if (this.beanFactory.getParentBeanFactory() == null) {
				throw new BeanCreationException(
						this.beanDefinition.getResourceDescription(), this.beanName,
						"Can't resolve reference to bean '" + refName +
						"' in parent factory: no parent factory available");
			}
			return this.beanFactory.getParentBeanFactory().getBean(refName);
		}
		else {
			// 递归调用getBean方法获得依赖bean对象
			Object bean = this.beanFactory.getBean(refName);
			this.beanFactory.registerDependentBean(refName, this.beanName);
			return bean;
		}
	}
	catch (BeansException ex) {
		throw new BeanCreationException(
				this.beanDefinition.getResourceDescription(), this.beanName,
				"Cannot resolve reference to bean '" + ref.getBeanName() + "' while setting " + argName, ex);
	}
}
```
依赖真正被注入到bean对象中是BeanWrapperImpl中的setPropertyValue方法。这里只节选了setter方法反射注入属性值的部分，由于调用层级比较多，详细的就只能自己去看了。
```
final Method writeMethod = (pd instanceof GenericTypeAwarePropertyDescriptor ?
		((GenericTypeAwarePropertyDescriptor) pd).getWriteMethodForActualAccess() :
		pd.getWriteMethod());
if (!Modifier.isPublic(writeMethod.getDeclaringClass().getModifiers()) && !writeMethod.isAccessible()) {
	if (System.getSecurityManager()!= null) {
		AccessController.doPrivileged(new PrivilegedAction<Object>() {
			@Override
			public Object run() {
				writeMethod.setAccessible(true);
				return null;
			}
		});
	}
	else {
		writeMethod.setAccessible(true);
	}
}
final Object value = valueToApply;
if (System.getSecurityManager() != null) {
	try {
		AccessController.doPrivileged(new PrivilegedExceptionAction<Object>() {
			@Override
			public Object run() throws Exception {
				writeMethod.invoke(object, value);
				return null;
			}
		}, acc);
	}
	catch (PrivilegedActionException ex) {
		throw ex.getException();
	}
}
else {
	writeMethod.invoke(this.object, value);
}
```
bean对象已经实例化，依赖属性也全部注入，还有初始化方法没有执行。回头来看AbstractAutowireCapableBeanFactory类doCreateBean方法中的initializeBean方法。
```
protected Object initializeBean(final String beanName, final Object bean, RootBeanDefinition mbd) {
	if (System.getSecurityManager() != null) {
		AccessController.doPrivileged(new PrivilegedAction<Object>() {
			@Override
			public Object run() {
				invokeAwareMethods(beanName, bean);
				return null;
			}
		}, getAccessControlContext());
	}
	else {
		// 处理实现Aware接口的Bean
		invokeAwareMethods(beanName, bean);
	}

	Object wrappedBean = bean;
	if (mbd == null || !mbd.isSynthetic()) {
		// BeanPostProcessor初始化前回调接口
		wrappedBean = applyBeanPostProcessorsBeforeInitialization(wrappedBean, beanName);
	}

	try {
		// 执行初始化方法
		// 1.实现InitializingBean接口的afterPropertiesSet方法
		// 2.配置的init-method方法
		invokeInitMethods(beanName, wrappedBean, mbd);
	}
	catch (Throwable ex) {
		throw new BeanCreationException(
				(mbd != null ? mbd.getResourceDescription() : null),
				beanName, "Invocation of init method failed", ex);
	}

	if (mbd == null || !mbd.isSynthetic()) {
		// BeanPostProcessor初始化后回调接口
		wrappedBean = applyBeanPostProcessorsAfterInitialization(wrappedBean, beanName);
	}
	return wrappedBean;
}
```
主要来看下invokeInitMethods方法
```
protected void invokeInitMethods(String beanName, final Object bean, RootBeanDefinition mbd)
		throws Throwable {

	boolean isInitializingBean = (bean instanceof InitializingBean);
	if (isInitializingBean && (mbd == null || !mbd.isExternallyManagedInitMethod("afterPropertiesSet"))) {
		if (logger.isDebugEnabled()) {
			logger.debug("Invoking afterPropertiesSet() on bean with name '" + beanName + "'");
		}
		if (System.getSecurityManager() != null) {
			try {
				AccessController.doPrivileged(new PrivilegedExceptionAction<Object>() {
					@Override
					public Object run() throws Exception {
						((InitializingBean) bean).afterPropertiesSet();
						return null;
					}
				}, getAccessControlContext());
			}
			catch (PrivilegedActionException pae) {
				throw pae.getException();
			}
		}
		else {
			// 先调用InitializingBean的afterPropertiesSet方法
			((InitializingBean) bean).afterPropertiesSet();
		}
	}

	if (mbd != null) {
		String initMethodName = mbd.getInitMethodName();
		if (initMethodName != null && !(isInitializingBean && "afterPropertiesSet".equals(initMethodName)) &&
				!mbd.isExternallyManagedInitMethod(initMethodName)) {
			// 再调用init-method方法，也是通过反射的方式去执行
			invokeCustomInitMethod(beanName, bean, mbd);
		}
	}
}
```
至此bean对象的所有操作都完成了，doCreateBean方法返回了单例bean的对象。最后一步，将创建好的bean对象放入缓存。
```
protected void addSingleton(String beanName, Object singletonObject) {
	synchronized (this.singletonObjects) {
		this.singletonObjects.put(beanName, (singletonObject != null ? singletonObject : NULL_OBJECT));
		this.singletonFactories.remove(beanName);
		this.earlySingletonObjects.remove(beanName);
		this.registeredSingletons.add(beanName);
	}
}
```
### scope为多例
多例bean也是通过createBean方法创建对象，只是前后的回调方法不同而已
```
Object prototypeInstance = null;
try {
	// 多例bean创建前回调方法
	// 默认修改bean创建状态
	beforePrototypeCreation(beanName);
	// createBean方法同单例bean一致
	prototypeInstance = createBean(beanName, mbd, args);
}
finally {
	// 多例bean创建后回调方法
	// 默认清除bean创建状态
	afterPrototypeCreation(beanName);
}
```
### 其他scope
其他scope同样创建对象过程同多例一致，只是对象创建成功后，缓存到指定的Scope中，从而保证Scope中的对象的唯一性。
```
String scopeName = mbd.getScope();
final Scope scope = this.scopes.get(scopeName);
if (scope == null) {
	throw new IllegalStateException("No Scope registered for scope '" + scopeName + "'");
}
try {
	Object scopedInstance = scope.get(beanName, new ObjectFactory<Object>() {
		@Override
		public Object getObject() throws BeansException {
			beforePrototypeCreation(beanName);
			try {
				return createBean(beanName, mbd, args);
			}
			finally {
				afterPrototypeCreation(beanName);
			}
		}
	});
}
catch (IllegalStateException ex) {
	throw new BeanCreationException(beanName,
			"Scope '" + scopeName + "' is not active for the current thread; " +
			"consider defining a scoped proxy for this bean if you intend to refer to it from a singleton",
			ex);
}
```
# 7.Bean的转换
在bean对象已经创建完成后，如果指定了bean的Type，且指定的Type和创建的Bean的Class不匹配，可以通过TypeConverter进行转换。默认的TypeConverter实现类是SimpleTypeConverter。关于转换操作将在后面的章节单独介绍，这里就暂时不细说了。
```
// Check if required type matches the type of the actual bean instance.
if (requiredType != null && bean != null && !requiredType.isAssignableFrom(bean.getClass())) {
	try {
		return getTypeConverter().convertIfNecessary(bean, requiredType);
	}
	catch (TypeMismatchException ex) {
		if (logger.isDebugEnabled()) {
			logger.debug("Failed to convert bean '" + name + "' to required type [" +
					ClassUtils.getQualifiedName(requiredType) + "]", ex);
		}
		throw new BeanNotOfRequiredTypeException(name, requiredType, bean.getClass());
	}
}
```
到这里，getBean方法基本完成了，还有FactoryBean的部分留待下一章单独介绍。原本觉得应该不会很多的内容，竟然写了接近6个小时，而且还是在部分点上省略待讲的前提下，终于能体会到把知识讲解透彻远比想象中要难的多。然后对于自己来说也是受益良多，之前不太理解的地方又有了新的认识，之前的理解很多都不够细致。一直以为除了JDK的源码，最值得一看的就是spring的源码。相信现在的付出一定能得到回报。Keep Going！