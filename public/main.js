/**
 * Created by xiayf on 15/12/4.
 */
var $ = jQuery = require('jquery');
var _ = require('bootstrap');
var __ = require('cn-bootstrap-datetimepicker');
var Highcharts = require('highcharts');
Highcharts.setOptions({ global: { useUTC: false } });

var statTitleMapper = {
    'connected_client': 'Connected Clients',
    'used_memory': 'Used Memory(MB)',
    'cmd_ps': 'Processed commands per second'
};
// var statTitleMapper = {
//     'connected_client': '客户端连接数(个)',
//     'used_memory': '内存使用量(MB)',
//     'cmd_ps': '每秒处理命令数(个)'
// };

function genErrorAlert(xhr) {
    return '<div class="alert alert-danger error-tip" role="alert">' +
        '<strong>'+ xhr.status +'</strong> - '  + xhr.statusText + '<p>' + xhr.responseText + '</p>'
        + '</div>';
}

$(function () {
    $('#begin_datetime').datetimepicker({
        format: 'MM/DD/YYYY HH:mm:ss',
        defaultDate: new Date(Date.now() - (60 * 60 * 12 * 1000)),
        sideBySide: true
    });
    $('#end_datetime').datetimepicker({
        format: 'MM/DD/YYYY HH:mm:ss',
        defaultDate: new Date(),
        sideBySide: true
    });

    $('#submit_cmd').on('click', function ($e) {
        $e.preventDefault();

        var $cmdOutput = $('#cmd_output');
        $cmdOutput.empty();

        var cmd = $('input[name="cmd"]').val(),
            cmdParts = cmd.split(' '),
            params = '';
        cmd = cmdParts[0];
        if (cmdParts.length > 1) {
            params = cmdParts.slice(1).join(' ');
        }

        // 加loading效果
        var loadingPart = '<div class="row" id="loading_part">' +
                '<div class="loading-tip col-md-6"">' +
                '<span>Command is being executed, please wait ...</span>' +
                '</div></div>';
        $cmdOutput.append(loadingPart);

        var $loadingPart = $('#loading_part');

        var req = $.ajax({
            "method": "POST",
            "url": "/cmd",
            "data": {
                "cmd": cmd,
                "params": params
            },
            dataType: "text"
        });
        req.done(function (resp) {
            $loadingPart.remove();

            resp = '<pre>' + resp + '</pre>';
            $cmdOutput.html(resp);
        });
        req.fail(function(xhr) {
            $loadingPart.remove();
            $cmdOutput.append(genErrorAlert(xhr));
        });
    });

    $('#show_stat').on('click', function ($e) {
        $e.preventDefault();

        var selectedServer = [];
        $('.server input').each(function () {
            if ($(this).prop('checked')) {
                selectedServer.push($(this).val());
            }
        });

        var selectedIndex = [];
        $('.index input').each(function () {
            if ($(this).prop('checked')) {
                selectedIndex.push($(this).val());
            }
        });

        var reduceWay = $('input[name="reduce_way"]:checked').val();

        var beginDateTime = $('input[name="begin-datetime"]').val();
        var endDateTime = $('input[name="end-datetime"]').val();

        var $statGraphPart = $('.stat-graph-part');
        $statGraphPart.empty();

        if (selectedServer.length === 0 || selectedIndex.length === 0 || !beginDateTime || !endDateTime) {
            $statGraphPart.append('<div class="alert alert-danger error-tip col-md-6" role="alert">Missing required parameters!</div>');
            return;
        }

        // 一个指标一张图
        selectedIndex.forEach(function (ele) {
            // 加loading效果
            var loadingPartID = 'loading_' + ele,
                loadingPart = '<div class="row" id="'+ loadingPartID +'">' +
                    '<div class="loading-tip col-md-6"">' +
                    '<span>Loading data, please wait...</span>' +
                    '</div></div>';

            $statGraphPart.append(loadingPart);

            var req = $.ajax({
                method: 'POST',
                url: "/stat",
                data: {
                    name: ele,
                    servers: selectedServer.join(','),
                    begin_time: beginDateTime,
                    end_time: endDateTime,
                    reduce_way: reduceWay
                },
                dataType: 'json'
            });
            req.done(function (resp) {
                //
                $('#' + loadingPartID).remove();

                var containerID = 'container_' + ele;
                $('.stat-graph-part').append('<div id=' + containerID + '></div>');

                $('#' + containerID).highcharts({
                    credits: {
                      enabled: false
                    },
                    title: {
                        text: statTitleMapper[ele]
                    },
                    xAxis: resp.xAxis ? resp.xAxis : {type: 'datetime'},
                    yAxis: resp.yAxis ? resp.yAxis : null,
                    series: resp.series
                });
            });
            req.fail(function(xhr) {
                $('#' + loadingPartID).remove();
                $('.stat-graph-part').append(genErrorAlert(xhr));
            });
        });
    });
});
