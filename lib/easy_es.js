'use strict';
const elasticsearch = require('elasticsearch');
const utils = require('./utils');

/**
 * deprecated 已经被遗弃了
 * 封装了elasticsearch的方法，主要是对构建好的参数执行查询、更新、统计、插入、删除等请求
 */
class EasyES {

  /**
   * 初始
   * @param host{host} 必填
   * @param version{version}  必填
   * @param index{string}   非必填,5.x推荐指定index,以后调用的时候就不用一直传入这个参数
   */
  constructor(host, version, index) {
    this.client = new elasticsearch.Client({
      host: host,
      apiVersion: version,
    });
    this.index = index;
    this.utils = utils;
  }

  /**
   * 根据id查询一条记录
   * @param type{string}      必填
   * @param id{string} 文档id  必填
   * @param source{array} 指定获取的字段   非必填
   * @param index{string}     非必填
   */
  async get(type, id, source, index) {

    let opt = {
      index: index || this.index,
      type: type,
      id: id,
    };

    if (source) {
      opt._source = source;
    }

    let {_source} = await this.client.get(opt);
    return _source;
  }

  /**
   * 根据条件进行检索
   * @param type{string}               必填
   * @param body{Object} 检索查询的body  必填
   * @param size{int} 查询返回的条数   非必填 null的时候默认10条数据
   * @param from{int} 查询开始位置     非必填 默认0
   * @param source{Array<string>} 结果展示的字段  非必填 默认全部
   * @param index{string}  非必填
   * @param options{Object} 非必填 SearchParams
   */
  async search(type, body, size, from, source, index, options = {}) {
    let opt = {
      index: index || this.index,
      type: type,
      body: body,
      from: from || 0,
      ...options,
    };

    if (size || size === 0) {
      opt.size = size;
    }

    if (source) {
      opt._source = source;
    }

    //如果是聚合查询就不需要显示查询符合的数据
    if (Object.prototype.toString.call(body.aggs) === '[object Object]') {
      opt._source = false;
    }

    let {hits, aggregations} = await this.client.search(opt);

    if (opt._source === false) {
      //如果是聚合查询
      return aggregations.result.buckets;
    } else {
      return hits;
    }
  }

  /**
   * 根据id更新一条数据
   * @param type{string}           必填
   * @param id{string}             必填
   * @param doc{Object}   更新的内容   必填
   * @param index{string}         非必填
   */
  async update(type, id, doc, index) {
    // 更新的内容和原有的内容相同的时候，successful为0
    let opt = {
      index: index || this.index,
      type: type,
      id: id,
      body: {doc: doc},
    };

    let {result, _shards} = await this.client.update(opt);
    return (result === 'updated' && _shards.successful > 0) || (result === 'noop' && _shards.failed === 0);
  }

  /**
   * 字段值递增
   * @param type{string}               必填
   * @param id{string}                 必填
   * @param field{string} 递增的字段     必填
   * @param interval{int} 递增的间距 默认为1 类型为数字
   * @param lang{string}    script采用的语言 5.0以后默认painless
   * @param index{string}    非必填
   */
  async increase(type, id, field, interval, lang, index) {
    let opt = {
      index: index || this.index,
      type: type,
      id: id,
      body: {
        script: {
          inline: `
                if (ctx._source.${field} == null) {
                  ctx._source.${field} = params.interval;
                } else if(ctx._source.${field} instanceof String){
                  ctx._source.${field} =  Integer.parseInt(ctx._source.${field}) + params.interval;
                } else {
                  ctx._source.${field} += params.interval;
                }`,
          params: {
            interval: interval || (interval === 0 ? 0 : 1),
          },
        },
      },
    };

    if (lang) {
      opt.body.script.lang = lang;
    }

    let {result, _shards} = await this.client.update(opt);
    return (result === 'updated' && _shards.successful > 0) || (result === 'noop' && _shards.failed === 0);
  }

  /**
   * 根据条件进行count计算
   * @param type{string}               必填
   * @param body{Object}  检索查询的body 非必填
   * @param index{string}              非必填
   */
  async count(type, body, index) {
    let opt = {
      index: index || this.index,
      type: type,
    };
    if (body) {
      delete body.sort;
      opt.body = body;
    }
    let {count} = await this.client.count(opt);
    return count;
  }

  /**
   * 插入一条记录
   * @param type{string}               必填
   * @param body{Object} 插入的记录      必填
   * @param id 插入的记录id，数字或者字符串 必填
   * @param index{string}  非必填
   */
  async create(type, body, id, index) {
    let opt = {
      index: index || this.index,
      type: type,
      body: body,
      id: id,
    };
    let {result} = await this.client.create(opt);
    return result === 'created';
  };

  /**
   * 根据id删除一条记录
   * @param type{string}               必填
   * @param id 删除的记录id，数字或者字符串 必填
   * @param index{string}  非必填
   */
  async delete(type, id, index) {
    let {result} = await this.client.delete({
      index: index || this.index,
      type: type,
      id: id,
    });

    return result === 'deleted';
  };

  /**
   * 根据body条件删除多条记录
   * @param type{string}               必填
   * @param body{Object} 检索查询的body  必填
   * @param index{string}  非必填
   */
  async deleteMulti(type, body, index) {
    let opt = {
      index: index || this.index,
      type: type,
      body: body,
    };
    let {deleted} = await this.client.deleteByQuery(opt);
    return deleted;
  }

  /**
   * 根据body条件更新多条记录
   * @param type{string}                      必填
   * @param searchBody{Object} 检索查询的body  必填
   * @param updateInfo{Object} 需要更新的内容   必填
   * @param lang{string}     脚本采用的语言，5.0以后es默认painless  非必填
   * @param index{string}  非必填
   */
  async updateMulti(type, searchBody, updateInfo, lang, index) {
    let updateBody = {
      script: {
        inline: '',
        params: updateInfo,
      },
    };

    if (lang) {
      updateBody.script.lang = lang;
    }

    for (let i in updateInfo) {
      updateBody.script.inline += `ctx._source.${i} = params.${i};`;
    }
    const body = Object.assign(updateBody, searchBody);
    const opt = {
      index: index || this.index,
      type: type,
      body: body,
    };
    if (!updateBody.script.inline) {
      return;
    }
    const {updated} = await this.client.updateByQuery(opt);
    return updated;
  }

}

module.exports = EasyES;
