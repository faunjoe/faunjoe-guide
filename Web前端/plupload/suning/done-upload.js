//图片上传
var cmt = cmt || {};
cmt.pluploadChange = function(omsOrderItemId){
	var domains = function(){
		var env = '';
		if(location.host.indexOf('reviewsit') > -1){
			env = 'sit';
		}else if(location.host.indexOf('reviewpre') > -1){
			env = 'pre';
		}else{
			env= 'prd';
		}

		return {
			sit: {
				review: '//reviewsit.cnsuning.com',
				reviewImage: '//reviewsit.loadimage.cnsuning.com'
			},
			pre: {
				review: '//reviewpre.cnsuning.com',
				reviewImage: '//reviewimagepre.cnsuning.com'
			},
			prd: {
				review: '//review.suning.com',
				reviewImage: '//reviewimage.suning.com'
			}
		}[env];
	}();

	initUpload('plupload-1');
	initUpload('plupload-2');

	function initUpload(buttonId){
	    var uploader = new plupload.Uploader({
	        browse_button : buttonId, //触发文件选择对话框的按钮，为那个元素id
	   		url: domains.reviewImage + '/imageload/uploadImg.do', //服务器端的上传页面地址
	        flash_swf_url : domains.review + '/project/review/js/plupload/Moxie.swf', //swf文件，当需要使用swf方式进行上传时需要配置该参数
	        silverlight_xap_url : domains.review +  '/project/review/js/plupload/Moxie.xap', //silverlight文件，当需要使用silverlight方式进行上传时需要配置该参数
	   		multipart_params: {
	   			"omsOrderItemId" : omsOrderItemId,
				"custNum" : $("#custNum").val(),
				"deviceType" : "1",
				"isReviewFlag": 'n',
				"reviewId": ''
	   		},
	   		filters: {
			  mime_types : [ //只允许上传图片和zip文件
			    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
			  ],
			  prevent_duplicates : true //不允许选取重复文件
			},
			file_data_name: 'Filedata',
			// container: buttonId,
			runtimes: 'html5,html4,flash'
	    });    

	    //在实例对象上调用init()方法进行初始化
	    uploader.init();
	    var errorFlag = false;

	    uploader.bind('FilesAdded', function(uploader, files){
/*	    	var currentSize = $('.upload-pic .pic-item').length;
	    	if(currentSize + files.length > 5) {//files是选择的文件，uploader.files是队列里的文件
                $('.upload-tip .txt-error').show().find('span').html("最多只能上傳5張圖片");
            	$('.upload-pic .continueAdd').hide();
            	uploader.splice(5 - currentSize, currentSize + uploader.files.length - 5);
            }*/
/*          	$.each(uploader.files, function(i, n){
          		if($('#' + n.id).length == 0){
           			$('.upload-pic .continueAdd').before('<li class="loading pic-item" id="' + n.id + '"><i class="icon-load"></i></li>');
          		}
          	});*/
/*          	if($('.upload-pic .pic-item').length == 5){
            	$('.upload-tip .txt-error').show().find('span').html("最多只能上傳5張圖片"); 
            	$('.upload-pic .continueAdd').hide();
            }*/
            if(errorFlag){
            	errorFlag = false;
            }else{
            	$('.w-comment .upload-tip .txt-error').hide();
            }
          	$('.w-comment .cmt-show, .w-comment .upload-pic').show();
	    	uploader.start();
	    });
	    uploader.bind('FileFiltered', function(uploader, file){
	    	var fileSize = file.origSize
            if (fileSize > 5242880) {
                uploader.removeFile(file)
				$('.upload-tip .txt-error').show().find('span').html('图片大小不能超过5M哦');
				pclog('评价图片大小超过5M');
                errorFlag = true;
                return;
            }
            if($('.w-comment .upload-pic .pic-item').length == 4){
            	$('.w-comment .upload-pic .continueAdd').hide();
            }

            if($('.w-comment .upload-pic .pic-item').length == 5){
            	$('.w-comment .upload-tip .txt-error').show().find('span').html("最多只能上传5张图片");
            	errorFlag = true;
            	uploader.removeFile(file);
            }else{
            	$('.w-comment .upload-pic .continueAdd').before('<li class="loading pic-item" id="' + file.id + '"><i class="icon-load"></i></li>');
            	$('.w-comment .picnumtip span').text(5 - $('.w-comment .upload-pic .pic-item').length);
            }
	    });
	    uploader.bind('UploadProgress', function(uploader, files){
	    	
	    });
	    uploader.bind('FileUploaded', function(uploader, file, res){
	        var responseObj = $.parseJSON(res.response);
	        if (responseObj.errorcode == "1") {
	        	var img  = new Image();
	        	img.onload = function(){
	        		$('#' + file.id).append(img).find(".icon-load").remove();
	        		$('#' + file.id).find('img').attr({
	        			src2: responseObj.src + "_400x400.jpg",
	        			imgId: responseObj.imgId
	        		}).after('<p class="opt" style="bottom: -20px;">\
	        			<span class="edit">编辑</span><span class="del">删除</span>\
	        		</p>');
	        	}
	       		img.src = responseObj.src + "_60x60.jpg";
	        } else {
	        	$('.w-comment .upload-tip .txt-error').show().find('span').html(responseObj.errMsg);
	        	$('#' + file.id).remove();
	        	$('.w-comment .continueAdd').show();
	        	$('.w-comment .picnumtip span').text(5 - $('.w-comment .upload-pic .pic-item').length);
	        }
	    });
	   	uploader.bind('Error', function(uploader, errObject){
	        if(errObject.code == -600) {
	        	$('.w-comment .cmt-show, .w-comment .upload-pic').show();
	        	$('.w-comment .upload-tip .txt-error').show().find('span').html("图片大小不能超过5M哦");
	        }else if(errObject.code == -601){
	        	$('.w-comment .cmt-show, .w-comment .upload-pic').show();
	        	$('.w-comment .upload-tip .txt-error').show().find('span').html("请选择jpg、jpeg、gif、bmp、png等格式图片");
	        }
	    });
	}
};

cmt.pluploadAgain = function(omsOrderItemId){
	var domains = function(){
		var env = '';
		if(location.host.indexOf('reviewsit') > -1){
			env = 'sit';
		}else if(location.host.indexOf('reviewpre') > -1){
			env = 'pre';
		}else{
			env= 'prd';
		}

		return {
			sit: {
				review: '//reviewsit.cnsuning.com',
				reviewImage: '//reviewsit.loadimage.cnsuning.com'
			},
			pre: {
				review: '//reviewpre.cnsuning.com',
				reviewImage: '//reviewimagepre.cnsuning.com'
			},
			prd: {
				review: '//review.suning.com',
				reviewImage: '//reviewimage.suning.com'
			}
		}[env];
	}();

	var uploadDom = $('.comtscont-addcomts:visible');
	var id1 = 'plupload-' + new Date().getTime() + Math.floor(Math.random() * 1000);
	uploadDom.find('.upload-place').eq(0).attr('id', id1);
	var id2 = 'plupload-' + new Date().getTime() + Math.floor(Math.random() * 1000);
	uploadDom.find('.upload-place').eq(0).attr('id', id2);

	initUpload(id1);
	initUpload(id2);

	function initUpload(buttonId){
	    var uploader = new plupload.Uploader({
	        browse_button : buttonId, //触发文件选择对话框的按钮，为那个元素id
	   		url: domains.reviewImage + '/imageAgainLoad/uploadImg.do', //服务器端的上传页面地址
	        flash_swf_url : domains.review + '/project/review/js/plupload/Moxie.swf', //swf文件，当需要使用swf方式进行上传时需要配置该参数
	        silverlight_xap_url : domains.review +  '/project/review/js/plupload/Moxie.xap', //silverlight文件，当需要使用silverlight方式进行上传时需要配置该参数
	   		multipart_params: {
	   			"omsOrderItemId" : omsOrderItemId,
				"custNum" : $("#custNum").val(),
				"deviceType" : "1",
				"isReviewFlag": 'n',
				"reviewId": ''
	   		},
	   		filters: {
			  mime_types : [ //只允许上传图片和zip文件
			    { title : "Image files", extensions : "jpg,jpeg,gif,png,bmp" }
			  ],
			  prevent_duplicates : true //不允许选取重复文件
			},
			file_data_name: 'Filedata',
			// container: buttonId,
			runtimes: 'html5,html4,flash'
	    });    

	    //在实例对象上调用init()方法进行初始化
	    uploader.init();
	    var errorFlag = false;

	    uploader.bind('FilesAdded', function(uploader, files){
/*	    	var currentSize = $('.upload-pic .pic-item').length;
	    	if(currentSize + files.length > 5) {//files是选择的文件，uploader.files是队列里的文件
                $('.upload-tip .txt-error').show().find('span').html("最多只能上傳5張圖片");
            	$('.upload-pic .continueAdd').hide();
            	uploader.splice(5 - currentSize, currentSize + uploader.files.length - 5);
            }*/
/*          	$.each(uploader.files, function(i, n){
          		if($('#' + n.id).length == 0){
           			$('.upload-pic .continueAdd').before('<li class="loading pic-item" id="' + n.id + '"><i class="icon-load"></i></li>');
          		}
          	});*/
/*          	if($('.upload-pic .pic-item').length == 5){
            	$('.upload-tip .txt-error').show().find('span').html("最多只能上傳5張圖片"); 
            	$('.upload-pic .continueAdd').hide();
            }*/
            if(errorFlag){
            	errorFlag = false;
            }else{
            	$('.upload-tip .txt-error', uploadDom).hide();
            }
          	$('.cmt-show, .upload-pic', uploadDom).show();
	    	uploader.start();
	    });
	    uploader.bind('FileFiltered', function(uploader, file){
	    	var fileSize = file.origSize
            if (fileSize > 5242880) {
                uploader.removeFile(file)
				$('.upload-tip .txt-error', uploadDom).show().find('span').html('图片大小不能超过5M哦');
				pclog('评价图片大小超过5M');
                errorFlag = true;
                return;
            }
            if($('.upload-pic .pic-item', uploadDom).length == 4){
            	$('.upload-pic .continueAdd', uploadDom).hide();
            }

            if($('.upload-pic .pic-item', uploadDom).length == 5){
            	$('.upload-tip .txt-error', uploadDom).show().find('span').html("最多只能上传5张图片");
            	errorFlag = true;
            	uploader.removeFile(file);
            }else{
            	$('.upload-pic .continueAdd', uploadDom).before('<li class="loading pic-item" id="' + file.id + '"><i class="icon-load"></i></li>');
            	$('.picnumtip span', uploadDom).text(5 - $('.upload-pic .pic-item', uploadDom).length);
            }
	    });
	    uploader.bind('UploadProgress', function(uploader, files){
	    	
	    });
	    uploader.bind('FileUploaded', function(uploader, file, res){
	        var responseObj = $.parseJSON(res.response);
	        if (responseObj.errorcode == "1") {
	        	var img  = new Image();
	        	img.onload = function(){
	        		$('#' + file.id).append(img).find(".icon-load").remove();
	        		$('#' + file.id).find('img').attr({
	        			src2: responseObj.src + "_400x400.jpg",
	        			imgId: responseObj.imgId
	        		}).after('<p class="opt" style="bottom: -20px;">\
	        			<span class="edit">编辑</span><span class="del">删除</span>\
	        		</p>');
	        	}
	       		img.src = responseObj.src + "_60x60.jpg";
	        } else {
	        	$('.upload-tip .txt-error', uploadDom).show().find('span').html(responseObj.errMsg);
	        	$('#' + file.id).remove();
	        	$('.continueAdd', uploadDom).show();
	        	$('.picnumtip span', uploadDom).text(5 - $('.upload-pic .pic-item', uploadDom).length);
	        }
	    });
	   	uploader.bind('Error', function(uploader, errObject){
	        if(errObject.code == -600) {
	        	$('.cmt-show, .upload-pic', uploadDom).show();
				$('.upload-tip .txt-error', uploadDom).show().find('span').html("图片大小不能超过5M哦");
				pclog('评价图片大小超过5M');
	        }else if(errObject.code == -601){
	        	$('.cmt-show, .upload-pic', uploadDom).show();
	        	$('.upload-tip .txt-error', uploadDom).show().find('span').html("请选择jpg、jpeg、gif、bmp、png等格式图片");
	        }
	    });
	}
};