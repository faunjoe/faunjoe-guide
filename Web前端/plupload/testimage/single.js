function SingleClient() {
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
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "enLogoImg"},
            init: {
                FilesAdded: function (up, files) {
                    uploader.settings.multipart_params.faunjoe = "faunjoe";
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#enLogoImg').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#hidEnLogoImg').val(response[0].imgPath);
                    }
                    $(".plupload-loading").remove();
                },
                UploadComplete: function (uploader, files) {
                    $(".plupload-loading").remove();
                },
                UploadProgress: function (uploader, file) {
                    //var $img = $("#enLogoImg");
                    var $img = $("#" + uploader.settings.multipart_params.loading);
                    $('<img class="plupload-loading"  src="/img/loading.gif" style="position:absolute;z-index:100000;"/>').css({
                        top: $img.offset().top + ($img.outerHeight() - 16) / 2,
                        left: $img.offset().left + ($img.outerWidth() - 16) / 2
                    }).appendTo(document.body);
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
    new SingleClient().initialize();
});
