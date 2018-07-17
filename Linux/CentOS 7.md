# Linux Centos7关闭防火墙及关闭开机启动防火墙

1、直接关闭防火墙
```
systemctl stop firewalld.service
```

2、禁止firewall开机启动
```
systemctl disable firewalld.service
```