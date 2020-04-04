'use strict';

const v5v6Client = require('./lib/easy_es_for_v5_v6');
const v7Client = require('./lib/easy_es_for_v7');

const validVersion = ['5.x', '6.x', '7.x'];

/**
 * @param config {object} 必填，除了官方的配置项外，多了version，可选的['5.x', '6.x', '7.x']
 */
function chooseVersion(config) {

  const {version} = config;

  if (!version) {
    throw new Error('Missing version parameter');
  }

  const lowerCaseVersion = version.toString().toLowerCase();
  if (!validVersion.includes(lowerCaseVersion)) {
    throw new TypeError(` Invalid version "${version}", expected one of 5.x, 6.x, 7.x `);
  }

  if (parseInt(version.toString().split('.')[0]) >= 7) {
    return new v7Client(config);
  } else {
    return new v5v6Client(config);
  }

}

module.exports = chooseVersion;