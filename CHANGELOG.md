# 发布历史

### v3.0.0 / `2020-04-05`
1. 依赖库切换成`elastic/elasticsearch`
2. 改变实例化的方式
    ```js
    const easyES = require('easy-es')
    // old
    const oldClient = new easyES('host', 'version');
    // new  
    // config 除了官方的配置项外，多了version,可选的值为['5.x', '6.x', '7.x']
    const config = {node: 'http://127.0.0.1:6800', version: '6.x'};
    const newClient = easyES(config); 
    ```
3. 5.x和6.x的client新增setIndex方法,取代之前new的时候直接参数指定index，其他方法和之前版本兼容
   推荐在client在发送请求的时候，index作为参数传入
    ```js
    const oldClient = new easyES('127.0.0.1:6800', '5.3','index');
    //上面等于下面的
    const config = {node: 'http://127.0.0.1:6800', version: '5.x'};
    const newClient = easyES(config); 
    newClient.setIndex('index');
    ```
3. 支持elasticsearch7.x
    ```js
    const config = {node: 'http://elastic:changeme@127.0.0.1:6800', version: '7.x'};
    const newClient = easyES(config); 
    // 无setIndex方法,在client在发送请求的时候，index作为参数传入
    await newClient.get('index', 'id');
    ```

### v2.0.1 / `2020-03-30`
1. 之前的版本addQueryString方法，在不指定analyzer时候，默认使用'ik_smart'，调整为只有指定analyzer才设置该参数（只有这个方法和之前版本不兼容)
    ```js
    //版本更新后 下面的两种实现的效果是一样的
    // v1.0.3版本
    client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5);
    // v2.0.0版本
    client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5, 'ik_smart');
    ```
2. search方法from参数优化，不指定或者指定为null的时候为0，其他为指定值
3. increase方面interval参数优化，不指定或者指定为null的时候为1，其他为指定值
4. delete和create方法，对应es5.x和6.x版本都返回Boolean类型

### v1.0.0 / `2019-11-07`
1. client功能包含了get、search、update、increase、count、deleteMulti、updateMulti、getConstantScore
2. utils功能包含了createBody、addMatchPhrase、addMatch、addQueryString、addRange、addTerms、addTerm

