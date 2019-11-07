### easy-es

1. 支持elasticsearch的版本为5.3-6.8

### Install

```shell
$ npm i easy-es --save
```

### Usage
[API文档请参考](https://github.com/Winterkeepgoing/easy-es/doc/index.html) 

实例化
```js
const easyES = require('easy-es');
const client = new easyES('user:password@192.168.91.1:9200', '_defualt','index');
```

### 构建子查询条件
目前支持的utils方法如下

```js
let should = [], filter = [], must = [], mustNot = [], sort = [];

client.utils.addMatchPhrase(should, 'title', '王千源', 1, 'ik_smart');
client.utils.addMatch(should, 'title', '王千源');
client.utils.addRange(filter, 'issue_time', 951840000, 1548950399);
client.utils.addTerms(filter, 'type.keyword', ['封面', '文章']);
client.utils.addTerm(filter, 'type.keyword', '封面');
client.utils.createTermsAggs('belong_company');
client.utils.addWildcard(should, 'magazine_keywords.keyword', '*时尚芭莎,总第391期,2016-7B*');
client.utils.addRegexp(should, 'magazine_keywords.keyword', '*时尚芭莎,总第391期,2016-7B*');
client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5);
let dateHistogramAggs = client.utils.createDateHistogramAggs('issue_time_date', 'year', null, 'yyyy');

```

### 构建查询body

```js
let body = client.utils.createBody(should, filter);
 body = client.utils.createBody(should, filter, dateHistogramAggs);
```

### 执行查询的样例

```js
  let result = await client.search('magazine_article', body, 2, 0);
  result = await client.get('magazine_article', '34');
  result = await client.update('magazine_article', '25',{download_times:"0"});
  result = await client.increase('magazine_article', '23','download_times',10);
  result = await client.count('magazine_article',body);
```

