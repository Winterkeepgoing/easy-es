'use strict';

require('should');
const sleep = require('sleep');
const easyES = require('../../index');
const log = require('../../common/log');

const configs = [
  {node: 'http://127.0.0.1:9200', version: '7.x'},
];

configs.forEach(test);

function test(config) {
  const client = easyES(config);
  describe('v7 easy_es', () => {

    const index = 'one_piece';
    const source = ['chineseName', 'englishName', 'age', 'rewards', 'views'];
    let firstId = 1;

    before(async function() {
      this.timeout(10000);

      let isExist;
      try {
        isExist = await client.get(index, firstId, source);
        log.info(isExist);
      } catch (e) {
        log.info('get firstId message:', e.statusCode, e.message);
      }
      if (!isExist) {
        log.info('不存在数据，创建中.....');
        const initViews = 0;
        // @formatter:off
        // 1 male 2 female
        const
          luffy = {chineseName: '蒙奇·D·路飞', englishName: 'Monkey D.Luffy', age: 19, rewards: 1500000000, gender: 1, views: initViews},
          zoro = {chineseName: '罗罗诺亚·索隆', englishName: 'Roronoa Zoro', age: 21, rewards: 320000000, gender: 1, views: initViews},
          nami = {chineseName: '娜美', englishName: 'Nami', age: 20, rewards: 66000000, gender: 0, views: initViews},
          usopp = {chineseName: '乌索普', englishName: 'Usopp', age: 19, rewards: 200000000, gender: 1, views: initViews},
          sanji = {chineseName: '文斯莫克·山治', englishName: 'Vinsmoke Sanji', age: 21, rewards: 320000000, gender: 1, views: initViews},
          chopper = {chineseName: '托尼托尼·乔巴', englishName: 'Tony Tony Chopper', age: 17, rewards: 100, gender: 1, views: initViews},
          robin = {chineseName: '妮可·罗宾', englishName: 'Nico Robin', age: 30, rewards: 130000000, gender: 0, views: initViews},
          franky = {chineseName: '弗兰奇', englishName: 'Franky', age: 36, rewards: 130000000, gender: 1, views: initViews},
          brook = {chineseName: '布鲁克', englishName: 'Brook', age: 90, rewards: 83000000, gender: 1, views: initViews},
          jinbe = {chineseName: '甚平', englishName: 'Jinbe', age: 46, rewards: 94000000, gender: 1, views: initViews};
        // @formatter:on

        // create
        await client.create(index, luffy, firstId);
        await client.create(index, zoro, ++firstId);
        await client.create(index, nami, ++firstId);
        await client.create(index, usopp, ++firstId);
        await client.create(index, sanji, ++firstId);
        await client.create(index, chopper, ++firstId);
        await client.create(index, robin, ++firstId);
        await client.create(index, franky, ++firstId);
        await client.create(index, brook, ++firstId);
        await client.create(index, jinbe, ++firstId);
        sleep.sleep(2);
      }

    });

    const should = [], filter = [];
    client.utils.addTerm(filter, 'age', 19);
    client.utils.addRange(filter, 'rewards', 200000000, 1500000000);
    client.utils.addMatch(should, 'chineseName', 'D');

    const body = client.utils.createBody(should, filter);


    it('search', async () => {

      // 获取前10个检索结果
      const response = await client.search(index, body, 10, 0, source);

      response.should.have.properties('total', 'max_score', 'max_score', 'hits');
      response.hits[0].should.have.properties('_id', '_score', '_source');

      response.hits.length.should.be.equal(2);
      response.hits[0]._source.should.have.properties(source);

      // 设置size为1,应该只返回一条
      const oneResult = await client.search(index, body, 1);
      oneResult.hits.length.should.be.equal(1);

      // 简单的聚合
      const agg = client.utils.createTermsAggs('gender');
      const aggBody = client.utils.createBody(null, null, agg);
      const aggResult = await client.search(index, aggBody, 0);

      aggResult.should.be.Array;
      aggResult.length.should.be.equal(2);
      aggResult[0].should.have.properties('key', 'doc_count');

    }).timeout(5000);


    it('get', async () => {
      const response = await client.get(index, firstId, source);
      response.should.have.properties(source);
    }).timeout(5000);

    it('create && update && increase && get && delete', async () => {
      const createView = 0, updateView = 888;
      const createDoc = {'views': createView}, updateDoc = {'views': updateView};
      const insertId = 100;
      const defaultIncreaseInterval = 1, increaseInterval = 20;

      // create
      const createRes = await client.create(index, createDoc, insertId);
      createRes.should.equal(true);

      const getCreateRes = await client.get(index, insertId);
      getCreateRes.views.should.equal(createView);

      // update
      const updateRes = await client.update(index, insertId, updateDoc);
      updateRes.should.equal(true);

      // update 更新的数据和原来一样
      const updateRes2 = await client.update(index, insertId, updateDoc);
      updateRes2.should.equal(true);

      const getUpdateRes = await client.get(index, insertId);
      getUpdateRes.views.should.equal(updateView);

      // increase defaultIncreaseInterval
      const defaultIncreaseRes = await client.increase(index, insertId, 'views');
      defaultIncreaseRes.should.equal(true);

      const getDefaultIncreaseRes = await client.get(index, insertId, ['views']);
      getDefaultIncreaseRes.views.should.equal(updateView + defaultIncreaseInterval);

      // increase IncreaseInterval
      const increaseIntervalRes = await client.increase(index, insertId, 'views', increaseInterval);
      increaseIntervalRes.should.equal(true);

      const getIncreaseIntervalRes = await client.get(index, insertId, ['views']);
      getIncreaseIntervalRes.views.should.equal(updateView + defaultIncreaseInterval + increaseInterval);

      // delete
      const deleteRes = await client.delete(index, insertId);
      deleteRes.should.equal(true);

    }).timeout(5000);


    it('count', async () => {
      const allCount = await client.count(index);
      allCount.should.be.Number;

      const simallCount = await client.count(index, body);
      simallCount.should.be.Number;
      allCount.should.above(simallCount);

    }).timeout(5000);

    it('updateMulti && deleteMulti ', async () => {
      const initViews = 777, updateViews = 888, thirdViews = 999;
      const doc = {'views': initViews}, thirdDoc = {'views': thirdViews};
      const firstId = 201, secondId = 202, thirdId = 203;

      // 数据不存在就创建
      let isExist;
      try {
        isExist = await client.get(index, firstId, source);
      } catch (e) {
        log.info('updateMulti get message:', e.statusCode, e.message);
      }
      if (!isExist) {
        log.info('创建数据中.....');
        await client.create(index, doc, firstId);
        await client.create(index, doc, secondId);
        await client.create(index, thirdDoc, thirdId);
        sleep.sleep(2);
      }

      // 把777的2条更新为888
      const filter = [];
      client.utils.addTerm(filter, 'views', initViews);
      const body = client.utils.createBody(null, filter);
      const updateInfo = {'views': updateViews};
      const updatedRows = await client.updateMulti(index, body, updateInfo, null);
      updatedRows.should.be.equal(2);
      sleep.sleep(2);

      // 检索更新后的条件，应该检索到888的两条
      const searchFiletr = [];
      client.utils.addTerm(searchFiletr, 'views', updateViews);
      const searchBody = client.utils.createBody(null, searchFiletr);
      const searchRes = await client.search(index, searchBody);
      searchRes.hits[0]._source.views.should.equal(updateViews);
      searchRes.hits.length.should.be.equal(2);

      // 999的那条应该一直没有变
      const getUpdateRes = await client.get(index, thirdId);
      getUpdateRes.views.should.equal(thirdViews);

      // 删除 3条
      const deleteFiletr = [];
      client.utils.addRange(deleteFiletr, 'views', initViews);
      const deleteBody = client.utils.createBody(null, deleteFiletr);
      const deletedRows = await client.deleteMulti(index, deleteBody);
      deletedRows.should.be.equal(3);

    }).timeout(10000);

  });
}