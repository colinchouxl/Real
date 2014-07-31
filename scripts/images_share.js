/**
 * 图片分享页面脚本(展示图片墙，统计数据，广告，简单交互)
 */

jQuery(function($){
    var isTouchSupported = 'ontouchstart' in window,
    isPointerSupported = navigator.pointerEnabled,
    isMSPointerSupported =  navigator.msPointerEnabled,
    downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : '')),
    moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove')),
    upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));

    var other_share = document.getElementById("other_share");
    other_share.onload = function(){

    };

    (function(){
        //支持触摸设备，需要扩大可点击范围
        if("ontouchstart" in window || window.navigator.pointerEnabled || window.navigator.msPointerEnabled) $("body").addClass("touch-device");

        if(window.top != self) $("body,html").addClass("in-frame");

        if(document.createElement("a").download != "") $("body").addClass("no-attr-dl");
        else $("body").addClass("attr-dl");

        //如果是移动设备则不添加web分享组件
       /* if(!$("body").hasClass("touch-device")){
            var bshare_js = document.createElement("script");
            bshare_js.type = "text/javascript";
            bshare_js.charset = "utf-8";
            bshare_js.src = "http://static.bshare.cn/b/buttonLite.js#style=-1&amp;uuid=&amp;pophcol=1&amp;lang=zh";

            bshare_js.onload = function(){
                var bshare_js_2 = document.createElement("script");
                bshare_js_2.type = "text/javascript";
                bshare_js_2.charset = "utf-8";
                bshare_js_2.src = "http://static.bshare.cn/b/bshareC0.js";
                document.body.appendChild(bshare_js_2);
            };

            document.body.appendChild(bshare_js);
        }*/
    })();

    if(__items && __items.length > 0){
        $("span.images-num").text(__items.length);
    }

    $(".share-title,.show-des").hover(function(){
        if($("body").hasClass("author")) $(this).addClass("hvr");
    },function(){
        if($("body").hasClass("author")) $(this).removeClass("hvr");
    });

    $(".share-title,.show-des").click(function(event){
        if(!$("body").hasClass("author")) return false;
        $(this).addClass("editing");
        var that = this;
        if($("input",this).val() != $(".title-con h1",that).text()) $("input",this).val($(".title-con h1",this).text());
        $("input",this).focus().one("blur",function(){
            
            if(this.value != $(".title-con h1",that).text()){
                //保存修改后的数据
                post.title = this.value;
                post.set_title(function(data){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        //修改成功，去除编辑状态
                        $(that).removeClass("editing");

                        //替换文字
                        $(".title-con h1",that).text(this.value);
                    }else{

                    }
                });
            }else{
                $(that).removeClass("editing");
            }
        });
    });

    $(".description .show-des pre").click(function(event){
        if(!$("body").hasClass("author")) return false;
        var $desc = $(this).closest(".description");
        var that = this;
        if($desc.hasClass("editing")){
            $desc.removeClass("editing");
        }else{
            var desc_height = $(this).height();
            $desc.addClass("editing").find("textarea").val($(this).text()).height(desc_height).focus().one("blur",function(event){
                if(this.value != $(that).text()){
                    //保存修改后的数据
                    __post.desc = this.value;
                    __post.set_desc(function(data){
                        var feedback = get_json_feedback(data);
                        if(feedback.status == "ok"){
                            //修改成功，去除编辑状态
                            $desc.removeClass("editing");

                            //替换文字
                            $(that).text(this.value);
                        }else{

                        }
                    });
                }else{
                    //修改成功，去除编辑状态
                    $desc.removeClass("editing");
                }
            });
        }
    });

    $.fn.load_img_onscroll = function(option,onload_callback){
        var scroll_con = (option && option.container) ? option.container : window;
        var _this = this;
        if(_this.length == 0) return false;
        _this.each(function(){
            //如果scrollTop大于图片的top-(x)px则加载图片
            if(elementInViewport(this)){
                if(onload_callback && $.isFunction(onload_callback)) this.onload = onload_callback;
                
                if($(this).data("src")) this.src = $(this).data("src");
            }
        });

        $(scroll_con).on("scroll",function(){
            _this.each(function(){
                //如果scrollTop大于图片的top-(x)px则加载图片
                if(elementInViewport(this)){
                    if(onload_callback && $.isFunction(onload_callback)) this.onload = onload_callback;
                    
                    if($(this).data("src")) this.src = $(this).data("src");
                }
            });
        });
    }

    function elementInViewport(el) {
	    if(el.getBoundingClientRect){
	        var rect = el.getBoundingClientRect();
	    }else{
	        var rect = $(el).offset();
	    }

	    return (
	           rect.top    >= 0
	        && rect.left   >= 0
	        && rect.top <= (window.innerHeight || document.documentElement.clientHeight)
	        );
	}


    // 分享组件
    $(".share-custom").on("click","a",function(){
        var newwin_height = 500,
            newwin_width = 800,
            newwin_top = (window.screen.height - newwin_height) / 2,
            newwin_left = (window.screen.width - newwin_width) / 2;

        var that = this;
        var url="";
        var img_url=""
        var content = "来自ok记得分享";
        var share_url = location.href;
        var str = share_url.split("?")[1];
        var last_post_id = str.split("&")[0];

        var append_share_source = "&__sharesource=okmemo";

            // var extra = "&__sharesource=okmemo&__sharepost="+last_post_id+"&__posttype=image";
            // var share_url = window.parent.location.origin+"/image/share?"+last_post_id;

            if($(that).hasClass("share-weibo")){
                url = weibo_share(content,img_url,share_url,append_share_source);
            }else if($(that).hasClass("share-douban")){
                url = douban_share(content,img_url,"分享自:Ok记("+share_url+")",append_share_source);
            }else if($(that).hasClass("email")){
                //分享到QQ邮箱
                url = qqmail_share(content,img_url,"",share_url,document.title,append_share_source);
            }else if($(that).hasClass("share-qzone")){
                url = qzone_share(content,img_url,"",share_url,document.title,append_share_source);
            }else if($(that).hasClass("share-qqwb")){
                url = qt_share(content,img_url,share_url,append_share_source);
            }else if($(that).hasClass("share-google")){
                url = gmail_share(content);
            }else if($(that).hasClass("share-weixin")){
                if(feedback.status == "ok"){
                    //生成一个二维码
                    $("#post_qrcode").find("canvas").remove().end().qrcode({
                        size: 80,
                        color: '#3a3',
                        text: share_url+"&__backsrc=wechat"
                    }).toggle();
                }else{
                    //提示用户分享失败
                    showMessage({type:"error",msg:"抱歉微信分享失败"});
                }
            }else if($(that).hasClass("share-twitter")){
                url = twitter_share(content,share_url,"okmemo",extra);
            }else if($(that).hasClass("share-facebook")){
                url = fb_share(content,share_url,extra);
            }else if($(that).hasClass("share-tumblr")){
                url = tb_share(content,share_url,extra);
            }
             window.open(url);
    });


	var ifr = document.getElementById("images_pad"),
		__initWidth = ($(window).width() < 500) ? 300 : 200;
        
	//加载items
	if(__items && __items.length){
		var items = __items,image;
		var items_html = "<link rel=\"stylesheet\" href=\""+location.origin+"/layout/images_share_inner.css\">";
             items_html += "<div id=\"container\">";

		//构建图片墙html
		for(var i=0,len=items.length; i<len; i++){
			image = items[i];
            resizedHeight = (__initWidth/image.width) * image.height;
			items_html += "<div class=\"item loading\" data-id=\""+image.id+"\">"+
						  "<div class=\"image-wrapper\">"+
						  "<img src=\""+location.origin+"/layout/images/1px.gif\" width=\""+__initWidth+"\" height=\""+resizedHeight+"\" data-height=\""+image.height+"\" data-width=\""+image.width+"\" data-src=\""+image.url+"\"/>"+
						  "<a href=\"#\" class=\"getit\"></a>"+
                          "</div>"+
						  "</div>";
		}
		items_html += "</div>"; // End of container

		//将html嵌入iframe
		var container = ifr.contentWindow.document.body;
        if(container) container.innerHTML = items_html;

        //嵌入脚本
        var script = document.createElement("script");
        script.src = location.origin+"/scripts/jquery.min.js";
        container.appendChild(script);

        script.onload = function(){
            var script = document.createElement("script");
            script.src = location.origin+"/scripts/masonry.js";
            container.appendChild(script);

            var utility = document.createElement("script");
            utility.src = location.origin+"/scripts/utility.js";
            container.appendChild(utility);

            utility.onload = function(){
                //嵌入自定义脚本
                var script = document.createElement("script");
                script.src = location.origin+"/scripts/images_share_inner.js";
                container.appendChild(script);
            };
        };
	}

    if(__other_posts && __other_posts.length > 0){
        var other_ifr = document.getElementById("other_share");
        var post_width = 200;

        var other_posts = __other_posts,post,title,desc;
        var meta = document.createElement("meta");
            meta.name = "Content-Type";
            meta.content = "text/html;charset=utf-8";
            other_ifr.contentWindow.document.getElementsByTagName("head")[0].appendChild(meta);

        var posts_html = "<link rel=\"stylesheet\" href=\""+location.origin+"/layout/other_posts.css\">";
            posts_html += "<div id=\"container\">";
            
            for(var i=0,len=other_posts.length; i<len; i++){
                post = other_posts[i];
                title = post.title ? post.title : post.items_count+"张最佳图片分享";

                //title,description,feature_img{url,width,height}
                posts_html += "<div class=\"post\">"+
                                  "<div class=\"poster\">"+ //thumbnail宽高是固定的，超过的部分用css隐藏
                                   "<a class=\"thumb\" href=\""+post.url+"\" >"+
                                        "<div class=\"mask\">"+
                                            "<div class=\"share-info\">"+
                                                "<span class=\"item-num\">"+post.items_count+"张</span>"+//图片多少张，用户会对数字比较敏感
                                                "<span class=\"title\">"+title+"</span>"+
                                                "<p class=\"read-times\">阅读次数:"+"200"+"</span>"+
                                            "</div>"+
                                        "</div>"+
                                        "<img data-width=\""+post.feature_img.width+"\" data-height=\""+post.feature_img.height+"\" src=\""+post.feature_img.url+"\">"+     
                                    "</a>"+
                                  "</div>"+
                              "</div>";
            }

            posts_html += "</div>"; // End of container
            
            var container_small = other_ifr.contentWindow.document.body;
            if(container_small) container_small.innerHTML = posts_html;
            
            //嵌入脚本
            var script = document.createElement("script");
            script.src = location.origin+"/scripts/jquery.min.js";
            container_small.appendChild(script);

            script.onload = function(){
                var script = document.createElement("script");
                script.src = location.origin+"/scripts/masonry.js";
                container_small.appendChild(script);

                // var utility = document.createElement("script");
                // utility.src = location.origin+"/scripts/utility.js";
                // container_small.appendChild(utility);

                script.onload = function(){
                    //嵌入自定义脚本
                    var script = document.createElement("script");
                    script.src = location.origin+"/scripts/other_share.js";
                    container_small.appendChild(script);
                };
            };
    }

    $("#header")



});