'use strict';
const elasticsearch = require('@elastic/elasticsearch');
const utils = require('./utils');

/**
 * 封装了elasticsearch的方法，主要是对构建好的参数执行查询、更新、统计、插入、删除等请求
 * 主要是对应5.x和6.x
 */
class EasyES {

  /**
   * @param config{object} 必填
   */
  constructor(config) {
    this.client = new elasticsearch.Client(config);
    this.utils = utils;
  }

  /**
   * @param index{String} 必填
   */
  setIndex(index) {
    this.index = index;
  }

  /**
   * 根据id查询一条记录
   * @param type{string}      必填
   * @param id{string} 文档id  必填
   * @param source{array} 指定获取的字段   非必填
   * @param index{string}     非必填
   */
  async get(type, id, source, index) {

    const opt = {
      index: index || this.index,
      type: type,
      id: id,
    };

    if (source) {
      opt._source = source;
    }

    let {body: {_source}} = await this.client.get(opt);

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
    const opt = {
      index: index || this.index,
      type: type,
      body: body,
      from: from || 0,
      ...options,
    };

    const isAgg = Object.prototype.toString.call(body.aggs) === '[object Object]';

    if (!isAgg) {
      // 非聚合，指定了返回的字段
      if (source) {
        opt._source = source;
      }

      // 非聚合， 设置size
      if (size || size === 0) {
        opt.size = size;
      }
    }

    let {body: {hits, aggregations}} = await this.client.search(opt, {
      ignore: [404],
    });

    if (isAgg) {
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
    const {body: {result, _shards}} = await this.client.update({
      index: index || this.index,
      type: type,
      id: id,
      body: {doc: doc},
    });

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
    const opt = {
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

    const {body: {result, _shards}} = await this.client.update(opt);

    return (result === 'updated' && _shards.successful > 0) || (result === 'noop' && _shards.failed === 0);
  }

  /**
   * 根据条件进行count计算
   * @param type{string}               必填
   * @param body{Object}  检索查询的body 非必填
   * @param index{string}              非必填
   */
  async count(type, body, index) {

    const opt = {
      index: index || this.index,
      type: type,
    };

    if (body) {
      delete body.sort;
      opt.body = body;
    }

    const {body: {count}} = await this.client.count(opt);

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

    const {body: {result}} = await this.client.create({
      index: index || this.index,
      type: type,
      body: body,
      id: id,
    });

    return result === 'created';
  };

  /**
   * 根据id删除一条记录
   * @param type{string}               必填
   * @param id 删除的记录id，数字或者字符串 必填
   * @param index{string}  非必填
   */
  async delete(type, id, index) {

    const {body: {result}} = await this.client.delete({
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

    let {body: {deleted}} = await this.client.deleteByQuery({
      index: index || this.index,
      type: type,
      body: body,
    });

    // Number
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

    const isObject = Object.prototype.toString.call(updateInfo) === '[object Object]';
    if (!isObject || Object.keys(updateInfo).length <= 0) {
      throw TypeError('updateInfo need to be Object that has one key at least');
    }
    const updateBody = {
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

    let {body: {updated}} = await this.client.updateByQuery({
      index: index || this.index,
      type: type,
      body: body,
    });

    // Number
    return updated;
  }

}

module.exports = EasyES;
