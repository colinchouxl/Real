jQuery(function($){
    var isTouchSupported = 'ontouchstart' in window,
    isPointerSupported = navigator.pointerEnabled,
    isMSPointerSupported =  navigator.msPointerEnabled,
    in_social_page = false,
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

    $("a.thumb").click(function(event){
        event.preventDefault();
        if(!in_social_page) parent.window.location.href=this.href;
        else window.open(this.href);
        return false;
    });

   function load_wall_event(){
        var parent_div = $("body").get(0),
            cube_width = ($(window.parent).width() < 500) ? 300 : 200,
            gutter = 20,
            $container = $('#container'),
            ori_ww = $(parent_div).width(),
            con_w = ori_ww - ori_ww%(cube_width+gutter);

            //如果窗口宽度小于图片宽度,则gutter=0
            if($("body").hasClass("touch-device") && ori_ww < cube_width+gutter){
                gutter = 0;
                con_w = ori_ww;
                cube_width = ori_ww;
            }

        //确定容器高度
        if($container.data("masonry")) $container.removeData("masonry");
        
        $container.width(con_w).masonry({
          columnWidth: cube_width,
          itemSelector: '.post',
          gutter: gutter
        });

        $("iframe#other_share",window.parent.document.body).height($container.height() + 5);
        $("body").height($container.height()).css("overflow","hidden");

        $('img',$container.get(0)).width(cube_width).on("load",function(){
            $container.masonry();

        });
        adjust_img(".poster .thumb img",200);
        var tmp_ww,tmp_margin;

        $(window).on("resize.img_wall",function(event){
            tmp_ww = $(parent_div).width();
            con_w = parseInt(tmp_ww/(cube_width+gutter)) * (cube_width+gutter);
            
            if($("body").hasClass("touch-device") && tmp_ww < cube_width+gutter){
                gutter = 0;
                con_w = ori_ww;
                cube_width = ori_ww;
            }

            $container.width(con_w);

            //框架的宽度也固定
            $("iframe#other_share",window.parent.document.body).height($container.height() + 5);
            $("body").height($container.height()).css("overflow","hidden");
        });
    }

    load_wall_event();
});

function adjust_img(img_selector,size){
    var ori_width,ori_height,radio,new_left,new_top;
    $(img_selector).each(function(){
        ori_width = $(this).data("width");
        ori_height = $(this).data("height");

        radio = ori_width/ori_height;
        //如果宽度大于高度
        if(radio > 1){
            //让其高度成为200
            //然后位置居中
            new_left = (ori_width*(size/ori_height))/2 - size/2;
            new_left = -new_left+"px";
            $(this).css({"height":size+"px","width":"auto","position":"relative","left":new_left});
        }

        //如果高度大于宽度
        if(radio < 1){
            //让其宽度成为200
            //然后位置居中
            new_top = (ori_height*(size/ori_width))/2 - size/2;
            new_top = -new_top+"px";
            $(this).css({"height":"auto","width":"200px","position":"relative","top":new_top});
        }

    });
}