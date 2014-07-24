jQuery(function($){
	//先将html的overflow设为hidden,然后再在js里面设为auto是为了处理chrome的自定义scrollbar无法显示的问题
    //只有动态改变overflow值才能在html节点上生效
    $("html").css("overflow","auto");

    (function(){
        //支持触摸设备，需要扩大可点击范围
        if("ontouchstart" in window || window.navigator.pointerEnabled || window.navigator.msPointerEnabled){
            //enable :active selector
            document.addEventListener("touchstart", function() {},false);
            $("body").addClass("touch-device");
        }

        if(window.top != self) $("body,html").addClass("in-frame");
        else $("body,html").addClass("top-win");
        
        if(document.createElement("a").download != "") $("body").addClass("no-attr-dl");
        else $("body").addClass("attr-dl");

        if(window._ENV){
            var os_class = window._ENV.os.replace(/[\s|\_]/g,"-").toLowerCase();
            var browser_class = window._ENV.browser.replace(/[\s|\_]/g,"-").toLowerCase();
            $("body").addClass(os_class+" "+browser_class);
        }

        toggleHvr(null,"#share_cont article,#share_cont article a,.other-con .item a.block");

        //若其他分享内容中有图片链接，则作为缩略背景
        $(".item .content").each(function(){
        	var feature_img = $(this).find("a[rel=\"image\"]").get(0);
        	var $item = $(this).closest(".item");
        	
        	if(feature_img){
        		is_image_url(feature_img.href,function(img){
        			var cover = $item.find(".cover").get(0);
        			if(cover){
        				$(cover).addClass("show");
        				cover.style.backgroundImage = "url("+feature_img.href+")";
        			}
        		});
        	}
        });

        //内容中包含有图片链接转换为图片，并自居一行，居中对齐
        $("#share_cont article a[rel=\"image\"]").each(function(){
            var src = this.href;
            var img = this;
            if(src){
                is_image_url(src,function(){
                    $(img).wrap("<div class=\"entity\">").parent().html("<img src=\""+src+"\">");
                });
            }
        });

    })();
});