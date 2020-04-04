
基于Elasticsearch进行二次封装，大幅简化查询条件的构建，以及发送相应请求

### Install
```shell
$ npm install easy-es --save
```
### Changes
* 依赖库切换为`elastic/elasticsearch`
* 支持elasticsearch`7.x`
* 改变实例化的方式
* 对应elasticsearch`5.x和6.x`取消实例化时指定`index`,改用`setIndex`替代

### Usage
* [v3.0.0 文档](https://easy-es.ibrightfactory.com/v3.0.0/) 
* [v2.0.1 文档](https://easy-es.ibrightfactory.com/v2.0.1/)

### Supported Elasticsearch Versions
* `5.x`
* `6.x`
* `7.x`

### Examples
```js
// 更多的样例请参考examples路径下的相应文件
const easyES = require('easy-es');
const config = {node: 'http://elastic:changeme@127.0.0.1:9200', version: '7.x'};
const client = easyES(config);

// 构建查询的body
const should = [], filter = [];
client.utils.addTerm(filter, 'gender', 'male');
client.utils.addRange(filter, 'reward', 300000000, 1500000000);
client.utils.addMatch(should, 'name', 'Monkey');

const body = client.utils.createBody(should, filter);

const source = ['name'];
// 获取前10个检索结果
const result = await client.search('index', body, 10, 0, source);
```
声明时的config的参数除了[官方的配置](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/client-configuration.html)之外，多了version的参数，支持的值为'5.x', '6.x', '7.x'。

### Something you need to know

查询body的基本结构如下,easy-es在此基础上进行查询条件的构建，must、must_not、should的值也可以是object(二级的bool条件)
```json
{
	"query": {
		"bool": {
			"must": [],
			"must_not": [],
			"should": [],
			"filter": []
		}
	},
	"sort": [],
	"aggs": {}
}
```

