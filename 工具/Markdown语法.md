# 标题

`faunjoe`

*faunjoe*

**faunjoe**


[百度](http://www.baidu.com)

- faunjoe1
- faunjoe2
- faunjoe3

高亮 java

```java
public class MainMyBatis {

    public static void main(String[] args) throws Exception {

        Dept dept = new Dept();
        dept.setDname("faunjoe");
        dept.setLoc("北京");

        InputStream is = Resources.getResourceAsStream("MyBatis-config.xml");
        SqlSessionFactory factory = new SqlSessionFactoryBuilder().build(is);
        SqlSession session = factory.openSession();
        session.insert("insertDept",dept);
        session.commit();
        session.close();
    }
}
```

>人生的磨难是很多的，所以我们不可对于每一件轻微的伤害都过于敏感。在生活磨难面前，精神上的坚强和无动于衷是我们抵抗罪恶和人生意外的最好武器。 —— 洛克


![测试图片](../image/test/meinv.jpg)



