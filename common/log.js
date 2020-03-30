'use strict';

const {createLogger, transports, format} = require('winston');

const {combine, timestamp, printf} = format;

const _transports = [new transports.Console()];

const logger = createLogger({
  transports: _transports,
  format: combine(
    format.colorize(),
    // format.json(),
    timestamp({
      format: 'YYYY-MM-DD HH:mm:ss:SSS',
    }),
    printf(info => {
      const {level, message, timestamp} = info;
      let splatInfo = info[Symbol.for('splat')];
      if (level.indexOf('error') !== -1) {
        console.error(info.timestamp, message, splatInfo ? splatInfo : ''); // eslint-disable-line
      }
      let more = [message];
      if (splatInfo) {
        splatInfo.forEach(item => {
          if (item instanceof Error) {
            more.push(item.message);
          } else if (item instanceof Buffer) {
            more.push(item);
          } else if (typeof item === 'object') {
            more.push(JSON.stringify(item));
          } else {
            more.push(item);
          }
        });
      }
      return `[${timestamp}] - [${level}] - [${process.pid}]: ${ more.join(' ')}`;
    })
  ),
});

module.exports = logger;
