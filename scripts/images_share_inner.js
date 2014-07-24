jQuery(function($){
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

        if(document.createElement("a").download != "") $("body").addClass("no-attr-dl");
        else $("body").addClass("attr-dl");

        if($(window.parent.document.body).hasClass("in_social_page")){
            $("body").addClass("in_social_page");
            in_social_page = true;
        }
    })();

    $(".image-wrapper").hover(function(){
        if(!$(window.parent.document.body).hasClass("author")) $(this).addClass("hvr");
    },function(){
        if(!$(window.parent.document.body).hasClass("author")) $(this).removeClass("hvr");
    });

    //收藏
    $(".image-wrapper a.getit").click(function(event){
        event.preventDefault();

        // var $item = $(this).closest(".item");
        // var img = $item.find(".image-wrapper img").get(0);
        
        // if(!!!img) return false;
        // //如果用户已经登录，则直接添加图片
        // if($(window.parent.document.body).hasClass("logged-in")){
        //     //添加到用户的图片库，给当前图片加上类"added"，出现气泡提示已经添加，并且已添加图片要给出不同的样式
        //     var note = new Note({content:img.src,tags:["images"]});
               
        //         note.save(function(data){
        //             if(console) console.log(data);
        //             var feedback = get_json_feedback(data);
        //             if(feedback.status == "ok"){
        //                 note.id = feedback.id;

        //                 //保存此图片链接，尺寸
        //                 var img_obj = {
        //                     url: img.src,
        //                     width: $(img).data("width"),
        //                     height: $(img).data("height")
        //                 };

        //                 note._save_image(img_obj);

        //                 $item.addClass("added").append("<p class=\"added-msg\" style=\"position:absolute;top:5px;left:0;width:100%;text-align:center;\"><span style=\"display:inline-block;color:white;font-size:12px;border-radius:5px;padding:5px 15px;background:#97E497\">添加成功</span></p>");
                        
        //                 setTimeout(function(){
        //                     $item.find("p.added-msg").fadeOut(function(){$(this).remove();});
        //                 },1000);
        //             }else{

        //             }
        //         });
        //     //如果假插件已经打开，而且面板是图片面板，则展示出来，

        // }else{
        //     //未登录用户，添加到本地localStorage，
        //     if($(window.parent.document.body).hasClass("extension-monitor-loaded")){
        //         //如果插件已经加载
        //         //打开插件
        //         if($("iframe#stick",window.parent.document.body).css("display") == "none"){
        //             try{
        //                 //触发点击事件打开假侧栏
        //                 var clickEvent = document.createEvent("MouseEvent");
        //                 clickEvent.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
                        
        //                 var alink = $("#eff_close_panel .eff_switch.eff_tab",window.parent.document.body).get(0);
        //                 alink.dispatchEvent(clickEvent);
        //             }catch(e){
        //                 $("iframe#stick",window.parent.document.body).show();
        //             }

        //             //打开插件模拟器
        //             if(localStorage) localStorage.monitor_closed = "0";
        //         }


        //     }
        // }
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

    function load_wall_event(){
        var parent_div = $("html").get(0),
            cube_width = ($(window.parent).width() < 500) ? 300 : 200,
            gutter = 20,
            $container = $('#container'),
            ori_ww = $(parent_div).width(),
            con_w = ori_ww - ori_ww%(cube_width+gutter);
            
            //如果是移动设备窗口宽度小于图片宽度,则gutter=0
            if($("body").hasClass("touch-device") && ori_ww < cube_width+gutter){
                gutter = 0;
                con_w = ori_ww;
                cube_width = ori_ww;
            }

            
        //确定容器高度
        if($container.data("masonry")) $container.removeData("masonry");
        
        $container.width(con_w).masonry({
          columnWidth: cube_width,
          itemSelector: '.item',
          gutter: gutter
        });

        $("iframe#images_pad",window.parent.document.body).height($container.height() + 5);
        $("body").height($container.height()).css("overflow","hidden");

        $('img',$container.get(0)).width(cube_width).on("load",function(){
            $container.masonry();
        });

        var tmp_ww,tmp_margin;

        $(window).on("resize.img_wall",function(event){
            tmp_ww = $(parent_div).width();
            con_w = parseInt(tmp_ww/(cube_width+gutter)) * (cube_width+gutter);

            //如果是移动设备窗口宽度小于图片宽度,则gutter=0
            if($("body").hasClass("touch-device") &&tmp_ww < cube_width+gutter){
                gutter = 0;
                con_w = ori_ww;
                cube_width = ori_ww;
            }
            
            $container.width(con_w);
            $("iframe#images_pad",window.parent.document.body).height($container.height() + 5);
            $("body").height($container.height()).css("overflow","hidden");
        });

        $(".item.loading img").load_img_onscroll({},function(){
            //图片加载完成调用
            $(this).closest(".item").removeClass("loading");
         });
    }

    load_wall_event();
});