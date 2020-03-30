'use strict';

require('should');
const sleep = require('sleep');
const easyES = require('../index');

const configs = [
  {host: '127.0.0.1:6800', version: '6.x'},
  {host: 'elastic:changeme@127.0.0.1:5300', version: '5.3'},
];

configs.forEach(test);

// const client = require('../index')({
//   node: 'http://192.168.90.139:9200',
//   version: '6.x',
// });
function test(config) {
  const client = new easyES(config.host, config.version);
  describe('lib/easy_es.js', () => {

    const index = 'one_piece', type = 'luffy';
    const source = ['chineseName', 'englishName', 'age', 'rewards', 'views'];
    let firstId = 1;

    before(async function() {
      this.timeout(10000);

      let isExist;
      try {
        isExist = await client.get(type, firstId, source, index);
      } catch (e) {
        /* eslint no-console: off */
        console.log('statusCode:', e.statusCode);
        console.log('message:', e.message);
      }
      if (!isExist) {
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
        await client.create(type, luffy, firstId, index);
        await client.create(type, zoro, ++firstId, index);
        await client.create(type, nami, ++firstId, index);
        await client.create(type, usopp, ++firstId, index);
        await client.create(type, sanji, ++firstId, index);
        await client.create(type, chopper, ++firstId, index);
        await client.create(type, robin, ++firstId, index);
        await client.create(type, franky, ++firstId, index);
        await client.create(type, brook, ++firstId, index);
        await client.create(type, jinbe, ++firstId, index);
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
      const response = await client.search(type, body, 10, 0, source, index);

      response.should.have.properties('total', 'max_score', 'max_score', 'hits');
      response.hits[0].should.have.properties('_id', '_score', '_source');

      response.hits.length.should.be.equal(2);
      response.hits[0]._source.should.have.properties(source);

      // 设置size为1,应该只返回一条
      const oneResult = await client.search(type, body, 1, null, null, index);
      oneResult.hits.length.should.be.equal(1);

      // 简单的聚合
      const agg = client.utils.createTermsAggs('gender');
      const aggBody = client.utils.createBody(null, null, agg);
      const aggResult = await client.search(type, aggBody);

      aggResult.should.be.Array;
      aggResult.length.should.be.equal(2);
      aggResult[0].should.have.properties('key', 'doc_count');

    }).timeout(5000);


    it('get', async () => {
      const response = await client.get(type, firstId, source, index);
      response.should.have.properties(source);
    }).timeout(5000);

    it('create && update && increase && get && delete', async () => {
      const createView = 0, updateView = 888;
      const createDoc = {'views': createView}, updateDoc = {'views': updateView};
      const insertId = 100;
      const defaultIncreaseInterval = 1, increaseInterval = 20;

      // create
      const createRes = await client.create(type, createDoc, insertId, index);
      createRes.should.equal(true);

      const getCreateRes = await client.get(type, insertId, null, index);
      getCreateRes.views.should.equal(createView);

      // update
      const updateRes = await client.update(type, insertId, updateDoc, index);
      updateRes.should.equal(true);

      const getUpdateRes = await client.get(type, insertId, null, index);
      getUpdateRes.views.should.equal(updateView);

      // increase defaultIncreaseInterval
      const defaultIncreaseRes = await client.increase(type, insertId, 'views', null, null, index);
      defaultIncreaseRes.should.equal(true);

      const getDefaultIncreaseRes = await client.get(type, insertId, ['views'], index);
      getDefaultIncreaseRes.views.should.equal(updateView + defaultIncreaseInterval);

      // increase IncreaseInterval
      const increaseIntervalRes = await client.increase(type, insertId, 'views', increaseInterval, null, index);
      increaseIntervalRes.should.equal(true);

      const getIncreaseIntervalRes = await client.get(type, insertId, ['views'], index);
      getIncreaseIntervalRes.views.should.equal(updateView + defaultIncreaseInterval + increaseInterval);

      // delete
      const deleteRes = await client.delete(type, insertId, index);
      deleteRes.should.equal(true);

    }).timeout(5000);


    it('count', async () => {
      const allCount = await client.count(type, null, index);
      allCount.should.be.Number;

      const simallCount = await client.count(type, body, index);
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
        isExist = await client.get(type, firstId, source, index);
      } catch (e) {
        /* eslint no-console: off */
        console.log('statusCode:', e.statusCode);
        console.log('message:', e.message);
      }
      if (!isExist) {
        await client.create(type, doc, firstId, index);
        await client.create(type, doc, secondId, index);
        await client.create(type, thirdDoc, thirdId, index);
        sleep.sleep(2);
      }

      // 把777的2条更新为888
      const filter = [];
      client.utils.addTerm(filter, 'views', initViews);
      const body = client.utils.createBody(null, filter);
      const updateInfo = {'views': updateViews};
      const updatedRows = await client.updateMulti(type, body, updateInfo, null, index);
      updatedRows.should.be.equal(2);
      sleep.sleep(2);

      // 检索更新后的条件，应该检索到888的两条
      const searchFiletr = [];
      client.utils.addTerm(searchFiletr, 'views', updateViews);
      const searchBody = client.utils.createBody(null, searchFiletr);
      const searchRes = await client.search(type, searchBody, null, null, null, index);
      searchRes.hits[0]._source.views.should.equal(updateViews);
      searchRes.hits.length.should.be.equal(2);

      // 999的那条应该一直没有变
      const getUpdateRes = await client.get(type, thirdId, null, index);
      getUpdateRes.views.should.equal(thirdViews);

      // 删除 3条
      const deleteFiletr = [];
      client.utils.addRange(deleteFiletr, 'views', initViews);
      const deleteBody = client.utils.createBody(null, deleteFiletr);
      const deletedRows = await client.deleteMulti(type, deleteBody, index);
      deletedRows.should.be.equal(3);

    }).timeout(10000);

  });
}