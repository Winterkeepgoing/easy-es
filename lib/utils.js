'use strict';

/**
 * @fileOverview
 * Global下的方法用于构建查询的body
 * EasyES下的方法用于对构建好的参数执行查询、更新、统计等请求
 */

/**
 * 生成body,所有参数都非必填
 * @param should{Array<Object>} body的should条件,类型为数组
 * @param filter{Array<Object>} body的filter条件,类型为数组
 * @param aggs{Object} body的聚合查询条件,类型为object
 * @param must{Array<Object>} body的聚合查询条件,类型为数组
 * @param mustNot{Array<Object>} body的聚合查询条件,类型为数组
 * @param sort{Array} body的排序条件,类型为数组,默认按照评分降序
 */
exports.createBody = (should = [], filter = [], aggs = null, must = [], mustNot = [], sort = []) => {
  let body = new Object({
    'query': {
      'bool': {
        'must': must,
        'must_not': mustNot,
        'should': should,
        'filter': filter,
      },
    },
  });
  if (sort && sort.length > 0) {
    body.sort = sort;
  }

  if (aggs && Object.prototype.toString.call(aggs) === '[object Object]') {
    body.aggs = aggs;
  }
  return body;
};

/**
 * 生成Terms Aggregation聚合子语句
 * @param field{string} 聚合的字段 有点像group的意思 必填
 * @param orderBy{Object} 类型为object,可选的key为_count、_term。排序为desc或者asc,默认_count、desc
 * @param minDocCount{Number} 要显示的最小的结果数 非必填 默认是0，即统计的结果是0，对应的可以也显示
 */
exports.createTermsAggs = (field, orderBy, minDocCount) => {
  //order 可选的有_count、_term
  let termAggs = new Object({
    'result': {
      'terms': {
        'field': field,
        'size': 100000,
        'order': orderBy || {
          '_count': 'desc',
        },
      },
    },
  });

  if (minDocCount || minDocCount === 0) {
    termAggs.result.terms.min_doc_count = minDocCount;
  }

  return termAggs;
};

/**
 * 生成Date Histogram Aggregation聚合子语句
 * @param field{string} 必填 聚合的时间字段
 * @param interval{string} 必填 聚合的间隔,可以是year, quarter, month, week, day, hour, minute, second,2d,24h,90m
 * @param format{string} 必填 聚合结果key(时间)的格式
 * @param orderBy{Object}，非必填 类型为object,可选的key为_key、_term。排序为desc或者asc,默认_key、asc
 * @param extendedBounds{Object} 非必填 类型为object 定义实际没有的数据,也要现实key的开始和结束范围,object的key为min和max
 * 默认按照key的升序
 * @param timeZone{string} 非必填 时区，比如'+08:00'
 */
exports.createDateHistogramAggs = (field, interval, format, orderBy, extendedBounds, timeZone) => {

  // interval: year, quarter, month, week, day, hour, minute, second,2d,24h,90m
  // 参照https://www.elastic.co/guide/en/elasticsearch/reference/5.3/common-options.html#time-units
  // order: _key、_term
  // format:  "yyyy-MM-dd"
  // https://www.elastic.co/guide/en/elasticsearch/reference/5.3/mapping-date-format.html
  //extendedBounds{
  //           'min': '1991',
  //           'max': '2019'
  //         }
  let aggs = new Object({
    'result': {
      'date_histogram': {
        'field': field,
        'interval': interval,
        'order': orderBy || {
          '_key': 'asc',
        },
        'format': format,
        'min_doc_count': 0,
      },
    },
  });

  if (timeZone) {
    aggs.result.date_histogram.time_zone = timeZone;
  }

  if (extendedBounds && Object.prototype.toString.call(extendedBounds) === '[object Object]') {
    aggs.result.date_histogram.extended_bounds = extendedBounds;
  }
  return aggs;
};

/**
 * 添加match_phrase条件
 * 主要用于短语的完全匹配
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段
 * @param value{string} 必填 检索的value
 * @param boost{number} 非必填 检索的权重,默认为1
 * @param analyzer{string} 非必填 对检索的value采用的分析器、默认和创建数据的时候保持一致
 */
exports.addMatchPhrase = (destination, field, value, boost = 1, analyzer = null) => {
  let matchPhrase =
    {
      'match_phrase': {
        [field]: {
          query: value,
          boost: boost,
        },
      },
    };
  if (analyzer) {
    matchPhrase.match_phrase[field].analyzer = analyzer;
  }
  destination.push(matchPhrase);
};

/**
 * 添加match条件
 * 用于全部匹配、而不在乎是否被分词
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段,类型的为字符串
 * @param value 必填 检索的value
 * @param matchPercent{string} 非必填 检索匹配的满足的百分比,类型为字符串,比如"100%"、"75%"
 * @param operator{string} 非必填 检索的满足条件,or代表满足其中一个就行，and代表是必须全部满足，默认为or
 * @param boost{number} 非必填 检索的权重,默认为1
 */
exports.addMatch = (destination, field, value, matchPercent, operator = 'or', boost = 1) => {
  let match =
    {
      'match': {
        [field]: {
          query: value,
          operator: operator,
          boost: boost,
        },
      },
    };
  if (matchPercent) {
    match.match[field].minimum_should_match = matchPercent;
  }
  destination.push(match);
};

/**
 * 添加query_string条件
 * 可以用于多词匹配
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param fieldArray{Array<string>} 必填 查询的字段,类型的为字符串
 * @param value 必填 检索的value
 * @param operator{string} 非必填 检索的满足条件,OR代表满足其中一个就行，AND代表是必须全部满足，默认为or
 * @param boost{number} 非必填 检索的权重
 * @param analyzer{string} 非必填 对检索的value采用的分析器、默认和创建数据的时候保持一致
 */
exports.addQueryString = (destination, fieldArray, value, operator = 'AND', boost, analyzer) => {
  let queryString =
    {
      'query_string': {
        fields: fieldArray,
        query: this.escape(value),
        'auto_generate_phrase_queries': true,
        'default_operator': operator,
        'use_dis_max': true,
      },
    };

  if (boost) {
    queryString.query_string.boost = boost;
  }
  if (analyzer) {
    queryString.query_string.analyzer = analyzer;
  }

  destination.push(queryString);
};

/**
 * 添加wildcard查询条件，通常用于not analyzed字段上
 * 可以用于多词匹配
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段,类型的为字符串
 * @param value 必填 检索的value
 * @param boost{number} 非必填 检索的权重,默认为1
 */
exports.addWildcard = (destination, field, value, boost = 1) => {
  let wildcard =
    {
      'wildcard': {
        [field]: {
          value: value,
          boost: boost,
        },
      },
    };
  destination.push(wildcard);
};

/**
 * 添加regexp查询条件，通常用于not analyzed字段上
 * 可以用于多词匹配
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段,类型的为字符串
 * @param value 必填 正则表达式字符串
 * @param boost{number} 非必填 检索的权重,默认为1
 */
exports.addRegexp = (destination, field, value, boost = 1) => {
  let regexp =
    {
      'regexp': {
        [field]: {
          value: value,
          boost: boost,
        },
      },
    };
  destination.push(regexp);
};

/**
 * 把生成好的filter查询条件转换成constant_score查询条件
 * @param origin{Array<Object>} 必填 创建好的filter查询条件,类型的为数组
 */
exports.getConstantScore = (origin) => {
  let result = [];
  origin.forEach(item => {
    let data =
      {
        'constant_score': {
          'filter': {},
          'boost': 1,
        },
      };

    data.constant_score.boost = getBoost(item);
    data.constant_score.filter = item;
    result.push(data);
  });

  return result;
};

/**
 * 添加range条件
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段,类型的为字符串
 * @param gte 非必填 大于等于
 * @param lte 非必填 小于等于
 * @param gt 非必填 大于
 * @param lt 非必填 小于
 * @param boost{number} 非必填 检索的权重,默认为1
 * 4个条件至少填一个
 */
exports.addRange = (destination, field, gte, lte, gt, lt, boost = 1) => {
  let range =
    {
      'range': {
        [field]: {
          boost: boost,
        },
      },
    };
  if (gte || gte === 0) {
    range.range[field].gte = gte;
  }

  if (lte || lte === 0) {
    range.range[field].lte = lte;
  }
  if (gt || gt === 0) {
    range.range[field].gt = gt;
  }

  if (lt || lt === 0) {
    range.range[field].lt = lt;
  }
  destination.push(range);
};

/**
 * 添加terms条件
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段
 * @param value{Array} 必填 检索的value,类型为数组
 * @param boost{number} 非必填 检索的权重,默认为1
 */
exports.addTerms = (destination, field, value, boost = 1) => {
  let terms =
    {
      'terms': {
        [field]: value,
        'boost': boost,
      },
    };

  destination.push(terms);
};

/**
 * 添加term条件
 * @param destination{Array<Object>} 必填、要添加到的数组，类型为数组
 * @param field{string} 必填 查询的字段
 * @param value 必填 检索的value'
 * @param boost{number} 非必填 检索的权重,默认为1
 */
exports.addTerm = (destination, field, value, boost = 1) => {
  let term =
    {
      term: {
        [field]: {
          value: value,
          boost: boost,
        },
      },
    };

  destination.push(term);
};

/**
 * 对QueryString 方法不支持的特殊字符 ({}[]^/进行转义
 * @param value{string} 要被转义的字符串
 */
exports.escape = (value) => {
  return value.replace(/[(){}[\]^\/]/g, (match) => {
    return '\\' + match;
  });
};

/**
 * 获取查询条件的boost值
 * @param object{Object} 查询条件
 */
function getBoost(object) {
  for (let key in object) {
    if (object.hasOwnProperty(key)) {
      if (key === 'boost') {
        return object.boost;
      } else {
        if (Object.prototype.toString.call(object[key]) === '[object Object]') {
          return getBoost(object[key]);
        }
      }
    }
  }
  return -1;
}