- 分转元 小数点后2位
```
private longToYuan(amount: number) {
    let yuan: number = amount / 100;
    return yuan.toFixed(2);
}
```

