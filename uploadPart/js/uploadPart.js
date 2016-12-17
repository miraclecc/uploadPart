/**
 * 上传相关js
 */
(function ($){

	if(typeof $.xy == "undefined"){
		$.xy = {};
	}
	
	if(typeof $.xy.upload == "undefined"){
		$.xy.upload = {};
	}

	//上传信息提醒
	$.xy.upload.showMsg = function(errMsg){
		if(errMsg != null && $.trim(errMsg) != "")		
			alert(errMsg);
	}
	//点击上传按钮出上传图片弹窗
	$.xy.upload.clickUploadDialog = function (picCount) {
		$.xy.upload.dialogTpl(picCount);
	}

	$.xy.upload.dialogTpl = function (picCount) {
		var tpl = '<div class="uploadBox">'
                        +'<div class="scroll uploadedBox">'
                        +'<a class="prev" href="javascript:void(0)"><</a> '
                        +'<div class="slidebBox"> '
                            +'<div class="scroll_list"> '
                                +'<ul> '
                                +'</ul>'
                            +'</div> '
                        +'</div> '
                        +'<a class="next" href="javascript:void(0)">></a>'
                        +'<p class="scrollSign">*照片上传完成后会显示在上方图框中</p>'
                    +'</div>'
                    +'<div class="imgBox">'
                    	+'<iframe id="ifm1" name="ifm1" style="display:none" src=""></iframe><!-- 防止form刷新 -->'
                		+'<input type="hidden" id="returnID"/>         <!-- 返回的ID -->'
						+'<input type="hidden" id="webServerName"/>    <!-- web服务器名称 -->'
						+'<input type="hidden" id="uploadToken"/>      <!-- 存储token -->'
						+'<input type="hidden" id="uploadServerName"/> <!-- 存储token -->'
                        +'<form id="uploadPic" target="ifm1" method="post" enctype="multipart/form-data" action="" >'
							+'<input type="hidden" name="fromTypeCms" value="cms" /><!--  后台上传cms  -->'
							+'<input class="fileInput" id="fileInput" accept="image/png,image/jpeg" value="" name="file" type="file" />'
						+'</form>'
						+'<p></p>'
						+'<div class="addimg"></div>'
                    +'</div>'
                    +'<div id="progress">'
                        +'<p class="bar"></p>'
                    +'</div>'
                    +'<ul>'
                        +'<li class="upClose"><div id="statusID"></div></li>'
                        +'<li class="close">关闭</li>'
                    +'</ul>'
                +'</div> ';
            $("body").append(tpl);  
            $("#fileInput").change(function(){
            	$.xy.upload.clickUploadPic($(this)[0],'uploadPic','statusID',picCount);
            })
	}

	var timeUpload = null;
	var uid = "";
	//上传图片选择
	$.xy.upload.clickUploadPic = function (uploadElement, fromID, statusID, picCount) {
		var checkType = _checkUploadFileType(uploadElement);
		if(!checkType)
			return;
		if(picCount > $(".slidebBox li").length){
			$.xy.upload.getUploadStatus(uploadElement, fromID, statusID);
		}else{
			alert("最多只能传"+ picCount +"张")
		}
	}
	
	// 检查上传文件类型
	_checkUploadFileType = function (obj) {
		var ALLOWED_TYPE = ".jpg|.jpeg|.gif|.png";
		var errUploadType = '目前只支持"JPG"或者"JPEG"或者"GIF"或者"PNG"格式';
		if(!(ALLOWED_TYPE.indexOf(obj.value.slice(obj.value.lastIndexOf(".")).toLowerCase())!=-1)){
			if(navigator.userAgent.toLowerCase().indexOf("firefox")>=0)
		 	 	obj.value = "";
		 	else{
			 	obj.select();
			 	obj.outerHTML += "";
		 	}	
		 	$.xy.upload.showMsg(errUploadType);	//错误信息
		 	return false;	
		}
		return true;
	}
	//上传进度条入口  uploadElement上传控件对象  uploadType：上传类型  formID：FORMID  statusID: 进度条div ID	
	$.xy.upload.getUploadStatus = function(uploadElement, formID, statusID){
		var xingyunDomain = "http://wwwww.xingyun.cc:8088"//$.trim($("#xingyunDomain").val());
		if(xingyunDomain == null || xingyunDomain == ""){
			alert("前台域名为空 影响上传!");
			return;
		}
		var requestUrl = xingyunDomain + "/commonAction_getUploadUrl.action";
		//获取上传服务信息
		$.ajax({
			url: requestUrl,
			type:"get",
			dataType:"jsonp",
			async:false,
			success:function(response){
				if(response == "dataErr" || response == ""){
					$.xy.upload.showMsg("数据错误,请刷新页面重新操作！");
					return;
				}else{
					var webserver = response.webserver;
					var uploadserver = response.uploadserver;
					var upKey = response.upKey;
					var uploadUrl = response.uploadurl;
					//此get请求作用：与上传服务建立握手
					$.ajax({
						url:uploadUrl,
						type:"get",
						dataType:"jsonp",
						async:false,
						success:function(response){
							$("#webServerName").val(webserver);
							$("#uploadServerName").val(uploadserver);
							if(uid != ''){
								$("#uploadServerName_"+uid).val(uploadserver);
							}
							$("#uploadToken").val(upKey);
							$("#" + formID).attr("action", uploadUrl);
							$("#" + formID).submit();
							$(uploadElement).attr("disabled", true);
							//打开进度条层
							$("#" + statusID).html("").show();	
							//处理上传进度条层
							setTimeout(function(){_showUploadStatus(uploadElement,uploadUrl, statusID);}, 2000);
						}
					});
				}
			}
		});
		return true;
	}
	//显示进度条
	var requestCountTag = 0;
	_showUploadStatus = function(uploadElement,uploadUrl, statusID){
		$.ajax({
			url:uploadUrl,
			type:"get",
			dataType:"jsonp",
			success:function(response){
				try{
					if(response != null && response != "" && response != "null"){
						var bytesRead = response.bytesRead;
						var totalSize = response.totalSize;
						var fileLength = response.fileLength;
						
						//进度条
						if(totalSize > 0 && bytesRead > 0){	
							var progressPercent = Math.ceil((bytesRead / totalSize) * 100);
							var msgHtml = "总大小:" + response.fileLength + " 上传进度：" + progressPercent + "%";
							$("#" + statusID).html(msgHtml);
						}
						if (response.code == "2"){
							timeUpload = setTimeout(function(){_showUploadStatus(uploadElement,uploadUrl, statusID);}, 1000);
							return ;
						}else {//上传中
							clearTimeout(timeUpload);	//上传后清理定时器timeUpload
							var msgHtml = msgHtml = "总大小:" + response.fileLength + " 上传进度：" + progressPercent + "%";
							$("#" + statusID).html(msgHtml);
							_showUploadPicData(uploadElement,statusID,response);	//处理显示图片
						}
					}else{
						requestCountTag++;
						if(requestCountTag >= 30){
							clearTimeout(timeUpload);
							$("#" + statusID).html("");	
							$.xy.upload.showMsg("上传出错！");
							_setUploadButton(false);	//设置上传按钮可用
						}
						timeUpload = setTimeout(function(){_showUploadStatus(uploadElement, uploadUrl, statusID);}, 5000);
					}
				}catch(e){
					clearTimeout(timeUpload);//上传后清理timeUpload
					$.xy.upload.showMsg("上传出错！");
				}
			},
			error : function(data) {
				$.xy.upload.showMsg("上传出错！");
			}
		});
	}
	
	//处理显示上传图片数据
	_showUploadPicData = function(uploadElement,statusID,response){
		try{
			var msg = "";
			if(response.code == "1" && response.pic.length > 0)
				_showPicByType(uploadElement,statusID,response);
			else if(response.code == "102")
				msg = "上传图片超过3M限制！";
			else if(response.code == "103")
				msg = "上传总大小超过限制！";
			else //上传错误信息
				msg = "上传出错！";
			$.xy.upload.showMsg(msg);	
			$(uploadElement).attr("disabled", false);
		}catch(e){
			console.log(e);
			$.xy.upload.showMsg("上传出错！");	
		}
	}
	_showPicByType = function(uploadElement,statusID,response){
		/*var picName = response.pic[0].picName;
		$("#picName").val(picName);
		$(uploadElement).attr("disabled", false);
		$("#"+statusID).hide();
		
		var picUrl = $("#webServerName").val() + response.pic[0].visitPath;
		var image = new Image();
		$(image).one("load",function(){
			$("#showUploadPic"+adpicid).attr("height", "").attr("src", picUrl);
			$("#showSrcUploadPic").attr("href", picUrl);
			adpicid = "";
		});
		image.src = picUrl;*/
		var picUrl = $("#webServerName").val() + response.pic[0].visitPath;
		$(".slidebBox ul").append('<li><img src="'+ picUrl +'" /><span></span></li>');
		_slide();
		_back(response.pic[0].picName,$("#uploadServerName").val());	
	}
	//返回给父窗口的参数
	_back=function(picName,uploadServerName) {   
		if(window.opener) {   
			//window.opener 找到打开该窗体的父窗体  
			var rerturn=$("#returnID").val();
			parentWindowElement = window.opener.document.getElementById(rerturn);  
			parentWindowElement.setAttribute("picName",picName);
			parentWindowElement.setAttribute("uploadServerName",uploadServerName);
			
			parentWindowImg = window.opener.document.getElementById(rerturn+"_img");
			if(parentWindowImg!=null)
			parentWindowImg.setAttribute("src",uploadServerName+"/"+picName);
			
		}	
	}

	_slide = function(){
		//滑动插件
        var page= 1; 
        var i = 6;//每版四个图片 
        //向右滚动 
        $(".uploadBox").on("click",".next",function(){ //点击事件 
            var v_wrap = $(this).parents(".scroll"); // 根据当前点击的元素获取到父元素 
            var v_show = v_wrap.find(".scroll_list"); //找到视频展示的区域 
            var v_cont = v_wrap.find(".slidebBox"); //找到视频展示区域的外围区域 
            var v_width = v_cont.width(); 
            var len = v_show.find("li").length; //我的视频图片个数 
            var page_count = Math.ceil(len/i); //只要不是整数，就往大的方向取最小的整数 
            if(!v_show.is(":animated")){ 
                if(page == page_count){ 
                    v_show.animate({left:'0px'},"slow"); 
                    page =1; 
                }else{ 
                    v_show.animate({left:'-='+v_width},"slow"); 
                    page++; 
                } 
            } 
        }); 
        //向左滚动 
        $(".uploadBox").on("click",".prev",function(){ //点击事件
            var v_wrap = $(this).parents(".scroll"); // 根据当前点击的元素获取到父元素 
            var v_show = v_wrap.find(".scroll_list"); //找到视频展示的区域 
            var v_cont = v_wrap.find(".slidebBox"); //找到视频展示区域的外围区域 
            var v_width = v_cont.width(); 
            var len = v_show.find("li").length; //我的视频图片个数 
            var page_count = Math.ceil(len/i); //只要不是整数，就往大的方向取最小的整数 
            if(!v_show.is(":animated")){ 
                if(page == 1){ 
                    v_show.animate({left:'-='+ v_width*(page_count-1)},"slow"); 
                    page =page_count; 
                }else{ 
                    v_show.animate({left:'+='+ v_width},"slow"); 
                    page--; 
                } 
            } 
        }); 
	}
})(jQuery);