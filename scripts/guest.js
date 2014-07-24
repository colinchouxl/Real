idl = {};

jQuery(function($){
    var note_ops = document.getElementById("note_ops"),
        all_saved_con = ".all",
        content_area = ".note.editable",
        cache_num = 50,
        isTouchSupported = 'ontouchstart' in window,
        isPointerSupported = navigator.pointerEnabled,
        isMSPointerSupported =  navigator.msPointerEnabled,
        downEvent = isTouchSupported ? 'touchstart' : (isPointerSupported ? 'pointerdown' : (isMSPointerSupported ? 'MSPointerDown' : '')),
        moveEvent = isTouchSupported ? 'touchmove' : (isPointerSupported ? 'pointermove' : (isMSPointerSupported ? 'MSPointerMove' : 'mousemove')),
        upEvent = isTouchSupported ? 'touchend' : (isPointerSupported ? 'pointerup' : (isMSPointerSupported ? 'MSPointerUp' : 'mouseup'));

    //搜索栏的位置及宽度
    var stickyTop = $('#search_area').offset().top;
    var stickyWidth = $('#search_area').width();

    //先将html的overflow设为hidden,然后再在js里面设为auto是为了处理chrome的自定义scrollbar无法显示的问题
    //只有动态改变overflow值才能在html节点上生效
    $("html").css("overflow","auto");

    //给上最后刷新时间，以便之后作缓存是否有效的判断
    $("#search_results .by-tag").data("last_refresh",get_current_time());

    (function(){
        //支持触摸设备，需要扩大可点击范围
        if("ontouchstart" in window || window.navigator.pointerEnabled || window.navigator.msPointerEnabled) $("body").addClass("touch-device");

        if(window.top != self) $("body,html").addClass("in-frame");
        else $("body,html").addClass("top-win");

        if(document.createElement("a").download != "") $("body").addClass("no-attr-dl");
        else $("body").addClass("attr-dl");

        if(window._ENV){
            var os_class = window._ENV.os.replace(/[\s|\_]/g,"-").toLowerCase();
            var browser_class = window._ENV.browser.replace(/[\s|\_]/g,"-").toLowerCase();
            $("body").addClass(os_class+" "+browser_class);
        }

        // 各种浏览器兼容
        var hidden, state, visibilityChange; 
        if (typeof document.hidden !== "undefined") {
            hidden = "hidden";
            visibilityChange = "visibilitychange";
            state = "visibilityState";
        } else if (typeof document.mozHidden !== "undefined") {
            hidden = "mozHidden";
            visibilityChange = "mozvisibilitychange";
            state = "mozVisibilityState";
        } else if (typeof document.msHidden !== "undefined") {
            hidden = "msHidden";
            visibilityChange = "msvisibilitychange";
            state = "msVisibilityState";
        } else if (typeof document.webkitHidden !== "undefined") {
            hidden = "webkitHidden";
            visibilityChange = "webkitvisibilitychange";
            state = "webkitVisibilityState";
        } else {
            //标志用户的活动状态，若在10秒以内没发生任何动作，则可以认为页面为空闲状态，进而决定进行特定的操作
            $("body").on(moveEvent + " keyup click scroll"+downEvent,function(event){
                $("body").addClass("user-active");
                if(idl.active_record) clearTimeout(idl.active_record);
                
                idl.active_record = setTimeout(function(){
                    $("body").removeClass("user-active");
                },10000);
            });
            return false;
        }

        if(document[hidden]) $("body").addClass("doc_hidden");
        else $("body").addClass("doc_visible");

        // 添加监听器
        $(document).on(visibilityChange,function(){
            if(document[hidden]){
                 $("body").addClass("doc_hidden").removeClass("doc_visible");

                 //如果新便签中有内容，则帮其保存
                 if($("#blank_sheet .note-con").hasClass("modified") || $.trim($("#blank_sheet .note-con .note.editable").html()) != ""){
                    console.log("submitting form");
                    $("#blank_sheet form").submit();
                 }

                 //发送同步请求
                 //User.prototype.sync();
            }else{
                 //打开新的tab，将APP的所有数据刷新一遍
                 APP.refresh();
                 $("body").addClass("doc_visible").removeClass("doc_hidden");

                 //检测是否新便签中有内容，若有则检测是否为刚才保存了的，若是则清除
                 if(localStorage && localStorage.newly_saved){
                    if($("#blank_sheet .note-con").data("stamp") == localStorage.newly_saved){
                        $("#blank_sheet .note-con").removeClass("modified").find(".note.editable").data("value","").html("");
                    }
                }
            }
        });
    })();

    //-----------------
    //用户登录部分
    //关闭登录框
    $("#login").on("click "+downEvent,".close-btn",function(event){
        event.preventDefault();

        APP.toggle_authwin();
    });

    //-----------------
    //安装浏览器扩展
    $("#install_area a").on("click",function(event){
        event.preventDefault();
        if($("#install_area").hasClass("installing") || $("#install_area").hasClass("installed")) return false;

        $("#install_area").addClass("installing");
        APP.install_ext(function(e){
            console.log(e);
            $("#install_area").addClass("installed").removeClass("installing").removeClass("active");
        },function(e){
            $("#install_area").removeClass("installing");
            console.log(e);
        });
    });

    //-----------------
    //用户反馈表
    $("#feedback").on("click","input",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);
        var content = $("#feedback .content").val();
        if($.trim(content) == ""){
            showMessage({type:"warning",msg:"不要玩我"});
            return false;
        }

        if(content.length > 10000){
            showMessage({type:"warning",msg:"写这么多，想整垮服务器吗？"});
            return false;
        }

        $.post("/user/send_feedback",{from:"web",type:"ajax",message:content},function(data){
            if(console) console.log(data);
            var feedback = get_json_feedback(data);
            if(feedback.status == "ok"){
                showMessage({type:"success",msg:"谢谢您的反馈，我们会在24小时之内查看处理。ㄟ(◑‿◐ )ㄏ"});
                $("#feedback .content").val("").text("");
            }else{
                showMessage({type:"error",msg:"⊙０⊙，发送反馈失败，暂时将反馈保存到便签里吧，或者邮件发送到eff505@gmail.com，谢谢"});
            }
        });
    });
    //-----------------用户反馈表结束


    //-------------------
    //得到插件发过来的通知
    $(window).on("message",function(event){
        event = event.originalEvent;
        var data = event.data;

        if(data){
            switch(data.command){
                case "save_note":
                    if(!!!data.content) return false;
                    var note = new Note({title:data.title,content:data.content,source:data.source});
                    
                    note.app_hidden = data.app_hidden;
                    note.save(function(feedback){
                        if(feedback.status == "ok"){
                            note.id = feedback.id;
                            //保存成功，接着展示
                            APP.display_note(note);
                        }
                    });
                    break;
                default: break;
            }
        }
    });
    //-------------------插件通知部分结束

    //当用户在页面上按下Ctrl/Cmd + S时，保存所有未保存得便签，并给出友好的提示
    $(document).on("keydown",function(event){
        event = EventUtil.getEvent(event);

        //快捷键 Ctrl/Cmd + S
        if(event.keyCode && event.keyCode == 83 && (event.metaKey || event.ctrlKey)){
            EventUtil.preventDefault(event);
            if($(".note-con.editing").length > 0){
                return false;
            }

            $(".note-con.modified").each(function(){
                $("form",this).submit();
            });
            check_local_saved();
        }
    });

    function divide_task_area(){
        $("h1.today-area").length == 0 ? $("#search_results.results-of-tasks .note-con.task.today").first().before("<h1 class=\"today-area\">今天<hr></h1>") : "";
        $("h1.later-area").length == 0 ? $("#search_results.results-of-tasks .note-con.task.today").last().after("<h1 class=\"later-area\">以后<hr></h1>") : "";
    }

    /* 初始化(完成添加事件监听器，初始化时间轴等任务) */
	function initialize(){
            //从本地添加数据
            APP.initialize();

            //今日任务分出
            divide_task_area();

            //便签内容拖拽时只允许copy
            $("body").on("dragstart",".note-con.editing " + content_area,function(event){
                event = EventUtil.getEvent(event);
                event.originalEvent.dataTransfer.effectAllowed = "copymove";
            });

            $("body").on("dragleave",".note-con.editing " + content_area,function(event){
                read_mode(this);
            });

            //若有内容被拖入新便签则使其成为可编辑状态
            $("body").on("dragenter","#blank_sheet "+content_area,function(event){
                $(this).attr("contenteditable","true");
                event = EventUtil.getEvent(event);
                event.originalEvent.dataTransfer.dropEffect = "copy";
            });

            //若有内容被拖入被固定的便签则使其成为可编辑状态
            $("body").on("dragenter",".fixed.maximized "+content_area,function(event){
                write_mode(this);
                event = EventUtil.getEvent(event);
                event.originalEvent.dataTransfer.dropEffect = "copy";
                event.originalEvent.dataTransfer.effectAllowed = "copy";
            });

            $("body").on("drop",".fixed.maximized "+content_area,function(event){
                $(this).closest('.note-con').addClass("editing modified");
            });

            //若被拖出，被固定的便签则使其成为可读
            $("body").on("dragleave",".fixed.maximized "+content_area,function(event){
                read_mode(this);
            });

            $("body").on("drop","#blank_sheet "+content_area,function(event){
                event = EventUtil.getEvent(event);
                var dt = event.originalEvent.dataTransfer;
                var content = "";
                var that = this;

                if($.inArray("Files",dt.types) >= 0){
                    if(console) console.log(dt.files);
                    var file = null;
                    
                    for(var i=0; i<dt.files.length; i++){
                        file = dt.files[i];
                        if(file.type.match(/text.*/) && window.FileReader){
                            var reader = new FileReader();

                            reader.onload = function(event){
                                if(console) console.log(event.target.result);
                                if(event.target.result.length < 5000)
                                    that.innerHTML += event.target.result;
                            };
                            reader.readAsText(file);
                        }else if(file.type.match(/image.*/) && window.FileReader){
                            var reader = new FileReader();

                            reader.onload = function(event){
                                if(console) console.log(event.target.result);
                            };
                            reader.readAsDataURL(file);
                        }
                    }
                }

                if($.inArray("text/html",dt.types)>=0 || $.inArray("text/uri-list")>=0){
                    //放入的数据为html格式
                    content = dt.getData("text/html");
                    if(content.toLowerCase().indexOf("schemas-microsoft-com:office:office") >= 0 || content.toLowerCase().indexOf("mso-") >= 0){
                        //拖入的内容来自word或excel等软件
                        content = dt.getData("text/plain");
                    }

                    if($.trim(content) == ""){
                        content = dt.getData("text/uri-list");
                    }
                }else{
                    content = dt.getData("text/plain");
                }

                if($.trim(content) != ""){
                    this.innerHTML = content;
                    $(this).addClass("modified");
                }
                if(console) console.log(content);
                EventUtil.preventDefault(event);
            });

            $("body").on("paste","#blank_sheet "+content_area,function(event){
                event = EventUtil.getEvent(event);
                var dt = event.originalEvent.clipboardData;
                if(console) console.log(dt.types);

                if($.inArray("text/html",dt.types)>=0 || $.inArray("text/uri-list")>=0){
                    //放入的数据为html格式
                    content = dt.getData("text/html");
                    if(content.toLowerCase().indexOf("schemas-microsoft-com:office:office") >= 0 || content.toLowerCase().indexOf("mso-") >= 0){
                        //拖入的内容来自word或excel等软件
                        content = dt.getData("text/plain");
                        if($.trim(content) != ""){
                            this.innerHTML = content;
                            $(this).addClass("modified");
                        }
                        EventUtil.preventDefault(event);
                    }
                }
            });

            //调整容器高度
            // $("#note .note-con "+content_area).each(function(){
            //     $(this).data("value",this.innerHTML);

            //     //将图片和文字全部转化为链接 （分三种情况：1.加载时，2.加载更多时，3.blur时，4.保存时，也就是离开编辑模式便成为富文本）
            //     var content = decode_content(this.innerHTML);
            //     $(this).html(content);
            //     this.style.height = 0;
            //     this.style.height = (Math.min($(this).prop("scrollHeight"),150)) + "px";
            // });
            
            $(".note.editable .favicon.unloaded").load_img_onscroll({timeout:5000,fallback_src:"layout/images/favicons.png",loading_class:"unloaded"},function(){
                $(this).removeClass("unloaded");
            });

            //touchstart,mousedown目标为文字，则进入编辑状态
            //mousedown 先于 focus
            $("#wrapper").on("mousedown "+downEvent,content_area,function(event){
                event = EventUtil.getEvent(event);
                var target = EventUtil.getTarget(event);
                var $note = $(this).closest(".note-con");
                if(!target.tagName || (target.tagName && target.tagName.toLowerCase() != "a")){
                    if(this.offsetHeight >= this.scrollHeight){
                        write_mode(this);

                        //去掉其他便签的编辑状态
                        $(".note-con.editing").removeClass("editing");
                        
                        $(this).closest(".note-con").addClass("editing").removeClass("viewing");
                        
                        //hack:解决火狐浏览器光标消失的问题
                        if(typeof window.mozRequestAnimationFrame == "function"){
                            if($(this).closest(".note-con").parent().attr("id") == "blank_sheet"){
                                //火狐下，鼠标无法通过点击来控制光标的位置，出错反而正常了，以下函数会报错
                                this.text();

                                $(this).focus();
                                return false;
                            }
                            
                            $(this).blur().focus();
                        }
                    }else{
                        if($note.hasClass("maximized")){
                            write_mode(this);
                        }
                        this.style.height = ($(this).prop("scrollHeight")) + "px";
                    }
                }
            });

            //点击进入编辑模式或打开链接
            $("#wrapper").on("click",content_area,function(event){
                event = EventUtil.getEvent(event);
                console.log("d");
                var thatEvent = event;
                var target = EventUtil.getTarget(event),
                    $note = $(this).closest(".note-con"),
                    oriLeft = event.pageX || event.clientX,
                    oriTop = event.pageY || event.clientY;

                //用户点击便签内容中的链接
                if(target.tagName && (target.tagName.toLowerCase() == "a")){
                    if(!$note.hasClass("editing")){
                        //在overlay中打开iframe或图片
                        if($(target).hasClass("open") && target.href){
                            if(!event.ctrlKey && !event.metaKey){
                                EventUtil.preventDefault(event);
                            }else{
                                return true;
                            }

                            //如果当前便签已经打开图片链接，则关闭
                            if($(target).hasClass("opened")){
                                $(".note-con.opened_image").removeClass("opened_image");
                                $("#img_modal").removeClass("show").find(".image_con img").remove();
                                $(target).removeClass("opened");
                                return false;
                            }
                            
                            var src = target.href;
                            var anchor = src.indexOf("#");
                            var src = src.substring(anchor+1,src.length);
                            if(src.indexOf("http") != 0){
                                src = "http://"+src;
                            }

                            //显示加载状态，给用户反馈
                            $("body").addClass("loading_resource");
                            $(".resource_loading").css({top:oriTop,left:oriLeft});

                            //判断是否是图片，如果是图片则无需用frame打开
                            is_image_url(src,function(url,img){
                                $("body").removeClass("loading_resource");
                                if(!img){
                                    //给链接添加类型数据，在之后用户打开时免做判断
                                    $(target).data("type","link").addClass("type-link");

                                    //非图片
                                    $("#new_windows iframe").get(0).src = url;
                                    var winScrollTop = $(window).scrollTop();
                                    if($("body").hasClass("open-link")){
                                        //切换网址
                                        $("body").addClass("switch-link");
                                        setTimeout(function(){
                                            $("body").removeClass("switch-link");
                                        },200);                                     
                                    }else{
                                        $("body").addClass("open-link");
                                        //滚动到当前便签位置
                                        $("#wrapper").scrollTop(winScrollTop);
                                    }                                

                                    //更新搜索栏宽度
                                    stickyWidth = $('#notes_con .inner-wrapper').width();
                                    $("#search_area").width(stickyWidth);
                                    // $("#iframe_modal").show();
                                    $note.addClass("opened_page");
                                }else{
                                    //给链接添加类型数据，在之后用户打开时免做判断
                                    $note.find(".note.editable a[rel=\"image\"]").attr("data-lightbox","in-memo");
                                    $(target).data("type","image").removeAttr("data-lightbox").addClass("type-image");

                                    //展示图片泡泡
                                    var filename = get_filename(url);
                                    
                                    //$("#img_modal").find(".image_con").html(img).end().addClass("show").find("a.download").attr({href:src});
                                    //if(!!filename) $("#img_modal a.download").attr("download",filename);

                                    var $img_entity = $note.find(".entities-con .img-entity a.entity img");
                                    
                                    if($img_entity.length > 0){
                                        var img_node = $img_entity.get(0);
                                        img_node.onload = img_entity_onload;

                                        img_node.onerror = function(){
                                            //加载失败，将图片去除
                                            $(this).closest(".img-entity").removeClass("entity-loaded");
                                            this.remove();
                                        };
                                        img_node.src = src;
                                    }else{
                                        var img_node = document.createElement("img");
                                        img_node.onload = img_entity_onload;

                                        img_node.onerror = function(){
                                            //加载失败，将图片去除
                                            $(this).closest(".img-entity").removeClass("entity-loaded");
                                            this.remove();
                                        };
                                        img_node.src = src;
                                        
                                        $note.find(".entities-con .img-entity").append("<a class=\"lb entity\" data-lightbox=\"in-memo\" href=\""+src+"\"></a><a class=\"img-downloader\" href=\""+src+"\" download=\""+filename+"\">").find("a.lb.entity").append(img_node);
                                    }
                                }
                            });
                        }
                    }else{
                        if($(target).attr("rel") == "image"){
                            EventUtil.preventDefault(event);
                            //没有按下ctrl键，也没有按下meta键，则取消默认行为
                            if(!event.ctrlKey && !event.metaKey && !event.shiftKey){
                                $note.find("a.selected").removeClass("selected");
                                $(target).addClass("selected");
                                selectText(target);
                            }else{
                                return false;
                            }
                        }
                    }
                }else{
                    $note.find("a.selected").removeClass("selected");
                    $("#imglk_con").html("");
                }
            });

            //关闭图片展示窗口
            $("#img_modal").on("click "+downEvent,"a.close",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                $(".note-con.opened_image").removeClass("opened_image");
                $("#img_modal").removeClass("show").find(".image_con img").remove();
            });

            //close iframe browser
            $("#new_windows .operations a").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                if($(this).hasClass("close")){
                    var wrapperScrollTop = $("#wrapper").scrollTop();

                    //更新搜索栏宽度
                    $(".note-con.opened_page").removeClass("opened_page");
                    $("body").removeClass("open-link");
                    $("#new_windows iframe").get(0).src="";

                    //滚动到当前便签位置
                    $(window).scrollTop(wrapperScrollTop);

                    stickyWidth = $('#notes_con .inner-wrapper').width();
                    $("#search_area").width(stickyWidth);
                }else if($(this).hasClass("blank")){
                    var newwin = window.open($("#new_windows iframe").get(0).src);
                }else if($(this).hasClass("fix")){

                }
            });

            //鼠标经过添加新的样式
            //函数: toggleHvr(reset,selector,hvrclass,tpSeletor,callback)
            if(!$("body").hasClass("touch-device")){
                //非触摸设备才添加hover事件
                toggleHvr(null,"#note .note-con.editing div.note.editable a[rel=\"image\"],"+
                                "#install_area .install-btn,"+
                                "#login .content-area input,"+
                                ".invite-wrapper,div.buzz-con,"+
                                "div.buzz-con .source,"+
                                "div.invite-list li,"+
                                "div.check-team,.at-box .at-list li a,"+
                                "div.unfold-area ul li a,"+
                                ".operations .edit-byname,"+
                                ".operations .pal-alias,"+
                                "#pals_list .group .pals-list .pal-con,#pals_list .group .name-con,"+
                                "#note .note-con form a.pin,"+
                                "#note .note-con form a.maximize-note,"+
                                "#note form div.bottom-menu,#colors a.color,"+
                                "html.in-frame,.checkbox,"+
                                "#search_area .by-tag.editing .custom-tags a.tag,"+
                                "#search_area .by-tag a#edit_tag,"+
                                "#search_area .by-tag a#edit_tag_finish,"+
                                "#img_modal,#settings div.nickname .name-con,"+
                                ".langs-con li.lang a,.fonts li a,"+
                                "a.drag_trigger,#note div.note.editable a.open,"+
                                "#note form div.bottom-menu a.op,"+
                                "#wrapper header .menu a,#note,"+
                                "#app_list ul li.app,section#app_list,"+
                                "#note .note-con");
            }

            //让便签可排序
            if(!$("#notes_con").hasClass("sorted")){
                sort_notes();
            }
            
            //函数: toggleFocus(reset,selector,focusClass,containerselector,callback)
            toggleFocus(function(event){
                //在blur发生时调用
                //当焦点不在当前输入框，则将大于150像素的区域隐藏，(条件是下一个聚焦的元素在他的上面)
                var $note = $(this).closest(".note-con");
                if($note.hasClass("hvr") || $note.hasClass("opened_image") || $note.hasClass("opened_page")){
                    //如果用户仍然在对当前便签进行操作，则不对文本框进行调整高度
                    return false;
                }

                var event = EventUtil.getEvent(event);
                var target = EventUtil.getTarget(event);
                var relatedTarget = EventUtil.getRelatedTarget(event);

                if(relatedTarget){
                    //下一个聚焦的元素在他的上面，以免便签过长收模式缩时页面滚动太大
                    if($(content_area).index(relatedTarget) < $(content_area).index(target)){
                        this.style.height = (Math.min($(this).prop("scrollHeight"),150)) + "px";
                        var classStr = $(this).attr("class").replace(/expand\d{0,}\-?\d{0,}/,"expand0-150");
                        $(this).attr("class",classStr);
                    }
                }else{
                    this.style.height = (Math.min($(this).prop("scrollHeight"),150)) + "px";
                    var classStr = $(this).attr("class").replace(/expand\d{0,}\-?\d{0,}/,"expand0-150");
                    if($(this).prop("scrollHeight") >= window.innerHeight/3 && $("body").hasClass("touch-device")){
                        $('html, body').animate({
                            scrollTop: $(this).offset().top - 15
                        }, 500);
                    }
                    $(this).attr("class",classStr);

                    //收缩的同时，去掉拖拽或者收缩的把手
                    if($("body").hasClass("touch-device")){
                        $note.find(".stick_handler").remove();
                    }
                }

                $note.removeClass("editing");

                //如果未修改则在此时返回查看模式，已经修改了的在保存后返回查看模式
                if(!$note.hasClass("modified")){
                    read_mode(this);
                }
            },".note-con "+content_area,"viewing","#notes_con .inner-wrapper "+all_saved_con+",#today,#search_results,#blank_sheet",function(event){
                //在focus发生时调用
                //当用户准备输入时，将文本框高度设为无滚动条时的高度，并改变最大高度值为999
                //this.style.height = ($(this).prop("scrollHeight")) + "px";
                var classStr = $(this).attr("class").replace(/expand\d{0,}\-?\d{0,}/,"expand0-600");
                $(this).attr("class",classStr);
                
                //移动设备上，若是便签的高度大于了屏幕高度的1/3则自动滚动到最上面
                if($(this).prop("scrollHeight") >= window.innerHeight/3 && $("body").hasClass("touch-device")){
                    $('html, body').animate({
                        scrollTop: $(this).offset().top - 15
                    }, 500);

                    //针对移动设备，同时给其添加把手，可以用来拖拽以及收缩便签的把手
                    if($("body").hasClass("touch-device")){
                        var $form = $(this).closest("form"),
                            $drag_trigger = $form.find(".drag_trigger");
                        if($drag_trigger.length > 0){
                            var top = $drag_trigger.prop("offsetTop") + $drag_trigger.height(),
                                height = $form.height() - top - 5;
                        }else{
                            var top = 5,
                                height = $form.height() - 10;
                        }
                        $form.append("<a href=\"#\" class=\"stick_handler\" style=\"height:"+height+"px;top:"+top+"px;\"></a>");
                    }
                }
            });
    
            if(!($("body").hasClass("touch-device")) && window.top == self){
                //页面打开时，让文本框自动让新记事获取焦点
                $(".note-con.new").addClass("editing").find(content_area).focus();
            }

            //设定自动保存定时器
            idl.noteint = setInterval(function(){
                //对用户正在编辑的便签进行保存
                  $(".note-con.editing").each(function(){
                        //如果便签处于已修改状态，则对其进行本地保存
                        if($(this).hasClass("modified") && !$(this).hasClass("saving")){
                            if(localStorage){
                                //本地存储,保存完后将其进行删除
                                var val = $(content_area,this).html();
                                    val = encode_content(val);
                                if($(this).data("id")){
                                    //如果是已存在的有id的
                                    //{34:{"content":"",saved:0,id:4,modified:"2013-3-3 00:00:00"}}
                                    var id = $(this).data("id");
                                    var modified_note = {content: val,modified: get_current_time(),saved:0};
                                    var modified_notes_str = localStorage.getItem("modified_notes");

                                    if(modified_notes_str){
                                        var modified_notes = JSON.parse(modified_notes_str);
                                        //更新当前保存数据
                                        modified_notes[id] = modified_note;
                                    }else{
                                        //如果本地存储中不存在此条数据，则新建一条
                                        var modified_notes = {};
                                            modified_notes[id] = modified_note;
                                    }

                                    if(console) console.log("local saved");
                                    localStorage.setItem("modified_notes",JSON.stringify(modified_notes));
                                }else{
                                    //此条数据只有一条,每次保存自动更新
                                    if($.trim(val) == "" || val.replace(/\&nbsp\;/ig,"") == ""){
                                        return false;
                                    }
                                    
                                    if(console) console.log("local saved");
                                    var new_note = {id: 0,content: val,created:get_current_time(),saved:0};
                                    localStorage.setItem("new_note",JSON.stringify(new_note));
                                }
                            }else{
                                //无本地存储则保存到服务器
                                $("form.note",this).submit();
                            }
                        }
                  });
            },1000);

            //已修改的记事在失去焦点时自动保存
            $("#wrapper").on("blur","#notes_con .note-con.modified",function(event){
                event = EventUtil.getEvent(event);
                $("form",this).submit();
                read_mode($(content_area,this).get(0));
            });

            //移动设备因为无法检测到删除按键，故删除了内容之后不会被设为"modified"状态，所以只要是正在编辑的都直接保存
            if($("body").hasClass("touch-device")){
                //已修改的记事在失去焦点时自动保存
                $("#wrapper").on("blur","#notes_con .note-con.editing",function(event){
                    event = EventUtil.getEvent(event);
                    $("form",this).submit();
                    read_mode($(content_area,this).get(0));
                });
            }

            /*
            * ----------打开某种高级搜索方式，以地理位置搜索时，离屏加载高德地图，以时间搜索时，离屏加载日历，以标签搜索时，离屏加载自定义便签------------
            */
            $("#search_area").on("click "+downEvent,".search",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                $("#search_results .result").html("");

                //如果当前搜索方式是其他方式
                if(!$(this).hasClass("active")){
                    if(/by\-(\S)/.test($(this).attr("class"))){
                        var method = $(this).attr("class").match(/by\-(\S+)/)[1];
                    }else{
                        return false;
                    }

                    if($(this).hasClass("by-geo")){
                        //按地理位置搜索
                        //“离屏”加载高德地图，同时加载最近添加地点
                        if($("#map_con").hasClass("uninitialized")){
                            var spt = document.createElement("script");
                                spt.type = 'text/javascript';
                                spt.src = "http://webapi.amap.com/maps?v=1.2&key=f2fc6ad0b48f9e5bdcd3553f4b8b72ea&callback=loadSticks";
                                document.body.appendChild(spt);
                                $("#map_con").removeClass("uninitialized");
                        }

                        $("#search_area").addClass(method).addClass("active");
                        //将点击的搜索功能设为激活状态
                        $(this).addClass("active").css("left","5px");

                    }else if($(this).hasClass("by-tag")){
                        //按标签进行搜索
                        $("#search_area").addClass(method).addClass("active");
                        //将点击的搜索功能设为激活状态
                        $(this).addClass("active").css("left","5px");

                    }else if($(this).hasClass("by-device")){
                        //按设备搜索
                        $("#search_area").addClass(method).addClass("active");
                        //将点击的搜索功能设为激活状态
                        $(this).addClass("active").css("left","5px");

                    }else if($(this).hasClass("by-archive")){
                        if($("#search_results .archived").hasClass("finished") || $("#search_results .archived").hasClass("loading")){
                            $("#search_results .archived").html("").removeClass("finished");
                        }else{
                            //得到存档箱中的结果
                            get_archived_notes();
                        }
                    }else if($(this).hasClass("by-history")){
                        $("#search_area").addClass(method).addClass("active");
                        //将点击的搜索功能设为激活状态
                        $(this).addClass("active").css("left","5px");
                    }
                }
            });

            $("#search_area .by-tag .expand-tags").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                if($("#search_area .by-tag").hasClass("custom")){
                    $("#search_area .by-tag").removeClass("custom");

                    //关闭时检测一下是否便签正处于编辑状态，若是，则退出编辑
                    if($("#search_area .by-tag").hasClass("editing")) $("#edit_tag_finish").trigger("click");
                }else{
                    $("#search_area .by-tag").addClass("custom")
                }
            });

            //让标签可拖拽
            (function(){
                var mousedown = false,
                    tag_con = null,
                    tag_con_clone = null,
                    pined_con_name = "pined-tags",
                    dropzone = $("#search_area .by-tag ."+pined_con_name).get(0),
                    tag_parent_con = "",
                    pined_num = 0,
                    diff = {};

                $(document).on("mousedown "+downEvent,"#search_area .by-tag.editing .custom-tags .tag-con,#search_area .by-tag.editing ."+pined_con_name+" .tag-con",function(event){
                    event = EventUtil.getEvent(event);
                    target = EventUtil.getTarget(event);
                    tag_con = this;
                    tag_parent_con = this.parentNode;

                    //根据拖动的元素来确定dropzone
                    if($(tag_parent_con).hasClass(pined_con_name)){
                        dropzone = $("#search_area .by-tag .custom-tags").get(0);
                    }else{
                        dropzone = $("#search_area .by-tag ."+pined_con_name).get(0);
                    }
                    pined_num = $("#search_area .by-tag ."+pined_con_name+" .tag-con").not(".clone").length;
                    var target = EventUtil.getTarget(event);
                    var posx = event.pageX || event.clientX;
                    var posy = event.pageY || event.clientY;
                    
                    //排除拖拽情况
                    //点击鼠标右键并非拖拽
                    //点击删除图标不属于拖拽
                    if(event.button != 2 && !$(target).hasClass("close") && $(tag_con).find("a.tag")[0].id != "tag_notes"){
                        mousedown = true;

                        //鼠标位置与顶点的偏差
                        diff.x = posx - tag_con.offsetLeft;
                        diff.y = posy - tag_con.offsetTop;
                    }
                });

                $(document).on(moveEvent,function(event){
                    event = EventUtil.getEvent(event);
                    var posx = event.pageX || event.clientX;
                    var posy = event.pageY || event.clientY;

                    if(mousedown){
                        if(!tag_con_clone){
                            var tag_left = tag_con.offsetLeft;
                            var tag_top = tag_con.offsetTop;
                            tag_con_clone = $(tag_con).clone(true).addClass("clone").css({position:"absolute",left:tag_left,top:tag_top,opacity:1,"z-index":999}).get(0);
                            
                            $(tag_con).addClass("current_tag").after(tag_con_clone);
                            
                            //给用户提示哪里可以放下tag --> outline
                            $("#search_area .by-tag.editing").addClass("dragging");
                            $(dropzone).addClass("dropzone");
                        }else{
                            //移动tag
                            tag_con_clone.style.left = (posx - diff.x) + "px";
                            tag_con_clone.style.top = (posy - diff.y) + "px";

                            var tag_offset = $(tag_con_clone).offset();
                            var drop_offset = $(dropzone).offset();
                            var drop_right_margin = drop_offset.left + $(dropzone).width();
                            var drop_bottom_margin = drop_offset.top + $(dropzone).height();
                            
                            if(posx < drop_right_margin && posx > drop_offset.left && posy < drop_bottom_margin && posy > drop_offset.top){
                                
                                //当拖入到pined-tags时，如果pined-tags中不存在此标签，则腾出空间来
                                if($(dropzone).hasClass(pined_con_name)){
                                    var current_tag_id = $(tag_con_clone).find("a.tag").data("id");
                                    
                                    var exist = $(dropzone).find("a.tag[data-id=\""+current_tag_id+"\"]").length;
                                    
                                    if(pined_num < 4 && !!!exist){
                                        var curnum = $(".tag-con",dropzone).length + 1;
                                        var con_width = (1/curnum) * 90;
                                        $(".tag-con",dropzone).css({"width":con_width+"%"});
                                        $(dropzone).addClass("dragon");
                                    }
                                }else{
                                    //由pined-tags移到custom，少于或等于一个不让移动
                                    console.log(pined_num);
                                    if(pined_num > 2){
                                        $(dropzone).addClass("dragon");
                                    }
                                }
                            }else{
                                if($(dropzone).hasClass(pined_con_name)){
                                    var curnum = $(".tag-con",dropzone).length;
                                    var con_width = (1/curnum) * 90;
                                    $(".tag-con",dropzone).css({"width":con_width+"%"});
                                }
                                $(dropzone).removeClass("dragon");
                            }
                        }
                        
                    }
                });

                $(document).on(upEvent,function(event){
                    event = EventUtil.getEvent(event);
                    //若鼠标松开时所在的区域是投放的区域，则让其插入，然后删除拷贝
                    if($(dropzone).hasClass("dragon")){
                        var tag_id = $(tag_con).find("a.tag").data("id");
                        var tag = new Tag({"id":tag_id});
                        //由custom移动到default
                        //default中多一个tag，custom中数量不变
                        if($(dropzone).hasClass(pined_con_name)){
                            tag.pinIt(function(feedback){
                                if(feedback.status == "ok"){
                                    //取出掉临时的样式，将其添加到default中
                                    //$(tag_con_clone).removeAttr("style").removeClass("clone");
                                    $(tag_con).append("<span class=\"separator\"></span>");
                                    $(".tag-con",dropzone).last().after(tag_con);
                                    $(tag_con_clone).remove();
                                    tag_con_clone = null;
                                    var curnum = $(".tag-con",dropzone).length;
                                    var con_width = (1/curnum) * 90;
                                    $(".tag-con",dropzone).css({"width":con_width+"%"});
                                    tag_con_clone = null;
                                    tag_con = null;
                                }else{
                                    
                                }
                            });
                        }else{
                            //由default移动到custom
                            //tag在default中消失，将其移除
                            tag.unpinIt(function(feedback){
                                if(feedback.status == "ok"){
                                    $(tag_con_clone).remove();
                                    $(tag_con).find("span.separator").remove();
                                    $("#search_area .custom-tags .tags-con").prepend($(tag_con).removeAttr("style"));
                                    tag.updateAccess(function(data){
                                        if(console) console.log(data);
                                    });
                                    //default中少了一个tag，调整宽度
                                    var $tag_cons_left = $("#search_area .by-tag ."+pined_con_name+" .tag-con").not(".clone");
                                    var curnum = $tag_cons_left.length;
                                    if(curnum > 0){
                                        var con_width = (1/curnum) * 90;
                                        $tag_cons_left.css({width:con_width+"%"});
                                    }
                                    tag_con_clone = null;
                                    tag_con = null;
                                }else{
                                    
                                }
                            });
                        }
                    }else{
                        $(tag_con_clone).remove();
                        tag_con_clone = null;
                        tag_con = null;
                    }

                    //清除提醒效果
                    $(dropzone).removeClass("dragon dropzone");
                    $("#search_area .by-tag.editing").removeClass("dragging");
                    mousedown = false;
                    $(tag_con).removeClass("current_tag");
                });
            })();

            //编辑标签
            $("#search_area").on("click","#edit_tag,#edit_tag_finish",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                if($("#search_area .by-tag").hasClass("editing")){
                    //退出编辑状态，
                    //有颜色的变换字体颜色，去掉背景颜色，
                    //没颜色的，变成默认颜色，字体也是
                    $("#search_area .by-tag").removeClass("editing");
                    
                    $("#search_area .by-tag a.tag").each(function(){
                        var color = $(this).data("color");
                        if(!!color){
                            $(this).css({"color":color,"background":"none"});
                        }else{
                            $(this).css({"background":"none","color":"#666"});
                        }
                    });
                }else{
                    //进入编辑状态，标签反色
                    $("#search_area .by-tag").addClass("editing");

                    $("#search_area .by-tag a.tag").each(function(){
                        var color = $(this).data("color");
                        if(!!color){
                            $(this).css({"color":"white","background":color});
                        }else{
                            $(this).css({"background":"#ccc","color":"white"});
                        }
                    });
                }
            });

            //无法失焦的元素通过在body上设置鼠标按下监听器，鼠标按下的不是需要聚焦的元素，则是失焦,模拟失焦事件
            $("body").on("mousedown "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                var target = EventUtil.getTarget(event);
            
                //如果当前页面有处于激活状态的元素且当前点击的元素非此激活元素
                if($(".tag-con.setting-color").length > 0 && !$.contains($(".tag-con.setting-color").get(0),target)){
                    $(".tag-con.setting-color").removeClass("setting-color");
                }

                //如果当前有打开的图片，电器别处即是关闭
                if($("#img_modal.show").length > 0 && !$.contains($("#img_modal.show").get(0),target) && !$(target).hasClass("opened")){
                    //$("#img_modal a.close").trigger("click");
                    $(".note-con.opened_image a.open.opened").removeClass("opened");
                    $(".note-con.opened_image").removeClass("opened_image");
                    $("#img_modal").removeClass("show").find(".image_con img").remove();
                }

                //如果当前打开的最大化便签没有没固定(pin)则将其最小化
                if($(".note-con.maximized").length > 0 && !$(".note-con.maximized").hasClass("fixed") && !$.contains($(".note-con.maximized").get(0),target) && !$(target).hasClass("maximized")){
                    if(!$("body").hasClass("in-frame")) $(".note-con.maximized").find("a.minimize-note").trigger("click");
		              EventUtil.stopPropagation(event);
                }

                if($(".unfold-info.active").length > 0 && !$.contains($(".unfold-info.active").get(0),target)){
                    $(".unfold-info").removeClass("active");
                }

                if($(".invite.active").length > 0 && !$.contains($(".invite.active").get(0),target)){
                    $(".invite.active").removeClass("active");
                }
                
                if($("#create_team form .unfold-area.active").length > 0 && !$.contains($("#create_team form .unfold-area.active").get(0),target)){
                    $("#create_team form .unfold-area.active").removeClass("active");
                }

                if($(".at-box.active").length > 0 && !$.contains($(".at-box.active .at-list .at-wrapper").get(0),target) && !$(target).hasClass("at-field")){
                    $(".at-box.active").removeClass("active");
                }

                if($(".invite-wrapper.active").length > 0 && !$.contains($(".invite-wrapper .invite-list").get(0),target) && !$(target).hasClass("members-list")){
                    $(".invite-wrapper.active").removeClass("active");
                }
            });

            //替换标签颜色，替换的同时，底部菜单也需要替换
            $("#colors").on("click","a.color,a.remove-tag",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                
                var $tag_con = $(this).closest(".tag-con");
                
                //关闭设置颜色面板
                $tag_con.removeClass("setting-color");

                if($tag_con.length == 0) return false;

                var $tag = $tag_con.find("a.tag");
                var tag = new Tag({id:$tag.data("id")});
                var is_current_panel = ($tag.data("id") == $("#search_area .by-tag .tag.active").data("id"));

                if($(this).hasClass("nocolor")){
                    //设置为无颜色
                    //如果本来就无颜色则不作操作
                    var oriColor = $tag_con.find("a.tag").data("color");

                    //否则,去掉原来的颜色，让颜色变为默认值
                    if(!!oriColor){
                        //传空参数进去
                        tag.setColor(function(data){
                            var feedback = get_json_feedback(data);

                            if(feedback.status == "ok"){
                                $tag_con.find("a.tag").css("background","#ccc").removeAttr("data-color").removeData("color");

                                //去掉其它区域此便签的颜色值
                                var $copy_tag = $("#note_ops a.tag[data-id=\""+$tag.data("id")+"\"]").removeAttr("data-color").removeData("color").removeClass("colored-tag");

                                if($copy_tag.hasClass("choosed")){
                                    //为被选中状态，去掉带原色的反色
                                    $copy_tag.css({background:"#ccc",color:"white"});
                                }else{
                                    //非选中状态
                                    $copy_tag.css("color","white");
                                }

                                //将便签中的颜色块去掉
                                $(".note-con .default_tag[data-id=\""+$tag.data("id")+"\"]").remove();
                            }else{
                                showMessage({type:"error",msg:"设置颜色失败"});
                            }
                        });
                    }
                }else if($(this).hasClass("remove-tag")){
                    if($tag_con.hasClass("default")) return false;
                    //删除标签
                    $tag.addClass("to-be-deleted").closest(".tag-con").fadeOut(function(){
                        //提示可撤销操作
                        $("#search_area").after("<div class=\"feedback-hint\">该标签已被删除<a href=\"#\" data-event=\"del_tag\" id=\"revocate\">撤销</a></div>");
                        var delete_note_timeout = setTimeout(function(){
                            if($tag.hasClass("to-be-deleted")){
                                //删除便签
                                tag.del(function(data){
                                    if(console) console.log(data);
                                    var feedback = get_json_feedback(data);
                                    if(feedback.status && feedback.status == "ok"){
                                        var $colors = $tag_con.find("#colors");
                                        $("body").append($colors);
                                        $tag_con.remove();
                                        if(is_current_panel){
                                            //如果删除的是当前打开的tag，则返回笔记面板
                                            $("#tag_notes").trigger("click");
                                        }
                                    }else{
                                        showMessage({type:"error",msg:"删除失败"});
                                        //还原
                                        $tag.removeClass("to-be-deleted").fadeIn();
                                    }

                                    //隐藏提示
                                    $(".feedback-hint").fadeOut("fast",function(){$(this).remove();});
                                });
                            }else{
                                clearTimeout(delete_note_timeout);
                            }
                        },2500);
                    });
                }else{
                    var color = $(this).data("color");
                    tag.setColor(color,function(data){
                        if(console) console.log(data);
                        var feedback = get_json_feedback(data);
                        if(feedback.status == "ok"){
                            //目前拥有此颜色的标签需要去掉此颜色，变为无色；拥有此标签的便签也要去掉相应的颜色块
                            var $previous_tag = $("#search_area .by-tag .tag[data-color=\""+color+"\"]");
                            $previous_tag.css("background","#ccc").removeAttr("data-color").removeData("color");
                            $(".note-con .default_tag[data-id=\""+$previous_tag.data("id")+"\"]").remove();

                            $tag.css("background",color).attr("data-color",color);

                            //更改其它区域此便签的颜色值
                            //首先去掉之前拥有该色彩的标签的色彩值
                            var $copy_previous_tag = $("#note_ops a.tag[data-id=\""+$previous_tag.data("id")+"\"]").removeAttr("data-color").removeData("color");
                            if($copy_previous_tag.hasClass("choosed")){
                                //为被选中状态，去掉带原色的反色
                                $copy_previous_tag.css({background:"#ccc",color:"white"});
                            }else{
                                //非选中状态
                                $copy_previous_tag.css("color","white");
                            }

                            //新添加色彩的标签也需要更新；拥有此标签的便签也要添加相应的颜色块，由于前台不刷新无法确定某个便签是否拥有某标签，所以暂时无法更新颜色块
                            var $copy_tag = $("#note_ops a.tag[data-id=\""+$tag.data("id")+"\"]").attr("data-color",color).data("color",color);
                            if($copy_previous_tag.hasClass("choosed")){
                                //为被选中状态，更改反色背景
                                $copy_previous_tag.css({background:color,color:"white"});
                            }else{
                                //非选中状态
                                $copy_previous_tag.css("color",color);
                            }
                        }else{
                            showMessage({type:"error",msg:"设置颜色失败"});
                        }
                    });
                    
                }
            });

            //点击标签，展示属于此标签的便签
            $("#search_area").on("click "+downEvent,".pined-tags a.tag,.custom-tags a.tag",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                //如果是在编辑模式下
                if($("#search_area .by-tag").hasClass("editing")){
                    var target = EventUtil.getTarget(event);
                    var tag_id = $(this).data("id");
                    var $tag = $(this);
                    var tag = new Tag({id:tag_id});
                    var is_current_panel = (tag_id == $("#search_area .by-tag .tag.active").data("id"));
                    if($(target).hasClass("close")){
                        //删除标签
                        $tag.addClass("to-be-deleted").fadeOut(function(){
                            //提示可撤销操作
                            $("#search_area").after("<div class=\"feedback-hint\">该标签已被删除<a href=\"#\" data-event=\"del_tag\" id=\"revocate\">撤销</a></div>");
                            var delete_tag_timeout = setTimeout(function(){
                                if($tag.hasClass("to-be-deleted")){
                                    //删除便签
                                    tag.del(function(data){
                                        if(console) console.log(data);
                                        var feedback = get_json_feedback(data);
                                        if(feedback.status && feedback.status == "ok"){
                                            $tag.remove();
                                            if(is_current_panel){
                                                //如果删除的是当前打开的tag，则返回笔记面板
                                                $("#tag_notes").trigger("click");
                                            }
                                        }else{
                                            showMessage({type:"error",msg:"删除失败"});
                                            //还原
                                            $tag.removeClass("to-be-deleted").fadeIn();
                                        }

                                        //隐藏提示
                                        $(".feedback-hint").fadeOut("fast",function(){$(this).remove();});
                                    });
                                }else{
                                    clearTimeout(delete_tag_timeout);
                                }
                            },2500);
                        });
                    }else if($(target).hasClass("tag")){
                        //打开或关闭设置颜色面板
                        if($tag.parent().hasClass("setting-color")){
                            $tag.parent().removeClass("setting-color");
                        }else{
                            $("#search_area .by-tag .tag-con.setting-color").removeClass("setting-color");
                            $tag.parent().addClass("setting-color").append($("#colors"));

                            var cursor_x = event.pageX || event.clientX;

                            $("#colors").css({left:0});
                            var left = -($("#colors").width()/2 +  $("#colors").offset().left - cursor_x);
                            $("#colors").css({left:left});

                            //然后判断是否有超出部分
                            var wrapper_width = $("#search_area .by-tag").outerWidth(),
                                wrapper_left = $("#search_area .by-tag").offset().left;

                            if($("#colors").width() + $("#colors").offset().left > wrapper_left + wrapper_width){
                                console.log("right side overflow");
                                //右边超出可视部分
                                var offsetx = $("#colors").width() + $("#colors").offset().left - (wrapper_left + wrapper_width);
                                $("#colors").css({left:left-offsetx});
                            }

                            if($("#colors").offset().left < wrapper_left){
                                console.log("left side overflow");
                                //左边超出可视部分
                                $("#colors").css({left:0});
                            }

                            //确定三角形的位置
                            var triangle_left = cursor_x - $("#colors").offset().left;
                            $("#colors .triangle,#colors .triangle-border").css({left:triangle_left});
                        }
                    }
                    return false;
                }

                //如果是在非编辑模式下且为当前打开面板则不允许再次点击
                if($(this).hasClass("active")){
                    return false;
                }

                //将上一次的结果缓存起来
                var $last_active_tag = $("#search_area .tag.active");
                $("#search_area .by-tag .tag[data-id=\""+$last_active_tag.data("id")+"\"]").data({last_refresh:get_current_time()});

                $last_active_tag.removeClass("active");

                //将点击的标签设为激活状态
                $(this).addClass("active");

                //如果点击的是所有，则离开搜索模式，展示所有
                var $tag = $(this),
                    tag_id = $(this).data("id"),
                    tag_name = $(this.firstChild).text(),
                    results_con = "#search_results .by-tag .tag-result.tag-"+tag_id;

                var tag = new Tag({id:tag_id});

                //给不同的分类加以区别，为做不同的样式做准备
                if($(this).hasClass("default-tag") && this.id && this.id.match(/tag\_([a-z]+)/)){
                    $("#search_results").removeAttr("class").addClass("results-of-"+this.id.match(/tag\_([a-z]+)/)[1]);
                }else{
                    $("#search_results").removeAttr("class").addClass("custom-tag-results");
                }

                $("#search_results h2 span.title").text(tag_name);
                $("#search_results h2 span.num").text("");

                tag.list_notes();
                return false;

                //此次打开的面板记录下来
                Note.prototype.save_last_opened(tag_id,function(data){
                    console.log(data);
                });

                //set_fetch_timer(tag_id,results_con);

                //如果当前面板为任务面板，则将新添加的任务放入以后区域
                    if($("#search_results").hasClass("results-of-tasks")){
                        divide_task_area();
                        var new_tasks = new Array();
                        $(".note-con.newly_saved.task").each(function(){
                            if($(this).offset().top < $(".today-area").offset().top){
                                new_tasks.push(this);
                            }
                        });
                        
                        for(var i=0; i<new_tasks.length; i++){
                            $(".later-area").after(new_tasks[i]);
                        }
                    }

                //给不同的分类加以区别，为做不同的样式做准备
                if($(this).hasClass("default-tag") && this.id && this.id.match(/tag\_([a-z]+)/)){
                    $("#search_results").removeAttr("class").addClass("results-of-"+this.id.match(/tag\_([a-z]+)/)[1]);
                }else{
                    $("#search_results").removeAttr("class").addClass("custom-tag-results");
                }

                $("#search_results h2 span.title").text(tag_name);
                $("#search_results h2 span.num").text("");

                //清空搜索结果
                $("#search_results .by-tag").removeClass("finished").find(".tag-result.show").fadeOut(function(){$(this).removeClass("show")});

                //$("#search_results .by-tag").html("").removeClass("finished");
                $(".inner-wrapper").addClass("searching");

                
                //查看之前是否有数据缓存
                if(!!!$(this).data("last_refresh") && !!!$(this).data("num")){
                    //无缓存则直接去服务器取数据
                    get_notes_in_tag(tag_id);
                }else{
                    //有缓存则检查缓存是否有效
                    var last_refresh = $(this).data("last_refresh");
                    var num = $(this).data("num");
                    var that = this;

                    if(!!!last_refresh){
                        get_notes_in_tag(tag_id);
                        return false;
                    }

                    //除了检查更新时间外，还需要检查,tag中的条目数是否改变
                    Note.prototype.check_cache_status(tag_id,last_refresh,num,function(data){
                        if(console) console.log(data);
                        var feedback = get_json_feedback(data);
                        if(feedback.status && feedback.status == "ok"){
                            //if(feedback.cache_status == "invalid" || $(that).data("results") === undefined){
                            if(feedback.cache_status == "invalid" || $("#search_results .by-tag .tag-result.tag-"+tag_id).length == 0){
                                //如果后台有新数据或其他变更导致缓存不准确，则从新加载
                                $(that).removeClass("finished");
                                //清空上次搜索结果
                                $("#search_results .by-tag .tag-result.tag-"+tag_id).html("");
                                //得到新的结果
                                get_notes_in_tag(tag_id);
                            }else{
                                //缓存可用，使用缓存
                                $("#search_results h2 span.num").text("("+$(that).data("num")+")");
                                //$("#search_results .by-tag").html($(that).data("results"));
                                $("#search_results .by-tag .tag-result.tag-"+tag_id).fadeIn(function(){$(this).addClass("show")});
                            }
                        }else{
                            showMessage({type:"error",msg:"刷新失败"});
                        }
                    });
                }
            });

            //打开关键字搜索字段
            $("#search_area").on("click "+downEvent,".by-keywords",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                var target = EventUtil.getTarget(event);
                if(target.tagName && target.tagName.toLowerCase() == "input") return false;
                switch_search();
            });

            

            $("#search_area .by-keywords a.close-input").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                //关闭搜索框
                switch_search();
            });

            //切换搜索方式
            function switch_search(){
                if(!$("#search_area").hasClass("searching-keywords")){
                    //重新返回所有便签
                    $("#search_area").addClass("searching-keywords");
                    var $title_field = $("#search_results h2 span.title"),
                        $num_field = $("#search_results h2 span.num");

                    $title_field.data("last_title",$title_field.text());
                    $num_field.data("last_num",$num_field.text());

                    //关闭标签展开区域
                    if($("#search_area .by-tag").hasClass("custom")){
                        $("#search_area .by-tag a.expand-tags").trigger("click");
                    }

                    //将搜索框展开，标签搜索栏隐藏
                    $("#search_area .by-tag").animate({left:"100%"});
                    $("#search_area .by-keywords").animate({width:"100%"});
                    $("#search_area .by-keywords input").focus();

                    $("#search_results").removeAttr("class");
                }else{
                    $("#search_area .by-tag").animate({left:"0"});
                    $("#search_area .by-keywords").animate({width:"40px"},function(){
                        $("#search_area").removeClass("searching-keywords");
                        //$("#search_results").removeAttr("class");
                    });
                }
            }

            //清除高级搜索结果，返回高级搜索选择界面
            $("#search_area a.deactive").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                //重置搜索区域状态?
                //得到当前激活了高级搜索方法,
                if(/by\-(\S)/.test($("#search_area .search.active").attr("class"))){
                    var cur_method = $("#search_area .search.active").attr("class").match(/by\-(\S+)/)[1];
                    $("#search_area").removeClass(cur_method)
                }

                $("#search_area").removeClass("active");
                $(".search.active").css("left",$(".search.active").data("pos-left")).removeClass("active");

                //清空搜索结果
                $("#search_results .result").html("");

                //隐藏高级选项(关闭日历，地图，自定义标签)
                $("#search_area").removeClass("cal-on map-on custom-on devices-expanded");
            });

            //添加搜索监听事件
            $("#wrapper").on("submit","form.notes-search",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var field = this.note_keywords,
                    keyword = this.note_keywords.value;

                if($.trim(keyword) == ""){
                    return false;
                }
            });

            function display_results(keywords,results_con){
                    keywords = keywords;
                var i=0,
                    keyword,
                    note_cons = "#notes_con .note-con",//所有被搜索便签
                    results_con = !!results_con ? results_con : ".results",
                    results = new Array(),
                    second_results = new Array();

                var keywords_str = keywords.replace(/[\,\.\;\'\"\`\!\-\+\，\。\；\‘\：\”\·\！\？\、]/g," ").toLowerCase(),
                    split_words = keywords_str.split(" "),
                    word_len = split_words.length,
                    frequency;

                //便签区域成为搜索状态，便签都成为不可拖拽状态，在取消搜索后去除，(关闭搜索结果框，或者关键字为空时)
                $("#notes_con").addClass("searching");

                //将搜索结果清空
                $(results_con).html("");

                //首先在当前页面中搜索
                //1.包含能够匹配所有用户输入关键字的记事 如一条记事匹配到 “css and design"
                //2.包含能够分别匹配用户输入的所有关键字的记事 如一条记事分别匹配到 “css” 和 “design”
                //权重依次降低

                //1.
                $(note_cons).not(".hidden").each(function(){
                    var data = $(this).data();
                    for(var prop in data){
                        //移出已经加上去的数据，避免上次的数据影响这次搜索结果
                        if(/^freq(\-)?\S+/.test(prop)){
                            $(this).removeData(prop);
                        }
                    }

                    var $note = $(this).find(content_area),
                        content = !!$note.html() ? $note.html().toLowerCase() : "";

                    if(content.indexOf(keywords) > -1){
                        results.push(this);
                    }
                });

                //2.
                //not(".hidden") 排除没有文本框的便签
                $(note_cons).not(".hidden").each(function(){
                    var $note = $(this).find(content_area),
                        content = !!$note.html() ? $note.html().toLowerCase() : "";

                        //在第一步中取的东西排除
                        if(content.indexOf(keywords) == -1){
                            var j=0;
                            for(i=0; i<word_len; i++){
                                keyword = split_words[i];
                                if(keyword != "" && content.indexOf(keyword) > -1){
                                    //得出出现的单词的个数
                                    j++;
                                    //得出单词出现的频度
                                    $(this).data("freq-"+keyword,content.split(keyword).length - 1);
                                }
                            }

                            if(j > 0){
                                $(this).data("keyword-num",j);
                                second_results.push(this);
                            }
                        }
                });
                
                //处理得到的second_results的展示顺序
                second_results.sort(function(a,b){
                    if($(a).data("keywordNum") > $(b).data("keywordNum")){
                        //返回false不调换顺序
                        return -1;
                    }else if($(a).data("keywordNum") == $(b).data("keywordNum")){
                        //如果此时两者的单词个数都是一样
                        //则比较比较哪一个节点的匹配频度高些
                        var adata = $(a).data(),
                            bdata = $(b).data(),
                            afreq = bfreq = 0;

                        for(var prop in adata){
                            if(bdata[prop] && /^freq(\-)?\S+/.test(prop)){
                                if(!isNaN(adata[prop]) && !isNaN(bdata[prop])){
                                    //将各个单词出现的频率做累加
                                    bfreq += bdata[prop];
                                    afreq += adata[prop];
                                }
                            }
                        }
                        
                        if(afreq > bfreq){
                            return -1;
                        }else{
                            return 1;
                        }
                    }else{
                        //调换a,b顺序
                        return 1;
                    }
                });
                
                var last_results = results.concat(second_results),
                    exclude_ids = new Array(),
                    limit = 4;

                //去掉搜索完成标识，以便继续搜索
                $(results_con).removeClass("finished");
                
                if(keywords.length > 0){
                    for(var i=0,len=last_results.length; i<len; i++){
                        var note = last_results[i];
                            $(results_con).append($(note).clone());
                            exclude_ids.push($(note).data("id"));
                    }
                }

                //进入服务器进入全库搜索
                //需要先检测用户的输入状态以及关键字的长度
                if(keywords.length >= 2){
                    //排除掉已经搜索出的结果
                    var offset = last_results.length,
                        $existed_results = new Array();

                    //搜索要分次搜索，以免一次结果太多导致页面卡死
                    search_notes(keywords,exclude_ids,limit);
                }
            }

            //按下回车键时立即搜索
            $("input.search-field").on("keydown",function(){
                event = EventUtil.getEvent(event);

                if(event.keyCode && event.keyCode == "13"){
                    var keywords = $.trim(this.value.toLowerCase());
                    
                    if(keywords == ""){
                        $("#search_results .by-keywords").html("");
                        return false;
                    }

                    clearTimeout(idl.search_delay);
                    display_results(keywords,"#search_results .by-keywords");
                    EventUtil.preventDefault(event);
                }
            });

            //在搜索框内键入时进行搜索
            $("input.search-field").on("propertychange input keyup",function(event){
                event = EventUtil.getEvent(event);

                if(this.value.toLowerCase() == $(this).data("keywords")){
                    return false;
                }

                var keywords = $.trim(this.value.toLowerCase());

                //清除上次的timeout
                clearTimeout(idl.search_delay);

                var $title_field = $("#search_results h2 span.title");
                var $num_field = $("#search_results h2 span.num");

                //有输入则改变标题
                if(keywords.length > 0){
                    $title_field.text("\""+keywords+"\"的搜索结果");
                    $num_field.text("");
                    $("#search_results .by-tag").hide();
                    $("#search_results .by-keywords").show();
                }

                //如果输入为空
                if(keywords == ""){
                    var last_num = $num_field.data("last_num") ? $num_field.data("last_num") : "";
                    var last_title = $title_field.data("last_title") ? $title_field.data("last_title") : "";
                    $title_field.text(last_title);
                    $num_field.text(last_num);
                    $("#search_results .by-keywords").html("").hide();
                    $("#search_results .by-tag").show();
                    return false;
                }

                $(this).data("keywords",keywords);

                //输入完成2s之后展示结果
                idl.search_delay = setTimeout(function(){
                    display_results(keywords,"#search_results .by-keywords");
                },600);
            });

            //获得标签下的便签
            function get_notes_in_tag(tag_id,limit,offset_id){
                if(isNaN(tag_id) || tag_id <= 0){
                    return false;
                }

                //限制一次取出数据
                limit = !!limit ? limit : 10;

                //设置偏移便签数量，默认从0取起
                offset_id = !!offset_id ? offset_id : 0;
                
                if(offset_id == 0){
                    //如果是第一次取，则将总数也取出，另外，也将这一次访问的tag_id保存
                    Note.prototype.get_num_in_tag(tag_id,function(data){
                        var feedback = get_json_feedback(data);
                        if(feedback.num != undefined){
                            $("#search_results h2 span.num").text("("+feedback.num+")");
                            $("#search_area .by-tag a.tag[data-id=\""+tag_id+"\"]").data("num",feedback.num);

                            //放入全局变量中缓存标签数据
                            // if(!idl.apps.note.tag["tag_"+tag_id]){
                            //     idl.apps.note.tag["tag_"+tag_id] = {};
                            // }
                            // idl.apps.note.tag["tag_"+tag_id].num = feedback.num;
                        }
                    });
                }

                //如果不存在乘装结果的容器，则创建一个
                if($("#search_results .by-tag .tag-result.tag-"+tag_id).length == 0){
                    $("#search_results .by-tag").append("<div class=\"tag-result tag-"+tag_id+"\"></div>");
                }
                console.log($("#search_results .by-tag .tag-result.tag-"+tag_id).length);
                var tag_notes_con = $("#search_results .by-tag .tag-result.tag-"+tag_id).fadeIn(function(){$(this).addClass("show")}).get(0);

                Note.prototype.get_notes_in_tag(tag_id,limit,offset_id,function(data){
                    var feedback = get_json_feedback(data),noteobj,note,notes;

                    var note_html = "";
                    if(feedback.notes && feedback.notes.length > 0){
                        console.log(feedback.notes.length);
                        notes = feedback.notes;

                        //放入全局变量中缓存标签数据
                        // if(!idl.apps.note.tag["tag_"+tag_id]){
                        //     idl.apps.note.tag["tag_"+tag_id] = {};
                        // }

                        // if(!idl.apps.note.tag["tag_"+tag_id].notes){
                        //     idl.apps.note.tag["tag_"+tag_id].notes = [];
                        // }

                        // var ori_tag_notes = idl.apps.note.tag["tag_"+tag_id].notes;
                        // idl.apps.note.tag["tag_"+tag_id].notes = ori_tag_notes.concat(notes);

                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            note = new Note(noteobj);
                            note.construct_item("newly_loaded");
                            note_html += note.html;
                        }
                        
                        var offset_id = notes[len-1].id;

                        $(tag_notes_con).append(note_html);

                        if(!$("#search_area a.tag.active").hasClass("finished")){
                            $(".note-con.newly_loaded",tag_notes_con).each(function(){
                                var $note = $(this).find(content_area);
                                if($note.length > 0){
                                    $note.data("value",$note.html());
                                    var content = decode_content($note.html());
                                    $note.html(content);
                                    $note.get(0).style.height = 0;
                                    $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                }
                                $(this).removeClass("newly_loaded");
                            });
                            
                            highlight_colored_tags();

                            //再次搜索
                            //当前取出的数量小于需要取出的数量则继续取
                            if($(".note-con",tag_notes_con).length < cache_num){
                                var num_left = 50 - $(".note-con",tag_notes_con).length;
                                if(num_left < limit){
                                    //重置limit值为num_left
                                    limit = num_left;
                                }
                                get_notes_in_tag(tag_id,limit,offset_id);
                            }else{
                                //将加载的任务交给滚动加载
                                //给出搜索完成标识
                                
                                //今日任务分出
                                divide_task_area();
                                return false;
                            }
                        }
                    }else{
                        //结果返回空则是搜索结束
                        console.log("finished");

                        //如果是任务标签，则继续加载已完成的便签
                        if(tag_id == $("#tag_tasks").data("id")){
                            var num_left = 50 - $(".note-con",tag_notes_con).length;
                            divide_task_area();
                            console.log("客户端提取未完成任务完毕，开始提取已完成任务，需要提取"+num_left+"条");
                            if(num_left > 0){
                                //继续取没取完的num_left条，可能剩下的条条目数小于num_left
                                var offset_id = 0;
                                Note.prototype.load_finished(num_left,offset_id,function(data){
                                    var feedback = get_json_feedback(data),noteobj,note,notes;
                                    var note_html = "";
                                    if(feedback.notes && feedback.notes.length > 0){
                                        notes = feedback.notes;

                                        for(var i=0,len=notes.length; i<len; i++){
                                            noteobj = notes[i];
                                            
                                            note = new Note(noteobj);
                                            note.construct_item("newly_loaded");
                                            note_html += note.html;
                                        }

                                        $(tag_notes_con).append(note_html);

                                        $(".note-con.newly_loaded",tag_notes_con).each(function(){
                                            var $note = $(this).find(content_area);
                                            if($note.length > 0){
                                                $note.data("value",$note.html());
                                                var content = decode_content($note.html());
                                                $note.html(content);
                                                $note.get(0).style.height = 0;
                                                $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                            }
                                            $(this).removeClass("newly_loaded");
                                        });

                                        var results_length = $(".note-con",tag_notes_con).length;
                                        
                                        highlight_colored_tags();

                                        if(feedback.notes.length < num_left){
                                            //剩下的完成了的便签不足limit条，即已经取完
                                            $("#search_area #tag_tasks").addClass("finished");

                                            //今日任务分出
                                            divide_task_area();
                                        }
                                        return false;
                                    }
                                });
                            }
                        }else{
                            //所有此标签里地便签不超过cache_num
                            //给出搜索完成标识
                            $("#search_area a.tag.active").addClass("finished");
                        
                            $(".note-con.newly_loaded",tag_notes_con).each(function(){
                            var $note = $(this).find(content_area);
                            if($note.length > 0){
                                    $note.data("value",$note.html());
                                    var content = decode_content($note.html());
                                    $note.html(content);
                                    $note.get(0).style.height = 0;
                                    $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                }
                                $(this).removeClass("newly_loaded");
                            });
                            
                            highlight_colored_tags();
                            return false;
                        }
                    }
                });
            }

            function load_finished(limit,offset_id){
                limit = !!limit ? limit : 4;
                offset_id = !!offset_id ? offset_id : 0;
                console.log(offset_id);
                var tasks_con = $("#search_results .by-tag .tag-result.tag-"+$("#tag_task").data("id")).get(0);
                Note.prototype.load_finished(limit,offset_id,function(data){
                    console.log(data);
                    var feedback = get_json_feedback(data),noteobj,note,notes;
                    var note_html = "";
                    if(feedback.notes && feedback.notes.length > 0){
                        notes = feedback.notes;

                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            
                            note = new Note(noteobj);
                            note.construct_item("newly_loaded");
                            note_html += note.html;
                        }

                        var offset_id = notes[len-1].id;

                        $(tasks_con).append(note_html);
                        //$("#search_results .by-tag").append(note_html);

                        //如果搜索未完成
                        if(!$("#search_area #tag_tasks").hasClass("finished")){
                            //再次搜索
                            load_finished(limit,offset_id);
                        }
                    }else{
                        //给出搜索完成标识
                        $("#search_area #tag_tasks").addClass("finished");
                        $(".note-con.newly_loaded",tasks_con).each(function(){
                            var $note = $(this).find(content_area);
                            if($note.length > 0){
                                $note.data("value",$note.html());
                                var content = decode_content($note.html());
                                $note.html(content);
                                $note.get(0).style.height = 0;
                                $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                            }
                            $(this).removeClass("newly_loaded");
                        });

                        var results_length = $(".note-con",tasks_con).length;
                        
                        highlight_colored_tags();
                        return false;
                    }
                });
            }

            function search_notes(keywords,exclude_ids,limit){
                var limit = !!limit ? limit : 4;
                var results_con = "#search_results .by-keywords";
                Note.prototype.search(keywords,exclude_ids,limit,function(data){
                    var feedback = get_json_feedback(data),noteobj,note,notes;
                    var append_html = "";
                    if(feedback.notes && feedback.notes.length > 0){
                        notes = feedback.notes;
                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            if(noteobj.id){
                                //将新得到的id加到排除id序列中
                                exclude_ids.push(parseInt(noteobj.id));
                            }
                            
                            note = new Note(noteobj);
                            note.construct_item();

                            append_html += note.html;
                            
                        }
                        $(results_con).append(append_html);
                        $(results_con).find(content_area).each(function(){
                            this.style.height = 0;
                            this.style.height = Math.min(150,this.scrollHeight) + "px";
                        });

                        //如果搜索未完成
                        if(!$(results_con).hasClass("finished")){
                            //再次搜索
                            search_notes(keywords,exclude_ids,limit);
                        }
                    }else{
                        //结果返回空则是搜索结束
                        //给出搜索完成标识
                        $("#notes_con").removeClass("searching");

                        //得到最终返回结果的长度
                        var results_len = $("#search_results .by-keywords .note-con").length;

                        //显示搜索标题，如”24条搜索结果“
                        $("#search_results h2 span.title").text("\""+keywords+"\"的搜索结果");
                        $("#search_results h2 span.num").text("("+results_len+")");

                        //给结果加上完成标识
                        $(results_con).addClass("finished");
                        return false;
                    }
                });
            }

            function get_archived_notes(exclude_ids,limit){
                limit = !!limit  && limit > 0 ? limit : 5;
                exclude_ids = !!exclude_ids ? exclude_ids : new Array();
                var results_con = "#search_results .archived";
                $(results_con).addClass("loading");
                Note.prototype.get_archived_notes(exclude_ids,limit,function(data){
                    var feedback = get_json_feedback(data),noteobj,note,notes;
                    
                    if(feedback.notes && feedback.notes.length > 0){
                        notes = feedback.notes;
                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            if(noteobj.id){
                                //将新得到的id加到排除id序列中
                                exclude_ids.push(parseInt(noteobj.id));
                            }
                            
                            note = new Note(noteobj);
                            note.construct_item();
                            $(results_con).append(note.html);
                        }

                        if(!$(results_con).hasClass("finished")){
                            get_archived_notes(exclude_ids,limit);
                        }

                    }else{
                        $(results_con).addClass("finished").removeClass("loading");
                        return false;
                    }
                });
            }

            function load_from_archive(exclude_ids,limit){
                limit = !!limit  && limit > 0 ? limit : 5;
                exclude_ids = !!exclude_ids ? exclude_ids : new Array();
                Note.prototype.get_archived_notes(exclude_ids,limit,function(data){
                    var feedback = get_json_feedback(data),noteobj,note,notes;
                    
                    if(feedback.notes && feedback.notes.length > 0){
                        notes = feedback.notes;
                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            if(noteobj.id){
                                //将新得到的id加到排除id序列中
                                exclude_ids.push(parseInt(noteobj.id));
                            }
                            
                            note = new Note(noteobj);
                            note.construct_item("newly_loaded").display_items();
                            //调整所有新出现的便签的高度
                            $("#notes_con .note-con.newly_loaded").each(function(){
                                var $note = $(this).find(content_area);
                                if($note.length > 0){
                                    $note.get(0).style.height = 0;
                                    $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                }
                                $(this).removeClass("newly_loaded");
                            });
                            highlight_colored_tags();
                        }
                        load_from_archive(exclude_ids,limit);
                    }else{
                        if(console) console.log("archived ends");
                        return false;
                    }
                });
            }

            function get_notes_by_device(device_name,exclude_ids,limit){
                limit = !!limit  && limit > 0 ? limit : 5;
                exclude_ids = !!exclude_ids ? exclude_ids : new Array();
                Note.prototype.get_notes_by_device(device_name,exclude_ids,limit,function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data),noteobj,note,notes;
                    
                    if(feedback.notes && feedback.notes.length > 0){
                        notes = feedback.notes;
                        var note_html = "";
                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            if(noteobj.id){
                                //将新得到的id加到排除id序列中
                                exclude_ids.push(parseInt(noteobj.id));
                            }
                            
                            note = new Note(noteobj);
                            note.construct_item();
                            note_html += note.html;
                        }
                        $("#search_results .by-device").append(note_html);
                        if(!$("#search_results .by-device").hasClass("finished")){
                            get_notes_by_device(device_name,exclude_ids,limit);
                        }

                    }else{
                        $("#search_results .by-device").addClass("finished");
                        //调整所有新出现的便签的高度，以及给上便签的标签颜色
                        $("#search_results .by-device .note-con").each(function(){
                            var $note = $(this).find(content_area);
                            if($note.length > 0){
                                $note.get(0).style.height = 0;
                                $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                            }
                        });
                        highlight_colored_tags();
                        return false;
                    }
                });
            }

            function get_notes_by_time(time,exclude_ids,limit){
                limit = !!limit  && limit > 0 ? limit : 5;
                exclude_ids = !!exclude_ids ? exclude_ids : new Array();
                Note.prototype.get_notes_by_time(time,exclude_ids,limit,function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data),noteobj,note,notes;
                    
                    if(feedback.notes && feedback.notes.length > 0){
                        notes = feedback.notes;
                        var note_html = "";
                        for(var i=0,len=notes.length; i<len; i++){
                            noteobj = notes[i];
                            if(noteobj.id){
                                //将新得到的id加到排除id序列中
                                exclude_ids.push(parseInt(noteobj.id));
                            }
                            
                            note = new Note(noteobj);
                            note.construct_item();
                            note_html += note.html;
                        }
                        $("#search_results .by-date").append(note_html);
                        if(!$("#search_results .by-date").hasClass("finished")){
                            get_notes_by_time(time,exclude_ids,limit);
                        }
                    }else{
                        $("#search_results .by-date").addClass("finished");
                        //调整所有新出现的便签的高度，以及给上便签的标签颜色
                        $("#search_results .by-date .note-con").each(function(){
                            var $note = $(this).find(content_area);
                            if($note.length > 0){
                                $note.get(0).style.height = 0;
                                $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                            }
                        });
                        highlight_colored_tags();
                        return false;
                    }
                });
            }

            $(".cal-con").on("click "+downEvent,"#_range a",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note_con = $(this).closest(".note-con");
                var note_id = $note_con.data("id");
                var note = new Note({id:note_id});
                var task_id = $note_con.data("task-id");
                var is_task = $note_con.hasClass("task");
                var is_today_task = $note_con.hasClass("today");

                if($(this).hasClass("_today")){
                    //设置今日为任务截止日期
                    //从今日任务中移除
                    if($(this).hasClass("active")){

                    }else{
                        //是否是任务
                        if(is_task){
                            //是否设定过日期，根据是否设定过日期来确定是重新为当前便签添加一个任务还是更新他的任务的截止日期
                            if(task_id){
                                if(is_today_task){

                                }else{

                                }
                            }else{

                            }
                        }
                    }
                }else if($(this).hasClass("_tomorrow")){
                    //设置明日为任务截止日期
                    if($(this).hasClass("active")){

                    }else{
                        if(is_task){
                            //如果是在今日区域，设置成功之后需要被提到以后区域中
                            if(task_id){
                                if(is_today_task){

                                }else{

                                }
                            }
                        }else{

                        }
                    }
                }else if($(this).hasClass("_afterto")){
                    //设置后天为任务截止日期
                    if($(this).hasClass("active")){

                    }else{
                        if(is_task){
                            if(task_id){
                                if(is_today_task){

                                }else{

                                }
                            }
                        }else{

                        }
                    }
                }
            });
            
            //便签的底部菜单(bottom menu)加载日历
            $(".cal-con").datepicker({
                //选中日历中得某一天时，设置这一天为便签的最后期限，并将便签转为任务
                onSelect: function(date,params){
                    var target = $(".cal-con.hasDatepicker td a.ui-state-hover").get(0),
                        deadline = date,
                        that = this,
                        $note = $(this).closest(".note-con"),
                        note_id = $note.data("id"),
                        task_id = $note.data("task-id"),
                        dead_day = target.parentNode,
                        note = new Note({id:note_id});
                        
                        //不允许将任务期限设为今日之前，只能规划未来和今天
                        if($(dead_day).hasClass("disabled")){
                            return false;
                        }

                        //如果当前便签已经是任务
                        if(!!task_id && task_id > 0){
                            //如果点击的日期已经为deadline，则将其任务删除，在从任务标签中移除
                            //由于每次点击都会促发showDay事件，必须先将日历中的deadline数据移出
                            if($(dead_day).hasClass("deadline")){
                                //如果点击的日期已经为deadline，则将此任务设为无截止日期任务，不将其删除，若取消的是今日任务(即截止日期小于或等于今天)则需要更改position，移动到以后区域，若取消的是未来任务则无需更新position
                                note.task_id = task_id;
                                note.deadline = null;
                                note.setDeadline(function(feedback){
                                    if(feedback.status == "ok"){
                                        $note.find("form div.deadline").remove();
                                        $("td.deadline",that).removeClass("deadline");
                                        $note.removeData("deadline").removeAttr("data-deadline");
                                        
                                        var today = get_formated_time(Date.now(),false);
                                        var formated_date = get_formated_time(date,false);

                                        //若取消的是今日或今日之前未完成的任务
                                        if(new Date(formated_date).valueOf() <= new Date(today).valueOf() || $note.hasClass("today")){
                                            recount_today_tasks("change_date");
                                            
                                            //如果是在任务面板，
                                            if($("#search_results").hasClass("results-of-tasks")){
                                                divide_task_area();

                                                if(feedback.position){
                                                    //更新position
                                                    var srcpos = $note.data("position");
                                                    var dstpos = feedback.position;
                                                    change_position("down",srcpos,dstpos);
                                                }

                                                //移动到以后区域
                                                if($(".later-area").length > 0){
                                                    var top_offset = $note.offset().top - $(window).scrollTop();
                                                    $(".later-area").after($note.get(0));
                                                    scroll_into_view($note.get(0),-top_offset);
                                                }
                                            }

                                        }
                                    }else{

                                    }
                                });
                            }else{
                                //否则改变deadline日期期限
                                note.deadline = date;
                                var formated_date = get_formated_time(date,false);
                                $note.data("deadline",formated_date).attr("data-deadline",formated_date);
                                var $last_deadline = $(".cal-con.hasDatepicker td.deadline");

                                note.setDeadline(function(feedback){
                                    //在调用此回调函数之前，日历已经被刷新,dead_day已经被从document中去掉
                                    //更改截止期限成功
                                    if(feedback.status && feedback.status == "ok"){
                                        
                                        //在便签线面展示deadline
                                        var $deadline = $note.find("form .deadline");
                                        if($deadline.length > 0){
                                            $deadline.find("span").text(note.deadline);
                                        }else{
                                            $note.find("form").append("<div class=\"deadline\"><span>"+note.deadline+"</span></div>");
                                        }

                                        var formated_date = get_formated_time(date,false);
                                        $note.data("deadline",formated_date).attr("data-deadline",formated_date);

                                        //如果是在任务面板下，还要做一些额外的操作
                                        if($("#search_results").hasClass("results-of-tasks")){
                                            //如果deadline恰好为今天，则将本便签放入“今天”的任务列表
                                            var today = get_formated_time(Date.now(),false);
                                            var $note_con = $(that).closest(".note-con");

                                            divide_task_area();

                                            //若原截止日期为今日或今日以前
                                            //将截止日期设为今日，不管是今日还是以后区域的任务都放到今日第一条
                                            if( new Date(formated_date).valueOf() == new Date(today).valueOf() ){
                                                recount_today_tasks("change_today");

                                                $note_con.addClass("today");
                                                if(feedback.position){
                                                    //更新position
                                                    var srcpos = $note.data("position");
                                                    var dstpos = feedback.position;
                                                    change_position("up",srcpos,dstpos);
                                                }

                                                //判断今日区域是否存在
                                                if($(".today-area").length > 0){
                                                    $(".today-area").after($note.get(0));
                                                }else{
                                                    //如不存在，则创建今日区域，
                                                    divide_task_area();
                                                    $(".today-area").after($note.get(0));
                                                }

                                                var top_offset = $note.offset().top - $(window).scrollTop();
                                                scroll_into_view($note.get(0),-top_offset);
                                            }

                                            //将截止日期设为未来
                                            if( new Date(formated_date).valueOf() > new Date(today).valueOf() ){
                                                //如果被设置日期的是今日区域的便签，则拖到以后区域的第一条
                                                if($note_con.hasClass("today")){
                                                    recount_today_tasks("change_date");

                                                    if(feedback.position){
                                                        //更新position
                                                        var srcpos = $note_con.data("position");
                                                        var dstpos = feedback.position;
                                                        change_position("down",srcpos,dstpos);
                                                    }

                                                    //移动到以后区域
                                                    if($(".later-area").length > 0){
                                                        var top_offset = $note_con.offset().top - $(window).scrollTop();
                                                        $(".later-area").after($note.get(0));
                                                        scroll_into_view($note_con.get(0),-top_offset);
                                                    }
                                                }

                                                //如果被设置日期的是以后区域的便签，则不动                                                
                                            }
                                        }else{
                                            //在非任务面板，更新position
                                            if(feedback.position){
                                                $note.data("position",feedback.position).attr("data-position",feedback.position);
                                            }
                                        }
                                    }else{
                                        showMessage({"type":"error","msg":"更改截止期限失败"});
                                        var year = $last_deadline.data("year"),
                                            month = $last_deadline.data("month"),
                                            day = $last_deadline.find("a").text();

                                        //改变截止日期失败，将日期还原
                                        $(".cal-con.hasDatepicker tr td[data-month=\""+month+"\"]").each(function(){
                                            if($("a",this).text() == day){
                                                $(this).addClass("deadline");
                                            }
                                        });
                                    }
                                });
                            }
                        }else{
                            //如果当前便签不是任务，则创建一个，另外也要加上tasks标签
                            note.deadline = date;//2014-02-28
                            note.setTask(function(feedback){
                                if(console) console.log(feedback);
                                if(feedback.status && feedback.status == "ok"){
                                    
                                    //如果此便签没有任务标签，则为其加上tasks标签
                                    if(!$note.hasClass("task")){
                                        note.addTag($("#tag_tasks").data("id"),function(feedback){
                                            if(feedback.status == "ok"){
                                                notify_user({operation:"add_tag",node:$("#tag_tasks").get(0),effect:"default"});

                                                //添加上标签色块
                                                var that = $("#tag_tasks").get(0),
                                                    color = $(that).data("color"),
                                                    $form = $note.find("form");

                                                //先添加任务标签，然后再给上日期，以防止页面闪动
                                                $note.addClass("task");

                                                if(!!color){
                                                    $form.append("<div class=\"default_tag\" data-id=\""+$("#tag_tasks").data("id")+"\" style=\"background:"+color+"\"></div>");
                                                    
                                                    var note_con = $note.addClass("highlighted").get(0);
                                                    var $form = $("form",note_con),
                                                        $tag_divs = $(".default_tag",note_con),
                                                        cube_length = $tag_divs.length,
                                                        cube_height = 1/cube_length * 100,
                                                        i=0;

                                                    $tag_divs.each(function(){
                                                        this.style.top = i * cube_height + "%";
                                                        this.style.height = cube_height + "%";
                                                        i++;
                                                    });
                                                }

                                                $form.append("<div class=\"deadline\"><span>"+note.deadline+"</span></div>");
                                            }
                                        });
                                    }

                                    //将当前选中日期设为deadline
                                    $(".ui-datepicker-current-day").addClass("deadline");


                                    if(feedback.task_id && feedback.task_id > 0){
                                        //将任务id加入便签中
                                        $note.data({"task-id":feedback.task_id,"deadline":date}).attr({"data-task-id":feedback.task_id,"data-deadline":date});

                                        if(feedback.position){
                                            $note.data("position",feedback.position).attr("data-position",feedback.position);
                                        }

                                        //如果deadline恰好为今天，则将本便签放入“今天”的任务列表
                                        //var today = get_formated_time(Date.now(),false) + " 00:00:00";
                                        //var formated_date = get_formated_time(date,false) + " 00:00:00";
                                        //火狐与iPad在new Date中传入的参数若加上了 "00:00:00",则返回invalid date
                                        //new Date(2014,2,23);在所有浏览器中都如愿显示，不会自动设为凌晨8点
                                        var today = get_formated_time(Date.now(),false);
                                        var formated_date = get_formated_time(date,false);

                                        var $deadline = $note.find("form .deadline");
                                        if($deadline.length > 0){
                                            $deadline.find("span").text(note.deadline);
                                        }else{
                                            $note.find("form").append("<div class=\"deadline\"><span>"+note.deadline+"</span></div>");
                                        }
                                        //是否在任务面板则需要针对选择的截止日期做移动操作
                                        // if($("#search_results").hasClass("results-of-tasks")){
                                        //     //如果设定的日期是今天或今天以前，则需要放到今日任务中
                                        //     if(new Date(formated_date).valueOf() == new Date(today).valueOf()){
                                        //         note.moveToToday(function(data){
                                        //             if(console) console.log(data);
                                        //             var feedback = get_json_feedback(data);
                                        //             if(feedback.status == "ok"){
                                        //                 //如果是为今日添加任务
                                        //                 //更新今日任务数量
                                        //                 //为当前便签添加今日任务的样式
                                        //                 recount_today_tasks("addnew");
                                        //                 $note.addClass("today");

                                        //                 var top_offset = $note.offset().top - $(window).scrollTop();
                                        //                 //将便签移动到今日任务区域，放在最上面
                                        //                 //判断今日区域是否存在
                                        //                 if($(".today-area").length > 0){
                                        //                     $(".today-area").after($note.get(0));
                                        //                 }else{
                                        //                     //如不存在，则创建今日区域，
                                        //                     divide_task_area();
                                        //                     $(".today-area").after($note.get(0));
                                        //                 }
                                        //                 //更新顺序
                                        //                 regen_tasks_order();

                                        //                 scroll_into_view($note.get(0),-top_offset);
                                        //             }else{
                                        //                 //出错
                                        //             }
                                        //         });
                                        //     }else{
                                        //         //在以后，则放入"later"区域，
                                        //         //因为没有截止日期的便签默认是在"later"区域，所有无需作任何操作
                                        //     }
                                        // }else{
                                        //     //不在任务面板

                                        // }
                                    }
                                }
                            });
                        }
                },

                dateFormat: "yy-mm-dd",

                beforeShowDay: function(date){
                    $(".ui-datepicker-current-day").removeClass("ui-datepicker-current-day");
                    $("a.ui-state-active").removeClass("ui-state-active");
                    var $note = $(".cal-con").closest(".note-con");

                    if($note.length != 0){
                        //如果当前便签没有deadline 数据，则得到当前便签的deadline
                        var deadline = $note.data("deadline"),
                            curdate = get_formated_time(date,false),
                            today = get_formated_time(Date.now(),false),
                            note_id = $note.data("id"),
                            note = new Note({id:note_id});

                        var formated_date = get_formated_time(deadline,false);
                            
                        if(new Date(curdate).valueOf() < new Date(today).valueOf()){
                            //对比deadline与所有日期，是deadline则给予高亮
                            if(new Date(curdate).valueOf() == new Date(formated_date).valueOf()){
                                if(console) console.log("calendar has been reloaded");
                                return [true,"deadline disabled"];
                            }
                            return [true,"disabled"];
                        }else if(new Date(curdate).valueOf() == new Date(today).valueOf()){
                            //对比deadline与所有日期，是deadline则给予高亮
                            if(new Date(curdate).valueOf() == new Date(formated_date).valueOf()){
                                if(console) console.log("calendar has been reloaded");
                                return [true,"deadline today"];
                            }
                            return [true,"today"];
                        }

                        if(!deadline){
                            
                        }else{
                            //对比deadline与所有日期，是deadline则给予高亮
                            if(new Date(curdate).valueOf() == new Date(formated_date).valueOf()){
                                if(console) console.log("calendar has been reloaded");
                                return [true,"deadline"];
                            }
                        }
                    }
                    return [true,""];
                }
            });


            /*-------------------------- 单条便签最大化编辑 ----------------------------*/
            //扩大便签编辑范围
            $("#wrapper").on("click","a.maximize-note",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var winScrollTop = $(window).scrollTop();

                //其他最大化的便签
                var $maximized_notes = $(".note-con.maximized");
                $("body").addClass("single-mode");
                var $note = $(this).closest(".note-con");
                //var left = $("#notes_con").offset().left + $("#notes_con").width() + 20;
                var top = $(window).scrollTop() + 20;

                //如果当前没有打开底部菜单，则默认打开标签选择
                $note.addClass("maximized").css({"top":top+"px"});
                if($note.find(".bottom-menu .op a.active").length == 0){
                    $note.find(".bottom-menu a.tags").trigger("click");
                }

                //editable 区域的最大和最小高度
                var minHeight = maxHeight = 0;
                var oriTop = $note.offset().top;
                var maxHeight = $(window).height() - 60 - 230;
                var minHeight = maxHeight - 30;
                $note.find(".note.editable").css({"max-height":maxHeight + "px","min-height":minHeight + "px"});
                
                //把其他最大化的关闭
                $maximized_notes.removeClass("maximized").find(".note.editable").css({"min-height":0});

                //滚动到当前便签位置
                $("#wrapper").scrollTop(winScrollTop);

                //更新搜索栏宽度
                stickyWidth = $('#notes_con .inner-wrapper').width();
                $("#search_area").width(stickyWidth);
            });

            //将最大化的窗口固定
            $("#wrapper").on("click",".note-con a.pin",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note = $(this).closest(".note-con");
                if($note.hasClass("maximized")){
                    //减去10像素的margin
                    $note.css({"top":($note.offset().top - 10 - $(window).scrollTop()) + "px"}).addClass("fixed");
                }
            });

            //将最大化的窗口解开固定
            $("#wrapper").on("click",".note-con a.unpin",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note = $(this).closest(".note-con");
                if($note.hasClass("fixed")){
                    //减去10像素的margin
                    $note.css({top:($note.offset().top - 10) +"px"}).removeClass("fixed");
                }
            });

            //最小化便签
            $("#wrapper").on("click","a.minimize-note",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                var wrapperScrollTop = $("#wrapper").scrollTop();

                $("body.single-mode").removeClass("single-mode");

                var $note = $(this).closest(".note-con");
                
                $note.removeClass("maximized fixed").find(".bottom-menu .op a.active").trigger("click");
                
                //更新搜索栏宽度
                stickyWidth = $('#notes_con .inner-wrapper').width();
                $("#search_area").width(stickyWidth);

                //将便签高度重置
                $note.find(".note.editable").css({"min-height":0+"px"}).each(function(){
                    this.style.height = 0;
                    this.style.height = Math.min(150,$(this).prop("scrollHeight")) + "px";
                    this.style.overflow = "hidden";
                    console.log(this.style.height);
                });

                //滚动到当前便签位置
                $("body").scrollTop(wrapperScrollTop);
            });
            /*------------------------ 单条便签最大化编辑结束 -------------------------*/


            //点击记事本菜单中的操作时
            $("#wrapper").on("click",".bottom-menu .op a",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note = $(this).closest(".note-con");
                var bottom_menu = $(this).closest(".bottom-menu").get(0);
                if($note.length == 0){
                    return false;
                }
                
                if($(this).hasClass("active")){
                    $(this).removeClass("active");
                }else{
                    $(".bottom-menu .op a.active").removeClass("active");
                    $(this).addClass("active");
                }

                //确保只附上一个菜单
                if($note.find("#note_ops").length == 0) $note.append(note_ops);

                //每当打开关闭面板时，一切应该还原，现在时去掉选中状态
                $("a.tag.choosed",note_ops).removeClass("choosed").each(function(){
                    if($(this).data("color")){
                        $(this).css({background:"none",color:$(this).data("color")});
                    }
                });

                var id = $note.data("id"),
                    note = new Note({id:id});

                if($(this).hasClass("share")){
                    if($note.hasClass("sharing")){
                        $note.removeClass("sharing");
                    }else{
                        $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags deleting setting-deadline showing-info sharing");
                        //列出分享组件
                        //1.邮箱 --> 给出邮箱以及正文输入地址，正文附上便签内容及网址
                        //2.微博 --> 按照微博的方式分享，微博内容中附上便签内容及网址
                        $note.addClass("sharing").removeClass("adding-tags setting-deadline deleting showing-info");
                    }
                }else if($(this).hasClass("cal")){
                    if($note.hasClass("setting-deadline")){
                        $note.removeClass("setting-deadline");
                    }else{
                        $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags deleting setting-deadline showing-info sharing");
                        //给出一个日历，
                        //点选后即设置deadline,并将便签转为任务
                        $note.addClass("setting-deadline").removeClass("sharing adding-tags deleting showing-info");
                        //刷新日历
                        $( ".cal-con" ).datepicker( "refresh" );
                    }
                }else if($(this).hasClass("tags")){
                    if($note.hasClass("adding-tags")){
                        $note.removeClass("adding-tags");
                    }else{
                        $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags deleting setting-deadline showing-info sharing");
                        //得到词便签的标签，然后将便签给予高亮
                        //为便签设置分组或标签，暂未定名字
                        $note.addClass("adding-tags").removeClass("setting-deadline sharing deleting showing-info");

                        note.get_tag_ids(function(feedback){
                            
                            if(feedback.tag_ids && feedback.tag_ids.length > 0){
                                var tag_ids = feedback.tag_ids,tag_id,$tag,color;

                                for(var i=0,len=tag_ids.length; i<len; i++){
                                    tag_id = tag_ids[i];
                                    $tag = $("#note_ops .custom a.tag[data-id=\""+tag_id+"\"]");
                                    $tag.addClass("choosed");
                                    color = $tag.data("color");
                                    if(color) $tag.css({background:color,color:"white"});
                                }
                            }
                        });
                    }
                }else if($(this).hasClass("del")){
                    $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags deleting setting-deadline showing-info sharing");
                    
                    //直接执行删除操作
                    var id = $note.data("id"),
                        note = new Note({id:id});
                    
                        if($(".note-con.to-be-deleted").length > 0){
                            $(".feedback-hint").remove();
                        }
                        
                        $note.addClass("to-be-deleted").fadeOut("fast",function(){
                            //提示可撤销操作
                            $note.before("<div class=\"feedback-hint\">该便签已被放入垃圾箱<a href=\"#\" data-event=\"del\" data-id=\""+note.id+"\" id=\"revocate\">撤销</a></div>");
                            var delete_note_timeout = setTimeout(function(){
                                if($note.hasClass("to-be-deleted")){
                                    //删除便签
                                    note.del(function(feedback){
                                        if(feedback.status && feedback.status == "ok"){
                                            //在删除前，将底部菜单保留
                                            $note.find("#note_ops").appendTo("body");
                                            $note.remove();
                                            recount_in_tag("delete");
                                            //隐藏提示
                                            $(".feedback-hint").fadeOut("fast",function(){$(this).remove();});
                                        }else{
                                            showMessage({type:"error",msg:"删除失败"});
                                            //还原
                                            $note.removeClass("to-be-deleted deleting").fadeIn();
                                            $("feedback-hint").remove();
                                        }
                                    });
                                }else{
                                    clearTimeout(delete_note_timeout);
                                }
                            },2500);
                        });
                    // if($note.hasClass("deleting")){
                    //     $note.removeClass("deleting");
                    // }else{
                    //     $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags deleting setting-deadline showing-info sharing");
                    //     $note.addClass("deleting");
                    // }
                }else if($(this).hasClass("info")){
                    //取得信息
                    if($note.hasClass("showing-info")){
                        $note.removeClass("showing-info");
                    }else{
                        $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags deleting setting-deadline showing-info sharing");
                        $note.addClass("showing-info").removeClass("setting-deadline sharing deleting adding-tags");
                        
                        note.get_info(function(feedback){
                            //data中应该包含便签的记事地点，创建时间，修改时间，设备名称
                            //info:{lnglat:"112.00323|23.23432",create_time:"2013-32-23 00:23:12",modified_time:"2013-32-23 00:23:12",device:"Android网页版"}

                            //先展示时间与设备，因为地理位置需要向服务器发送请求才能得到
                            if(feedback.modified_time && feedback.modified_time != "0000-00-00 00:00:00" && feedback.modified_time != ""){
                                //若修改了则展示修改时间
                                $("#note_ops .info").addClass("has-modified");
                                $("#note_ops .info .modified-time .content").text(feedback.modified_time);
                            }else{
                                $("#note_ops .info").removeClass("has-modified");
                            }

                            if(!!feedback.source){
                                $("#note_ops .info").addClass("has-source");
                                $("#note_ops .info .source .content").text(feedback.source).attr("href",feedback.source);
                            }else{
                                $("#note_ops .info").removeClass("has-source");
                            }

                            $("#note_ops .info .create-time .content").text(feedback.create_time);
                            $("#note_ops .info .device .content").text(feedback.device);

                            //展示地理位置，利用百度提供的逆地理编码服务
                            if(!!feedback.lnglat){
                                if(console) console.log(feedback.lnglat);
                                if(!!$note.data("loc")){
                                    $("#note_ops .info .location .content").text($note.data("loc"));
                                }else{
                                    var lng = feedback.lnglat.split("|")[0],
                                        lat = feedback.lnglat.split("|")[1],
                                        latlng = lat + "," + lng,
                                        lnglat = lng + "," + lat;
                                        if(console) console.log(lnglat);
                                    $.getScript("http://api.map.baidu.com/geocoder/v2/?ak=CC2dd2781a38600e9c9240b996aee39b&callback=renderReverse&location="+lnglat+"&output=json&pois=0");
                                }
                            }else{
                                if(!!$note.data("loc")){
                                    $("#note_ops .info .location .content").text($note.data("loc"));
                                }else{
                                    $("#note_ops .info .location .content").text("未知地点");
                                }
                            }
                        });
                        
                    }
                }else if($(this).hasClass("more")){
                    if($(bottom_menu).hasClass("all")){
                        //已经被打开，则关闭
                        $(bottom_menu).removeClass("all");
                        $note.find(".deadline").show();
                    }else{
                        //打开，先关闭所有其他已经打开的菜单
                        $(".bottom-menu").removeClass("all");
                        $(bottom_menu).addClass("all");
                        $note.find(".deadline").hide();
                        
                        //滚动即关闭
                        // if($("body").hasClass("touch-device")){
                        //     $(document).one(moveEvent,function(event){
                        //         $(".bottom-menu").removeClass("all");
                        //         $(".note-con.adding-tags,.note-con.deleting,.note-con.setting-deadline,.note-con.showing-info,.note-con.sharing").removeClass("adding-tags setting-deadline showing-info sharing");
                        //     });
                        // }
                    }
                }
            });

            //确认删除
            $("#wrapper").on("click",".del-confirm a.button",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note = $(this).closest(".note-con");
                var id = $note.data("id"),
                    note = new Note({id:id});
                if($(this.parentNode).hasClass("confirm")){
                    //确认删除便签
                    if($(".note-con.to-be-deleted").length > 0){
                        $(".feedback-hint").addClass("warning");
                        return false;
                    }
                    
                    $note.addClass("to-be-deleted").fadeOut("fast",function(){
                        //提示可撤销操作
                        $note.before("<div class=\"feedback-hint\">该便签已被放入垃圾箱<a href=\"#\" data-event=\"del\" id=\"revocate\">撤销</a></div>");
                        var delete_note_timeout = setTimeout(function(){
                            if($note.hasClass("to-be-deleted")){
                                //删除便签
                                note.del(function(data){
                                    if(console) console.log(data);
                                    var feedback = get_json_feedback(data);
                                    if(feedback.status && feedback.status == "ok"){
                                        //在删除前，将底部菜单保留
                                        $note.find("#note_ops").appendTo("body");
                                        $note.remove();
                                        recount_in_tag("delete");
                                        //隐藏提示
                                        $(".feedback-hint").fadeOut("fast",function(){$(this).remove();});
                                    }else{
                                        showMessage({type:"error",msg:"删除失败"});
                                        //还原
                                        $note.removeClass("to-be-deleted deleting").fadeIn();
                                        $("feedback-hint").remove();
                                    }
                                });
                            }else{
                                clearTimeout(delete_note_timeout);
                            }
                        },2500);
                    });
                }else if($(this.parentNode).hasClass("cancel")){
                    //取消删除
                    $note.removeClass("deleting").find("a.del.active").removeClass("active");
                }
            });

            $("body").on("click "+downEvent,"#revocate",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var theEvent = $(this).data("event");
                var that = this;
                if(theEvent){
                    if(theEvent == "del"){
                        $(".note-con.to-be-deleted").each(function(){
                            if($(this).data("id") == $(that).data("id")){
                                $(this).removeClass("to-be-deleted deleting").fadeIn().find("a.del.active").removeClass("active"); 
                            }
                        });
                        
                    }else if(theEvent == "move"){
                        $(".note-con.to-be-moved").removeClass("to-be-moved adding-tags").fadeIn().find("a.tags.active").removeClass("active");
                    }else if(theEvent == "del_tag"){
                        $("#search_area .tag.to-be-deleted").removeClass("to-be-deleted").fadeIn();
                    }
                    $(this).parent().remove();
                }
            });

            $("#note_ops .share.section .at-box input.at-field").on("focus",function(event){
                $(".at-box").addClass("active");
            });

            // //选择分享的好友或组内成员
            // $("#note_ops .share.section .at-box .at-list").on("click","li",function(event){
            //     event = EventUtil.getEvent(event);
            //     EventUtil.preventDefault(event);
            //     var target = EventUtil.getTarget(event);
            //     var $field = $(".at-box input.at-field")
            //     var cur_value = $field.val();
            //     var new_value = "";

            //     //点击的是小组
            //     if($(this).hasClass("at-team")){
            //         var $team_con = $(this);
            //         var $selected_members = $team_con.find("a.at-team-member.checked");
            //         var team_name = $team_con.find("a.team-name").text();
            //         var reg = new RegExp("@"+team_name+"(\\d+)?人?\\s","g");

            //         //点击勾选框
            //         if($(target).hasClass("check-team")){
            //             //组内人员个数
            //             var members_num = $("a.at-team-member",this).length;

            //             if($(target).hasClass("checked")){
            //                 $(target).removeClass("checked");
                            
            //                 var new_value = cur_value.replace(reg,"");
            //                 $field.val(new_value);
            //                 $("a.at-team-member",this).removeClass("checked");
            //             }else{
            //                 $(target).addClass("checked");
            //                 $("a.at-team-member",this).addClass("checked");
            //                 if(cur_value.match(reg)){
            //                     new_value = cur_value.replace(reg,"@"+team_name+""+members_num+"人 ");
            //                 }else{
            //                     new_value = cur_value + "@"+team_name+""+members_num+"人 ";
            //                 }

            //                 $field.val(new_value);
            //             }
            //         }else if($(target).hasClass("team-name")){
            //             //点击展开
            //             if($(this).hasClass("expanded")){
            //                 $(this).removeClass("expanded");
            //             }else{
            //                 $(this).addClass("expanded");

            //                 if($(this).offset().top > $(".at-list ul.first").offset().top){
            //                     console.log("should scroll");
            //                     $(".at-list ul.first").animate({scrollTop: $(".at-list ul.first").scrollTop() + $(this).offset().top - $(".at-list ul.first").offset().top},"fast");
            //                 }
            //             }
            //         }
            //     }else{
            //         //点击的是某个成员
            //         var $pal = $(this).find("a.at-target");
            //         var $team_con = $pal.closest(".at-team");
            //         var $selected_members = $team_con.find("a.at-team-member.checked");
            //         var team_name = $team_con.find("a.team-name").text();
            //         var reg = new RegExp("@"+team_name+"(\\d+)?人?\\s","g");

            //         if($pal.hasClass("at-team-member")){
            //             if($pal.hasClass("checked")){
            //                 $team_con.find(".check-team").removeClass("checked");

            //                 if(($selected_members.length-1) > 0){
            //                     //更新组@人数
            //                     var members_num = $selected_members.length - 1;
            //                     if(cur_value.match(reg)){
            //                         new_value = cur_value.replace(reg,"@"+team_name+""+members_num+"人 ");
            //                     }else{
            //                         new_value = cur_value + "@"+team_name+""+members_num+"人 ";
            //                     }
            //                 }else{
            //                     //未选中组内任何成员
            //                     if(cur_value.match(reg)){
            //                         new_value = cur_value.replace(reg,"");
            //                     }
            //                 }

            //                 $field.val(new_value);
            //                 $pal.removeClass("checked");
            //             }else{
            //                 $pal.addClass("checked");
            //                 var members_num = $selected_members.length + 1;
            //                 if(cur_value.match(reg)){
            //                     new_value = cur_value.replace(reg,"@"+team_name+""+members_num+"人 ");
            //                 }else{
            //                     new_value = cur_value + "@"+team_name+""+members_num+"人 ";
            //                     console.log(new_value);
            //                 }

            //                 $field.val(new_value);
            //             }
            //         }else if($pal.hasClass("at-pal")){
            //             if($pal.hasClass("checked")){
            //                 $pal.removeClass("checked");
            //                 var new_value = cur_value.replace("@"+$pal.text()+" ","");
            //                 $field.val(new_value);
            //             }else{
            //                 $pal.addClass("checked");
            //                 $field.val(cur_value + "@" + $pal.text() + " ");
            //             }
            //         }
            //     }
            // }); //选择分享好友或组员结束

            // //点击站内分享按钮
            // $(".at-box").on("click "+downEvent,"a.sharebtn",function(event){
            //     event = EventUtil.getEvent(event);
            //     EventUtil.preventDefault(event);

            //     var $share_list = $(".at-box li a.at-target.checked");
            //     var $note = $(this).closest(".note-con");
            //     var note = new Note({id:$note.data("id")});
            //     var pal_ids=new Array();

            //     if($share_list.length > 0){
            //         $share_list.each(function(){
            //             if($(this).hasClass("at-team-member")){
            //                 //如果是组员，判断是否选中了全组
            //                 var $team = $(this).closest("li.at-team");
            //                 if($team.find(".check-team").hasClass("checked")){
            //                     pal_ids.push({pal_id:$(this).data("id"),team_id:$team.find("a.team-name").data("id")});
            //                 }else{
            //                     pal_ids.push({pal_id:$(this).data("id")});
            //                 }
            //             }else if($(this).hasClass("at-pal")){
            //                 //如果是好友
            //                 pal_ids.push({pal_id:$(this).data("id")});
            //             }
            //         });

            //         if(pal_ids.length > 0){
            //             console.log(pal_ids);
            //             note.at(pal_ids,function(data){
            //                 if(console) console.log(data);
            //             });
            //         }
            //     }
            // });

            //点击站内分享按钮
            $(".at-box").on("click "+downEvent,"a.sharebtn",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $at_filed = $(this).closest(".at-box").find("input.at-field");
                var text = $at_filed.val();
                var $note = $(this).closest(".note-con");
                var note = new Note({id:$note.data("id")});

                if(text.length == 0) return false;

                note.share_insite(text,function(data){
                    if(console) console.log(data);

                });
            });

            //点击分享组件弹出分享窗口
            $("#note_ops").on("click",".share .component",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note_con = $(this).closest(".note-con");

                //分享内容必须去掉html标记，且需要将实体空格装换
                var content = $note_con.find("div.note.editable").data("value").replace(/(<([^>]+)>)/ig," ").replace("&nbsp"," ");
                var links = get_links(content);
                var img_url = "";
                if(links.length > 0){
                    for(var i=0,len=links.length; i<len; i++){
                        var link = links[i];
                        if(link.match(/[^\/]+\.(?:png|jpg|jpeg|svg|bmp|gif|tiff)\b/i)){
                            img_url = link;
                            break;
                        }
                    }
                }

                //如果链接中没有带有图片特有后缀的则看是否有已经标明为图片的
                if(img_url == ""){
                    var $img = $note_con.find("a.type-image").first();
                    if($img.length > 0) img_url = get_link_in_url($img.attr("href"));
                }

                var newwin_height = 500,
                newwin_width = 800,
                newwin_top = (window.screen.height - newwin_height) / 2,
                newwin_left = (window.screen.width - newwin_width) / 2;
                
                var append_share_source = "&__sharesource=okmemo";
                if($(this).hasClass("weibo")){
                    weibo_share(content,img_url,location.origin,append_share_source);
                }else if($(this).hasClass("douban")){
                    douban_share(content,img_url,"分享自:Ok记("+location.origin+")",append_share_source);
                }else if($(this).hasClass("qqmail")){
                    //分享到QQ邮箱
                    qqmail_share(content,img_url,"",location.origin,document.title,append_share_source);
                }else if($(this).hasClass("qzone")){
                    qzone_share(content,img_url,"",location.origin,document.title,append_share_source);
                }else if($(this).hasClass("tqq")){
                    qt_share(content,img_url,location.origin,append_share_source);
                }else if($(this).hasClass("gmail")){
                    gmail_share(content);
                }
                //发送给QQ好友或群组
                //http://connect.qq.com/widget/shareqq/index.html?url=http%3A%2F%2Fwww.smallactions.cn&showcount=0&desc=%E5%B0%8F%E8%A1%8C%E5%8A%A8%E5%A4%A7%E4%B8%8D%E5%90%8C%E6%98%AF%E7%88%B6%E6%AF%8D%EF%BC%9F%E6%98%AF%E5%AD%A9%E5%AD%90%EF%BC%9F%E6%98%AF%E7%88%B1%E4%BA%BA%E8%BF%98%E6%98%AF%E4%BC%99%E4%BC%B4%EF%BC%9F%E8%B0%81%E6%98%AF%E4%BD%A0%E4%B8%80%E7%94%9F%E4%B8%AD%E6%9C%80%E6%83%B3%E5%AE%88%E6%8A%A4%E7%9A%84%E4%BA%BA%EF%BC%9F%E5%8A%A0%E5%85%A5%E8%81%94%E5%90%88%E5%88%A9%E5%8D%8E%5B%E5%B0%8F%E8%A1%8C%E5%8A%A8+%E5%A4%A7%E4%B8%8D%E5%90%8C%5D%EF%BC%8C%E4%BB%A5%E6%AF%8F%E4%B8%80%E4%B8%AA%E5%B0%8F%E5%B0%8F%E8%A1%8C%E5%8A%A8%EF%BC%8C%E4%B8%BA%E4%BA%86%E6%88%91%E4%BB%AC%E6%83%B3%E8%A6%81%E5%AE%88%E6%8A%A4%E7%9A%84%E4%BA%BA%EF%BC%8C%E5%88%9B%E9%80%A0%E7%BE%8E%E5%A5%BD%E6%9C%AA%E6%9D%A5%E5%A4%A7%E4%B8%8D%E5%90%8C%EF%BC%81&summary=%E5%B0%8F%E8%A1%8C%E5%8A%A8%E5%A4%A7%E4%B8%8D%E5%90%8C%E6%98%AF%E7%88%B6%E6%AF%8D%EF%BC%9F%E6%98%AF%E5%AD%A9%E5%AD%90%EF%BC%9F%E6%98%AF%E7%88%B1%E4%BA%BA%E8%BF%98%E6%98%AF%E4%BC%99%E4%BC%B4%EF%BC%9F%E8%B0%81%E6%98%AF%E4%BD%A0%E4%B8%80%E7%94%9F%E4%B8%AD%E6%9C%80%E6%83%B3%E5%AE%88%E6%8A%A4%E7%9A%84%E4%BA%BA%EF%BC%9F%E5%8A%A0%E5%85%A5%E8%81%94%E5%90%88%E5%88%A9%E5%8D%8E%5B%E5%B0%8F%E8%A1%8C%E5%8A%A8+%E5%A4%A7%E4%B8%8D%E5%90%8C%5D%EF%BC%8C%E4%BB%A5%E6%AF%8F%E4%B8%80%E4%B8%AA%E5%B0%8F%E5%B0%8F%E8%A1%8C%E5%8A%A8%EF%BC%8C%E4%B8%BA%E4%BA%86%E6%88%91%E4%BB%AC%E6%83%B3%E8%A6%81%E5%AE%88%E6%8A%A4%E7%9A%84%E4%BA%BA%EF%BC%8C%E5%88%9B%E9%80%A0%E7%BE%8E%E5%A5%BD%E6%9C%AA%E6%9D%A5%E5%A4%A7%E4%B8%8D%E5%90%8C%EF%BC%81&title=%E5%B0%8F%E8%A1%8C%E5%8A%A8%E5%A4%A7%E4%B8%8D%E5%90%8C&site=jiathis&pics=http%3A%2F%2Fwww.smallactions.cn%2Fdocroot%2Fimg%2Fheader%2Flogo.jpg
            })

            
            //给拥有默认标签的便签加上带颜色的假边框
            highlight_colored_tags();

            //自定义便签标签部分
            // $("#wrapper").on("click touchstart","#note_ops .default a.dropdown",function(event){
            //     event = EventUtil.getEvent(event);
            //     EventUtil.preventDefault(event);

            //     //展开内容
            //     if(!$("#note_ops").hasClass("adding-custom")){
            //         //内容没有被展开，则展开
            //         $("#note_ops").addClass("adding-custom");
            //     }else{
            //         $("#note_ops").removeClass("adding-custom");
            //     }
            // });

            // $("#wrapper").on("click touchstart",".custom a.tag",function(event){
            //     var event = EventUtil.getEvent(event);
            //         EventUtil.preventDefault(event);

            //     var that = this;
            //     var $note = $(this).parentsUntil(".note-con").last().parent();
            //     var note_id = $note.data("id");
            //     var tag_id = $(this).data("id");
            //     var note = new Note({id:note_id});
            //     if(note_id > 0 && tag_id > 0){
            //         if($(this).hasClass("choosed")){
            //             note.removeTag(tag_id,function(data){
            //                 if(console) console.log(data);
            //                 var feedback = get_json_feedback(data);
            //                 if(feedback.status == "ok"){
            //                     //移除标签成功
            //                     $(that).removeClass("choosed")
            //                 }else{
            //                     //移除标签失败
            //                     showMessage({type:"error",msg:"移除标签失败"});
            //                 }
            //             });
            //         }else{
            //             note.addTag(tag_id,function(data){
            //                 var feedback = get_json_feedback(data);
            //                 if(feedback.status && feedback.status == "ok"){
            //                     $(that).addClass("choosed");
            //                 }
            //             });
            //         }
            //     }
            // });

            // $(".tags.section .add-tag").on("click "+downEvent,function(event){
            //     event = EventUtil.getEvent(event);
            //     var target = EventUtil.getTarget(event);
            //     if(target.type && target.type == "submit"){
            //         return false;
            //     }
            //     $("input.tag-name",this).focus();
            // });

            $(".tags.section a.new-btn").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                //如果已经达到了tag数量上限
                var current_tags_num = $("#search_area a.tag").not(".default").length;
                if(current_tags_num >= APP.max_tag_num){
                    showMessage({type:"warning",msg:"对不起，你的标签数量已经达到上限"});
                    return false;
                }

                $(".tags.section").addClass("adding-tag");
                console.log("add");
                $("div.new-tag-con input.tag-name").focus().blur(function(event){
                    if(this.value == ""){
                        $(".tags.section").removeClass("adding-tag");
                    }
                });
            });

            //点击图片下载，如果用户没有装插件则要求其装上插件
            $(".tag-result").on("click","a.img-downloader",function(event){
                if(!APP.ext_installed){
                    //要求安装插件
                    setTimeout(function(){
                        APP.show_install_btn();
                    },1500);

                    //阻止下载
                    event.preventDefault();
                }
            });

            $("#search_area .by-tag a.new-btn").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                //如果已经达到了tag数量上限
                var current_tags_num = $("#search_area a.tag").not(".default").length;
                if(current_tags_num >= APP.max_tag_num){
                    showMessage({type:"warning",msg:"对不起，你的标签数量已经达到上限"});
                    return false;
                }

                $("#search_area .by-tag").addClass("adding-tag");
                
                $("div.new-tag-con input.tag-name").focus().blur(function(event){
                    if(this.value == ""){
                        $("#search_area .by-tag").removeClass("adding-tag");
                    }
                });
            });

            //当用户在输入时自动扩大字段长度
            $(".tags.section,#search_area .by-tag").on("keyup input paste","input.tag-name",function(event){
                if(this.value.length > 3){
                    if($(this).width() < $(".tags.section").width()-20){
                        $(this).attr("size",this.value.length);
                    }else{
                        $(this).attr("size",$(this).attr("size"));
                    }
                }else{
                    $(this).attr("size",3);
                }
            });

            $(".tags.section").on("click "+downEvent,".new-tag-con input.submit",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var input = $(".tags.section .new-tag-con input.tag-name").get(0);
                var tag_name = input.value;
                
                var tags_arr = tag_name.replace(/，|,/g,"------").split("------");
                
                if(tags_arr.length > 0){
                    for(var i=0,len=tags_arr.length;i<len;i++){
                        add_new_tag(tags_arr[i],input);
                    }
                }
            });

            $("#search_area .by-tag").on("click "+downEvent,".new-tag-con input.submit",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var input = $("#search_area .by-tag .new-tag-con input.tag-name").get(0);
                var tag_name = input.value;
                
                var tags_arr = tag_name.replace(/，|,/g,"------").split("------");
                
                if(tags_arr.length > 0){
                    for(var i=0,len=tags_arr.length;i<len;i++){
                        add_new_tag(tags_arr[i],input,"search_area");
                    }
                }
            });

            // $("div.add-tag input.submit").on("click "+downEvent,function(event){
            //     event = EventUtil.getEvent(event);
            //     EventUtil.preventDefault(event);

            //     var input = $("div.add-tag input.tag-name").get(0);
            //     var tag_name = input.value;
            //     add_new_tag(tag_name,input);
            // });

            // $("div.add-tag input[type='text']").on("keyup",function(event){
            //     event = EventUtil.getEvent(event);
            //     var cur_val = this.value;
            //     var that = this;
            //     if(cur_val){
            //         var last_char = cur_val.slice(cur_val.length-1,cur_val.length);
            //         if(last_char == "," || last_char == "，"){
            //             var tag = cur_val.slice(0,cur_val.length-1);
            //             add_new_tag(tag,that);
            //             //we clear the field
            //             //this.value = "";
            //             //$(this).before("<span class='tag-block' data-tag='"+tag+"'>"+tag+"<a href='#' class='remove-tag'>x</a></span>");
            //         }
            //     }
            // }).on("keydown",function(event){
            //     //按删除键的时候，当input为空时，依次删除tag
            //     if(event.keyCode && event.keyCode == 8 && $(this).val() == ""){
            //         $("span.tag-block").last().remove();
            //     }
            // });

            //给便签添加一个新的标签
            function add_new_tag(tag_name,input,from){
                if($.trim(tag_name) == ""){
                    return false;
                }

                //先创建tag
                var tag_obj = new Tag({name:tag_name});
                
                tag_obj.save(function(data){
                    if(console) console.log(data);
                    var feedback = data;
                    if(feedback.status && feedback.status == "ok"){
                        input.value = "";
                        $(input).focus();
                        $(input).attr("size",3);

                        if(feedback.tagid && feedback.tagid > 0){
                            var tag_id = feedback.tagid;

                            //如果用户为安装浏览器扩展，则提醒他安装
                            if(!!APP.ext_installed){
                                setTimeout(function(){
                                    APP.show_install_btn();
                                },1500);
                            }

                            //更新所有tag列表
                            $(".tags .custom a.tag").last().after("<a href=\"#\" class=\"tag\" data-id=\""+tag_id+"\">"+tag_obj.name+"</a>");
                            $("#search_area .by-tag .custom-tags div.tag-con").last().after("<div class=\"tag-con\"><a href=\"#\" draggable=\"false\" class=\"tag\" data-id=\""+tag_id+"\">"+tag_name+"</a></div>");
                            
                            //如果在搜索栏添加，则只创建标签不给便签添加
                            if(!from || (from && from != "search_area")){
                                var $note = $(input).closest(".note-con");
                                var note_id = $note.data("id");
                                var note = new Note({id:note_id});
                                console.log(note);
                                //再添加tag
                                note.addTag(tag_id,function(feedback){
                                    if(feedback.status == "ok"){
                                        //加标签成功
                                        $(".tags.section .tag[data-id=\""+tag_id+"\"]").addClass("choosed");
                                    }else{
                                        //加标签失败
                                        showMessage({type:"error",msg:"加标签失败"});
                                    }
                                });
                            }
                        }
                    }else{
                        showMessage({type:"error",msg:"加标签失败"});
                    }
                });
            }

            //同步至ical,google calendar
            $("#wrapper").on("click "+downEvent,"#sync a.sync-to",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                //同步完成的提示信息
                var callback = function(data){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){

                    }else{
                        if(feedback.msg){
                            showMessage({type:"error",msg:feedback.msg});
                        }
                    }
                };

                if($(this).hasClass("gcal")){
                    Note.prototype.sync("gcal",callback);
                }else if($(this).hasClass("evernote")){
                    Note.prototype.sync("evernote",callback);
                }else if($(this).hasClass("weibo")){
                    Note.prototype.sync("weibo",callback);
                }else if($(this).hasClass("ical")){
                    Note.prototype.sync("ical",callback);
                }
            });

            //添加或者移除标签，同时需要更新修改时间
            $("#search_results").on("click "+downEvent,"#note_ops .tags a.tag",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var $note = $(".note-con.adding-tags");
                var id = $note.data("id");
                var tag_id = $(this).data("id");
                var tag_name = $(this).text();
                var that = this;

                if($(this).hasClass("choosed")){
                    //移除选中的标签
                    if(id && id > 0 && tag_id && tag_id > 0){
                        var note = new Note({id:id});

                        //若需要删除的标签是当前打开的标签，则在删除之后需要将其隐藏，所以要给出撤销操作
                        if(tag_id == $("#search_area .by-tag .tag.active").data("id")){
                            $note.addClass("to-be-moved");
                            $note.fadeOut("slow",function(){
                                //提示可撤销操作
                                $note.before("<div class=\"feedback-hint\">该便签已被移出\""+tag_name+"\"标签<a href=\"#\" data-event=\"move\" id=\"revocate\">撤销</a></div>");
                                
                                var move_note_timeout = setTimeout(function(){
                                    if($note.hasClass("to-be-moved")){
                                        //删除便签
                                        note.removeTag(tag_id,function(data){
                                            if(console) console.log(data);
                                            var feedback = get_json_feedback(data);
                                            if(feedback.status == "ok"){
                                                //如果移出的标签为当前打开的标签，则更新计数
                                                recount_in_tag("delete");
                                                //在删除前，将底部菜单保留
                                                $note.find("#note_ops").appendTo("body");

                                                //隐藏提示
                                                $(".feedback-hint").fadeOut("fast",function(){$(this).remove();});

                                                //如果移除的是任务标签
                                                if(that.id == "tag_tasks"){
                                                    note.task_id = $note.data("task-id");
                                                    $note.removeClass("task");
                                                    
                                                    //去掉任务属性，删除任务
                                                    note.unsetTask(function(data){
                                                        var feedback = get_json_feedback(data);
                                                        if(feedback.status == "ok"){

                                                        }else{
                                                            
                                                        }
                                                    });
                                                }

                                                $note.remove();
                                            }else{
                                                //移除标签失败
                                                showMessage({type:"error",msg:"移除标签失败"});
                                                //还原
                                                $note.removeClass("to-be-moved").fadeIn();
                                                $("feedback-hint").remove();
                                            }
                                        });
                                    }else{
                                        clearTimeout(move_note_timeout);
                                    }
                                },2500);

                            });
                        }else{
                            //移除一个标签
                            note.removeTag(tag_id,function(feedback){
                                if(feedback.status == "ok"){
                                    //如果移除的是任务标签
                                    if(that.id == "tag_tasks"){
                                        note.task_id = $note.data("task-id");
                                        $note.removeClass("task");
                                        //如果移除的是任务标签
                                        //去掉任务属性，删除任务
                                        note.unsetTask(function(data){
                                            var feedback = get_json_feedback(data);
                                            if(feedback.status == "ok"){

                                            }else{
                                                
                                            }
                                        });
                                    }

                                    //移除标签成功
                                    $(that).removeClass("choosed");

                                    if($(that).hasClass("colored-tag")){
                                        //如果是含有颜色的标签，则删除便签上对应的颜色块
                                        var $form = $note.find("form");
                                        $form.find("div.default_tag[data-id=\""+tag_id+"\"]").remove();
                                        highlight_colored_tags($note.removeClass("highlighted").get(0));

                                        //移除反色
                                        $(that).css({background:"white",color:$(that).data("color")});
                                    }
                                }else{
                                    //移除标签失败
                                    showMessage({type:"error",msg:"移除标签失败"});
                                }
                            });
                        }
                    }
                }else{
                    //添加新的标签
                    if(id && id > 0 && tag_id && tag_id > 0){
                        var note = new Note({id:id});

                        note.addTag(tag_id,function(feedback){
                            if(feedback.status == "ok"){
                                //如果用户为安装浏览器扩展，则提醒他安装
                                if(!APP.ext_installed){
                                    setTimeout(function(){
                                        APP.show_install_btn();
                                    },1500);
                                }

                                //如果添加的是任务标签
                                if(that.id == "tag_tasks"){
                                    $note.addClass("task");
                                    note.deadline = null;
                                    note.setTask(function(feedback){
                                        if(feedback.status == "ok"){
                                            //无截止日期任务添加成功
                                            //应当返回任务id，以及position
                                            if(console) console.log("新的无截止日期的任务创建成功");
                                            $note.attr({"data-task-id":feedback.task_id,"data-position":feedback.position}).data({"position":feedback.position,"task-id":feedback.task_id});
                                        }
                                    });
                                }

                                //加标签成功
                                $(that).addClass("choosed");

                                if($(that).hasClass("colored-tag")){
                                    //如果是含有颜色的标签，则为便签添加颜色
                                    var color = $(that).data("color"),$form = $note.find("form");

                                    $form.append("<div class=\"default_tag\" data-id=\""+tag_id+"\" style=\"background:"+color+"\"></div>");
                                    
                                    highlight_colored_tags($note.removeClass("highlighted").get(0));

                                    //添加反色
                                    $(that).css({background:color,color:"white"});
                                }
                            }else{
                                //加标签失败
                                showMessage({type:"error",msg:"加标签失败"});
                            }
                        });
                    }
                }
            }); 

            //点击记事本旁的选项框时将记事/任务标记为完成与未完成 (选项框为div而非input checkbox)
            toggleClick(".note-con .checkbox","checked",true,function(){
                var $note_con = $(this).closest(".note-con");
                var note_id = $note_con.data("id");
                var deadline = $note_con.data("deadline");
                if(!!!note_id) return false;

                var note = new Note({id:note_id,deadline:deadline});

                //重新将已完成的任务标记为未完成
                note.recover(function(feedback){
                    if(feedback.status == "ok"){
                        $note_con.find("form").removeClass("finished").end().removeAttr("data-deadline").removeData("deadline");
                        $note_con.find("div.deadline").remove();
                        if($note_con.hasClass("today")){
                            recount_today_tasks("recover");
                        }

                        var $note = $note_con.find(content_area);
                        if($note.length > 0){
                            $note.get(0).style.height = 0;
                            $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                        }

                        //如果是在任务列表面板中，则将其移到最前方
                        if($("#search_results").hasClass("results-of-tasks")){
                            $note_con.fadeOut("slow",function(){
                                //移动到以后列表中的第一个
                                divide_task_area();
                                $("#search_results .by-tag.result .tag-result.show").find("h1.later-area").after(this);
                            }).delay(500).fadeIn().addClass("outline").removeClass("hidden");

                            setTimeout(function(){
                                $(".outline").removeClass("outline");
                            },3000);
                        }
                    }
                });
                note = null;
            },function(){
                //选中之后，将任务或记事标记为已完成
                var $note_con = $(this).closest(".note-con");
                var note_id = $note_con.data("id");
                var deadline = $note_con.data("deadline");
                if(!!!note_id) return false;
                
                var note = new Note({id:note_id,deadline:deadline});
                note.finish(function(feedback){
                    if(feedback.status == "ok"){
                        //如果是今天的任务，则首先将今日任务计数减一，然后检查今日任务是否为0，如果为0，则隐藏今日任务区域
                        if($note_con.hasClass("today")){
                            recount_today_tasks("finished");
                        }

                        //如果是在任务列表面板中，则将其移到最后方
                        if($("#search_results").hasClass("results-of-tasks")){
                            $note_con.fadeOut("slow",function(){
                                //移到已完成任务的最前方
                                var $finished_items = $("#search_results .by-tag.result .note-con form.finished");
                                $(this).find("form").addClass("finished");

                                if($finished_items.length > 0){
                                    //如果存在已经完成的便签
                                    $finished_items.first().closest(".note-con").before(this);
                                    $note_con.fadeIn().addClass("outline").addClass("hidden").find("form").addClass("finished");
                                }else{
                                    //如果不存在已完成的便签且所有任务已经加载完成，则放到最后面
                                    if($("#tag_tasks").hasClass("finished")){
                                        $note_con.fadeIn().addClass("outline").appendTo("#search_results .by-tag.result .tag-result.show");
                                    }else{
                                        $note_con.remove();
                                        $note_con = null;
                                    }   
                                }
                            });

                            setTimeout(function(){
                                $(".outline").removeClass("outline");
                            },3000);
                        }
                        
                        if($note_con){
                        var $note = $note_con.find(content_area);
                            if($note.length > 0){
                                $note.get(0).style.height = 0;
                                $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                            }
                        }
                    }
                });
                note = null;
            });
            
            //滚动加载记事(加载当前面板所属标签下的便签)
            $(window).on("scroll.window",container_onscroll);

            $("body #wrapper").on("scroll",container_onscroll);

            function container_onscroll(event){
                event = EventUtil.getEvent(event);
                var target = EventUtil.getTarget(event);

                if(target == document && ( $("body").hasClass("single-mode")||$("body").hasClass("img-wall")||$("body").hasClass("open-link")||$("body").hasClass("configuring") )){
                    //若是在侧栏模式中滚动整个窗口则不做操作
                    return false;
                }

                if(target.id && target.id == "wrapper" && !( $("body").hasClass("single-mode")||$("body").hasClass("img-wall")||$("body").hasClass("open-link")||$("body").hasClass("configuring") ) ){
                    //若是在非侧栏模式中滚动整个窗口则不做操作
                    return false;
                }

                if(target == document){
                    var con_full_height = $(target).height();
                }

                if(target.id && target.id == "wrapper"){
                    var con_full_height = $(target).prop("scrollHeight");
                }

                var that = $("#note").get(0);
                var $cur_tag = $("#search_area .by-tag a.tag.active");

                //滚动到一定位置，保留搜索栏
                if($(target).scrollTop() >= stickyTop + 100){
                    if(!$("#search_area").hasClass("fixed")){
                        $("#search_area").addClass("fixed").css({width:stickyWidth+"px"});
                    }
                }else{
                    if($("#search_area").hasClass("fixed")){
                        $("#search_area").removeClass("fixed").removeAttr("style");
                    }
                }
                
                return ;
                //当滚动到离页面底部还有500px时，加载内容
                if($(target).scrollTop() > con_full_height - $(window).height() - 500) {
                    if($(that).hasClass("loading") || $(that).hasClass("end") || $(this).hasClass("empty") || !$("body").hasClass("note-app")){
                        //页面正在加载，不继续请求
                        return false;
                    }

                    $(that).addClass("loading");
                    var tag_id = $cur_tag.data("id"),
                        limit = 10,
                        offset_id = $("#search_results .by-tag .tag-result.show .note-con").last().data("id") ? $("#search_results .by-tag .tag-result.show .note-con").last().data("id") : 0;
                    
                    if($cur_tag.hasClass("finished")){
                        if(console) console.log("marked as finished");
                        $(that).removeClass("loading");
                        return false;
                    }

                    if(console) console.log(offset_id);
                    //如果当前打开的面板是任务面板，且便签中存在已完成的便签，则说明未完成的便签已经取完
                    Note.prototype.get_notes_in_tag(tag_id,limit,offset_id,function(data){
                        var feedback = get_json_feedback(data),noteobj,note,notes;
                        var note_html = "";

                        if($("#search_results .by-tag .tag-result.tag-"+tag_id).length == 0){
                            $("#search_results .by-tag").append("<div class=\"tag-result tag-"+tag_id+"\"></div>");
                        }

                        var tag_notes_con = $("#search_results .by-tag .tag-result.tag-"+tag_id).fadeIn(function(){$(this).addClass("show")}).get(0);

                        if(feedback.notes && feedback.notes.length > 0){
                            notes = feedback.notes;
                            
                            //放入全局变量中缓存标签数据
                            // if(!idl.apps.note.tag["tag_"+tag_id]){
                            //     idl.apps.note.tag["tag_"+tag_id] = {};
                            // }

                            // if(!idl.apps.note.tag["tag_"+tag_id].notes){
                            //     idl.apps.note.tag["tag_"+tag_id].notes = [];
                            // }
                            // var ori_tag_notes = idl.apps.note.tag["tag_"+tag_id].notes;
                            // idl.apps.note.tag["tag_"+tag_id].notes = ori_tag_notes.concat(notes);


                            for(var i=0,len=notes.length; i<len; i++){
                                noteobj = notes[i];
                                note = new Note(noteobj);
                                note.construct_item("newly_loaded");
                                note_html += note.html;
                            }
                        
                            $(tag_notes_con).append(note_html);

                            $(".note-con.newly_loaded",tag_notes_con).each(function(){
                                var $note = $(this).find(content_area);
                                if($note.length > 0){
                                    $note.data("value",$note.html());
                                    var content = decode_content($note.html());
                                    $note.html(content);
                                    $note.get(0).style.height = 0;
                                    $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                }
                                $(this).removeClass("newly_loaded");
                            });
                            highlight_colored_tags();
                            $(that).removeClass("loading");
                        }else{
                            if(console) console.log("end");
                            //结果返回空则是加载结束
                            if(tag_id == $("#tag_tasks").data("id")){
                                //如果是任务标签，返回空则表示未完成的任务已经加载完成，已经完成的是否加载完成还是未知数需要作判断
                                //如果未完成的任务便签刚好50条，则不会提供取已完成的便签的参考offset_id
                                //则继续加载已完成的便签

                                if(!$(".note-con",tag_notes_con).last().find("form").hasClass("finished")){
                                    if(console) console.log("no finished, load from start of finished notes");
                                    //如果现在存在的便签中不存在已完成的便签，则从已完成的便签中从头开始加载
                                    offset_id = 0;
                                }else{
                                    if(console) console.log("has finished, load from "+offset_id);
                                }

                                Note.prototype.load_finished(limit,offset_id,function(data){
                                    console.log(data);
                                    var feedback = get_json_feedback(data),noteobj,note,notes;
                                    var note_html = "";
                                    if(feedback.notes && feedback.notes.length > 0){
                                        notes = feedback.notes;

                                        for(var i=0,len=notes.length; i<len; i++){
                                            noteobj = notes[i];
                                            
                                            note = new Note(noteobj);
                                            note.construct_item("newly_loaded");
                                            note_html += note.html;
                                        }

                                        $(tag_notes_con).append(note_html);
                                        $(".note-con.newly_loaded",tag_notes_con).each(function(){
                                            var $note = $(this).find(content_area);
                                            if($note.length > 0){
                                                $note.data("value",$note.html());
                                                var content = decode_content($note.html());
                                                $note.html(content);
                                                $note.get(0).style.height = 0;
                                                $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                            }
                                            $(this).removeClass("newly_loaded");
                                        });

                                        var results_length = $(".note-con",tag_notes_con).length;
                                        
                                        highlight_colored_tags();
                                        $(that).removeClass("loading");
                                    }else{
                                        //给出搜索完成标识
                                        $("#search_area #tag_tasks").addClass("finished");
                                        $(that).removeClass("loading");
                                        return false;
                                    }
                                });
                            }else{
                                //给出搜索完成标识
                                $cur_tag.addClass("finished");
                                $(that).removeClass("loading");
                                $(".note-con.newly_loaded",tag_notes_con).each(function(){
                                    var $note = $(this).find(content_area);
                                    if($note.length > 0){
                                        $note.data("value",$note.html());
                                        var content = decode_content($note.html());
                                        $note.html(content);
                                        $note.get(0).style.height = 0;
                                        $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                                    }
                                    $(this).removeClass("newly_loaded");
                                });
                                
                                highlight_colored_tags();
                                return false;
                            }
                        }
                    });
                }
            }

            $("#note #backtotop").on("click "+downEvent,function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                $("html,body").animate({scrollTop: 0},"fast");
                $('#search_area').css({position:'relative',width:stickyWidth}).removeClass("fixed");
            });

            //将已经修改的内容标记为已修改
            $("#wrapper").on("keyup",".note-con",function(event){
                var editable = $(this).find(".note.editable").get(0);
                var cursorPos = getCursorPosition(editable);
                var note_con = this;
                var note = new Note({id:$(this).data("id")});
                //在移动设备上delete键不会被检测到
                //所以如果删除了某些文字并不会标识为已修改
                //只有按下了字符键(包括空格，回车)才回标识为已修改
                if($(content_area,this).html() != $(content_area,this).data("value") && $(this).hasClass("editing")){
                    $(this).addClass("modified").removeClass("saved");
                }else{
                    $(this).removeClass("modified");
                }

                //此处针对移动设备
                //装了其他输入法的设备可以检测到键盘事件，但无法检测到事件的keycode 或 which属性
                //alert(event.which);
                if(!event.keyCode && !event.which){
                    //如果位置为1，则记录下0-1这个位置输入的字符，若字符==" "，则相当于按下了space键
                    var char = getLastInput(editable);

                    //如果敲下的为空格
                    if(/\s/.test(char)){
                        if(cursorPos == 1){
                            //在打头处敲下空格键，记录下来，为下次敲击做准备
                            $(this).data("hit_space_count",1);
                            console.log(1);
                        }else if(cursorPos == 2){
                            if($(this).data("hit_space_count") == 1){
                                //如果不是新的便签，则为其添加上任务标签
                                if(!$(this).hasClass("new")){
                                    note.addTag($("#tag_tasks").data("id"),function(feedback){
                                        if(feedback.status == "ok"){
                                            note.deadline = null;
                                            note.setTask(function(data){
                                                feedback = get_json_feedback(data);
                                                if(feedback.status == "ok"){
                                                    $(note_con).addClass("task");
                                                    $(note_con).attr({"data-task-id":feedback.task_id,"data-position":feedback.position}).data({"position":feedback.position,"task-id":feedback.task_id});
                                                    //如果添加的当前的标签有色彩值，则需要为新建的便签加上色彩值
                                                    var color = $("#tag_tasks").data("color");
                                                    
                                                    if(!!color){
                                                        $("form",that).append("<div class=\"default_tag\" data-id=\""+task_id+"\" style=\"background:"+color+"\"></div>");
                                                    }

                                                    if($(note_con).hasClass("highlighted")) $(note_con).removeClass("highlighted");
                                                    highlight_colored_tags(note_con);
                                                } 
                                            });
                                        }
                                    });
                                }else{
                                    //如果是新便签，则直接勾选框
                                    $(note_con).addClass("task");
                                }
                            }

                            //去掉之前打下的两个空格
                            if(window.getSelection){
                                var s = window.getSelection();
                                var range = s.getRangeAt(0);
                                range.setStart(s.anchorNode,0);
                                range.setEnd(s.anchorNode,cursorPos);
                                if(/\s+/.test(range.toString())){
                                    range.deleteContents();
                                }
                                
                                range.detach();
                                range = null;
                            }else if(document.selection){
                                //针对ie
                                var textRange = document.body.createTextRange();
                                    textRange.moveToElementText(editable);
                                    textRange.moveStart(0);
                                    textRange.moveEnd(-textRange.text.length+2);
                                    if(textRange.text.length == 2 && /\s+/.test(textRange.text)){
                                        textRange.text = "";
                                    }
                            }
                        }
                    }
                }

                //在可编辑区域中的开始部分敲下两个空格即为任务
                if(event.keyCode && event.keyCode == "32" && !$(this).hasClass("task")){
                    if(cursorPos == 1){
                        //在打头处敲下空格键，记录下来，为下次敲击做准备
                        $(this).data("hit_space_count",1);
                    }else if(cursorPos == 2){
                        if($(this).data("hit_space_count") == 1){
                            $(this).addClass("task");

                            //如果不是新的便签，则为其添加上任务标签
                            if(!$(this).hasClass("new")){
                                var that = this;
                                var task_id = $("#tag_tasks").data("id");
                                note.addTag(task_id,function(feedback){
                                    if(feedback.status == "ok"){
                                        note.deadline = null;
                                        note.setTask(function(data){
                                            if(console) console.log(data);
                                            feedback = get_json_feedback(data);
                                            if(feedback.status == "ok"){
                                                $(note_con).addClass("task");
                                                $(note_con).attr({"data-task-id":feedback.task_id,"data-position":feedback.position}).data({"position":feedback.position,"task-id":feedback.task_id});
                                                //如果添加的当前的标签有色彩值，则需要为新建的便签加上色彩值
                                                var color = $("#tag_tasks").data("color");
                                                
                                                if(!!color){
                                                    $("form",that).append("<div class=\"default_tag\" data-id=\""+task_id+"\" style=\"background:"+color+"\"></div>");
                                                }

                                                if($(note_con).hasClass("highlighted")) $(note_con).removeClass("highlighted");
                                                highlight_colored_tags(note_con);
                                            } 
                                        });
                                    }
                                });
                            }else{
                                //如果是新便签，则直接显示勾选框(在样式上显示为任务)
                                $(note_con).addClass("task");
                            }

                            //去掉之前打下的两个空格
                            if(window.getSelection){
                                var s = window.getSelection();
                                var range = s.getRangeAt(0);
                                range.setStart(s.anchorNode,0);
                                range.setEnd(s.anchorNode,cursorPos);
                                if(/\s+/.test(range.toString())){
                                    range.deleteContents();
                                }
                                range.detach();
                                range = null;
                            }else if(document.selection){
                                //针对ie
                                var textRange = document.body.createTextRange();
                                    textRange.moveToElementText(editable);
                                    textRange.moveStart(0);
                                    textRange.moveEnd(-textRange.text.length+2);
                                    if(textRange.text.length == 2 && /\s+/.test(textRange.text)){
                                        textRange.text = "";
                                    }
                            }
                        }
                    }
                }

                if(event.keyCode && event.keyCode == "8" && $(this).hasClass("task")){
                    if(cursorPos == 0){
                        if($(this).data("hit_del_count")){
                            if($(this).data("hit_del_count") == "1"){
                                $(this).removeClass("task");

                                //如果不是新的便签，则为其去掉任务标签
                                if(!$(this).hasClass("new")){
                                    var that = this;
                                    var task_id = $("#tag_tasks").data("id");
                                    note.task_id = $(note_con).data("task-id");

                                    //去掉任务标签
                                    note.removeTag(task_id,function(data){
                                        if(console) console.log(data);
                                        var feedback = get_json_feedback(data);
                                        if(feedback.status == "ok"){
                                            //删除任务
                                            note.unsetTask(function(data){
                                                if(console) console.log(data);
                                                var feedback = get_json_feedback(data);

                                                if(feedback.status == "ok"){
                                                    if($("#search_results").hasClass("results-of-tasks")){
                                                        $(note_con).remove();
                                                    }else{
                                                        $(note_con).removeClass("task");

                                                        //去掉任务标签的色块
                                                        $(that).find(".default_tag[data-id=\""+task_id+"\"]").remove();

                                                        if($(note_con).hasClass("highlighted")) $(note_con).removeClass("highlighted");
                                                        highlight_colored_tags(note_con);
                                                    }
                                                }else{
                                                    //操作失败
                                                }
                                            });
                                        }
                                    });
                                }else{
                                    //如果是新便签，则直接去掉勾选框
                                    $(note_con).removeClass("task");
                                }
                                
                                $(this).removeData("hit_space_count").removeData("hit_del_count");
                            }
                        }else{
                            $(this).data("hit_del_count",1);
                        }
                    }
                }
            });

            $("#wrapper").on("keydown",".note-con form",function(event){
                event = EventUtil.getEvent(event);
                
                //快捷键 Ctrl/Cmd + S
                if(event.keyCode && event.keyCode == 83 && (event.metaKey || event.ctrlKey)){
                    EventUtil.preventDefault(event);
                    
                    var $note_con = $(this).parent(),
                        $txtarea = $note_con.find(content_area),
                        save_id = $note_con.data("id");

                    if($note_con.hasClass("saving") || !$note_con.hasClass("modified") || $note_con.hasClass("saved")){
                        showMessage({"type":"success","msg":"已保存"});
                    }else{
                        $(this).submit();
                    }
                }
            });

            $("#blank_sheet").on("click "+downEvent,".note-con .submit",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);
                $note_con = $("#blank_sheet .note-con");
                $("#blank_sheet .new form").submit();
                
                if($("#blank_sheet .note-con.new").length == 0){
                    Note.prototype.addBlank();
                    //$("#notes_con .range-title").first().after($note_con.get(0));
                    $("#notes_con "+all_saved_con+" .range-title").first().after($note_con.get(0));
                    
                    $note_con.find(content_area).each(function(){
                        var content = decode_content(this.innerHTML,true);
                        $(this).html(content);
                        this.style.height = 0;
                        this.style.height = Math.min(150,this.scrollHeight) + "px";
                    });
                }
            });

            //提交记事表单进行保存,保存至远程数据库
            $("#wrapper").on("submit",".note-con form.note",function(event){
                event = EventUtil.getEvent(event);
                EventUtil.preventDefault(event);

                var field = $(this).find("div.note.editable").get(0),
                    content = field.innerHTML,
                    that = this,
                    title = "",
                    note_con = this.parentNode,
                    id = 0;

                //使用tab键时，会促发blur和focus，但便签并没有进入编辑状态，blur时会自动保存，此时保存的是可读模式下的内容，是错的
                //所以非编辑模式下的内容不保存                    
                if($(field).attr("contenteditable") == "false" || $(field).attr("contenteditable") == undefined){
                    return false;
                }

                if($.trim(content) == "" || $.trim($(field).text()) == ""){
                    if(!($("body").hasClass("touch-device"))){
                        field.focus();
                    }
                    return false;
                }

                content = encode_content(content,true);
                
                field.innerHTML = content;

                var title = get_title(content);
                if($(note_con).data("id")){
                    id = $(note_con).data("id");
                }

                //如果内容没有发生变化则给出提示并返回
                if(content == $(field).data("value")){
                    //showMessage({"type":"success","msg":"已保存"});
                    return false;
                }

                //如果内容长度超过5000字建议在两个便签中书写
                if(content.length > 5000){
                    showMessage({type:"warning",msg:"你输入的内容长度("+content.length+"字符)超过了5000字符，请将超过部分("+(content.length-5000)+"字符)保存于另一份便签中"});
                    return false;
                }

                var note = new Note({"id":id,"title":title,"content":content});
                $(note_con).removeClass("saved").addClass("saving");

                $(".loading_bar").remove();
                $(that).append("<div class=\"loading_bar\" style=\"width:2px;height:2px;position:absolute;top:100%;-webkit-transition:all .4s ease-in-out;background:#0ae;\"></div>");
                
                note.save(function(feedback){
                    if(feedback.status == "ok"){
                        $(".loading_bar").css({width:that.offsetWidth,opacity:0});
                        $(note_con).removeClass("saving modified");

                        if(feedback.id){
                            //添加的是新便签，其类别必须是notes或tasks其中之一，
                            note.id = feedback.id;
                            note.created = get_current_time();

                            //保存成功，如果用户装了插件，每创建5条便签弹出一次登录框
                            if(APP.ext_installed){
                                if(APP.notes.length%5 == 0)
                                    APP.toggle_authwin();
                            }

                            //新建的便签
                            //将本地存储中的new_note记录删除
                            if(localStorage) localStorage.removeItem("new_note");

                            var extra_html = "<div class=\"checkbox\"><span class=\"ok-icon-complete icon-font\"></span></div>" + 
                            "<div class=\"bottom-menu\">" +                                //7-13-添加了字体图标
                                "<div class=\"op\"><a href=\"#\" class=\"more\"></a></div>" +
                                "<div class=\"op exit\"><a href=\"#\" class=\"share\"><span class=\"ok-icon-share icon-font\"></span></a></div>" + 
                                "<div class=\"op hidden\"><a href=\"#\" class=\"del\"><span class=\"ok-icon-del icon-font\"></span></a></div>" +
                                "<div class=\"op hidden\"><a href=\"#\" class=\"cal\"><span class=\"ok-icon-cal icon-font\"></span></a></div>" + 
                                "<div class=\"op hidden\" ><a href=\"#\" class=\"tags\"><span class=\"ok-icon-tag icon-font\"></span></a></div>" + 
                                "<div class=\"op hidden\"><a href=\"#\" class=\"info\"><span class=\"ok-icon-info icon-font\"></span></a></div>" + 
                            "</div>" + 
                            "<div class=\"top-ops\">" + 
                                "<a href=\"#\" class=\"maximize-note\"><span class=\"ok-icon-maximize-note icon-font\"></span></a>" +
                                "<a href=\"#\" class=\"minimize-note\"><span class=\"ok-icon-minimize-note icon-font\"></span></a>" +
                            "</div>" +
                            "<div class=\"stamp\"><span class=\"address\"></span><span class=\"contact\"></span></div>"+  //联系人和地址的色彩标签
                            "<a href=\"#\" class=\"drag_trigger sort_trigger\"></a>";

                            $(note_con).attr({"id":"note-"+feedback.id,"data-id":feedback.id})
                                        .removeClass("new")
                                        .addClass("saved sortable newly_saved")
                                        .find("form").append(extra_html)
                                        .find(".bottom").remove();

                            //将便签进行分类
                            //默认分类为当前选项卡
                            var default_type = "all",
                                $active_tag = null;

                            //系统自动添加标签
                            if(/\bresults\-of\-(tasks|contacts|notes|links|images)\b/.test($("#search_results").attr("class"))){
                                //如果是在默认五大分类面板中添加
                                default_type = $("#search_results").attr("class").match(/\bresults\-of\-(tasks|contacts|notes|links|images)\b/)[1];
                                $active_tag = $("#tag_"+default_type);
                            }else if($("#search_results").hasClass("custom-tag-results")){
                                //自定义标签面板中添加
                                default_type = "custom";
                                $active_tag = $("#search_area .by-tag .tag.active");
                                
                                note.addTag($active_tag.data("id"),function(feedback){
                                    if(feedback.status == "ok"){
                                        //如果添加的当前的标签有色彩值，则需要为新建的便签加上色彩值
                                        var color = $active_tag.data("color");
                                        
                                        if(!!color){
                                            $(that).append("<div class=\"default_tag\" data-id=\""+$active_tag.data("id")+"\" style=\"background:"+color+"\"></div>");
                                            if($(note_con).hasClass("highlighted")) $(note_con).removeClass("highlighted");
                                            highlight_colored_tags(note_con);
                                        }
                                    }
                                });
                            }

                            //在任务面板中添加便签
                            if(default_type != "all" && default_type == "tasks") $(note_con).addClass("task");

                            //新建的便签是否有task类，若有则需要加上tasks标签，
                            //1.在任务面板 因为tasks页面会自动在classify函数中添加tasks标签，所以这里不作操作
                            //2.非任务面板 需手动加上tasks标签
                            if(default_type != "tasks" && $(note_con).hasClass("task")){
                                note.addTag($("#tag_tasks").data("id"),function(feedback){
                                    if(feedback.status == "ok"){
                                        var color = $("#tag_tasks").data("color");

                                        if(!!color){
                                            $(that).append("<div class=\"default_tag\" data-id=\""+$("#tag_tasks").data("id")+"\" style=\"background:"+color+"\"></div>"); 
                                            if($(note_con).hasClass("highlighted")) $(note_con).removeClass("highlighted");
                                            highlight_colored_tags(note_con);
                                        }

                                        //将任务设为今日任务
                                        var date = get_formated_time(Date.now(),false);
                                        note.deadline = null;
                                        note.setTask(function(response){
                                            if(response.status == "ok"){
                                                if(response.task_id && response.task_id > 0){
                                                    //将任务id加入便签中
                                                    $(note_con).attr({"data-task-id":response.task_id,"data-position":response.position}).data({"position":response.position,"task-id":response.task_id});
                                                    $("form",note_con).append("<div class=\"deadline\"><span>"+note.deadline+"</span></div>");
                                                    recount_today_tasks("addnew");
                                                }
                                            }else{
                                                //发生错误
                                            }
                                        });
                                    }
                                });
                            }

                            //系统自动分类
                            note.classify(default_type,function(o){
                                if(console) console.log(o);
                                var stick_types = o.types ? o.types : new Array();
                                var feedback = o.data;
                                if(feedback.status && feedback.status == "ok"){
                                    //为便签添加上相应的颜色
                                    var default_tag = null,color="";
                                    for(var i=0,len=stick_types.length; i<len; i++){
                                        default_tag = $("#tag_"+stick_types[i]).get(0);
                                        if(default_tag){
                                            color = $(default_tag).data("color");
                                            console.log(color);
                                            //如果添加的标签含有颜色值，并且便签中不包含该颜色块则为其添加颜色块
                                            if(!!color && $(that).find(".default_tag[data-id=\""+$("#tag_"+stick_types[i]).data("id")+"\"]").length == 0){
                                                $(that).append("<div class=\"default_tag\" data-id=\""+$("#tag_"+stick_types[i]).data("id")+"\" style=\"background:"+color+"\"></div>");
                                            }
                                        }
                                    }
                                    if($(note_con).hasClass("highlighted")) $(note_con).removeClass("highlighted");
                                    highlight_colored_tags(note_con);
                                }else{
                                    console.log(o);
                                }
                            });
                            
                            //保存之后，只有在当前编辑文本框失焦之后才创建新的记事
                            $(field).data("value",content);

                            if($("#blank_sheet .note-con.new").length > 0){
                                return false;
                            }

                            //确保只有一个新记事才添加新的空白记事
                            Note.prototype.addBlank();

                            //将新增的记事放入面板
                            if(default_type != "all" && $active_tag != null){
                                //如果是任务面板，则将新建便签加入今日便签内
                                $("#search_results .by-tag.result .tag-result.show").prepend(note_con);
                                
                                //更新计数
                                recount_in_tag("addnew");
                                var current_num = $active_tag.data("num");
                                $active_tag.data("num",current_num+1);

                                $(note_con).find(content_area).each(function(){
                                    read_mode(this);
                                    this.style.height = 0;
                                    this.style.height = (Math.min($(this).prop("scrollHeight"),150)) + "px";

                                    load_first_image(this);
                                }).end().removeClass("newly_saved");

                            }

                            //添加地理位置
                            if($("body").hasClass("geo_on")){
                                get_position(function(lnglat){
                                    if(console) console.log(lnglat);
                                    if(lnglat){
                                        var coords = lnglat.lat + "|" + lnglat.lng;
                                        note.add_coords(coords,function(data){
                                            if(console) console.log(data);
                                        });
                                    }
                                });
                            }
                        }else{
                            //修改的便签,
                            if(!!localStorage){
                                note.modified = get_current_time();
                                //删除本地存储中的对应条目
                                var modified_notes_str = localStorage.getItem("modified_notes");
                                if(!!modified_notes_str){
                                    var modified_notes = $.parseJSON(modified_notes_str);
                                        if(modified_notes[note.id]){
                                            delete modified_notes[note.id];
                                            localStorage.setItem("modified_notes",JSON.stringify(modified_notes));
                                        }
                                }
                            }

                            $(note_con).addClass("saved");
                            $(field).data("value",content);

                            //添加地理位置
                            if($("body").hasClass("geo_on")){
                                get_position(function(lnglat){
                                    if(console) console.log(lnglat);
                                    if(lnglat){
                                        var coords = lnglat.lat + "|" + lnglat.lng;
                                        note.add_coords(coords,function(data){
                                            if(console) console.log(data);
                                        });
                                    }
                                });
                            }
                        }
                    }else{
                        //showMessage({type:"error",msg:"记事失败"});
                    }
                });
                return false;
            });//保存记事结束
	}

	initialize();

    function check_local_saved(when){
        if(!!localStorage){
            var modified_notes_str = localStorage.getItem("modified_notes");
            var new_note_str = localStorage.getItem("new_note");

            if(modified_notes_str || new_note_str){
                var modified_notes = $.parseJSON(modified_notes_str);
                var new_note = $.parseJSON(new_note_str);
                var modified_exist = (!!modified_notes && !$.isEmptyObject(modified_notes));
                
                var new_note_exist = (!!new_note && !$.isEmptyObject(new_note) && $.trim(new_note.content) != "");
                if( modified_exist || new_note_exist ){
                    //如果本地存储中存在未被保存的便签则保存并给予用户提示
                    var id,note,noteobj;
                    if(modified_exist){
                        modified_exist = false;

                        for(id in modified_notes){
                            $note = $(".note-con[data-id=\""+id+"\"]");
                            noteobj = modified_notes[id];

                            //仅仅在用户修改了的情况下进行保存
                            if($note.find(content_area).data("value") != noteobj.content){
                                note = new Note({id:id,content:noteobj.content});
                                note.save(function(feedback){
                                    if(feedback.status == "ok"){
                                        //下面这句主要针对页面关闭时不能保存的设备如ipad
                                        $note.find(content_area).html(noteobj.content);
                                    }

                                    //保存之后将其删除
                                    $note.removeClass("modified");
                                    delete modified_notes[id];
                                    localStorage.setItem("modified_notes",JSON.stringify(modified_notes));
                                });
                                modified_exist = true;
                            }else{
                                delete modified_notes[id];
                                localStorage.setItem("modified_notes",JSON.stringify(modified_notes));
                            }
                        }
                    }

                    if(new_note_exist){
                        if(when == "onload"){
                            //下面主要针对页面关闭时不能保存的设备如ipad
                            //页面加载时若有未保存的新便签(可能是因为关闭时未保存)则将其放入输入框
                            $("#blank_sheet .note-con.new").data("value",new_note.content).addClass("modified").find(content_area).html(new_note.content);
                        }else if(when == "beforeunload"){
                            //用户离开页面时，若有未保存的便签则将其保存

                            // note = new Note({id:0,content:new_note.content});

                            // note.save(function(data){
                            //     var feedback = get_json_feedback(data);
                            //     if(feedback.status == "ok"){
                                    
                            //     }
                            // });

                            // localStorage.removeItem("new_note");
                        }
                    }
                }

                //如果是新便签，若内容为空则不保存也不提示用户
                if($("#blank_sheet .note-con.modified").length > 0){
                    var new_content = $("#blank_sheet .note-con.modified").find(".note.editable").html();
                    //如果此刻正在编辑的新便签为空，则移除所保存的空本地便签
                    if($.trim(new_content) == "" || $.trim(new_content.replace(/\&nbsp\;/ig,"")) == ""){
                        localStorage.removeItem("new_note");
                        return false;
                    }else{
                        //若新便签非空，而且本地未保存，则将其保存在本地
                        if(!new_note_exist){
                            var new_note = {id: 0,content: new_content,created:get_current_time(),saved:0};
                                localStorage.setItem("new_note",JSON.stringify(new_note));
                                return true;
                        }else{
                            return false;
                        }
                    } 
                }

                return modified_exist || $("#wrapper .note-con.modified").length > 0;
            }
        }
    }

    //打开网页时检测本地存储是否有未被保存的便签，有则保存，再将其记录删除
    check_local_saved("onload");

    //在离开页面之前检查未保存的便签并将其保存
    if("onbeforeunload" in window){
        window.onbeforeunload = function(){
            //如果有未保存的便签则保存之后再关闭
            if(check_local_saved("beforeunload")){
                return "网页中存在未保存的便签,正在保存中,此时离开网页正在保存的内容将丢失,确定离开吗？";
            }
        };
    }

    function recount_in_tag(reason){
        if(reason != "delete" && reason != "addnew") return false;
        var curnum = 0,$numcon = $("#search_results h2 span.num");
        if(/\((\d+)\)/.test($numcon.text())){
            curnum = parseInt($numcon.text().match(/\((\d+)\)/)[1]);
            if(isNaN(curnum)) return false;
        }

        switch(reason){
            case "delete":
            $numcon.text("("+(curnum-1)+")");
            break;
            case "addnew":
            $numcon.text("("+(curnum+1)+")");
            break;
            default: return false;
        }
    }

    function set_fetch_timer(tag_id,results_con){
        if(isNaN(tag_id)){
            return false;
        }

        results_con = results_con ? results_con : "#search_results .by-tag .tag-result.tag-"+tag_id;
        var $fetch_tag = $("#search_area .by-tag a.tag[data-id=\""+tag_id+"\"]");

        if(idl.tag_fetchint){
            clearInterval(idl.tag_fetchint);
        }
        //为此标签添加一个定时抓取的程序，当后台有便签更新或添加时，前台自动刷新
        idl.tag_fetchint = setInterval(function(){
            var last_refresh = $fetch_tag.data("last_fetch");
            //如果不存在最后索取时间或正在索取则返回
            if($(results_con).hasClass("fetching")){
                return false;
            }

            if(!!!last_refresh){
                last_refresh = get_current_time();
                $fetch_tag.data("last_fetch",get_current_time());
            }

            $(results_con).addClass("fetching");
            //if(console) console.log("fetch in tag");
            Note.prototype.fetch_in_tag(tag_id,last_refresh,function(data){
                //if(console) console.log(data);
                if(!!!data){
                    //若没有新的或修改的便签，刷新更新时间也不变
                    $(results_con).removeClass("fetching");
                    return false;
                }

                var feedback = get_json_feedback(data);

                if(feedback.status && feedback.status == "ok"){
                    var notes = feedback.new_notes ? feedback.new_notes : null;
                    //更新刷新时间
                    $fetch_tag.data("last_fetch",get_current_time());

                    if(notes){
                        //在所有记事的前面展示
                        for(var i=0,len=notes.length; i<len; i++){
                            var noteobj = notes[i];
                            if(notes[i] && notes[i].fetch_type == "0"){
                                //如果是新建的便签
                                //如果当前页面含有相同id的便签，则只对内容进行修改，如果有其他属性修改如已删除或已存档则让
                                if($(results_con + " .note-con[data-id=\""+noteobj.id+"\"]").length > 0){
                                    $(results_con + " .note-con[data-id=\""+noteobj.id+"\"] "+content_area).html(decode_content(noteobj.content)).data("value",noteobj.content);
                                }else{
                                    //否则，将便签插入到最前面
                                    //如果新建的便签为当前浏览用户创建则不显示出来
                                    if($("#blank_sheet .note-con").data("id") != noteobj.id){
                                        var note = new Note(noteobj);
                                        note.construct_item("fetched_tag_note");
                                        
                                        $(results_con).prepend(note.html);
                                        
                                        //标题旁的计数加一
                                        recount_in_tag("addnew");
                                    }
                                }
                            }else{
                                if(noteobj.id){
                                    if(noteobj.is_deleted == "1"){
                                        $(results_con + " .note-con[data-id=\""+noteobj.id+"\"]").fadeOut(function(){
                                            $(this).remove();
                                            //标题旁的计数减一
                                            recount_in_tag("delete");
                                        });
                                    }

                                    //如果更新过了的便签更新的是完成属性，
                                    if(noteobj.finished == "1"){
                                        //任务被完成
                                        $(results_con + " .note-con.task[data-id=\""+noteobj.id+"\"]").find(".checkbox").each(function(){
                                            //如果存在此条便签
                                            if(!$(this).hasClass("checked")){
                                                $(this).trigger("click");
                                            }
                                        });
                                    }else if(noteobj.finished == "0"){
                                        //任务被恢复
                                        $(results_con + " .note-con.task[data-id=\""+noteobj.id+"\"]").find(".checkbox.checked").each(function(){
                                            //如果面板中存在此条便签，则直接恢复
                                            $(this).trigger("click");
                                        });
                                    }
                                    
                                    if($(results_con + " .note-con[data-id=\""+noteobj.id+"\"]").length > 0){
                                        //如果是修改的便签，找到对应的便签再进行更新
                                        if($(results_con + " .note-con[data-id=\""+noteobj.id+"\"] "+content_area).data("value") != noteobj.content){
                                            $(results_con + " .note-con[data-id=\""+noteobj.id+"\"] "+content_area).html(decode_content(noteobj.content)).data("value",noteobj.content);
                                        }
                                    }else{
                                        //不存在此便签有两种情况
                                        //1.新建便签
                                        //2.删除的便签
                                        if(console) console.log(noteobj);

                                        if($("#blank_sheet .note-con").data("id") != noteobj.id && noteobj.is_deleted != "1"){
                                            var note = new Note(noteobj);
                                                note.construct_item("fetched_tag_note");
                                            
                                            $(results_con).prepend(note.html);
                                            //标题旁的计数加一
                                            recount_in_tag("addnew");
                                        }
                                    }
                                    
                                }
                            }
                        }

                        //给从服务器取来的便签decode_content,拉伸高度
                        $(results_con + " .fetched_tag_note").each(function(){
                            var $note = $(this).find(content_area);
                            if($note.html()){
                                $note.data("value",$note.html());
                                var content = decode_content($note.html(),true);
                                
                                $note.html(content);
                                $note.get(0).style.height = 0;
                                $note.get(0).style.height = (Math.min($note.prop("scrollHeight"),150)) + "px";
                            }
                        }).removeClass("fetched_tag_note");
                        //给含有彩色标签的便签附上颜色
                        highlight_colored_tags();
                    }
                }

                //遍历完之后去掉正在索取标识
                $("#search_results .by-tag").removeClass("fetching");
            });
        },5000);
    }

    function sort_notes(){
        //拖拽排序，同时还要判断便签是否由今日拖到了以后或者相反，若是由今日拖入了以后则需要，则去掉其任务，若是由以后拖入了今日则需要将便签的截止日期设为今日
        $("#notes_con").addClass("sorted");
        $("#search_results.results-of-tasks .note-con.task").sortable({trigger:"a.drag_trigger",itemdata:"id",sortdata:"position"},function(sortdata){
            if(!!sortdata.itemsort){
                var sortstr = sortdata.itemsort;
                console.log(sortdata.itemsort);
                var moveid = sortdata.srcdata.id;
                var srcdata = sortdata.srcdata;
                var dstdata = sortdata.dstdata;

                //如果顺序未被改变则返回
                if(srcdata.position == dstdata.position && srcdata.id == dstdata.id){
                    return false;
                }
             
                //如果顺序并没有被改变则返回
                if($("#note").data("order") && sortstr == $("#note").data("order")){
                    return false;
                }
                var note_id = sortdata.srcdata.id,
                    $moved_note = $(".note-con[data-id=\""+note_id+"\"]")
               
                //如果移动的是新建的任务
                if($moved_note.hasClass("newly_saved")){
                    //如果原来的位置是低于移动到的位置，则更改移动到的位置
                    if(srcdata.position < dstdata.position){
                        if($moved_note.next().data("position")){
                            dstdata.position = $moved_note.next().data("position");
                        }
                    }
                }

                Note.prototype.set_display_order_beta(srcdata.position,dstdata.position,function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        //重设order值
                        var note = new Note({id:note_id});
                            note.task_id = $moved_note.data("task-id");

                        //由下面移到上面
                        if(srcdata.position < dstdata.position){

                            //由下面移动到上面，如果被移动的便签在之前是“以后”列表中的任务，被移入了今日，则将便签设为今日任务
                            if(!$moved_note.hasClass("today") && $moved_note.offset().top < $("h1.later-area").offset().top){
                                note.deadline = get_formated_time(Date.now(),false);
                                console.log("move to today-area");
                                //如果已经设置了截止日期，则修改截止日期
                                note.setDeadline(false,function(data){
                                    if(console) console.log(data);
                                    var feedback = get_json_feedback(data);
                                    if(feedback.status == "ok"){
                                        var $deadline = $moved_note.find("form .deadline");
                                        if($deadline.length > 0){
                                            $deadline.find("span").text(note.deadline);
                                        }else{
                                            $moved_note.find("form").append("<div class=\"deadline\"><span>"+note.deadline+"</span></div>");
                                        }
                                        //更新计数
                                        recount_today_tasks("change_today");
                                        $moved_note.addClass("today");
                                    }else{
                                        //出错
                                    }
                                });
                            }

                            //更新position
                            change_position("up",srcdata.position,dstdata.position);
                        }else{
                            //如果由今日移入了以后，则将便签设为以后任务，去掉任务
                            if($moved_note.hasClass("today") && $moved_note.offset().top > $("h1.later-area").offset().top){
                                console.log("moved to later area");
                                note.deadline = null;

                                //去掉截止日期
                                note.setDeadline(false,function(data){
                                    if(console) console.log(data);
                                    var feedback = get_json_feedback(data);
                                    if(feedback.status == "ok"){
                                        $moved_note.find("div.deadline").remove();

                                        //更新计数
                                        recount_today_tasks("change_date");

                                        $moved_note.removeClass("today");
                                    }else{
                                        //出错
                                    }
                                });
                            }

                            //更新positon
                            change_position("down",srcdata.position,dstdata.position);
                        }

                        $("#note").data("order",sortdata.itemsort);
                    }
                });
            }
        });
    }

    /**
     * ------ 图片墙 ----
     */

     //打开图片墙
     $("#title_sec a.img-wall-btn").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        if(!$("body").hasClass("img-wall")){
            var winScrollTop = $(window).scrollTop();
            init_image_wall();
            $("#wrapper").scrollTop(winScrollTop);
        }else{
            var wrapperScrollTop = $("#wrapper").scrollTop();
            unload_image_wall();
            $(window).scrollTop(wrapperScrollTop);
        }

        //更新搜索栏宽度
        stickyWidth = $('#notes_con .inner-wrapper').width();
        $("#search_area").width(stickyWidth);
     });

     //刷新图片墙
     $("#image_wall").on("click "+downEvent,".wall-op a.refresh",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        init_image_wall();
     });


     //查看某个tag下的所有图片
    $("#image_wall").on("click "+downEvent,".img-tags .img-tag a",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var tag_id = $(this).data("id") ? $(this).data("id") : 0;
        //加载图片
        ImageItem.prototype.load_images(tag_id,paint_wall);
        $("#image_wall .img-tags .img-tag.checked").removeClass("checked");
        $(this).parent().addClass("checked");
    });

    //对图片墙上的图片数据进行排版，并加上监听事件
    // function load_wall_event(){
    //     var parent_div = $(".image-wall").get(0),
    //         cube_width = 204,
    //         gutter = 20,
    //         $container = $('#container'),
    //         ori_ww = $(parent_div).width(),
    //         con_w = ori_ww - ori_ww%(cube_width+gutter);

    //     //确定容器高度
    //     var scroll_con_height = $("#image_wall").height() - $("#image_wall .operations").height() - $("#image_wall .wall-header").height() - $("#image_wall .multi-choice").height() - 12;
    //     $("#image_wall .con-wrap").height(scroll_con_height);

    //     if($container.data("masonry")) $container.removeData("masonry");
    //     $container.width(con_w).masonry({
    //       columnWidth: cube_width,
    //       itemSelector: '.item',
    //       gutter: gutter
    //     });

    //     $('img',$container.get(0)).width(cube_width).on("load",function(){
    //         $container.masonry();
    //     });

    //     var tmp_ww,tmp_margin;
    //     $(window).on("resize.img_wall",function(event){
    //         //确定容器高度
    //         scroll_con_height = $("#image_wall").height() - $("#image_wall .operations").height() - $("#image_wall .wall-header").height() - $("#image_wall .multi-choice").height() - 12;
    //         $("#image_wall .con-wrap").height(scroll_con_height);

    //         tmp_ww = $(parent_div).width();
    //         con_w = parseInt(tmp_ww/(cube_width+gutter)) * (cube_width+gutter);
            
    //         $container.width(con_w);
    //     });

    //     //滚动加载图片
    //     $("#image_wall .item.loading img").load_img_onscroll({container:"#image_wall .con-wrap"},function(){
    //         //图片加载完成调用
    //         $(this).closest(".item").removeClass("loading");
    //      });
    // } 

    //为图片墙加上tag与图片数据
    function init_image_wall(){
        //打开图片墙
        $("body").addClass("img-wall");

        //加载图片标签
        ImageItem.prototype.get_image_tags(function(data){
            var tags = get_json_feedback(data);
            var tag = null;
            var html = "<div class=\"img-tag checked\"><a href=\"#\">ALL</a></div>";
            for(var i=0,len=tags.length; i<len; i++){
                tag = tags[i];
                html += "<div class=\"img-tag\"><a href=\"#\" data-id=\""+tag.id+"\">"+tag.tag_name+"</a></div>";
            }

            $("#image_wall .img-tags .tags-con").html(html);
        });

        //刷墙
        ImageItem.prototype.load_images(paint_wall);
    }

    //将图片数据附到dom
    function paint_wall(images_data){
        var images = get_json_feedback(images_data);
        var html = "<link rel=\"stylesheet\" href=\""+location.origin+"/layout/image_wall.css\"><link rel=\"stylesheet\" href=\""+location.origin+"/layout/lightbox.css\">";
             html += "<div id=\"container\">";
        var image = null;
        var resizedHeight;
        for(var i=0,len=images.length; i<len; i++){
            image = images[i];
            resizedHeight = (APP.imgwallItemInitWidth/image.width) * image.height;

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
                            "<a href=\""+image.url+"\" class=\"lb\" data-lightbox=\"image-1\" data-title=\"My caption\"><img src=\""+location.origin+"/layout/images/1px.gif\" width=\""+idl.apps.image.initWidth+"\" height=\""+resizedHeight+"\" data-height=\""+image.height+"\" data-width=\""+image.width+"\" data-src=\""+image.url+"\"/></a>" +
                        "</div>" +
                        "<div class=\"single-op\">" +
                            "<div class=\"checkbox\"></div>" +
                            "<div class=\"operations\">" +
                                "<a class=\"download\" href=\""+image.url+"\" target=\"_blank\" download=\""+get_filename(image.url)+"\"></a>" +
                                "<a class=\"delete\" href=\"#\"></a>" +
                                "<a class=\"share\" href=\"#\"></a>" +
                            "</div>" +
                            "<div class=\"share-component\">" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"cancel-share\"></a></div>" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"qqmail component\"></a></div>" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"weibo component\"></a></div>" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"douban component\"></a></div>" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"qzone component\"></a></div>" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"tqq component\"></a></div>" +
                                "<div class=\"share-icon\"><a href=\"#\" class=\"gmail component\"></a></div>" +
                            "</div>" +
                        "</div>" +
                    "</div>";
        }
        html += "</div>";
        //加载脚本

        var container = document.getElementById("container").contentWindow.document.body;
        if(container) container.innerHTML = html;
        var script = document.createElement("script");
        script.src = location.origin+"/scripts/jquery.min.js";
        container.appendChild(script);

        script.onload = function(){
            var script = document.createElement("script");
            script.src = location.origin+"/scripts/lightbox.min.js";
            container.appendChild(script);

            var script = document.createElement("script");
            script.src = location.origin+"/scripts/masonry.js";
            container.appendChild(script);

            var utility = document.createElement("script");
            utility.src = location.origin+"/scripts/utility.js";
            container.appendChild(utility);

            utility.onload = function(){
                var script = document.createElement("script");
                script.src = location.origin+"/scripts/image_wall.js";
                container.appendChild(script);
            };
        };

        var scroll_con_height = $("#image_wall").height() - $("#image_wall .wall-op").height() - $("#image_wall .wall-header").height() - $("#image_wall .multi-choice").height() - 12 - 10;

        var parent_div = $(".image-wall").get(0),
            cube_width = 204,
            gutter = 20,
            ori_ww = $(parent_div).width(),
            con_w = ori_ww - ori_ww%(cube_width+gutter);
        $("iframe#container").height(scroll_con_height);

        //if(!$(container).hasClass("inited")) load_wall_event();
    }

    function unload_image_wall(){
        //关闭图片墙
        $("body").removeClass("img-wall");

        //卸载事件
        $(window).off("resize.img_wall");

        //清空数据
        $("#container").html("").removeClass("inited");

        $("#image_wall .img-tags .tags-con").html(""); 
    }

    //关闭图片墙
    $("#image_wall .wall-op").on("click "+downEvent,"a",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        if($(this).hasClass("close") && $("body").hasClass("img-wall")){
            var wrapperScrollTop = $("#wrapper").scrollTop();
            unload_image_wall();
            $(window).scrollTop(wrapperScrollTop);

            //更新搜索栏宽度
            stickyWidth = $('#notes_con .inner-wrapper').width();
            $("#search_area").width(stickyWidth);
        }
    });

    //全选或不选
    $("#image_wall").on("click "+downEvent,".overall a",function(event){
       event = EventUtil.getEvent(event);
       EventUtil.preventDefault(event);
       var ifr = $("iframe#container").get(0);
       if($(this).hasClass("all-choice")){
           if(ifr) $(".item",ifr.contentWindow.document.body).addClass("checked");
       }else if($(this).hasClass("cancel")){
           if(ifr) $(".item.checked",ifr.contentWindow.document.body).removeClass("checked");
       }
    });

    $("#image_wall").on("click "+downEvent,"#bulk-del-msg a.revocation",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);
        var ifr = $("iframe#container").get(0);
        $(".item.checked.to-be-exclude",ifr.contentWindow.document.body).removeClass("to-be-exclude");
        $("#bulk-del-msg").fadeOut(function(){
            $("#image_wall").removeClass("bulk-excluding");
            $(this).removeAttr("style");
        });
    });

     //多张图片操作
    $("#image_wall").on("click "+downEvent,".footer-op a",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);
        var ifr = $("iframe#container").get(0);
        var $checked = $(".item.checked",ifr.contentWindow.document.body);

        if($(this).hasClass("share")){
            //批量分享图片墙中的图片

            //生成一个公开的网页(http://stick.eff.do/image/public?sha5)，包含所有选中的图片
            var share_ids = new Array();
            $checked.each(function(){
                share_ids.push($(this).data("id"));
            });

            var post = new Post({});
            post.type = "image";
            post.items = share_ids;
            post.publish(function(data){
                if(console) console.log(data);
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    //展示公开链接供用户点击
                    if(feedback.hash){
                        window.open(location.origin+"/image/share?"+feedback.hash);
                    }
                }else{
                    //失败
                    showMessage({type:"error",msg:"操作失败"});
                }
            });
        }else if($(this).hasClass("delete")){
            //批量隐藏图片墙中图片
            var delete_ids = new Array();
            $checked.each(function(){
                delete_ids.push($(this).data("id"));
            });

            //必须先删除之后才能再次排列
            //先降低透明度，过两秒删除之后再排序，
            $checked.addClass("to-be-exclude");
            $("#image_wall").addClass("bulk-excluding");

            //过一段时间之后才真正执行操作
            setTimeout(function(){
                var $excluded = $(".item.checked.to-be-exclude",ifr.contentWindow.document.body);

                if($excluded.length > 0){
                    ImageItem.prototype.bulk_exclude(delete_ids,function(data){
                        if(console) console.log(data);
                        var feedback = get_json_feedback(data);

                        if(feedback.status == "ok"){
                            var finished = feedback.finished;
                            if(finished && finished.length > 0){
                                //全部删除成功
                                if(finished.length == delete_ids.length){
                                    $excluded.fadeOut(function(){
                                        $(this).remove();
                                        $("#container",ifr.contentWindow.document.body).masonry();
                                    });
                                }else if(finished.length < delete_ids.length){
                                    //只被删除了一部分
                                    for(var i=0,len=finished.length; i<len; i++){
                                        $excluded.each(function(){
                                            if($(this).data("id") == finished[i]){
                                                $(this).fadeOut(function(){
                                                    $(this).remove();
                                                    $("#container",ifr.contentWindow.document.body).masonry();
                                                });
                                            }
                                        });
                                    }
                                }
                            }else{

                            }
                        }else{
                            
                        }
                        $(".item.checked.to-be-exclude",ifr.contentWindow.document.body).removeClass("to-be-exclude");
                        $("#image_wall").removeClass("bulk-excluding");
                    });
                }
            },4000);
        }else if($(this).hasClass("download")){
            //批量下载图片，对于支持a标签download属性的浏览器，则使用download属性进行下载，对于其他浏览器啊则在新页面打开所有图片
            if(ifr){
                var item,alink;
                if($("body").hasClass("attr-dl")){
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
        }
    });

    /*
    * ------ 设置 --------
    */
    $("header .menu .config").on("click",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        if(!$("body").hasClass("configuring")){
            //取出配置数据，再打开配置配置页面
            //本地有缓存就取出本地的
            $.get("/user/get_config",{type:"ajax",from:"web"},function(data){
                if(console) console.log(data);
                var feedback = get_json_feedback(data);

                //保存，在后续的更改中还需要更新
                //idl.apps.note.config = feedback;

                //feedback 所返回的数据应该为以下形式，包括
                //1.地理位置开关，2.favicon开关，3.主题编号(是默认的就无返回)，4.字体编号(是默认的就无返回)，
                //5.界面语言代码(是默认的就无返回)，6.个性短网址，7.登陆设备以及登录时间地点，8.nickname
                display_config(feedback);

                //更新搜索栏宽度
                stickyWidth = $('#notes_con .inner-wrapper').width();
                $("#search_area").width(stickyWidth);
            });

            //$("body").addClass("configuring");

        }else{
            //直接关闭页面
            $("body").removeClass("configuring");
            //更新搜索栏宽度
            stickyWidth = $('#notes_con .inner-wrapper').width();
            $("#search_area").width(stickyWidth);
        }
    });

    $("#settings h2").on("click "+downEvent,"a.back",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        $("body").removeClass("configuring");

        //更新搜索栏宽度
        stickyWidth = $('#notes_con .inner-wrapper').width();
        $("#search_area").width(stickyWidth);
    });
    
    function display_config(data){
        if(!!!data) return false;
        var nickname = data.nickname,
            lang = data.lang ? data.lang : "zh_cn",
            theme = data.theme ? data.theme : "default",
            font = data.font ? data.font : "default",
            geo_is_on = parseInt(data.geo_is_on),
            favicon_is_on = parseInt(data.favicon_is_on),
            accounts = data.accounts ? data.accounts : null,
            shorturl = data.shorturl ? data.shorturl : null;
            evernote_is_on = data.evernote ? data.evernote : null;
        
        //昵称
        $("#settings .nickname span").text(nickname);
        
        //个性短网址
        if(shorturl){
            $("#settings .fancyurl").addClass("set").find("a.url").text(shorturl).attr("href",shorturl);
        }

        //界面语言
        if(lang != "zh_cn"){
            $(".langs-con .lang.choosed").removeClass("choosed");
            var $li = $(".langs-con .lang a[data-lang=\""+lang+"\"]").parent().addClass("choosed");
            $(".langs-con").prepend($li.get(0));
        }

        //favicon 显示设置
        if(favicon_is_on){
            $(".ui .favicon").addClass("on");
        }else{
            $(".ui .favicon").removeClass("on");
        }

        //界面主题
        if(theme != "default"){
            
        }

        //字体设置
        if(font != "default"){
            $(".fonts-con .font.choosed").removeClass("choosed");
            $(".fonts-con .font a[data-font=\""+font+"\"]").parent().addClass("choosed");
        }

        //地理开关设置
        if(geo_is_on){
            $(".geo .geo-web").addClass("on");
        }else{
            $(".geo .geo-web").removeClass("on");
        }

        //同步的账户
        if(!!account && accounts.length > 0){
            for(var i=0; i<accounts.length; i++){
                var account = accounts[i];
                $(".accounts .open-app."+account).addClass("on");
            }
        }

        if(evernote_is_on == 1){
            $(".accounts .open-app.evernote").addClass("on");
        }


        $("body").addClass("configuring");
    }
    
    //显示网址图标
    $("#settings").on("click "+downEvent,".checkbox",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);
        
        var option = this.parentNode;
        if($(option).hasClass("on")){
            //当前状态为开启
            if($(option).hasClass("favicon")){
                //关闭favicon
                //隐藏图标
                $.post("/user/hide_favicon",{type:"ajax",from:"web"},function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        $(option).removeClass("on");
                        $("body").removeClass("favicon_on");
                        showMessage({type:"success",msg:"设置成功"});
                    }else{
                        if(console) console.log(data);
                        showMessage({type:"error",msg:"设置失败"});
                    }
                });
            }else if($(option).hasClass("geo-web")){
                //关闭地理定位特性
                $.post("/user/turn_off_geo",{type:"ajax",from:"web"},function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        $(option).removeClass("on");
                        $("body").removeClass("geo_on");
                        //存储到本地存储
                        var userconfig = localStorage.getItem("user_conf");
                            //更新用户配置
                            if(!!userconfig){
                                //如果存在则直接更新
                                userconfig.geo_is_on = false;
                            }else{
                                //如果不存在则创建一个
                                userconfig = {
                                    geo_is_on: false
                                };
                            }
                            localStorage.setItem("user_conf",JSON.stringify(userconfig));
                    }else{
                        if(console) console.log(data);
                        showMessage({type:"error",msg:"关闭地理定位失败"});
                    }
                });
            }
        }else{
            if($(option).hasClass("favicon")){
                //显示图标
                $.post("/user/show_favicon",{type:"ajax",from:"web"},function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        $(option).addClass("on");
                        $("body").addClass("favicon_on");
                        showMessage({type:"success",msg:"设置成功"});
                    }else{
                        if(console) console.log(data);
                        showMessage({type:"error",msg:"设置失败"});
                    }
                });
            }else if($(option).hasClass("geo-web")){
                //检查html5特性是否可用，如果是不可用则无需更新数据库
                if(navigator.geolocation){
                    navigator.geolocation.getCurrentPosition(function(position){
                        var lng = position.coords.longitude,
                            lat = position.coords.latitude,
                            pos = lng+","+lat,
                            latlng = lat+","+lng; 
                            if(console) console.log(pos);
                            //将用户地理位置保存至本地存储或添加dom data
                            //用于以后保存书签时添加地理信息
                            $("body").data("pos",pos);
                            var userconfig = localStorage.getItem("user_conf");

                            //更新用户配置
                            if(!!userconfig){
                                //如果存在则直接更新
                                userconfig.geo_is_on = true;
                            }else{
                                //如果不存在则创建一个
                                userconfig = {
                                    geo_is_on: true
                                }
                            }
                            localStorage.setItem("user_conf",JSON.stringify(userconfig));

                            //与数据库进行同步
                            $.post("/user/turn_on_geo",{type:"ajax",from:"web"},function(data){
                                if(console) console.log(data);
                                var feedback = get_json_feedback(data);
                                if(feedback.status != "ok"){
                                    if(console) console.log(data);
                                    showMessage({type:"error",msg:"开启地理定位失败"});
                                }else{
                                    $(option).addClass("on");
                                    $("body").addClass("geo_on");
                                    $.getScript("http://api.map.baidu.com/geocoder/v2/?ak=CC2dd2781a38600e9c9240b996aee39b&callback=renderReverse&location="+latlng+"&output=json&pois=0");

                                    showMessage({type:"success",msg:"开启地理定位成功"});
                                }
                            });
                    },function(PosError){
                        //PositionError {
                        //   message: "User denied Geolocation", 
                        //   code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3} 
                        switch(PosError.code){
                            //根据状态码判定操作
                            case 1: 
                                //showMessage({type:"warning",msg:"地理定位处于启用状态，如需关闭地理定位可以点击<a href=\"#\" class=\"off-geo\">此处</a>"});
                                break; //用户拒绝定位
                            case 2:
                                showMessage({type:"warning",msg:"无法获取您的位置信息"}); 
                                break; //硬件不支持或处于无网络连接状态
                            case 3: 
                                showMessage({type:"warning",msg:"网络连接超时，无法获取您的位置信息"});
                                break; //网络连接慢，获取地理位置超时
                            default: break;
                        }
                    });
                }else{
                    //不可用，则提醒用户更新浏览器，否则无法得到地理位置
                    showMessage({type:"error",msg:"配置失败，您的浏览器不支持地理定位，请下载Chrome,Firefox或Safari"});
                }//检查html5特性是否可用结束
            }
        }
    });

    //鼠标放上时打开下拉菜单
    toggleHvr(null,"#settings .sections div.langs ul,#settings .sections div.fonts ul");

    //更改昵称
    $("#settings div.nickname").on("click",".name-con span",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);
        var that = this;
        var current_name = $(this).text();
        $("#settings div.nickname").addClass("change-name").find("input").val(current_name).focus().on("blur keyup",function(event){
            //如果按下回车键
            if((event.type == "keyup" && event.keyCode == "13") || event.type == "blur"){
                if(this.value == $(that).text()){
                    $("#settings div.nickname").removeClass("change-name");
                }else{
                    var new_name = $.trim(this.value);
                    //改变昵称
                    if(/[<>()*&^%$#@!~]/.test(new_name) || /^\s{0,}$/.test(new_name)){
                        showMessage({type:"warning",msg:"昵称不能为空且不能包括特殊字符，请重新填写"});
                        return false;
                    }else{
                        var user = new User({nickname:new_name});
                        user.update(function(data){
                            if(console) console.log(data);
                            var feedback = get_json_feedback(data);
                            if(feedback.status && feedback.status == "ok"){
                                showMessage({type:"success",msg:"修改成功!"});
                                $(that).text(new_name);
                                $("#settings div.nickname").removeClass("change-name");
                                $(".menu .user-info span").text("欢迎你, "+new_name+"!");
                            }else{
                                showMessage({type:"error",msg:"修改失败!"});
                            }
                        });
                        
                    }
                }
            }
            
        });
    });

    //登录
    $(".user-info .login-btn").on("click "+downEvent,function(event){
        event.preventDefault();
        APP.toggle_authwin();
        $("#login .mail-con input").focus();
    });

    //提交登录表单
    $("#login_form").on("submit",function(event){
        event.preventDefault();
        //如果用户用户名密码都不填写直接提交则表明是要注册，将按钮变为注册，相应提示文字进行修改
        var email = this.email.value;
        var pass = this.password.value;
        var submit = this.submit;

        if($("#login .wrapper").hasClass("new-user") || $("#login .wrapper").hasClass("old-user")){
            if(email.value == "" || pass.value == ""){
                showMessage({type:"warning",msg:"字段不能为空"});
                return false;
            }

            if(!email_field_regexp.test(email)){
                showMessage({type:"warning",msg:"邮箱格式不正确"});
                return false;
            }
        }

        //登录或者注册成功之后，将本地的数据导入到服务器
        if($("#login .wrapper").hasClass("new-user")){
            //新用户注册
            //检查协议是否勾选
            if($("#login .wrapper .content-area").hasClass("unchecked")){
                showMessage({type:"warning",msg:"必须勾选用户协议才能注册"});
                return false;
            }
            
            //检测密码长度
            $("#login").addClass("sending");
            $("#login_form input").blur();
            
            $.post("/user/create",{type:"adduser",email:email,pass:pass},function(data){
                $("#login").removeClass("sending");
                if(console) console.log(data);
                var feedback = get_json_feedback(data);
                if(feedback.status != "ok"){
                    showMessage({type:"error",msg:feedback.msg});
                }else{
                    $("#login").addClass("success");
                    window.location.href = "/";
                }
            });
        }else if($("#login .wrapper").hasClass("old-user")){
            //老用户登录
            $("#login").addClass("sending");
            $("#login_form input").blur();
            $.post("/user/loginauth",{email:email,pass:pass,type:"login"},function(data){
                $("#login").removeClass("sending");
                console.log(data);
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    window.location.href = "/";
                }else{
                    $("#login").addClass("success");
                    showMessage({type:"error",msg:"邮箱与密码不匹配，登录失败"});
                }
            });
        }else{
            //如果邮箱密码输入为空
            if(email == "" || pass == ""){
                //进入注册页面
                submit.value = "注册";
                $("#login .wrapper").addClass("new-user");
            }else if(email != "" && pass != ""){
                //没检测完邮箱是否已注册就点击了提交按钮，则作为登录提交
                $("#login .wrapper").addClass("old-user");
                $("#login_form").submit();
            }
        }
    });

    $("#login_form .mail-con input").on("keyup",function(event){
        if(email_field_regexp.test(this.value)){
            $("#login .wrapper").removeClass("wrong-account").addClass("right-account");
        }else{
            $("#login .wrapper").removeClass("right-account").addClass("wrong-account");
        }
    });

    //输入邮箱地址区域，失焦的话，检查邮箱是否可用
    $("#login_form .mail-con input").on("blur",function(event){
        if($(this).hasClass("checking")) return false;
        var input = this;
        if(email_field_regexp.test(this.value)){
            $(this).addClass("checking");
            $("#login .wrapper").removeClass("wrong-account").addClass("right-account");
            User.prototype.check_registered(this.value,function(data){
                console.log(data);
                $(input).removeClass("checking");
                var feedback = get_json_feedback(data);

                if(feedback.available){
                    //此邮箱未被注册过
                    $("#login .wrapper").addClass("new-user").removeClass("old-user");
                    $("#login_form #submit_btn").val("注册");
                }else{
                    //此邮箱已经被注册过
                    $("#login .wrapper").addClass("old-user").removeClass("new-user");
                    $("#login_form #submit_btn").val("登录");
                }
            });
        }else{
            $("#login .wrapper").removeClass("right-account").addClass("wrong-account");
        }
    });

    //用户勾选同意协议
    $("#login .agreement a .checkbox").on("click",function(){
        $("#login .wrapper .content-area").toggleClass("unchecked");
    });

    //返回注册
    $("#login .back-login a").on("click "+downEvent,function(event){
        event.preventDefault();
        $("#login .wrapper").removeClass("new-user").addClass("old-user").find("#submit_btn").val("登录");
    });

    //返回登录
    $("#login .back-register").on("click "+downEvent,function(event){
        event.preventDefault();
        $("#login .wrapper").removeClass("old-user").addClass("new-user").find("#submit_btn").val("注册");
    });

    $("#login .other-account .login-icon").on("click "+downEvent,function(event){
        event.preventDefault();
        var login_win = null;
        var third_party = "";
        var newwin_height = 500,
            newwin_width = 800,
            newwin_top = (window.screen.height - newwin_height) / 2,
            newwin_left = (window.screen.width - newwin_width) / 2;
        //打开授权页
        //后台请求第三方服务器授权地址
        //登陆成功
        //如果是第一次授权登录，则保存用户对应数据如第三方账号id,username,screen_name,语言，创建用户，创建session，创建对应用户，直接进入，刷新当前网页
        //如果之前使用此账号登录过
        if($(this).hasClass("facebook")){
            //使用Facebook账号登陆
            third_party = "facebook";
        }else if($(this).hasClass("twitter")){
            //使用Twitter登录
            third_party = "twitter";
        }else if($(this).hasClass("weibo")){
            //使用微博账号登录
            third_party = "weibo";
        }else if($(this).hasClass("weixin")){
            //使用微博账号登录
            third_party = "weibo";
        }else if($(this).hasClass("yinxiang")){
            //使用印象笔记账号登录
            third_party = "yinxiang";
        }else if($(this).hasClass("evernote")){
            //使用evernote账号登录
            third_party = "evernote";
        }else if($(this).hasClass("qq")){
            //使用qq账号登录
            third_party = "qq";
        }else if($(this).hasClass("google")){
            //使用Google账号的登录
            third_party = "google";
        }else if($(this).hasClass("douban")){
            third_party = "douban";
        }

        if(third_party != ""){
            login_win = window.open("/loginManager/"+third_party+"?__sharesource=okmemo",'Facebook 授权登录','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
            if(login_win.onbeforeunload){
                //login_win.onbeforeunload = window.location.reload;
                //窗口关闭之后检查登录是否成功
                //登录成功之后刷新页面

            }else{
                //不支持beforeunload事件的浏览器，如ie，设定刷新器
                //检查窗口是否被关闭
                var check_sync_int = setInterval(function(){
                    if(newwin.closed){
                        clearInterval(check_sync_int);
                        //窗口关闭之后检查登录是否成功
                        //登录成功之后刷新页面

                    }
                },500);
            }
        }
    });

    //更新密码
    $("#settings .user").on("click","#reset_pwd",function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        $("#settings div.password").addClass("reset-pwd").find("#reset_pw_btn").on("click",function(event){
            event = EventUtil.getEvent(event);
            EventUtil.preventDefault(event);

            $("div.password form input[type=\"password\"]").each(function(){
                if(!(/[0-9a-z.]{4,}/i.test(this.value))){
                    showMessage({type:"warning",msg:"密码长度至少为4位且必须由数字、字母或.组成"});
                    return false;
                }
            });

            var current_pwd = $("#cur_pwd").val(),
                new_pwd = $("#new_pwd").val(),
                re_new_pwd = $("#re_new_pwd").val();

            if(new_pwd !== re_new_pwd){
                showMessage({type:"error",msg:"两次输入的新密码不一致，请重新输入"});
            }else{
                if(new_pwd == current_pwd){
                    showMessage({type:"success",msg:"修改成功"});

                    //隐藏表单
                    $("#settings div.password").removeClass("reset-pwd");

                    //清空密码域
                    $("div.password form input[type=\"password\"]").val("");
                    return false;
                }
                var user = new User({old_password:current_pwd,password:new_pwd});
                user.update(function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data);
                    if(feedback.status && feedback.status == "ok"){
                        showMessage({type:"success",msg:"修改成功"});

                        //隐藏表单
                        $("#settings div.password").removeClass("reset-pwd");

                        //清空密码域
                        $("div.password form input[type=\"password\"]").val("");
                    }else{
                        showMessage({type:"error",msg:"修改失败!"});
                    }
                });
            }
        }).end().find(".cancel").on("click",function(event){
            event = EventUtil.getEvent(event);
            EventUtil.preventDefault(event);

            //隐藏表单
            $("#settings div.password").removeClass("reset-pwd")
            //清空密码域
            $("div.password form input[type=\"password\"]").val("");
        });
    });

    //设置主题色彩
    $(".theme").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var that = this;
        if(!$(this).hasClass("choosed")){
            
            var theme_no = "";

            $.post("/user/switch_theme",{type:"ajax",from:"web",theme_no:theme_no},function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    $(".theme.choosed").removeClass("choosed");
                    $(that).addClass("choosed");
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            })
        }
    });

    //设置字体
    $(".font").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var that = this;
        if(!$(this).hasClass("choosed")){
            
            var font_no = "";

            $.post("/user/switch_font",{type:"ajax",from:"web",font_no:font_no},function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    $(".font.choosed").removeClass("choosed");
                    $(that).addClass("choosed");
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            })
        }
    });

    //设置界面语言
    $(".lang a").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var that = this;
        var option = this.parentNode;
        if(!$(that).hasClass("choosed")){
            var lang = $(this).data("lang");

            $.post("/user/switch_lang",{type:"ajax",from:"web",lang:lang},function(data){
                if(console) console.log(data);
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    var ori_lang = $(".lang.choosed a").data("lang");
                    var new_lang = $("a",option).data("lang");
                    $(".lang.choosed").removeClass("choosed");
                    $(option).addClass("choosed");
                    $("body").removeClass(ori_lang).addClass(new_lang);
                    $("ul.langs-con").removeClass("hvr").prepend(option);
                    showMessage({type:"success",msg:"设置成功"});
                    window.location.reload();
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            });
        }
    });

    //设置分享组件个数和顺序
    //添加或去除分享组件
    $(".share-compo").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var that = this,
            share_compo_no = "";
        if($(this).hasClass("choosed")){
            //去除当前分享组件
            $.post("/user/del_share_component",{type:"ajax",from:"web",share_compo_no:share_compo_no},function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    $(that).removeClass("choosed");
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            });
        }else{
            //添加当前分享组件
            $.post("/user/add_share_component",{type:"ajax",from:"web",share_compo_no:share_compo_no},function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    $(that).addClass("choosed");
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            });
        }
    });

    //分享组件排序

    //设置同步账号，设置时需要认证授权
    $("#settings section.accounts .checkbox").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var that = this;
        var newwin_height = 500,
            newwin_width = 800,
            newwin_top = (window.screen.height - newwin_height) / 2,
            newwin_left = (window.screen.width - newwin_width) / 2;
        
        if(!$(this).parent().hasClass("on")){
            if($(this).parent().hasClass("evernote")){
                var newwin = window.open('/user/auth_evernote','同步设置','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
                
                //检查窗口是否被关闭
                var check_sync_int = setInterval(function(){
                    if(newwin.closed){
                        clearInterval(check_sync_int);
                        
                        //窗口关闭之后检查同步是否成功
                        var user = new User({});
                        user.check_granted("evernote",function(data){
                            if(console) console.log(data);
                            var feedback = get_json_feedback(data);
                            if(feedback.status == "ok"){
                                showMessage({type:"success",msg:"授权成功!"});
                                _evgranted = true;
                                $(that).parent().addClass("on");
                            }else{
                                _evgranted = false;
                                showMessage({type:"error",msg:"授权失败!"});
                            }
                        });   
                    }
                },500);
            }
        }else{
            //取消同步
            if($(this).parent().hasClass("evernote")){
                var user = new User({});
                user.cancel_granted("evernote",function(data){
                    if(console) console.log(data);
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        showMessage({type:"success",msg:"你已经取消与Evernote账号同步，下次若需同步需要\"重新授权\""});
                        $(that).parent().removeClass("on");
                        _evgranted = false;
                    }else{
                        showMessage({type:"error",msg:"操作失败!"});
                    }
                });
            }
        }
    });

    //设置客户端认证
    $(".device .checkbox").on("click "+downEvent,function(event){
        event = EventUtil.getEvent(event);
        EventUtil.preventDefault(event);

        var that = this,
            device_name = "";

        if($(this).hasClass("checked")){
            //reauth
            $.post("/user/reauth_device",{type:"ajax",from:"web",device_name:device_name},function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    $(that).removeClass("checked");
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            });
        }else{
            $.post("/user/auth_device",{type:"ajax",from:"web",device_name:device_name},function(data){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    $(that).removeClass("checked");
                }else{
                    if(console) console.log(data);
                    showMessage({type:"error",msg:"设置失败"});
                }
            });
        }
    });

});
