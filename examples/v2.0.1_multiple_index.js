'use strict';

const easyES = require('easy-es');

// 在5.x版本中,一个index可以有多个type,如果使用场景只有1个index，并且其中有多个type，
// 那么创建实例的时候推荐直接指定index，以后的请求默认都会使用这个index
// 如果创建index和type是一对一的关系，在查询的时候指定index比较合适
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
const result = await client.search('type', body, 10, 0, source, 'index');

// -------一个简单的聚合-------
const agg = client.utils.createTermsAggs('gender');
const body = client.utils.createBody(should, filter, agg);
const result = await client.search('type', body, 0, 0, null, 'index');

// -------带timeZone的时间聚合-------
const dateHistogramAggs = client.utils.createDateHistogramAggs('birthday', 'year', 'yyyy', null, null, '+08:00');
const body = client.utils.createBody(should, filter, dateHistogramAggs);

const result = await client.search('type', body, 0, 0, null, 'index');

// -------一些其他的请求方法样例------------
await client.get('type', 'id', source, 'index');
await client.update('type', 'id', {download_times: 0}, 'index');
await client.increase('type', 'id', 'views', 10, null, 'index');
await client.count('type', body, 'index');
