'use strict';

var Template = require('../utils/template');
var DB = require('../models/db');
var Logger = require('../utils/logger');

var serverIndexs = {
    cmd_ps: 'The number of commands per second',
    connected_client: 'Client connections',
    used_memory: 'Memory Usage'
};
// var serverIndexs = {
//     cmd_ps: '每秒处理命令数',
//     connected_client: '客户端连接数',
//     used_memory: '内存使用量'
// };

var reduceWays = {
    default: 'No aggregation (prudent use of large time range)',
    by_max: 'Max',
    by_ave: 'Means'
};
// var reduceWays = {
//     default: '不聚合(时间范围大时慎重使用)',
//     by_max: '最大值',
//     by_ave: '均值'
// };

function _stat_page(req, res) {
    DB.getClusterInfo(function (err, result) {
        if (err) {
            Logger.error(err);

            res.statusCode = 500;
            res.write('System errors, please contact the administrator');
            // res.write('系统异常,请联系管理员');
            res.end();
            return;
        }

        var redisServers = [];
        var redisMaster = JSON.parse(result.master);
        var redisSlaves = JSON.parse(result.slaves);

        redisServers.push(redisMaster.ip + ':' + redisMaster.port);
        Object.getOwnPropertyNames(redisSlaves).forEach(slave => {
            redisServers.push(slave);
        });

        res.write(Template.render('views/stat.jade', {
            servers: redisServers,
            indexs: serverIndexs,
            ways: reduceWays
        }));
        res.end();
    });
}

module.exports = _stat_page;
