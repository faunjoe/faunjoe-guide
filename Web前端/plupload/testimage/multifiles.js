function MultifilesClient() {
    this.initialize = function () {
        this.imageInit();
    }

    this.imageInit = function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash,silverlight',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadimage',//上传文件路径
            max_file_size: '2mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'browse',
            multi_selection: true,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "multifile", "multifile": "multifile", "hidmultifile": "hidmultifile"},
            init: {
                FilesAdded: function (up, files) {
                    if (files.length > 8) {
                        $alert("提示：", "批量上传一次最多8张图片,您上传了" + files.length + "张图片。");
                    } else {
                        uploader.start();
                        return false;
                    }
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var index = uploader.total.uploaded;
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $("#" + uploader.settings.multipart_params.multifile + index).attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $("#" + uploader.settings.multipart_params.hidmultifile + index).val(response[0].imgPath);
                    }
                    $(".plupload-loading").remove();
                },
                UploadComplete: function (uploader, files) {
                    $(".plupload-loading").remove();
                    uploader.splice(0,uploader.total.uploaded);
                    console.log(uploader);
                },
                UploadProgress: function (uploader, file) {
                    //var $img = $("#enLogoImg");
                    var index = uploader.total.uploaded + 1;
                    var $img = $("#" + uploader.settings.multipart_params.loading + index);
                    if (uploader.total.uploaded > 8 ) {
                        // $('<img id="plupload-loading'+index+'" src="/img/loading.gif" style="position:absolute;z-index:100000;"/>').css({
                        //     top: $img.offset().top + ($img.outerHeight() - 16) / 2,
                        //     left: $img.offset().left + ($img.outerWidth() - 16) / 2
                        // }).appendTo(document.body);
                        $('<img class="plupload-loading" src="/img/loading.gif" style="position:absolute;z-index:100000;"/>').css({
                            top: $img.offset().top + ($img.outerHeight() - 16) / 2,
                            left: $img.offset().left + ($img.outerWidth() - 16) / 2
                        }).appendTo(document.body);
                    }
                },
                Error: function (uploader, err) {
                    $alert("消息", "code:" + err.code + "  message:" + err.message);
                }
            }
        });

        uploader.init();
    }
}

// 初始化
$(function () {
    new MultifilesClient().initialize();
});
