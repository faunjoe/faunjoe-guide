- 双日期控件
```
$('#daterange').daterangepicker({
                //autoUpdateInput: false,
                alwaysShowCalendars: true,
                autoApply: true, // 隐藏应用/清除按钮
                locale: {
                    format: "YYYY-MM-DD",
                    applyLabel: '应用',
                    cancelLabel: '清除',
                    customRangeLabel: "自定义范围",
                },
                //showWeekNumbers:true,
                ranges: {
                    '今天': [moment(), moment()],
                    '昨天': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
                    '过去 7 天': [moment().subtract(6, 'days'), moment()],
                    '过去 30 天': [moment().subtract(29, 'days'), moment()],
                    '这个月': [moment().startOf('month'), moment().endOf('month')],
                    '上个月': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
                },
            }, function (start, end, label) {
                $("#start").val(start.format('YYYY-MM-DD'));
                $("#end").val(end.format('YYYY-MM-DD'));
                console.log(`New date range selected: ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')} (predefined range: ${label})`);
            }).on('cancel.daterangepicker', function (ev, picker) {
                $('#daterange,#start,#end').val('');
            });
```

- 设置最小和最大日期
```
let drp = $('#daterange').data('daterangepicker');
drp.minDate = moment(new Date(item.relaseTime));
drp.maxDate = moment(new Date(item.unShelveTime));
drp.setStartDate(item.relaseTime);
drp.setEndDate(item.unShelveTime);
```

- 时间比较
```
if (item.launchMovie != null && item.launchMovie.movieId > 0) {
                            let movieInfo: string = item.launchMovie.movieName + " 上映时间：" + item.launchMovie.releaseTime + "--" + item.launchMovie.unShelveTime;
                            if (!moment(item.webLaunchBeginTime).isBetween(moment(item.launchMovie.releaseTime).add(-1, "days"), moment(item.launchMovie.unShelveTime).add(1, "days"))) {
                                isTrue = false;
                                message = movieInfo + " 投放上刊时间不在电影上映和下映时间内";
                                break;
                            }
                            if (!moment(item.webLaunchEndTime).isBetween(moment(item.launchMovie.releaseTime).add(-1, "days"), moment(item.launchMovie.unShelveTime).add(1, "days"))) {
                                isTrue = false;
                                message = movieInfo + "投放下刊时间不在电影上映和下映时间内";
                                break;
                            }
}
```