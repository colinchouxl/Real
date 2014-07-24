(function($){
    var isTouchSupported = 'ontouchstart' in window,
    isPointerSupported = navigator.pointerEnabled,
    isMSPointerSupported =  navigator.msPointerEnabled,
    downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : '')),
    moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove')),
    upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));
    

    (function(){
        //支持触摸设备，需要扩大可点击范围
        if("ontouchstart" in window || window.navigator.pointerEnabled || window.navigator.msPointerEnabled) $("body").addClass("touch-device");

        if(window.top != self) $("body,html").addClass("in-frame");

        $("body").addClass("inside-parent");

        if(document.createElement("a").download != "") $("body").addClass("no-attr-dl");
        else $("body").addClass("attr-dl");
    })();

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

    //附上数目
    $(".wall-title span.num").text("("+$("#container .item").length+")");

    //切换图片标签
    $("div.img-tags a").on("click "+downEvent,function(event){
        event.preventDefault();
        var tid = $(this).data("id");
        var that_tag = this;
        tid = tid > 0 ? tid : 0;
        $(".img-tag.checked").removeClass("checked");

        //从本地缓存中选择
        if(tid == 0){
            $("#container .item").removeClass("filtered");
        }else{
            $("#container .item").each(function(){
                var tag_ids = $(this).data("tagids");
                
                if(tag_ids){
                    tag_ids = tag_ids.toString().split(",");
                    tid = tid.toString();
                   
                    if(tag_ids.length > 0 && $.inArray(tid,tag_ids) != -1){
                        $(this).removeClass("filtered");
                    }else{
                        $(this).addClass("filtered");
                    }
                }
            });
        }
        load_wall_event();
        $("#container .item.loading img").each(function(){
            $(this).closest(".item").removeClass("loading");
            this.src = $(this).data("src");
        });
        $(that_tag).parent().addClass("checked");
        return false;

        ImageItem.prototype.load_images(tid,function(data){
            var images = get_json_feedback(data);
            var html = "";
                 html += "<div id=\"container\">";
            var image = null;
            var resizedHeight;
            for(var i=0,len=images.length; i<len; i++){
                image = images[i];
                resizedHeight = (window.parent.idl.apps.image.initWidth/image.width) * image.height;

                html += "<div class=\"item loading\" data-id=\""+image.id+"\" data-tagids=\""+image.tag_ids+"\" data-note=\""+image.note_id+"\">" +
                            "<div class=\"mask\">" +
                                "<div class=\"del-mask\">" +
                                    "<p class=\"warn\">已在图片墙排除了这张照片</p>" +
                                    "<div>" +
                                        "<a class=\"revocation\" href=\"#\">" +
                                            "<span class=\"info\">撤销</span>" +
                                            "<span class=\"icon\"></span>" +
                                        "</a>" +
                                    "</div>" +
                                "</div>" +
                                "<a href=\""+image.url+"\" class=\"lb\" data-lightbox=\"image-1\" data-title=\"My caption\"><img src=\""+window.parent.location.origin+"/layout/images/1px.gif\" width=\""+window.parent.idl.apps.image.initWidth+"\" height=\""+resizedHeight+"\" data-height=\""+image.height+"\" data-width=\""+image.width+"\" data-src=\""+image.url+"\"/></a>" +
                            "</div>" +
                            "<div class=\"single-op\">" +
                                "<div class=\"checkbox\"><span class=\"icon-font ok-icon-complete\"></span></div>" +
                                "<div class=\"operations\">" +
                                    "<a class=\"download\" href=\""+image.url+"\" target=\"_blank\" download=\""+get_filename(image.url)+"\"><span class=\"icon-font ok-icon-download\"></span></a>" +
                                    "<a class=\"delete\" href=\"#\"><span class=\"icon-font ok-icon-del\"></span></a>" +
                                    "<a class=\"share\" href=\"#\"><span class=\"icon-font ok-icon-share\"></span></a>" +
                                "</div>" +
                                "<div class=\"share-component\">" +  //添加了字体图标   7-13-icon-font
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"qqmail component\"><span class=\"icon-font ok-icon-email-line2\"></span></a></div>" +
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"weibo component\"><span class=\"icon-font ok-icon-sinaweibo-line\"></span></a></div>" +
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"douban component\"><span class=\"icon-font ok-icon-douban-line\"></span></a></div>" +
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"qzone component\"><span class=\"icon-font  ok-icon-qqzone-line\"></span></a></div>" +
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"tqq component\"><span class=\"icon-font ok-icon-tencentweibo-line\"></span></a></div>" +
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"gmail component\"><span class=\"icon-font ok-icon-wechat-line\"></span></a></div>" +
                                    "<div class=\"share-icon\"><a href=\"#\" class=\"cancel-share\"><span class=\"icon-font ok-icon-share\"></span></a></div>" +
                                "</div>" +
                            "</div>" +
                        "</div>";
            }
            html += "</div>";

            $("#container").html(html);
            load_wall_event();
            $("#container .item.loading img").each(function(){
                $(this).closest(".item").removeClass("loading");
                this.src = $(this).data("src");
            });

            $(that_tag).parent().addClass("checked");
            // //滚动加载
            //  $("#container .item.loading img").load_img_onscroll({},function(){
            //     //图片加载完成调用
            //     $(this).closest(".item").removeClass("loading");
            //  });
        });
    });

    var fixed_top = $(".tags-con").offset().top;
    //窗口滚动到一定位置的时候将标签栏固定
    $(window).on("scroll",function(event){
        //滚动到一定位置，保留搜索栏
        if($("body").scrollTop() >= fixed_top){
            if(!$("body").hasClass("scroll")){
                $("body").addClass("scroll");
            }
        }else{
            if($("body").hasClass("scroll")){
                $("body").removeClass("scroll");
            }
        }
    });

    //全选或者取消选择
    $(".wall-header").on("click "+downEvent,".multi-choice a.gol",function(event){
        event.preventDefault();

        if($(this).hasClass("all-choice")){
            $("#container .item").addClass("checked").first().attr("data-share-order",0);
            var total_num = $("#container .item").not(".filtered").length;
            $(".wall-header .chosen-num").text(total_num+"/"+total_num);
        }else if($(this).hasClass("cancel")){
            $("#container .item.checked").removeClass("checked").removeAttr("data-share-order");
            $("body").removeClass("choosing");
        }
    });

    //单张图片操作
     $("#container").on("click "+downEvent,".item .single-op .operations a",function(event){
        if(!$(this).hasClass("download") || $("body").hasClass("no-attr-dl")){
            event = EventUtil.getEvent(event);
            EventUtil.preventDefault(event);
        }

        if($(this).hasClass("download")){
            if($("body").hasClass("no-attr-dl")){
                var $img = $(this).closest(".item").find("a.lb img");
                var newwin_height = $img.data("height"),
                newwin_width = $img.data("width"),
                newwin_top = (window.screen.height - newwin_height) / 2,
                newwin_left = (window.screen.width - newwin_width) / 2;
                url = this.href;

                var newwin = window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
            }
        }

        var $item = $(this).closest(".item");
        var id = $item.data("id");
        var image = new ImageItem({id:id});

        if($(this).hasClass("share")){
            $item.addClass("sharing");
        }else if($(this).hasClass("delete")){
            $item.addClass("delete to-be-delete");
            var delete_timeout = setTimeout(function(){
                if($item.hasClass("to-be-delete")){
                    //排除这张图片
                    image.exclude(function(data){
                        if(console) console.log(data);
                        var feedback = get_json_feedback(data);
                        if(feedback.status == "ok"){
                            //删除这张图片
                            $item.fadeOut(function(){
                                $item.remove();
                                $("#container").masonry();
                            });
                        }else{
                            //出错
                            $item.removeClass("delete");
                            showMessage({type:"error",msg:"操作失败"});
                        }
                    });
                }else{
                    clearTimeout(delete_timeout);
                }
            },3000);
        }
     });

    //单张分享
    $("#container").on("click "+downEvent,".item .share-icon a",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var $item = $(this).closest(".item");
        if($(this).hasClass("cancel-share")){
            $item.removeClass("sharing");
            return false;
        }

        var share_url = window.parent.location.origin ? window.parent.location.origin : "http://stick.eff.do";
        var site_title = document.title;
        var extra = "&__sharesource=okmemo";
        var title = "";
        var pic_url = $(this).closest(".item").find("a.lb img").data("src");
        var content = "分享一张图片";

        var url = "";
        var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;

        if($(this).hasClass("qqmail")){
            url = qqmail_share(content,pic_url,title,share_url,site_title,extra);
        }else if($(this).hasClass("weibo")){
            url = weibo_share(content,pic_url,share_url,extra);
        }else if($(this).hasClass("gmail")){
            url = gmail_share(content);
        }else if($(this).hasClass("douban")){
            url = douban_share(content,pic_url,"分享自:Ok记(stick.eff.do)",extra);
        }else if($(this).hasClass("qzone")){
            url = qzone_share(content,pic_url,title,share_url,site_title,extra);
        }else if($(this).hasClass("tqq")){
            url = qt_share(content,pic_url,share_url,extra);
        }
        window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
    });

    //更多分享
    $(".wall-header").on("click "+downEvent,".more-comp a",function(event){
        event.preventDefault();
       
        if(!$(".multi-choice").hasClass("show-more")) $(".multi-choice").addClass("show-more");
        else $(".multi-choice").removeClass("show-more");
    });

    //下载，删除，
    $(".wall-header").on("click "+downEvent,".overall .gol-op a",function(event){
        event.preventDefault();
        var $checked = $("#container .item.checked").not(".filtered");
        
        if($(this).hasClass("delete")){

        }else if($(this).hasClass("tags")){

        }else if($(this).hasClass("download")){
            var item,alink;
            if($("body").hasClass("attr-dl")){
                alert("ddd");
                for(var i = 0; i < $checked.length; i++){
                    var clickEvent = document.createEvent("MouseEvent");
                    clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null); 
                    
                    //找到a标签触发时间
                    item= $checked[i];
                    alink = $("a.download",item).get(0);
                    alink.dispatchEvent(clickEvent);
                }
            }else if($("body").hasClass("no-attr-dl")){
                //浏览器不支持a标签的download属性
                var tmp_win = window.open("about:blank");

                var tmp_win_html = "";
                //将图片全部放入临时的frame中供用户下载
                $checked.each(function(){
                    var img = $(this).find("a.lb img").get(0);
                    tmp_win_html += "<div style=\"float:left;margin:5px;border:1px solid white;width:200px;height:200px;overflow:hidden;\" onmouseover=\"\"><img src=\""+$(img).data("src")+"\" ></div>";
                });
                tmp_win.document.body.innerHTML = tmp_win_html;
            }
        }
    });

    //在批量删除时，正在被删除的图片不让其显示
    $("#container").on("click "+downEvent,".item a.lb",function(event){
        event = EventUtil.getEvent(event);
        var $item = $(this).closest(".item");

        if($item.hasClass("to-be-exclude")) return false;

        //如果用户正在选择，那么点击图片的话则是选择而不是在lightbox中打开
        if($("body").hasClass("choosing")){
            $item.find(".checkbox").trigger("click");
            return false;
        }

        //获取图片数据，嵌入lightbox
        var note_id = $item.data("note");
        if(note_id > 0){
            Note.prototype.get_note_by_id(note_id,function(data){
                if(console) console.log(data);
                var feedback = get_json_feedback(data);
                if(feedback.note){
                    $("#lightbox .lb-description .note-con .note.editable").html(decode_content(feedback.note.content));
                }
            });
        }
    });

    //点击图片墙分享
    $(".wall-header").on("click "+downEvent,".share-con a.comp",function(event){
        event.preventDefault();
        var share_comp = this;
        
        //上一次分享的帖子所有id
        var last_post = $("#container").data("last-post");
        var last_post_id = $("#container").data("last-postid");
        
        var $checked = $(".item.checked");
        //生成一个公开的网页(http://stick.eff.do/image/public?sha5)，包含所有选中的图片
        var share_ids = new Array();
        var share_objs = new Array();
        //根据用户点击的顺序生成id序列
        $checked.each(function(){
            share_objs.push({id:$(this).data("id"),order:$(this).data("share-order")});
        });
        
        share_objs.sort(function(a,b){
            if(a.order > b.order) return 1;
            else return -1;
        });
        
        for(var i=0,len=share_objs.length; i<len; i++){
            share_ids.push(share_objs[i].id);
        }

        var site_title = window.parent.document.title,
            title = "分享"+share_ids.length+"张美图",
            content = "人世间最美好的事莫过美图分享，今天选出8张最棒的图片集结成页，供大家分享，使美人美景更多人欣赏，您可在此段描述分享心得和编辑语。亦可多左侧便签中挑出内容放置与此",
            pic_url = $checked.first().find("a.lb img").attr("src");

        var url = "";
        if(last_post && last_post_id && last_post == share_ids.join(",")){
            //是上次的分享，则不再创建一个帖子
            //new_win.location.href = location.origin+"/image/share?"+last_post_id+"";
            var extra = "&__sharesource=okmemo&__sharepost="+last_post_id+"&__posttype=image";
            var share_url = window.parent.location.origin+"/image/share?"+last_post_id;
            

            if($(share_comp).hasClass("weibo")){
                //构造一个带有额外参数的微博分享链接
                url = weibo_share(content,pic_url,share_url,extra);
            }else if($(share_comp).hasClass("tt")){
                //构造一个带有额外参数的腾讯微博分享链接
                url = qt_share(content,pic_url,share_url,extra);
            }else if($(share_comp).hasClass("douban")){
                //构造一个带有额外参数的豆瓣分享链接
                url = douban_share(content,pic_url,title,extra);
            }else if($(share_comp).hasClass("qq")){
                //构造一个带有额外参数的qzone分享链接
                url = qzone_share(content,pic_url,title,share_url,site_title,extra);
            }else if($(share_comp).hasClass("qqmail")){
                //构造一个带有额外参数的qq邮箱分享链接
                url = qqmail_share(content,pic_url,title,share_url,site_title,extra);
            }else if($(share_comp).hasClass("wechat")){
                $("#post_qrcode").find("canvas").remove().end().qrcode({
                    size: 80,
                    color: '#3a3',
                    text: share_url+"&__backsrc=wechat"
                }).toggle();
                return false;
            }
            window.open(url);
        }else{
            //与上次分享的不同则重新创建post
            var post = new Post({});
            post.type = "image";
            post.items = share_ids;
            var new_win = window.open();
            post.publish(function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    //展示公开链接供用户点击
                    if(feedback.hash){
                        //记录这次post id
                        $("#container").data("last-post",share_ids.join(","));
                        $("#container").data("last-postid",feedback.hash);

                        //window.open(location.origin+"/image/share?"+feedback.hash);
                        //new_win.location.href = location.origin+"/image/share?"+feedback.hash+"";
                        //$checked.removeClass("checked");
                        //$("#image_wall .image-wall").removeClass("choosing");
                        //$("#container",ifr.contentWindow.document.body).removeClass("choosing");
                        var extra = "&__sharesource=okmemo&__sharepost="+feedback.hash+"&__posttype=image";
                        var share_url = window.parent.location.origin+"/image/share?"+feedback.hash;

                        if($(share_comp).hasClass("weibo")){
                            //构造一个带有额外参数的微博分享链接
                            url = weibo_share(content,pic_url,share_url,extra);
                        }else if($(share_comp).hasClass("tt")){
                            //构造一个带有额外参数的腾讯微博分享链接
                            url = qt_share(content,pic_url,share_url,extra);
                        }else if($(share_comp).hasClass("douban")){
                            //构造一个带有额外参数的豆瓣分享链接
                            url = douban_share(content,pic_url,title,extra);
                        }else if($(share_comp).hasClass("qq")){
                            //构造一个带有额外参数的qzone分享链接
                            url = qzone_share(content,pic_url,title,share_url,site_title,extra);
                        }else if($(share_comp).hasClass("qqmail")){
                            //构造一个带有额外参数的qq邮箱分享链接
                            url = qqmail_share(content,pic_url,title,share_url,site_title,extra);
                        }else if($(share_comp).hasClass("wechat")){
                            //微信分享生成二维码
                            $("#post_qrcode").find("canvas").remove().end().qrcode({
                                size: 80,
                                color: '#3a3',
                                text: share_url+"&__backsrc=wechat"
                            }).toggle();
                            new_win.close();
                        }

                        new_win.location.href = url;
                    }
                }else{
                    //失败
                    showMessage({type:"error",msg:"操作失败"});
                    new_win.close();
                }
            });
        }
    });

    //撤销删除
    $("#container").on("click "+downEvent,".item .mask a.revocation",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var $item = $(this).closest(".item");
        $item.removeClass("to-be-delete delete");
    });

    //选中图片
     $("#container").on("click "+downEvent,".item .single-op .checkbox",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);
        
        var $item = $(this).closest(".item");
        if($("#image_wall",parent.window.document.body).hasClass("bulk-excluding")) return false;

        //得到已经选中的条目数
        var checked_num = $("#container .item.checked").length;
        if($item.hasClass("checked")){
            $item.removeClass("checked").removeAttr("data-share-order");
            if($("#container .item.checked").length == 0){
                // $("#image_wall .image-wall",parent.window.document.body).removeClass("choosing");
                $("body").removeClass("choosing");
                //$("#container").removeClass("choosing");
            }
        }else{
            $item.addClass("checked").attr("data-share-order",checked_num);
            // $("#image_wall .image-wall",parent.window.document.body).addClass("choosing");
            $("body").addClass("choosing");
            //$("#container").addClass("choosing");
        }
        var chosen_num = $("#container .item.checked").length;
        var total_num = $("#container .item").not(".filtered").length;
        var show_text = chosen_num+"/"+total_num;
        
        $("span.chosen-num").text(show_text);
     });

     //滚动加载
     $("#container .item.loading img").load_img_onscroll({},function(){
        //图片加载完成调用
        $(this).closest(".item").removeClass("loading");
     });

     //鼠标经过添加新的样式
    //函数: toggleHvr(reset,selector,hvrclass,tpSeletor,callback)
    if(!$("body").hasClass("touch-device")){
        //非触摸设备才添加hover事件
        toggleHvr(null,"#container div.item");
    }
})(jQuery);

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

function load_wall_event(){
    var parent_div = $("body").get(0),
        cube_width = 204,
        gutter = 30,
        $container = $('#container'),

        ori_ww = $(parent_div).width(),
        con_w = ori_ww - ori_ww%(cube_width+gutter);


    $container.width(con_w-gutter);
    $(".wall-header").width(con_w-gutter/2);
    $(".img-tags").width(con_w-gutter/2);
    if($container.data("masonry")) $container.removeData("masonry");
    $container.masonry({
      columnWidth: cube_width,
      itemSelector: '.item',
      gutter: gutter
    });

    $('img',$container.get(0)).width(cube_width).on("load",function(){
        $container.masonry();
    });

    var tmp_ww,tmp_margin;
    $(window).on("resize.img_wall",function(event){
        tmp_ww = $(parent_div).width();
        con_w = parseInt(tmp_ww/(cube_width+gutter)) * (cube_width+gutter);
        
        $container.width(con_w);
        $(".wall-header").width(con_w-gutter/2);
        $(".img-tags").width(con_w-gutter/2);
    });
} 

load_wall_event();