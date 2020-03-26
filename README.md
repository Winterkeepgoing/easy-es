
基于Elasticsearch进行二次封装，大幅简化查询条件的构建，以及发送相应请求

### Install
```shell
$ npm install easy-es --save
```

### Usage
[API文档请参考](https://easy-es.ibrightfactory.com/) 

### Supported Elasticsearch Versions
6.x, 6.2, 6.1, 6.0, 5.6, 5.5, 5.4, 5.3, 5.2, 5.1, 5.0

### Examples
```js
// 6.x
// 其他版本样例请参考examples路径下的相应文件
const easyES = require('easy-es');
const client = new easyES('user:password@192.168.1.1:9200', '6.x');

// -------一个简单的查询-------
const should = [], filter = [];
// 无论什么版本，utils下的方法都是一致的
client.utils.addTerm(filter, 'gender', 'male');
client.utils.addRange(filter, 'reward', 300000000, 1500000000);
client.utils.addMatch(should, 'name', 'Monkey');

const body = client.utils.createBody(should, filter);

const source = ['name'];
// 获取前10个检索结果
const result = await client.search('type', body, 10, 0, source ,'index');

// -------一个简单的聚合-------
const agg = client.utils.createTermsAggs('gender');
const body = client.utils.createBody(should, filter, agg);
const result = await client.search('type', body, 0, 0, null, 'index');

// -------带timeZone的时间聚合-------
const dateHistogramAggs = client.utils.createDateHistogramAggs('birthday', 'year', 'yyyy', null, null, '+08:00');
const body = client.utils.createBody(should, filter, dateHistogramAggs);

const result = await client.search('type', body, 0, 0, null, 'index');

```

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

