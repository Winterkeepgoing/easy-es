'use strict';

const easyES = require('..');
const client = new easyES('121.40.33.99:9200', '5.3', 'dtwave_trends');

let should = [], filter = [], must = [], mustNot = [], sort = [];

client.utils.addMatchPhrase(should, 'title', '苏芒', 1, 'ik_smart');
client.utils.addRange(filter, 'issue_time', 730915200, 891359999);
client.utils.addTerms(filter, 'type.keyword', ['封面', '文章']);
client.utils.addQueryString(should, ['abstract'], '衬衫 白色', 'AND', 5);
// client.utils.addWildcard(should, 'magazine_keywords.keyword', '*时尚芭莎,总第391期,2016-7B*');

let termsAggs = client.utils.createTermsAggs('belong_company');
let dateHistogramAggs = client.utils.createDateHistogramAggs('issue_time_date', 'year', 'yyyy');

// let body = client.utils.createBody(should, filter, dateHistogramAggs);
let body = client.utils.createBody(should, filter);

console.log('body', JSON.stringify(body, null, '\t'));

exports.test = async () => {
  // let result = await client.delete('magazine_article',5);
  let result = await client.search('magazine_article', body, 0);
  // let result = await client.get('magazine_article', '38ea1f93528ae588ba92b1668eb7e37c');
  // let result = await client.update('magazine_article', '38ea1f93528ae588ba92b1668eb7e37c', {download_times: '0'});
  // let result = await client.increase('magazine_article', '38ea1f93528ae588ba92b1668eb7e37c', 'download_times', 10);
  // let result = await client.count('magazine_article', body);

  console.log('result', JSON.stringify(result, null, '\t'));
};

// console.log('body', JSON.stringify(body, null, '\t'));
this.test();


