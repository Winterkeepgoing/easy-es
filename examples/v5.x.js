'use strict';

const easyES = require('easy-es');

// 在5.x版本中,一个index可以有多个type,如果使用场景只有1个index，并且其中有多个type，
// 那么创建实例的时候推荐直接指定index，以后的请求默认都会使用这个index
// 如果创建index和type是一对一的关系，采用6.x的样例比较合适
// 无论什么版本，utils下的方法都是一致的
const client = new easyES('user:password@192.168.1.1:9200', '5.3', 'index');

// -------一个简单的查询-------
const should = [], filter = [];
client.utils.addTerm(filter, 'gender', 'male');
client.utils.addRange(filter, 'reward', 300000000, 1500000000);
client.utils.addMatch(should, 'name', 'Monkey');

const body = client.utils.createBody(should, filter);
const source = ['name'];
// 获取前十个结果
const result = await client.search('type', body, 10, 0, source);


// -------一个简单的聚合----------
const agg = client.utils.createTermsAggs('gender');
const body = client.utils.createBody(should, filter, agg);

const result = await client.search('type', body);


// -------带timeZone的时间聚合------------
const dateHistogramAggs = client.utils.createDateHistogramAggs('birthday', 'year', 'yyyy', null, null, '+08:00');
const body = client.utils.createBody(should, filter, dateHistogramAggs);

const result = await client.search('type', body);

// -------其他的部分body组成方法
client.utils.addMatchPhrase(should, 'title', '王千源', 1, 'ik_smart');
client.utils.addWildcard(should, 'keyword', '*时尚芭莎*');
client.utils.addRegexp(should, 'keyword', '*时尚芭莎*');
client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5, 'ik_smart');

// -------其他的部分请求方法样例------------
const result = await client.get('type', 'id');
const result = await client.update('type', 'id', {download_times: 0});
const result = await client.increase('type', 'id', 'views', 10);
const result = await client.count('type', body);
