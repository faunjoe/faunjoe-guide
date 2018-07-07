# 起点

我第一次认真地看spring的源码，应该算是在2015年。那时我已经看了一些spring的框架原理之类的博客文章，自我感觉已经从宏观上了解spring的概要设计。于是下了一本spring源码深度解析的PDF(原谅一个刚工作的人的囊中羞涩)，跟着作者的思路开始撸起Spring的源码，经过两个星期左右的废寝忘食(有时候坐在马桶上也捧着pad看)，终于看完了第一部分，也就是Spring的核心部分，IOC容器和AOP。

你们以为我这么牛逼吗，两个星期就把java最经典的开源项目的核心理解了？其实我真的只是把书看完了，努力理解作者贴出来的大段大段的代码，尤其是spring的一些精妙的设计，在当时的我看来简直就是一会跳到这，一会又跳到那，什么玩意儿。但我还是压制住了心中的洪荒之力，兢兢业业地看完了好几章的源码剖析。等我拖着疲惫的精神终于到达终点时，蓦然回首，尼玛，连个鬼影都没有，只模模糊糊的记得解析了xml文件，实例化了bean，组装了一些bean的依赖属性，然后呢，哪有什么然后，我突然发现好像领悟到张无忌学太极剑的感觉，整个脑袋里空空荡荡，唯有江月与清风。

咳咳，好像扯的有点多了，言归正传。我后来又多次尝试跟断点去追spring的源码，看解析spring的书，每次总是会觉得又懂了那么一点点，心中还是有那么丝丝的窃喜，又进步了一点哈哈。直到有一天看到一篇博客，叫[1000行代码实现一个基本的IoC容器](https://my.oschina.net/flashsword/blog/192551)(非常建议大家看下，还有一篇1000行实现AOP的)。我想我擦，我反反复复看了这么长时间的源码，1000行就能搞定了？等我仔细看我这篇博客，让我震惊的不是1000行的代码，而是我一直以来看spring ioc源码存在的误区：我从来没有认真思考过为什么我们要用spring ioc，spring IOC究竟实现了什么，IOC的核心又是什么？

我想对我spring源码的学习过程有个总结，所以才有这一篇以及之后的spring源码分析的博客。但我不想在第一篇就贴上BeanDefinition和BeanFactory的大段代码，列举出他们的实现接口以及类(当然后面还是会贴的，呵呵)，我会在前辈大神的思路上，构建一个简单的ioc容器，让大家对spring有个基本的认识和理解，这样可以在之后源码解析的海洋里矗立一座灯塔，不会被波涛汹涌的代码所淹没。

# 什么是ioc容器
想要知道IOC容器的核心是什么，首先得了解什么是ioc容器。而IOC容器，它得先是个容器，那什么是容器呢？容器是许多对象的运行环境，它管理着对象的生命周期，支持对象的查找和依赖决策，以及配置管理等其他功能，最终让对象井然有序地运转着。

那IOC是什么，控制反转(Inversion Of Control)，它也等同于依赖注入(DI Dependence Injection)，什么意思呢？ 一个对象依赖另一个对象，当我们使用这个对象时，需要主动去创建或查找这个依赖对象，而IOC是容器在对象初始化时不等这个对象被使用就主动将依赖传递给它。

举个例子吧，我在公司做个项目，需要其他部门的人提供一个API，一般都是我主动找那个部门的人沟通让他们提供。假如有个项目经理，我给他一份API需求文档，等我需要这个API时，发现已经提供好了可以直接使用了。从这个例子可以发现，我的工作变简单了,而这个项目经理的角色就相当于IOC容器，它让开发变得简单。

具体怎么变简单的呢，就是你按照格式提供一份对象的组件及依赖的配置信息，IOC容器就能产生出配置完整可执行的应用系统。如下图：


# 构建IOC容器
理论都说的差不多了，现在来写一个IOC容器。提供一份配置信息，它要完成的目标如下：

创建对象
组装对象中的属性和依赖
现在我们以xml文件为配置信息载体，构建一个公司的Demo.公司(Company)开业有名字(name)，也要有员工(Employee)干活。

### Company

```
package com.lntea.test.bean;

public class Company {

    private String name;
    
    private Employee employee;
    
    public void open(){
        System.out.println("Company " + name + " is open.");
        employee.work();
    }
}
```

### Employee

```
package com.lntea.test.bean;

public class Employee {

    private String name;
    
    public void work(){
        System.out.println("Employee " + name + " is working");
    }
}
```

### company-ioc.xml
```
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE beans PUBLIC "-//SPRING//DTD BEAN//EN"
		"http://www.springframework.org/dtd/spring-beans.dtd">
<beans>
    <bean id="company" class="com.lntea.test.bean.Company">
    	<property name="name" value="Apple"></property>
    	<property name="employee" ref="employee"></property>
    </bean>
    <bean id="employee" class="com.lntea.test.bean.Employee">
    	<property name="name" value="Jack"></property>
    </bean>
</beans>
```

# 1.定位
首先我们要对xml资源文件进行读取，一般对资源的操作都是通过流来做的，定义一个Resource资源接口

```
package com.lntea.ioc.resource;

import java.io.IOException;
import java.io.InputStream;

public interface Resource {
	InputStream getInputStream() throws IOException;
}
```
通常资源文件都会放在classpath路径下，实现一个ClassPathResource类可以读取classpath的文件
```
package com.lntea.ioc.resource;

import java.io.IOException;
import java.io.InputStream;

public class ClassPathResource implements Resource{
    
    private String path;
    
    private ClassLoader classLoader;
    
    public ClassPathResource(String path) {
        this(path, (ClassLoader)null);
    }
    
    public ClassPathResource(String path, ClassLoader classLoader) {
        this.path = path;
        this.classLoader = (classLoader != null ? classLoader : Thread.currentThread().getContextClassLoader());
    }

    @Override
    public InputStream getInputStream() throws IOException {
        return classLoader.getResourceAsStream(path);
    }

}
```
但是资源也可以通过其他方式定义，比如绝对路径或者URL的方式，因而需要一个Resource的处理器ResourceLoader。当前我们就只处理classpath方式的。
```
package com.lntea.ioc.resource;

public class ResourceLoader {
    
    final String CLASSPATH_URL_PREFIX = "classpath:";
	
	public Resource getResource(String location){
	    if (location.startsWith(CLASSPATH_URL_PREFIX)) {
            return new ClassPathResource(location.substring(CLASSPATH_URL_PREFIX.length()));
        }
        else {
            return new ClassPathResource(location);
        }
	}
}
```

这样就可以通过ResourceLoader来获得company-ioc.xml文件的输入流
```
 InputStream inputStream = new ResourceLoader().getResource("company-ioc.xml").getInputStream;
```
# 2.解析
有了company-ioc.xml文件的输入流，就可以进行bean及bean关系的解析，在解析之前，我们需要一个数据结构存储解析后的数据。为什么不直接存储对象？因为spring中可以设置lazy-init=true，从而在真正需要bean对象时才创建；另一个是spring中可以设置bean的scope为prototype，也就是bean不是单例的，每次获取的都是一个新的bean对象。这样就要求我们只能存储bean的数据结构，而不能直接存储bean对象。

bean的数据结构至少要包含：

bean名称
bean的class包路径或class对象
依赖属性
可以定义bean的数据结构BeanDefinition
```
package com.lntea.ioc.beans;

public class BeanDefinition {
    // bean名称
	private String beanName;
	// bean的class对象
	private Class beanClass;
	// bean的class的包路径
	private String beanClassName;
	// bean依赖属性
	private PropertyValues propertyValues = new PropertyValues();
	
	public String getBeanName() {
		return beanName;
	}
	public void setBeanName(String beanName) {
		this.beanName = beanName;
	}
	
	public Class getBeanClass() {
		return beanClass;
	}

	public void setBeanClass(Class beanClass) {
		this.beanClass = beanClass;
	}

	public String getBeanClassName() {
		return beanClassName;
	}

	public void setBeanClassName(String beanClassName) {
		this.beanClassName = beanClassName;
	}

	public PropertyValues getPropertyValues() {
		return propertyValues;
	}

	public void setPropertyValues(PropertyValues propertyValues) {
		this.propertyValues = propertyValues;
	}
	
}
```

其中PropertyValues用来存储依赖属性

```
package com.lntea.ioc.beans;

import java.util.ArrayList;
import java.util.List;

public class PropertyValues {
	private List<PropertyValue> propertyValues = new ArrayList<PropertyValue>();
	
	public void addPropertyValue(PropertyValue propertyValue){
		propertyValues.add(propertyValue);
	}
	
	public List<PropertyValue> getPropertyValues(){
		return this.propertyValues;
	}
}
```

PropertyValue通过键值对记录依赖属性的名称和值或引用

```
package com.lntea.ioc.beans;

public class PropertyValue {
	private final String name;
	private final Object value;
	
	public PropertyValue(String name, Object value) {
		this.name = name;
		this.value = value;
	}
	public String getName() {
		return name;
	}
	public Object getValue() {
		return value;
	}
}
```

定义BeanDefinition读取接口

```
package com.lntea.ioc.xml;

public interface BeanDefinitionReader {
	void loadBeanDefinitions(String location) throws Exception;
}
```

实现xml文件的BeanDefinition读取类XmlBeanDefinitionReader

```
package com.lntea.ioc.xml;

import java.io.InputStream;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;

import com.lntea.ioc.beans.BeanDefinition;
import com.lntea.ioc.beans.BeanDefinitionRegistry;
import com.lntea.ioc.beans.BeanReference;
import com.lntea.ioc.beans.PropertyValue;
import com.lntea.ioc.resource.ResourceLoader;

public class XmlBeanDefinitionReader implements BeanDefinitionReader{
    // BeanDefinition注册到BeanFactory接口
    private BeanDefinitionRegistry registry;
    // 资源载入类
    private ResourceLoader resourceLoader;
    
    public XmlBeanDefinitionReader(BeanDefinitionRegistry registry, ResourceLoader resourceLoader) {
        this.registry = registry;
        this.resourceLoader = resourceLoader;
    }
    
    @Override
    public void loadBeanDefinitions(String location) throws Exception{
    	InputStream is = getResourceLoader().getResource(location).getInputStream();
    	doLoadBeanDefinitions(is);
    }
    
    public BeanDefinitionRegistry getRegistry(){
        return registry;
    }
    
    public ResourceLoader getResourceLoader(){
        return resourceLoader;
    }
}
```
XmlBeanDefinitionReader的构造参数传入资源文件的载入类和BeanDefinition注册接口实现类，用来定位xml文件和注册BeanDefinition，所以在XmlBeanDefinitionReader中实现了Bean的定位，解析和之后的注册。

在loadBeanDefinitions方法中，通过ResourceLoader获取到xml文件的InputStream，完成了定位操作，解析操作转到doLoadBeanDefinitions方法中。
```
protected void doLoadBeanDefinitions(InputStream is) throws Exception {
	DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
	DocumentBuilder builder = factory.newDocumentBuilder();
	Document document = builder.parse(is);
	registerBeanDefinitions(document);
	is.close();
}

protected void registerBeanDefinitions(Document document) {
	Element root = document.getDocumentElement();
	parseBeanDefinitions(root);
}
```
DOM方式解析xml，拿到Document对象，再拿到根节点，转到parseBeanDefinitions解析具体的 <beans> 信息
```
protected void parseBeanDefinitions(Element root) {
	NodeList nodeList = root.getChildNodes();
	for (int i = 0; i < nodeList.getLength(); i++) {
		Node item = nodeList.item(i);
		if(item instanceof Element){
			Element ele = (Element)item;
			processBeanDefinition(ele);
		}
	}
}

protected void processBeanDefinition(Element ele) {
	String name = ele.getAttribute("id");
	String className = ele.getAttribute("class");
	if(className==null || className.length()==0){
		throw new IllegalArgumentException("Configuration exception: <bean> element must has class attribute.");
	}
	if(name==null||name.length()==0){
		name = className;
	}
	BeanDefinition beanDefinition = new BeanDefinition();
	beanDefinition.setBeanClassName(className);
	processBeanProperty(ele,beanDefinition);
	getRegistry().registerBeanDefinition(name, beanDefinition);
}
```
遍历<beans>下的每一个<bean>节点，获取属性id和class的值，分别对应BeanDefinition的beanName和BeanClassName。然后解析依赖属性<property>标签：

```
protected void processBeanProperty(Element ele, BeanDefinition beanDefinition) {
		NodeList childs = ele.getElementsByTagName("property");
		for (int i = 0; i < childs.getLength(); i++) {
			Node node = childs.item(i);
			if(node instanceof Element){
				Element property = (Element)node;
				String name = property.getAttribute("name");
				String value = property.getAttribute("value");
				if(value!=null && value.length()>0){
					beanDefinition.getPropertyValues().addPropertyValue(new PropertyValue(name, value));
				}else{
					String ref = property.getAttribute("ref");
					if(ref==null || ref.length()==0){
						throw new IllegalArgumentException("Configuration problem: <property> element for "+
								name+" must specify a value or ref.");
					}
					BeanReference reference = new BeanReference(ref);
					beanDefinition.getPropertyValues().addPropertyValue(new PropertyValue(name, reference));
				}
			}
		}
	}
```    
如果<property>中存在value属性，则作为String类型存储，如果是ref属性，则创建BeanReference对象存储。
```
package com.lntea.ioc.beans;

public class BeanReference {
	private String ref;

	public BeanReference(String ref) {
		this.ref = ref;
	}

	public String getRef() {
		return ref;
	}
	
}
```
最后注册BeanDefinition到存储BeanDefinition的地方，我们可以猜测肯定有一个Map<String,BeanDefinition>。
```
getRegistry().registerBeanDefinition(name, beanDefinition);
```
# 3. 注册
上面的getRegistry()获得的就是XmlBeanDefinitionReader构造时传入的BeanDefinitionRegistry实现类。首先BeanDefinitionRegistry是个接口。
```
package com.lntea.ioc.beans;

public interface BeanDefinitionRegistry {

    void registerBeanDefinition(String beanName, BeanDefinition beanDefinition);
}
```
它只定义了一个方法，就是注册BeanDefinition。它的实现类就是要实现这个方法并将BeanDefinition注册到Map<String,BeanDefinition>中。在这里这个实现类是DefaultListableBeanFactory。
```
public class DefaultListableBeanFactory extends AbstractBeanFactory implements ConfigurableListableBeanFactory,BeanDefinitionRegistry{

    private Map<String, BeanDefinition> beanDefinitionMap = new ConcurrentHashMap<String, BeanDefinition>();
    private List<String> beanDefinitionNames = new ArrayList<String>();
    
    public void registerBeanDefinition(String beanName,BeanDefinition beanDefinition){
        beanDefinitionMap.put(beanName, beanDefinition);
        beanDefinitionNames.add(beanName);
    }
}
```
可以看出它包含一个beanDefinitionMap 和 beanDefinitionNames，一个记录beanName和BeanDefinition的关系，一个记录所有BeanName。而registerBeanDefinition方法就是将BeanDefinition添加到beanDefinitionMap和beanDefinitionNames。

# 4.获取Bean
DefaultListableBeanFactory实现了ConfigurableListableBeanFactory接口，而ConfigurableListableBeanFactory继承了BeanFactory接口。BeanFactory是一个顶级接口。
```
package com.lntea.ioc.factory;

public interface BeanFactory {
    
	Object getBean(String beanName);
}
```
它定义了获取bean对象的接口方法，实现这个方法的是AbstractBeanFactory抽象类。
```
public abstract class AbstractBeanFactory implements ConfigurableListableBeanFactory {
	private Map<String, Object> singleObjects = new ConcurrentHashMap<String, Object>();
	
	@Override
    public Object getBean(String beanName){
	    Object singleBean = this.singleObjects.get(beanName);
	    if(singleBean != null){
	        return singleBean;
	    }
	    
        BeanDefinition beanDefinition  = getBeanDefinitionByName(beanName);
        if(beanDefinition==null){
            throw new RuntimeException("bean for name '"+beanName+"' not register.");
        }
        
        singleBean = doCreateBean(beanDefinition);
        this.singleObjects.put(beanName, singleBean);
        return singleBean;
    }
    
    protected abstract BeanDefinition getBeanDefinitionByName(String beanName);
}
```
AbstractBeanFactory中定义了单实例(Demo默认都是单实例的bean)的beanName和bean对象关系的singleObjects的Map。getBean方法传入beanName，先查询singleObjects有没有beanName的缓存，如果存在，直接返回；如果不存在则调用getBeanDefinitionByName获取BeanDefinition，getBeanDefinitionByName由AbstractBeanFactory的子类实现，也就是DefaultListableBeanFactory。
```
@Override
protected BeanDefinition getBeanDefinitionByName(String beanName) {
    return beanDefinitionMap.get(beanName);
}
```
拿到BeanDefinition后，进入真正创建bean的方法doCreateBean。
```
protected Object doCreateBean(BeanDefinition beanDefinition){
	Object bean = createInstance(beanDefinition);
	applyPropertyValues(bean,beanDefinition);
	return bean;
}
```
它做了两个操作，一个是创建bean对象，另一个是注入依赖属性。
```
protected Object createInstance(BeanDefinition beanDefinition) {
    try {
	    if(beanDefinition.getBeanClass() != null){
            return beanDefinition.getBeanClass().newInstance();
	    }else if(beanDefinition.getBeanClassName() != null){
	        try {
                Class clazz = Class.forName(beanDefinition.getBeanClassName());
                beanDefinition.setBeanClass(clazz);
                return clazz.newInstance();
            } catch (ClassNotFoundException e) {
                throw new RuntimeException("bean Class " + beanDefinition.getBeanClassName() + " not found");
            }
	    }
    } catch (Exception e) {
        throw new RuntimeException("create bean " + beanDefinition.getBeanName() + " failed");
    } 
    throw new RuntimeException("bean name for " + beanDefinition.getBeanName() + " not define bean class");
}
```
通过Class.forName加载bean的Class对象，再通过Class的newInstance方法生成bean对象。
```
protected void applyPropertyValues(Object bean, BeanDefinition beanDefinition){
    for(PropertyValue propertyValue : beanDefinition.getPropertyValues().getPropertyValues()){
        String name = propertyValue.getName();
        Object value = propertyValue.getValue();
        if(value instanceof BeanReference){
            BeanReference reference = (BeanReference) value;
            value = getBean(reference.getRef());
        }
        try {
            Method method = bean.getClass().getDeclaredMethod("set"+name.substring(0, 1).toUpperCase()+
                    name.substring(1), value.getClass());
            method.setAccessible(true);
            method.invoke(bean, value);
        } catch(Exception e){
            try {
                Field field = bean.getClass().getDeclaredField(name);
                field.setAccessible(true);
                field.set(bean, value);
            } catch (Exception e1) {
                throw new RuntimeException("inject bean property " + name + " failed");
            } 
        }
    }
}
```
如果依赖属性是对象的话，通过getBean获取或生成依赖对象，并通过反射注入到bean对象中，这也就是依赖注入。

至此，Bean的创建和获取就完成了。

5. ApplicationContext
在我们日常使用spring时，一般不会直接用BeanFactory，而是通过一个更加高级的接口ApplicationContext来初始化容器以及提供其他企业级的功能。在我们的简易IOC容器中，通过ApplicationContext来实例化所有的bean。
```
package com.lntea.ioc.context;

import com.lntea.ioc.factory.BeanFactory;

public interface ApplicationContext extends BeanFactory{
	
}
```
ApplicationContext没有提供其他功能，只是继承了BeanFactory。

来看ApplicationContext的一个最终实现类ClasspathXmlApplicationContext。
```
package com.lntea.ioc.context;

import com.lntea.ioc.beans.BeanDefinitionRegistry;
import com.lntea.ioc.resource.ResourceLoader;
import com.lntea.ioc.xml.XmlBeanDefinitionReader;

public class ClasspathXmlApplicationContext extends AbstractApplicationContext {
	private String location;
	
	public ClasspathXmlApplicationContext(String location) {
		this.location = location;
		try {
			refresh();
		} catch (Exception e) {
			e.printStackTrace();
		}
	}
}
```
ClasspathXmlApplicationContext的构造函数里接收传入xml资源文件的路径location,再调用refresh方法。refresh方法在AbstractApplicationContext抽象类中实现。
```
package com.lntea.ioc.context;

import com.lntea.ioc.beans.BeanDefinitionRegistry;
import com.lntea.ioc.factory.ConfigurableListableBeanFactory;
import com.lntea.ioc.factory.DefaultListableBeanFactory;

public abstract class AbstractApplicationContext implements ApplicationContext{
	private ConfigurableListableBeanFactory beanFactory;
	
	@Override
    public Object getBean(String beanName) {
        return beanFactory.getBean(beanName);
    }
	
	public void refresh() throws Exception{
	    DefaultListableBeanFactory beanFactory = new DefaultListableBeanFactory();
		loadBeanDefinitions(beanFactory);
		this.beanFactory = beanFactory;
		onRefresh();
	}
	
	protected void onRefresh() throws Exception {
		beanFactory.preInstantiateSingletons();
	}

	protected abstract void loadBeanDefinitions(BeanDefinitionRegistry registry) throws Exception;
}
```
refresh方法先创建一个DefaultListableBeanFactory，然后通过loadBeanDefinitions解析并注册bean，真正的实现在ClasspathXmlApplicationContext中。
```
@Override
protected void loadBeanDefinitions(BeanDefinitionRegistry registry) throws Exception {
	XmlBeanDefinitionReader reader = new XmlBeanDefinitionReader(registry, new ResourceLoader());
	reader.loadBeanDefinitions(location);
}
```
就是通过XmlBeanDefinitionReader来处理，这在上面已经详细的讲过了，就不再赘述了。

refresh方法中最后调用onRefresh方法，初始化所有bean实例。
```
protected void onRefresh() throws Exception {
	beanFactory.preInstantiateSingletons();
}
```
实际调用的是DefaultListableBeanFactory，方法定义在ConfigurableListableBeanFactory接口中。
```
package com.lntea.ioc.factory;

public interface ConfigurableListableBeanFactory extends BeanFactory{

    void preInstantiateSingletons() throws Exception;
}
```
DefaultListableBeanFactory的实现
```
public void preInstantiateSingletons() throws Exception{
    for(String beanName : beanDefinitionNames){
        getBean(beanName);
    }
}
```
这样在我们需要bean对象时，就可以直接拿到实例化好的对象。还记得之前定义的Company和Employee以及company-ioc.xml吗，我们写个测试：
```
package com.lntea.test;

import com.lntea.ioc.context.ApplicationContext;
import com.lntea.ioc.context.ClasspathXmlApplicationContext;
import com.lntea.test.bean.Company;

public class CompanyApplicationContext {

    public static void main(String[] args) {
        ApplicationContext context = new ClasspathXmlApplicationContext("company-ioc.xml");
        Company company = (Company) context.getBean("company");
        company.open();
    }
}
```
可以看出与真正的spring的使用方式一致，执行结果如下。

Company Apple is open.
Employee Jack is working.

# 6.总结
以上我们构建了一个非常简单的IOC容器，但是实现的功能确是IOC容器最核心的DI(依赖注入)。在此基础上，spring建立起完善的企业级的IOC容器以及同样重要的AOP功能。老子《道德经》有云：“合抱之木，生于毫末；九层之台，起于垒土；千里之行，始于足下。”。当我们理解了spring的基础，再去学习spring的源码，自然要事半功倍。后面的文章我们将真正学习spring的源码，领略spring源码的美妙。