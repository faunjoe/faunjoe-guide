//===================================================================
// 文件名:	AddGoods.js
// 版权:		Copyright (C) 2013 Mtime
// 创建人:	tony.zhou
// 创建时间:	6/7/2014 9:47:30 AM
// 描述:		
// 备注:		
//===================================================================
/// <reference path="../Js/Mtime.Core-vsdoc.js" />

function AddOrEditGoodsImagesVideosClient() {
    this.initialize = function () {
        $(document).click($.action.dispatch);
        $.action.add("deleteImage", this.deleteImage.bind(this));
        $.action.add("leftMove", this.leftMove.bind(this));
        $.action.add("rightMove", this.rightMove.bind(this));
        $.action.add("uploadGoodsSKUImage", this.uploadGoodsSKUImage.bind(this));
        $.action.add("useGoodsImage", this.useGoodsImage.bind(this));
        $.action.add("deleteGoodsSKUVideoImage", this.deleteGoodsSKUVideoImage.bind(this));
        $.action.add("deleteGoodsSKUPNGImage", this.deleteGoodsSKUPNGImage.bind(this));
        $.action.add("deleteGoodsSKUJGPImage", this.deleteGoodsSKUJGPImage.bind(this));
        this.imageSKUVideoInit();
        this.imagePngInit();
        this.imageJpgInit();
    };

    //删除视频图片
    this.deleteGoodsSKUVideoImage = function (e) {
        $("#txtGoodsSKUVideoImage").val("");
        $("#goodsSKUVideoImage_cover").attr("src", "/img/Imagenone.jpg");
    };

    //删除PNG图片
    this.deleteGoodsSKUPNGImage = function (e) {
        $("#txtGoodsSKUPNGImage").val("");
        $("#goodsSKUPNGImage_cover").attr("src", "/img/Imagenone.jpg");
    };

    //删除白底图
    this.deleteGoodsSKUJGPImage = function (e) {
        $("#txtGoodsSKUJPGImage").val("");
        $("#goodsSKUJPGImage_cover").attr("src", "/img/Imagenone.jpg");
    };

    //使用商品图片
    this.useGoodsImage = function (e) {
        var propertyImagesCount = $(e.target).attr("propertyImagesCount");
        var square = "#goodsImagesTable_square_" + propertyImagesCount;
        var width = "#goodsImagesTable_width_" + propertyImagesCount;
        var squareTable = $(square);
        var widthTable = $(width);
        var squareTableTrcount = squareTable.attr("trcount");
        var widthTableTrcount = widthTable.attr("trcount");


        //方图是否上传过
        var issquare = true;
        for (var i = 1; i <= 8; i++) {
            var img_url = $("#img_url" + squareTableTrcount + "_" + i).val();
            if (img_url.length == 0) {
                issquare = false;
                break;
            }
        }
        var iswidth = true;
        //横图是否上传过
        for (var i = 1; i <= 8; i++) {
            var img_url = $("#img_url" + widthTableTrcount + "_" + i).val();
            if (img_url.length == 0) {
                iswidth = false;
                break;
            }
        }

        if (iswidth && issquare) {
            //方图
            for (var i = 1; i <= 8; i++) {
                var goods_src = $("#img_cover0_" + i).attr("src");
                var goods_img_patch = $("#img_url0_" + i).val();
                var img_cover = $("#img_cover" + squareTableTrcount + "_" + i).attr("src", goods_src);
                var img_url = $("#img_url" + squareTableTrcount + "_" + i).val(goods_img_patch);
            }
            //横图
            for (var i = 1; i <= 8; i++) {
                var goods_src = $("#img_cover1_" + i).attr("src");
                var goods_img_patch = $("#img_url1_" + i).val();
                var img_cover = $("#img_cover" + widthTableTrcount + "_" + i).attr("src", goods_src);
                var img_url = $("#img_url" + widthTableTrcount + "_" + i).val(goods_img_patch);
            }
        }
        else {
            $confirm("使用商品图片提示：", "该项已经上传过图片，请确定是否使用商品图片，确定将覆盖原有图片", function (dlg) {
                //方图
                for (var i = 1; i <= 8; i++) {
                    var goods_src = $("#img_cover0_" + i).attr("src");
                    var goods_img_patch = $("#img_url0_" + i).val();
                    var img_cover = $("#img_cover" + squareTableTrcount + "_" + i).attr("src", goods_src);
                    var img_url = $("#img_url" + squareTableTrcount + "_" + i).val(goods_img_patch);
                }
                //横图
                for (var i = 1; i <= 8; i++) {
                    var goods_src = $("#img_cover1_" + i).attr("src");
                    var goods_img_patch = $("#img_url1_" + i).val();
                    var img_cover = $("#img_cover" + widthTableTrcount + "_" + i).attr("src", goods_src);
                    var img_url = $("#img_url" + widthTableTrcount + "_" + i).val(goods_img_patch);
                }
                dlg.close();
            })
        }
    };

    //左移动图片
    this.leftMove = function (e) {
        var $target = $(e.target);
        var counts = $target.attr("count").split('_');
        var count = parseInt(counts[1], 10);
        if (count == 1) {
            $alert("错误提示", "已经到达最左边，不能再移动了");
        }
        else {
            var rigthImageCount = parseInt(count, 10) - 1;
            var rightImage = $("#img_url" + counts[0] + "_" + rigthImageCount).val();
            var rightImageCover = $("#img_cover" + counts[0] + "_" + rigthImageCount).attr("src");
            var leftImage = $("#img_url" + counts[0] + "_" + count).val();
            var leftImageCover = $("#img_cover" + counts[0] + "_" + count).attr("src");
            if (leftImage.length == 0) {
                $alert("错误提示：", "还没有上传图片，不能左移动");
            }
            else {
                if (rightImage.length == 0) {
                    $("#img_url" + counts[0] + "_" + count).val("");
                    $("#img_cover" + counts[0] + "_" + count).attr("src", "/img/inner_img.jpg");
                }
                else {
                    $("#img_url" + counts[0] + "_" + count).val(rightImage);
                    $("#img_cover" + counts[0] + "_" + count).attr("src", rightImageCover);
                }

                $("#img_url" + counts[0] + "_" + rigthImageCount).val(leftImage);
                $("#img_cover" + counts[0] + "_" + rigthImageCount).attr("src", leftImageCover);
            }
        }
    };

    //右移动图片
    this.rightMove = function (e) {
        var $target = $(e.target);
        var counts = $target.attr("count").split('_');
        var count = parseInt(counts[1], 10);
        if (count == 8) {
            $alert("错误提示", "已经到达最右边，不能再移动了");
        }
        else {
            var rigthImageCount = parseInt(count, 10) + 1;
            var rightImage = $("#img_url" + counts[0] + "_" + rigthImageCount).val();
            var rightImageCover = $("#img_cover" + counts[0] + "_" + rigthImageCount).attr("src");
            var leftImage = $("#img_url" + counts[0] + "_" + count).val();
            var leftImageCover = $("#img_cover" + counts[0] + "_" + count).attr("src");

            if (leftImage.length == 0) {
                $alert("错误提示：", "还没有上传图片，不能左移动");
            }
            else {
                if (rightImage.length == 0) {
                    if (rigthImageCount == 2) {
                        $("#img_url" + counts[0] + "_" + count).val("");
                        $("#img_cover" + counts[0] + "_" + count).attr("src", "/img/main_img.jpg");
                    }
                    else {
                        $("#img_url" + counts[0] + "_" + count).val("");
                        $("#img_cover" + counts[0] + "_" + count).attr("src", "/img/inner_img.jpg");
                    }
                }
                else {
                    $("#img_url" + counts[0] + "_" + count).val(rightImage);
                    $("#img_cover" + counts[0] + "_" + count).attr("src", rightImageCover);
                }
                $("#img_url" + counts[0] + "_" + rigthImageCount).val(leftImage);
                $("#img_cover" + counts[0] + "_" + rigthImageCount).attr("src", leftImageCover);
            }
        }
    };

    //删除图片
    this.deleteImage = function (e) {
        var $target = $(e.target);
        var count = $target.attr("count");
        var numberArr = count.split('_');
        var number = 0;
        if (numberArr.length > 1) {
            number = numberArr[1];
        }
        else {
            number = count;
        }
        $("#img_url" + count).val("");
        if (number == 1) {
            $("#img_cover" + count).attr("src", "/img/main_img.jpg");
        }
        else {
            $("#img_cover" + count).attr("src", "/img/inner_img.jpg");
        }

    };

    //上传图片
    this.uploadGoodsSKUImage = function (e) {
        var $target = $(e.target);
        var trCount = $target.attr("trCount");
        var imageType = $target.attr("ImageType");
        var imageInfos = [];
        for (var i = 1; i < 9; i++) {
            var $imageURL = $("#img_cover" + trCount + "_" + i);
            var $imagePatch = $("#img_url" + trCount + "_" + i);
            var imageInfo = {
                imageURL: $imageURL.attr("src"),
                imagePatch: $imagePatch.val()
            };
            imageInfos.push(imageInfo);
        }

        //alert(trCount);
        var dlg = new uploadGoodsSKUImageDlg(trCount, imageInfos, imageType);
        dlg.initialize({
            title: "上传商品SKU图片",
            width: '750px',
            buttons: [
                {
                    text: '确定',
                    callback: function (dlg) {
                        var images = dlg.getGoodsSKUImages();
                        //alert(trCount);
                        for (var i = 1; i < 9; i++) {
                            var $imageURL = $("#img_cover" + trCount + "_" + i);
                            var $imagePatch = $("#img_url" + trCount + "_" + i);
                            $imageURL.attr("src", images[i - 1].imageURL);
                            $imagePatch.val(images[i - 1].imagePatch);
                        }

                        dlg.close();
                    }.bind(this)
                },
                {text: '取消'}]
        });
    };

    //视频缩略图
    this.imageSKUVideoInit = function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'upGoodsSKUVideoImage',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "goodsSKUVideoImage_cover"},
            init: {
                FilesAdded: function (up, files) {
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#goodsSKUVideoImage_cover').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#txtGoodsSKUVideoImage').val(response[0].imgPath);
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
    };

    //PNG透明图
    this.imagePngInit = function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'upGoodsSKUPNGImage',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "goodsSKUPNGImage_cover"},
            init: {
                FilesAdded: function (up, files) {
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#goodsSKUPNGImage_cover').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#txtGoodsSKUPNGImage').val(response[0].imgPath);
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
    };

    //白底图
    this.imageJpgInit = function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'upGoodsSKUJPGImage',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "goodsSKUJPGImage_cover"},
            init: {
                FilesAdded: function (up, files) {
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#goodsSKUJPGImage_cover').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#txtGoodsSKUJPGImage').val(response[0].imgPath);
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
    };
}


// 上传SKU图片
function uploadGoodsSKUImageDlg(trCount, imageInfos, imageType) {
    this.trCount = trCount;
    this.imageInfos = imageInfos;
    this.imageType = imageType;
}

$.extend(uploadGoodsSKUImageDlg.prototype, Dialog.prototype, {
    createContent: function () {
        var sb = new StringBuilder();
        sb.append('<div width="750px" class="pb15">');
        sb.append('<table border="0" cellspacing="0" cellpadding="0" class="scm_upimg" id="goodsSKUImages_Table">');
        sb.append('     <tbody>');
        sb.append('         <tr align="left">');
        sb.append('            <td rowspan="2">');
        sb.append('                 <span>选择水印：</span>');
        sb.append('            </td>');
        sb.append('            <td colspan = "2">');
        sb.append('                 <input type="checkbox" value="checkbox" id="chkgoodslogo" checked="checked"><span>加时光Logo水印</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodslogo" value="3" id="radiogoodslogo3"><span>右上</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodslogo" value="7" id="radiogoodslogo6"><span>右下</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodslogo" value="1" id="radiogoodslogo1"><span>左上</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodslogo" value="5" id="radiogoodslogo5"><span>左下</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodslogo" value="4" id="radiogoodslogo4"  checked="checked"><span>居中</span>');
        sb.append('            </td>');
        sb.append('         </tr>');
        sb.append('         <tr align="left">');
        sb.append('            <td colspan = "2">');
        sb.append('                 <input type="checkbox" value="checkbox" id="chkgoodsdesign" checked="checked"><span>加原创正版水印</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodsdesign" value="3" id="radiogoodsdesign3" checked="checked"><span>右上</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodsdesign" value="7" id="radiogoodsdesign6"><span>右下</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodsdesign" value="1" id="radiogoodsdesign1"><span>左上</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodsdesign" value="5" id="radiogoodsdesign5"><span>左下</span>');
        sb.append('            </td>');
        sb.append('            <td>');
        sb.append('                 <input type="radio" name="radiogoodsdesign" value="4" id="radiogoodsdesign4"><span>居中</span>');
        sb.append('            </td>');
        sb.append('          </tr>');
        sb.append('         <tr>');
        for (var i = 1; i < 9; i++) {
            sb.append('            <td>');
            sb.append('                <p>');
            sb.append('                    <a href="javascript:void(0)" count="' + i + '" data-action="leftMoveImage" >&lt;左移</a> │');
            sb.append('                    <a href="javascript:void(0)" count="' + i + '" data-action="rightMoveImage">右移&gt;</a>');
            sb.append('               </p>');
            if (this.imageType == "width") {
                sb.append('               <p class="upimgWidth">');
            }
            else {
                sb.append('               <p class="upimg">');
            }
            if (this.imageType == "width") {
                sb.append('                    <img width="78" height="39" id="img_cover' + i + '" alt="" src="/img/main_img.jpg">');
            }
            else {
                sb.append('                    <img width="78" height="78" id="img_cover' + i + '" alt="" src="/img/main_img.jpg">');
            }
            sb.append('               </p>');
            sb.append('               <div>');
            sb.append('                   <input type="hidden" id="img_url' + i + '" value="">');
            sb.append('                   <div style="display: none;z-index: 999999" id="btn_upload_cover_holder' + i + '">');
            sb.append('                   </div>');
            sb.append('                   <a href="javascript:void(0)"  id="btn_upload_cover' + i + '">上传</a> <a href="javascript:void(0)" data-action="deleteImage1" count="' + i + '">删除</a>');
            sb.append('               </div>');
            sb.append('            </td>');
        }
        sb.append('            </tr>');
        sb.append('     </tbody>');
        sb.append('</table>');
        sb.append('</div>');

        sb.append('<div style="margin-top:30px;margin-left:20px;">');
        sb.append('     <div style="display: none;" id="btn_batch_upload_cover_holder"></div>');
        sb.append('     <a href="javascript:void(0)" id="btn_batch_upload_cover">批量上传</a>');
        sb.append('     <span id="divmsg" style="margin-left:50px;"></span>');
        sb.append('</div>');
        return sb.toString();
    },

    onload: function () {
        for (var i = 0; i < 8; i++) {
            this.find("#img_cover" + (i + 1)).attr("src", this.imageInfos[i].imageURL);
            this.find("#img_url" + (i + 1)).val(this.imageInfos[i].imagePatch);
        }
        var hidConfigBrandID = $("#hidConfigBrandID").val();
        var hidBrandID = $("#hidBrandID").val();
        //如果品牌ID不等于配置的品牌ID
        if (hidConfigBrandID != hidBrandID) {
            this.find("#chkgoodsdesign").removeAttr("checked");
        }
        $.action.add("leftMoveImage", this.leftMoveImage.bind(this));
        $.action.add("rightMoveImage", this.rightMoveImage.bind(this));
        $.action.add("deleteImage1", this.deleteImage1.bind(this));
        this.imageInit1();
        this.imageInit2();
        this.imageInit3();
        this.imageInit4();
        this.imageInit5();
        this.imageInit6();
        this.imageInit7();
        this.imageInit8();
        this.batchImageInit();
        //this.imageInitialize1();
        //this.batchImageInitialize();
    },

    //左移动图片
    leftMoveImage: function (e) {
        var $target = $(e.target);
        var count = $target.attr("count");
        if (count == 1) {
            this.setError("已经到达最左边，不能再移动了");
            //$alert("错误提示", "已经到达最左边，不能再移动了");
        }
        else {
            this.setError("");
            var rigthImageCount = parseInt(count, 10) - 1;
            var rightImage = this.find("#img_url" + rigthImageCount).val();
            var rightImageCover = this.find("#img_cover" + rigthImageCount).attr("src");
            var leftImage = this.find("#img_url" + count).val();
            var leftImageCover = this.find("#img_cover" + count).attr("src");
            if (leftImage.length == 0) {
                this.setError("还没有上传图片，不能左移动");
                //$alert("错误提示：", "还没有上传图片，不能左移动");
            }
            else {
                this.setError("");
                if (rightImage.length == 0) {
                    this.find("#img_url" + count).val("");
                    this.find("#img_cover" + count).attr("src", "/img/inner_img.jpg");
                }
                else {
                    this.find("#img_url" + count).val(rightImage);
                    this.find("#img_cover" + count).attr("src", rightImageCover);
                }

                this.find("#img_url" + rigthImageCount).val(leftImage);
                this.find("#img_cover" + rigthImageCount).attr("src", leftImageCover);
            }
        }
    },

    //右移动图片
    rightMoveImage: function (e) {
        var $target = $(e.target);
        var count = $target.attr("count");
        if (count == 8) {
            this.setError("已经到达最右边，不能再移动了");
            //$alert("错误提示", "已经到达最右边，不能再移动了");
        }
        else {
            this.setError("");
            var rigthImageCount = parseInt(count, 10) + 1;
            var rightImage = this.find("#img_url" + rigthImageCount).val();
            var rightImageCover = this.find("#img_cover" + rigthImageCount).attr("src");
            var leftImage = this.find("#img_url" + count).val();
            var leftImageCover = this.find("#img_cover" + count).attr("src");

            if (leftImage.length == 0) {
                this.setError("还没有上传图片，不能左移动");
                //$alert("错误提示：", "还没有上传图片，不能左移动");
            }
            else {
                this.setError("");
                if (rightImage.length == 0) {
                    if (rigthImageCount == 2) {
                        this.find("#img_url" + count).val("");
                        this.find("#img_cover" + count).attr("src", "/img/main_img.jpg");
                    }
                    else {
                        this.find("#img_url" + count).val("");
                        this.find("#img_cover" + count).attr("src", "/img/inner_img.jpg");
                    }
                }
                else {
                    this.find("#img_url" + count).val(rightImage);
                    this.find("#img_cover" + count).attr("src", rightImageCover);
                }
                this.find("#img_url" + rigthImageCount).val(leftImage);
                this.find("#img_cover" + rigthImageCount).attr("src", leftImageCover);
            }
        }
    },

    //删除图片
    deleteImage1: function (e) {
        var $target = $(e.target);
        var count = $target.attr("count");
        var numberArr = count.split('_');
        var number = 0;
        if (numberArr.length > 1) {
            number = numberArr[1];
        }
        else {
            number = count;
        }
        this.find("#img_url" + count).val("");
        if (number == 1) {
            this.find("#img_cover" + count).attr("src", "/img/main_img.jpg");
        }
        else {
            this.find("#img_cover" + count).attr("src", "/img/inner_img.jpg");
        }

    },

    //#****单个上传图片 begin****/
    imageInit1: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover1',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover1"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover1').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url1').val(response[0].imgPath);
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
    },

    imageInit2: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover2',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover2"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover2').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url2').val(response[0].imgPath);
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
    },

    imageInit3: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover3',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover3"},
            init: {
                FilesAdded: function (up, files) {
                    uploader.start();
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover3').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url3').val(response[0].imgPath);
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
    },

    imageInit4: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover4',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover4"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover4').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url4').val(response[0].imgPath);
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
    },

    imageInit5: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover5',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover5"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover5').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url5').val(response[0].imgPath);
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
    },

    imageInit6: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover6',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover6"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover6').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url6').val(response[0].imgPath);
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
    },

    imageInit7: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover7',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover7"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover7').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url7').val(response[0].imgPath);
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
    },

    imageInit8: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadwatermarkimage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_upload_cover8',
            multi_selection: false,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "img_cover8"},
            init: {
                FilesAdded: function (up, files) {
                    var radiogoodslogo = $("input:radio[name=radiogoodslogo]:checked").val();

                    var radiogoodsdesign = $("input:radio[name=radiogoodsdesign]:checked").val();

                    var chkgoodslogo = 0;
                    if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                        chkgoodslogo = 1;
                    }

                    var chkgoodsdesign = 0;

                    if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                        chkgoodsdesign = 1;
                    }
                    uploader.settings.multipart_params.imageSize = "200";
                    uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                    uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                    uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                    uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
                    uploader.start();
                    return false;
                },
                FileUploaded: function (up, file, info) {//文件上传完毕触发
                    console.log("单独文件上传完毕");
                    if (info.status == 200) {
                        var response = $.parseJSON(info.response);
                        console.log("url:" + response[0].url);
                        $('#img_cover8').attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $('#img_url8').val(response[0].imgPath);
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
    },

    //#****单个上传图片 end****/


    //#****批量上传图片 begin****/

    batchImageInit: function () {
        var uploader = new plupload.Uploader({
            runtimes: 'html5,flash',//设置运行环境，会按设置的顺序，可以选择的值有html5,gears,flash,silverlight,browserplus,html
            flash_swf_url: 'js/view/testimage//Moxie.swf',
            silverlight_xap_url: 'js/view/testimage/Moxie.xap',
            url: '/image/uploadWatermarkLogoImage',//上传文件路径
            max_file_size: '5mb',//100b, 10kb, 10mb, 1gb
            unique_names: true,//生成唯一文件名
            browse_button: 'btn_batch_upload_cover',
            multi_selection: true,
            filters: [{title: "Image files", extensions: "jpg,gif,png"}],
            multipart_params: {"loading": "btn_batch_upload_cover", "img_cover": "img_cover", "img_url": "img_url"},
            init: {
                FilesAdded: function (up, files) {
                    if (files.length > 8) {
                        $alert("提示：", "批量上传一次最多8张图片,您上传了" + files.length + "张图片。");
                    } else {
                        var radiogoodslogo = $(":radio[name=radiogoodslogo][checked]").val();
                        var radiogoodsdesign = $(":radio[name=radiogoodsdesign][checked]").val();
                        var chkgoodslogo = 0;
                        if ($("input:checkbox[id=chkgoodslogo]:checked").length > 0) {
                            chkgoodslogo = 1;
                        }
                        var chkgoodsdesign = 0;

                        if ($("input:checkbox[id=chkgoodsdesign]:checked").length > 0) {
                            chkgoodsdesign = 1;
                        }
                        uploader.settings.multipart_params.imageSize = "200";
                        uploader.settings.multipart_params.radiogoodslogo = radiogoodslogo;
                        uploader.settings.multipart_params.radiogoodsdesign = radiogoodsdesign;
                        uploader.settings.multipart_params.chkgoodslogo = chkgoodslogo;
                        uploader.settings.multipart_params.chkgoodsdesign = chkgoodsdesign;
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
                        $("#" + uploader.settings.multipart_params.img_cover + index).attr("src", response[0].url);
                        console.log("imgPath:" + response[0].imgPath);
                        $("#" + uploader.settings.multipart_params.img_url + index).val(response[0].imgPath);
                    }
                    $(".plupload-loading").remove();
                },
                UploadComplete: function (uploader, files) {
                    $(".plupload-loading").remove();
                    uploader.splice(0, uploader.total.uploaded);
                    console.log(uploader);
                },
                UploadProgress: function (uploader, file) {
                    //var $img = $("#enLogoImg");
                    //var index = uploader.total.uploaded + 1;
                    //var $img = $("#" + uploader.settings.multipart_params.loading + index);
                    var $img = $("#" + uploader.settings.multipart_params.loading);
                    //if (uploader.total.uploaded > 8) {
                    // $('<img id="plupload-loading'+index+'" src="/img/loading.gif" style="position:absolute;z-index:100000;"/>').css({
                    //     top: $img.offset().top + ($img.outerHeight() - 16) / 2,
                    //     left: $img.offset().left + ($img.outerWidth() - 16) / 2
                    // }).appendTo(document.body);
                    $('<img class="plupload-loading" src="/img/loading.gif" style="position:absolute;z-index:100000;"/>').css({
                        top: $img.offset().top + ($img.outerHeight() - 16) / 2,
                        left: $img.offset().left + ($img.outerWidth() - 16) / 2
                    }).appendTo(document.body);
                    //}
                },
                Error: function (uploader, err) {
                    $alert("消息", "code:" + err.code + "  message:" + err.message);
                }
            }
        });

        uploader.init();
    },

    //#****批量上传图片 end****/

    getGoodsSKUImages: function () {
        var imageInfos = [];
        for (var i = 1; i < 9; i++) {
            var $imageURL = this.find("#img_cover" + i);
            var $imagePatch = this.find("#img_url" + i);
            var imageInfo = {
                imageURL: $imageURL.attr("src"),
                imagePatch: $imagePatch.val()
            };
            imageInfos.push(imageInfo);
        }

        return imageInfos;
    }
});


// 初始化
$(function () {
    new AddOrEditGoodsImagesVideosClient().initialize();
});