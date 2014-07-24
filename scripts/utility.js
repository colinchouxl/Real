var all_saved_con = ".all",
	content_area = ".note.editable",
	//with "g" modifier
	//顶级域名中出现[\d]+ 是为了匹配ip地址，但这样的话类似2.5之类的小数也被匹配上了，所以暂时先去掉
	//link_regexp = /((http\:\/\/|https\:\/\/|ftp\:\/\/)?([a-z0-9\-]+\.){0,5}[a-z0-9\-]+\.(?:[\d]+|com|cn|hr|io|org|do|fr|jp|tv|name|mobi|pro|us|fm|asia|net|gov|tel|la|travel|so|biz|info|hk|me|co|in|at|bz|ag|eu|in)\b(?:\:[\d+])?[^\s\,\"\'\[\]\{\}\<]{0,})/ig,
	link_regexp = /((http\:\/\/|https\:\/\/|ftp\:\/\/)?([a-z0-9\-]+\.){0,5}[a-z0-9\-]+\.(?:com|cn|hr|io|org|do|fr|jp|tv|name|mobi|pro|us|fm|asia|net|gov|tel|la|travel|so|biz|info|hk|me|co|in|at|bz|ag|eu|in|cc|ly)\b(?:\:[\d+])?[^\s\"\'\[\]\{\}\<]{0,})/ig,
	ip_link_regexp = /((http\:\/\/|https\:\/\/|ftp\:\/\/)?[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\b(?:\:[\d+])?[^\s\"\'\[\]\{\}\<]{0,})/ig,
	email_regexp = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}\b/i,
	email_field_regexp = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i,
	///^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	phonenum_regexp = /\(?\+?[\(\)\-\s\d]{6,20}/;

(function (window) {
    {
        var unknown = '-';

        // screen
        var screenSize = '';
        if (screen.width) {
            width = (screen.width) ? screen.width : '';
            height = (screen.height) ? screen.height : '';
            screenSize += '' + width + " x " + height;
        }

        //browser
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browser = navigator.appName;
        var version = '' + parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion, 10);
        var nameOffset, verOffset, ix;

        // Opera
        if ((verOffset = nAgt.indexOf('Opera')) != -1) {
            browser = 'Opera';
            version = nAgt.substring(verOffset + 6);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // MSIE
        else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(verOffset + 5);
        }
        // Chrome
        else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
            browser = 'Chrome';
            version = nAgt.substring(verOffset + 7);
        }
        // Safari
        else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
            browser = 'Safari';
            version = nAgt.substring(verOffset + 7);
            if ((verOffset = nAgt.indexOf('Version')) != -1) {
                version = nAgt.substring(verOffset + 8);
            }
        }
        // Firefox
        else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
            browser = 'Firefox';
            version = nAgt.substring(verOffset + 8);
        }
        // MSIE 11+
        else if (nAgt.indexOf('Trident/') != -1) {
            browser = 'Microsoft Internet Explorer';
            version = nAgt.substring(nAgt.indexOf('rv:') + 3);
        }
        // Other browsers
        else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
            browser = nAgt.substring(nameOffset, verOffset);
            version = nAgt.substring(verOffset + 1);
            if (browser.toLowerCase() == browser.toUpperCase()) {
                browser = navigator.appName;
            }
        }
        // trim the version string
        if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
        if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);

        majorVersion = parseInt('' + version, 10);
        if (isNaN(majorVersion)) {
            version = '' + parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion, 10);
        }

        // mobile version
        var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

        // cookie
        var cookieEnabled = (navigator.cookieEnabled) ? true : false;

        if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
            document.cookie = 'testcookie';
            cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
        }

        // system
        var os = unknown;
        var clientStrings = [
            {s:'Windows 3.11', r:/Win16/},
            {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
            {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
            {s:'Windows 98', r:/(Windows 98|Win98)/},
            {s:'Windows CE', r:/Windows CE/},
            {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
            {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
            {s:'Windows Server 2003', r:/Windows NT 5.2/},
            {s:'Windows Vista', r:/Windows NT 6.0/},
            {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
            {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
            {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
            {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
            {s:'Windows ME', r:/Windows ME/},
            {s:'Android', r:/Android/},
            {s:'Open BSD', r:/OpenBSD/},
            {s:'Sun OS', r:/SunOS/},
            {s:'Linux', r:/(Linux|X11)/},
            {s:'iOS', r:/(iPhone|iPad|iPod)/},
            {s:'Mac OS X', r:/Mac OS X/},
            {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
            {s:'QNX', r:/QNX/},
            {s:'UNIX', r:/UNIX/},
            {s:'BeOS', r:/BeOS/},
            {s:'OS/2', r:/OS\/2/},
            {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
        ];
        for (var id in clientStrings) {
            var cs = clientStrings[id];
            if (cs.r.test(nAgt)) {
                os = cs.s;
                break;
            }
        }

        var osVersion = unknown;

        if (/Windows/.test(os)) {
            osVersion = /Windows (.*)/.exec(os)[1];
            os = 'Windows';
        }

        switch (os) {
            case 'Mac OS X':
                osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'Android':
                osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
                break;

            case 'iOS':
                osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
                osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
                break;
        }
        
        // flash (you'll need to include swfobject)
        /* script src="//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" */
        var flashVersion = 'no check';
        if (typeof swfobject != 'undefined') {
            var fv = swfobject.getFlashPlayerVersion();
            if (fv.major > 0) {
                flashVersion = fv.major + '.' + fv.minor + ' r' + fv.release;
            }
            else  {
                flashVersion = unknown;
            }
        }
    }

    window._ENV = {
        screen: screenSize,
        browser: browser,
        browserVersion: version,
        mobile: mobile,
        os: os,
        osVersion: osVersion,
        cookies: cookieEnabled,
        flashVersion: flashVersion
    };
}(this));

//检测内容中是否含有地址
function containsAddress(content){
	//中文：检测字符串中"省"，"市"，"区"，"县"，"镇"，"乡"，"路"，"街"，"号"，"巷"等出现的索引,各个索引之间距离不超过一定字符数
	if(/([\W]{0,5}省)?\s{0,2}([\W]{0,5}市)?\s{0,2}[\W\d]+(区|路|镇|巷|乡|县|号|街|院|校|门)/.test(content) || /地址(\:|\：|\s)/i.test(content)){
		return true;
	}

	if(/([\s\w\,\.]{0,35}provice)?\s{0,2}([\s\w\,\.]{0,35}state)?\s{0,2}[\w\d\.]+(district|road|town|county|street)/.test(content) || /address(\:|\：|\s)/i.test(content)){
		return true;
	}
}

function is_contact(val){
    val = val.toString();
    //var reglution = /\d+/;
    //check_trans = check_id.match(reglution);
    if(check_adress(val) == 4){
        return 4;
    }else if (check_idcard(val) == 2){
        return 2;
    }else if(check_bank(val) == 1){
        return 1;
    }else if(check_phone(val) == 3){
        return 3;
    }
}

function check_bank(bank){
    var constr_bank = new Array();
        constr_bank[0] = /621700\d{13}/;
        constr_bank[1] = /436742/;
        constr_bank[2] = /436745/;
        constr_bank[3] = /622280[\d]{10}/;
        constr_bank[4] = /524094[\d]{10}/;
        constr_bank[5] = /421349[\d]{10}/;
        constr_bank[6] = /434061[\d]{10}/;
        constr_bank[7] = /434062[\d]{10}/;
        constr_bank[8] = /436718[\d]{10}/;
        constr_bank[9] = /436728[\d]{10}/;
        constr_bank[10] = /436738[\d]{10}/;
        constr_bank[11] = /436742[\d]{13}/;
        constr_bank[12] = /436745[\d]{10}/;
        constr_bank[13] = /436748[\d]{10}/;
        constr_bank[14] = /453242[\d]{10}/;
        constr_bank[15] = /489592[\d]{10}/;
        constr_bank[16] = /491031[\d]{10}/;
        constr_bank[17] = /524094[\d]{10}/;
        constr_bank[18] = /526410[\d]{10}/;
        constr_bank[19] = /532420[\d]{10}/;
        constr_bank[20] = /532430[\d]{10}/;
        constr_bank[21] = /532450[\d]{10}/;
        constr_bank[22] = /532458[\d]{10}/;
        constr_bank[23] = /544033[\d]{10}/;
        constr_bank[24] = /552245[\d]{10}/;
        constr_bank[25] = /552801[\d]{10}/;
        constr_bank[26] = /553242[\d]{10}/;
        constr_bank[27] = /558895[\d]{10}/;
        constr_bank[28] = /622166[\d]{10}/;
        constr_bank[29] = /622168[\d]{10}/;
        constr_bank[30] = /622280[\d]{10}/;
        constr_bank[31] = /622700[\d]{10}/;
        constr_bank[32] = /622728[\d]{10}/;
        constr_bank[33] = /622725[\d]{10}/;
        constr_bank[34] = /628266[\d]{10}/;
        constr_bank[35] = /628366[\d]{10}/;
        //constr_bank[36] = /[\d]{15,19}/;
        //constr_bank[37] = //;
    var conmme_bank = new Array();
        conmme_bank[0] = /427020/;
        conmme_bank[1] = /427030/;
        conmme_bank[2] = /530990/;
        conmme_bank[3] = /622230/;
        conmme_bank[4] = /622235/;
        conmme_bank[5] = /622210/;
        conmme_bank[6] = /622215/;
        conmme_bank[7] = /622200/;
        conmme_bank[8] = /955880/;
        conmme_bank[9] = /1020000/;
        conmme_bank[10] = /370246[\d]{9}/;
        conmme_bank[11] = /370247[\d]{9}/;
        conmme_bank[12] = /370248[\d]{9}/;
        conmme_bank[13] = /370249[\d]{9}/;
        conmme_bank[14] = /489736[\d]{9}/;
        conmme_bank[15] = /489735[\d]{9}/;
        conmme_bank[16] = /489734[\d]{9}/;
        conmme_bank[17] = /438125[\d]{10}/;
        conmme_bank[18] = /438126[\d]{10}/;
        conmme_bank[19] = /451804[\d]{10}/;
        conmme_bank[20] = /451810[\d]{10}/;
        conmme_bank[21] = /458060[\d]{10}/;
        conmme_bank[22] = /458071[\d]{10}/;
        conmme_bank[23] = /489734[\d]{10}/;
        conmme_bank[24] = /489735[\d]{10}/;
        conmme_bank[25] = /489736[\d]{10}/;
        conmme_bank[26] = /510529[\d]{10}/;
        conmme_bank[27] = /402791[\d]{10}/;
        conmme_bank[28] = /427010[\d]{10}/;
        conmme_bank[29] = /427018[\d]{10}/;
        conmme_bank[30] = /427019[\d]{10}/;
        conmme_bank[31] = /427020[\d]{10}/;
        conmme_bank[32] = /427028[\d]{10}/;
        conmme_bank[33] = /427038[\d]{10}/;
        conmme_bank[34] = /427029[\d]{10}/;
        conmme_bank[35] = /427039[\d]{10}/;
        conmme_bank[36] = /427062[\d]{10}/;
        conmme_bank[37] = /427064[\d]{10}/;
        //conmme_bank[38] = /[\d]{15,19}/;
        /*conmme_bank[39] = /[\d]{10}/;
        conmme_bank[40] = /[\d]{10}/;
        conmme_bank[41] = /[\d]{10}/;
        conmme_bank[42] = /[\d]{10}/;
        conmme_bank[43] = /[\d]{10}/;
        conmme_bank[44] = //;
        conmme_bank[] = //;
        conmme_bank[] = //;
        conmme_bank[] = //;
        conmme_bank[] = //;
        conmme_bank[] = //;
        conmme_bank[] = //;
        conmme_bank[] = //;*/
    var agricu_bank = new Array();
        agricu_bank[0] = /103000[\d]{13}/;
        agricu_bank[1] = /403361[\d]{10}/;
        agricu_bank[2] = /404117[\d]{10}/;
        agricu_bank[3] = /491020[\d]{10}/;
        agricu_bank[4] = /519412[\d]{10}/;
        agricu_bank[5] = /520082[\d]{10}/;
        agricu_bank[6] = /535910[\d]{10}/;
        agricu_bank[7] = /535918[\d]{10}/;
        agricu_bank[8] = /552599[\d]{10}/;
        agricu_bank[9] = /558730[\d]{10}/;
        agricu_bank[10] = /622821[\d]{13}/;
        agricu_bank[11] = /622822[\d]{13}/;
        agricu_bank[12] = /622823[\d]{13}/;
        agricu_bank[13] = /622824[\d]{13}/;
        agricu_bank[14] = /622825[\d]{13}/;
        agricu_bank[15] = /622836[\d]{10}/;
        agricu_bank[16] = /622837[\d]{10}/;
        agricu_bank[17] = /622840[\d]{13}/;
        agricu_bank[18] = /622844[\d]{13}/;
        agricu_bank[19] = /622845[\d]{13}/;
        agricu_bank[20] = /622846[\d]{13}/;
        agricu_bank[21] = /622847[\d]{13}/;
        agricu_bank[22] = /622848[\d]{13}/;
        //agricu_bank[23] = /\d{15,19}/;
        /*agricu_bank[] = //;
        agricu_bank[] = //;
        agricu_bank[] = //;*/
    var china_bank = new Array();
        china_bank[0] = /356833[\d]{10}/;
        china_bank[1] = /356835[\d]{10}/;
        china_bank[2] = /400937[\d]{10}/;
        china_bank[3] = /400938[\d]{10}/;
        china_bank[4] = /400939[\d]{10}/;
        china_bank[5] = /400940[\d]{10}/;
        china_bank[6] = /400941[\d]{10}/;
        china_bank[7] = /400942[\d]{10}/;
        china_bank[8] = /409665[\d]{10}/;
        china_bank[9] = /409666[\d]{10}/;
        china_bank[10] = /409667[\d]{10}/;
        china_bank[11] = /409668[\d]{10}/;
        china_bank[12] = /409669[\d]{10}/;
        china_bank[13] = /409670[\d]{10}/;
        china_bank[14] = /409671[\d]{10}/;
        china_bank[15] = /424106[\d]{10}/;
        china_bank[16] = /424107[\d]{10}/;
        china_bank[17] = /424108[\d]{10}/;
        china_bank[18] = /424109[\d]{10}/;
        china_bank[19] = /424110[\d]{10}/;
        china_bank[20] = /424111[\d]{10}/;
        china_bank[21] = /438088[\d]{10}/;
        china_bank[22] = /451291[\d]{10}/;
        china_bank[23] = /456351[\d]{10}/;
        china_bank[24] = /493878[\d]{10}/;
        china_bank[25] = /512315[\d]{10}/;
        china_bank[26] = /512316[\d]{10}/;
        china_bank[27] = /512411[\d]{10}/;
        china_bank[28] = /512412[\d]{10}/;
        china_bank[29] = /512695[\d]{10}/;
        china_bank[30] = /512732[\d]{10}/;
        china_bank[31] = /514957[\d]{10}/;
        china_bank[32] = /514958[\d]{10}/;
        china_bank[33] = /518378[\d]{10}/;
        china_bank[34] = /518379[\d]{10}/;
        china_bank[35] = /518474[\d]{10}/;
        china_bank[36] = /518475[\d]{10}/;
        china_bank[37] = /518476[\d]{10}/;
        china_bank[38] = /522153[\d]{10}/;
        china_bank[39] = /524864[\d]{10}/;
        china_bank[40] = /524865[\d]{10}/;
        china_bank[41] = /525745[\d]{10}/;
        china_bank[42] = /525746[\d]{10}/;
        china_bank[43] = /540297[\d]{10}/;
        china_bank[44] = /540838[\d]{10}/;
        china_bank[45] = /541068[\d]{10}/;
        china_bank[46] = /547628[\d]{10}/;
        china_bank[47] = /547648[\d]{10}/;
        china_bank[48] = /547766[\d]{10}/;
        china_bank[49] = /552742[\d]{10}/;
        china_bank[50] = /553131[\d]{10}/;
        china_bank[51] = /558808[\d]{10}/;
        china_bank[52] = /558809[\d]{10}/;
        china_bank[53] = /558868[\d]{10}/;
        china_bank[54] = /601382[\d]{10}/;
        china_bank[55] = /622346[\d]{10}/;
        china_bank[56] = /622347[\d]{10}/;
        china_bank[57] = /622348[\d]{10}/;
        china_bank[58] = /622750[\d]{10}/;
        china_bank[59] = /622751[\d]{10}/;
        china_bank[60] = /622752[\d]{10}/;
        china_bank[61] = /622753[\d]{10}/;
        china_bank[62] = /622754[\d]{10}/;
        china_bank[63] = /622755[\d]{10}/;
        china_bank[64] = /622756[\d]{10}/;
        china_bank[65] = /622757[\d]{10}/;
        china_bank[66] = /622758[\d]{10}/;
        china_bank[67] = /622759[\d]{10}/;
        china_bank[68] = /622760[\d]{10}/;
        china_bank[69] = /622761[\d]{10}/;
        china_bank[70] = /622762[\d]{10}/;
        china_bank[71] = /622763[\d]{10}/;
        china_bank[72] = /622770[\d]{13}/;
        //china_bank[73] = /[\d]{16,19}/;
        /*china_bank[] = /[\d]{10}/;
        china_bank[] = /[\d]{10}/;*/
    for(var i = 0; i < constr_bank.length; i++){
        var flag = constr_bank[i].test(bank);
        if(flag){
            return 1;   //表示银行
        }
    }
    for(var i = 0; i<conmme_bank.length; i++){
        var flag = conmme_bank[i].test(bank);
        if(flag){
            return 1;   //表示银行
        }
    }

    for(var i = 0; i<agricu_bank.length; i++){
        var flag = agricu_bank[i].test(bank);
        if(flag){
            return 1;   //表示银行
        }
    }

    for(var i = 0; i<china_bank.length; i++){
        var flag = china_bank[i].test(bank);
        if(flag){
            return 1;   //表示银行
        }
    }

    for(var i = 0; i<china_bank.length; i++){
        var flag = china_bank[i].test(bank);
        if(flag){
            return 1;   //表示银行
        }
    }
    
}

function check_idcard(id_numb){
    var identity = /(\W|\b)\d{17,17}(\d|x)(\W|\b)/;
    var sobj = id_numb.match(identity);
    var nowtime = new Date();
    var nowyear = nowtime.getFullYear();
    if(sobj == null) return false;
    for(var i = 0; i<sobj[i].length; i++){
        if(sobj[i].length == 18){
            var first_char = sobj[i].charAt(0);
            if(first_char == '9'){
                return false;
            }else{
                var year = sobj[i].substr(6,4);
                var month = sobj[i].substr(10,2);
                var date = sobj[i].substr(12,2);
                if((year>=nowyear-150&&year<=nowyear)&&(month<=12)&&(date<=31)){
                    //return '身份证';
                    return 2;   //表示身份证
                }else{
                    //跳出函数或执行其他函数
                }
            }
        }
    }
}

function check_phone(phone_number){
    var reg = new Array();
        reg[0] = /(\W|\b)(1)[\d]{10}(\W|\b)/;
        reg[1] = /(\W|\b)[\d]{4}(-|)\d{8}(\W|\b)/;
        reg[2] = /(\W|\b)[\d]{3,6}-\d{5,15}(\W|\b)/;

        for(var i in reg){
            var sobj = reg[i].test(phone_number);

            var num_length = phone_number.match(reg[i]);
            if (sobj&&num_length.length<=15) {
                return 3;   //表示电话号码
            }
        }
}

function selectText(container) {
    if(!container) return false;
    if (document.selection) {
        document.selection.clear();
        var range = document.body.createTextRange();
        range.moveToElementText(container);
        range.select();
    } else if (window.getSelection) {
        var range = document.createRange();
        
        if(container){
            window.getSelection().removeAllRanges();
            range.selectNode(container);
            if(range){
                window.getSelection().addRange(range);
                window.getSelection().toString();
            } 
        }
    }
}


function check_adress(adress){
    var reg = new Array();
        reg[0] = /市/;
        reg[1] = /区/;
        reg[2] = /路/;
        reg[3] = /省/;
        reg[4] = /号/;
        reg[5] = /镇/;
        reg[6] = /乡/;
        reg[7] = /村/;
        reg[8] = /州/;
        reg[9] = /县/;
        reg[10] = /村/;
    var reg_count = 0;
    for (var i in reg){
        var flag = reg[i].test(adress);
        if(flag){
            reg_count++;
        }
    }
    if(reg_count >= 4){
        return 4;   //表示地址
    }
}

function delink(){
    var w = window,d=document;
    if(w.getSelection){
        var sel = w.getSelection();
        //如果并没有选中文字，则判断光标所处位置是否存在链接，存在的话则去掉对应链接(还要判断是否文字是url)
        if(sel.isCollapsed || sel.type == "Caret"){
            //找到最外层节点
            var wrapperNode = sel.anchorNode.parentNode;
            if(wrapperNode.nodeName == "A"){
                wrapperNode.outerHTML = wrapperNode.innerText || wrapperNode.textContent;

            }else{
                //从最外层节点中找到所有链接
                var as = wrapperNode.querySelectorAll("a");

                if(as && as.length > 0){
                    for(var i=0,len=as.length; i<len; i++){
                        var a = as[i];
                        a.outerHTML = a.innerText || a.textContent;
                    }
                }
            }
        }else if(!sel.isCollapsed || sel.type == "Range"){
            //将选取的内容中的a标签全部清除，
            var startNode = sel.anchorNode.parentNode;
            var endNode = sel.focusNode.parentNode;
            
            //选中了一个A标签中的某些内容，清除此链接即可
            if(startNode == endNode && startNode.nodeName == "A"){
                startNode.outerHTML = startNode.innerText || startNode.textContent;
            }else{
                //去掉开头处的链接，如果存在的话
                if(startNode && startNode.nodeName == "A"){
                    startNode.outerHTML = startNode.innerText || startNode.textContent;
                }

                //去掉结尾处的链接
                if(endNode && endNode.nodeName == "A"){
                    endNode.outerHTML = endNode.innerText || endNode.textContent;
                }

                var ran = sel.getRangeAt(0);
                var frag = ran.cloneContents();
                
                var as = frag.querySelectorAll("a");

                if(as && as.length > 0){
                    //documentFragment不能使用outerHTML属性设置
                    for(var i=0,len=as.length; i<len; i++){
                        var a = as[i];
                        var text = a.innerText || a.textContent;
                        a.parentNode.insertBefore(document.createTextNode(text),a);
                        a.remove();
                    }
                }

                ran.deleteContents();
                ran.insertNode(frag);
            }
        }
    }else if(d.selection){
        var ran = d.selection.createTextRange();
        if(ran.boundingWidth == 0 || ran.htmlText == ""){
            var ancestor = ran.parentElement();
            var as = ancestor.getElementsByTag("a");
            if(as && as.length > 0){
                //documentFragment不能使用outerHTML属性设置
                for(var i=0,len=as.length; i<len; i++){
                    var a = as[i];
                    var text = a.innerText || a.textContent;
                    a.parentNode.insertBefore(document.createTextNode(text),a);
                    a.remove();
                }
            }
        }else{
            var html = ran.htmlText;
            //替换所有链接为文字
            html = html.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(\<\/a\>)?/ig,"$2");
            ran.pasteHTML(html);
        }
    }
}

function get_link_in_url(url){
    if(url.indexOf("#") != -1){
        var hash = url.substr(url.indexOf("#")+1);

        if(hash == "" || (!hash.match(link_regexp) && !hash.match(ip_link_regexp)) || hash.length > 2048){
            return false;
        }else{
            if(hash.indexOf('http') < 0){
                hash = "http://"+hash;
            }
            return hash;
        }
    }
}

//根据搜索区域标签容器大小来给所有标签进行分页
function relocate_tags(tag_container,tag_selector){
	tag_selector = tag_selector ? tag_selector : ".tag-con";
	var $tags = $(tag_selector,tag_container);
	var container_offset = $(tag_container).offset();
	var row_height = $tags.height();

	//遍历所有标签，每三排包含在一个子容器中
	$tags.each(function(){
		if($(this).offset().top > (2 * row_height + container_offset.top) && $(this).offset().top < (6 * row_height + container_offset.top)){
			//这是第一个子容器
			console.log(this);
		}

		if($(this).offset().top > (5 * row_height + container_offset.top) && $(this).offset().top < (9 * row_height + container_offset.top)){
			//这是第一个子容器
			console.log(this);
		}


	});
}

function change_position(direction,srcpos,dstpos){
    var position;

    if(direction == "up"){
        $(".task.note-con").each(function(){
            position = $(this).data("position");

            if(position >= srcpos && position <= dstpos){
                if((position - 1) < srcpos){
                    $(this).data("position",dstpos).attr("data-position",dstpos);
                }else{
                    $(this).data("position",position-1).attr("data-position",position-1);
                }
            }
        });
    }else{
        $(".task.note-con").each(function(){
            position = $(this).data("position");

            if(position <= srcpos && position >= dstpos){
                if((position + 1) > srcpos){
                    $(this).data("position",dstpos).attr("data-position",dstpos);
                }else{
                    $(this).data("position",position+1).attr("data-position",position+1);
                }
            }
        });
    }
}

//在右边打开某一个窗口关闭其他窗口
function show_window(which){
    switch(which){
        case "open-link":
            if($("body").hasClass("img-wall")) $("body").removeClass("img-wall");
            if($("body").hasClass("single-mode")) $(".note-con.maximized .minimize-note").trigger("click");
            break;
        case "img-wall":
            if($("body").hasClass("open-link")) $("body").removeClass("open-link");
            if($("body").hasClass("single-mode")) $(".note-con.maximized .minimize-note").trigger("click");
            break;
        case "note":
            if($("body").hasClass("img-wall")) $("body").removeClass("img-wall");
            if($("body").hasClass("open-link")) $("body").removeClass("open-link");
            break;
        default: return false;
    }
}

function download_img(image){
	//先将img转换为canvas
	var canvas = document.createElement("canvas");
		canvas.setAttribute("class","dl-canvas");
		canvas.width = image.width;
		canvas.height = image.height;
        image.crossOrigin = "*";
		canvas.getContext("2d").drawImage(image,0,0);
		var dl_image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream;Content-Disposition: attachment;filename=foobar.png");
        window.location.href=dl_image;
}

function regen_tasks_order(){
	//重置所有顺序
    var i = 0;
    $("#search_results.results-of-tasks .note-con").each(function(){
        $(this).attr("data-order",i).data("order",i);
        i += 1;
    });
}

function scroll_into_view(el,extra){
	extra = extra ? extra : -100;
	$("html,body").animate({scrollTop:$(el).offset().top + extra});
}

function recount_today_tasks(reason){
    var $num_con = $("#tag_tasks span.today-num");
    var today_tasks_num = $num_con.text();
    if(reason == "delete" || reason == "finished" || reason == "change_date"){
        console.log(today_tasks_num);
        if(today_tasks_num > 1){
            $num_con.text(parseInt(today_tasks_num) - 1);
            //idl.apps.note.tasks.today_tasks_num--;
        }else{
            $num_con.text(0).addClass("all-finished");
            //idl.apps.note.tasks.today_tasks_num = 0;
        }
    }else if(reason == "recover" || reason == "addnew" || reason == "change_today"){
        if($num_con.hasClass("all-finished")){
            $num_con.removeClass("all-finished");
        }

        //idl.apps.note.tasks.today_tasks_num++;
        $num_con.text(parseInt(today_tasks_num) + 1);
    }
}

// Strip HTML tags with a whitelist
function strip_tags(str, allowed_tags) {
 
    var key = '', allowed = false;
    var matches = [];
    var allowed_array = [];
    var allowed_tag = '';
    var i = 0;
    var k = '';
    var html = '';
 
    var replacer = function(search, replace, str) {
        return str.split(search).join(replace);
    };
 
    // Build allowes tags associative array
    if (allowed_tags) {
        allowed_array = allowed_tags.match(/([a-zA-Z]+)/gi);
    }
 
    str += '';
 
    // Match tags
    matches = str.match(/(<\/?[\S][^>]*>)/gi);
 
    // Go through all HTML tags
    for (key in matches) {
        if (isNaN(key)) {
            // IE7 Hack
            continue;
        }
 
        // Save HTML tag
        html = matches[key].toString();
 
        // Is tag not in allowed list? Remove from str!
        allowed = false;
 
        // Go through all allowed tags
        for (k in allowed_array) {
            // Init
            allowed_tag = allowed_array[k];
            i = -1;
 
            if (i != 0) { i = html.toLowerCase().indexOf('<'+allowed_tag+'>');}
            if (i != 0) { i = html.toLowerCase().indexOf('<'+allowed_tag+' ');}
            if (i != 0) { i = html.toLowerCase().indexOf('</'+allowed_tag)   ;}
 
            // Determine
            if (i == 0) {
                allowed = true;
                break;
            }
        }
 
        if (!allowed) {
            str = replacer(html, "", str); // Custom replace. No regexing
        }
    }
 
    return str;
}

function cache_tag_data(tag_id,data){
	var cache_tag_id = "_cache_tag_" + tag_id,
		tag_div = document.getElementById(cache_tag_id);

	//如果此标签未建立缓存
	if(!tag_div){
		var tag_div = document.createElement("div");
	}
	
	var results_cache = document.getElementById("results_cache");
	tag_div.innerHTML = data;
	tag_div.id = "_cache_tag_" + tag_id;
	jQuery(tag_div).data("tag_id",tag_id);
	results_cache.appendChild(tag_div);
}

function get_cached_tag_data(tag_id){
	var cache_tag_id = "_cache_tag_" + tag_id,
		tag_div = document.getElementById(cache_tag_id);

	if(tag_div){
		return tag_div.innerHTML;
	}
}

function insertTextAtCursor(el, text) {
    var val = el.value, endIndex, range;
    if (typeof el.selectionStart != "undefined" && typeof el.selectionEnd != "undefined") {
        endIndex = el.selectionEnd;
        el.value = val.slice(0, el.selectionStart) + text + val.slice(endIndex);
        el.selectionStart = el.selectionEnd = endIndex + text.length;
    } else if (typeof document.selection != "undefined" && typeof document.selection.createRange != "undefined") {
        el.focus();
        range = document.selection.createRange();
        range.collapse(false);
        range.text = text;
        range.select();
    }
}

function getSelectionHTML() {
	var userSelection;
	if (window.getSelection) {
		// W3C Ranges
		userSelection = window.getSelection ();
		// Get the range:
		if (userSelection.getRangeAt)
			var range = userSelection.getRangeAt (0);
		else {
			var range = document.createRange ();
			range.setStart (userSelection.anchorNode, userSelection.anchorOffset);
			range.setEnd (userSelection.focusNode, userSelection.focusOffset);
		}
		
		// And the HTML:
		var clonedSelection = range.cloneContents ();
		var div = document.createElement ('div');
		div.appendChild (clonedSelection);
		return div.innerHTML;
	} else if (document.selection) {
		// Explorer selection, return the HTML
		userSelection = document.selection.createRange ();
		return userSelection.htmlText;
	} else {
		return '';
	}
};

function getLastInput(el){
	if(!el) return false;
	if(window.getSelection){
		var sel = window.getSelection();
		var range = document.createRange();
		if(sel.anchorOffset > 0){
			range.setStart(sel.anchorNode,sel.anchorOffset - 1);
			range.setEnd(sel.anchorNode,sel.anchorOffset);
			return range.toString();
		}else{
			return false;
		}
	}else if(document.selection){
		var sel = document.selection;
		var range = document.body.createTextRange();
			range.moveToElementText(el);
			if(range.text.length > 0){
				range.setEndPoint("EndToEnd",sel);
				var endOffset = range.text.length;
				if(endOffset > 0){
					range.moveStart("character",endOffset-1);
					return range.text;
				}
			}
	}
}

function getCursorPosition(element) {
	if(!element) return false;
    var caretOffset = 0;
    var doc = element.ownerDocument || element.document;
    var win = doc.defaultView || doc.parentWindow;
    var sel;
    if (typeof win.getSelection != "undefined") {
        var range = win.getSelection().getRangeAt(0);
        var preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(element);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        caretOffset = preCaretRange.toString().length;
    } else if ( (sel = doc.selection) && sel.type != "Control") {
        var textRange = sel.createRange();
        var preCaretTextRange = doc.body.createTextRange();
        preCaretTextRange.moveToElementText(element);
        preCaretTextRange.setEndPoint("EndToEnd", textRange);
        caretOffset = preCaretTextRange.text.length;
    }
    return caretOffset;
}
//type为rich或者plain
function process_sharetext(content,type){
    type = type ? type : "plain";

    if(type == "plain"){
        //纯文本分享，将所有html tag去除，将html实体去除如&nbsp;
        content = content.replace(/\&nbsp\;/," ");

        //先将<br>换成\n
        content = content.replace(/\<br[^<>]{0,}\>/,"\n");

        //去掉所有html标签
        content = content.replace(/(<([^>]+)>)/ig,"");

    }else if(type == "rich"){
        //以html的形式分享，将所有rel=image的a标签转换为图片标签，其余不变
        content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}rel\=["']?image["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<img src=\"$1\" />");
    }
    
    return content;
}

function gplus_share(share_url,extra){
    //https://twitter.com/intent/tweet?url=http://alistapart.com/article/designing-web-registration-forms-for-kids&text=Designing+Web+Registration+Processes+for+Kids&via=alistapart
    if(share_url.indexOf("?") == -1){
        share_url += "?__backsrc=gplus";
    }else{
        share_url += "&__backsrc=gplus";
    }

    var url = "https://plus.google.com/share?url="+encodeURIComponent(share_url)+extra;
}

function fb_share(content,share_url,extra){
    //https://www.facebook.com/sharer/sharer.php?u=http%3A%2F%2Falistapart.com%2Farticle%2Fdesigning-web-registration-forms-for-kids&t=Designing+Web+Registration+Processes+for+Kids
    if(content.length > 140){
        content = content.substr(0,130)+"......";
    }

    if(share_url.indexOf("?") == -1){
        share_url += "?__backsrc=facebook";
    }else{
        share_url += "&__backsrc=facebook";
    }
    content = content.replace(" ","+");
    var url = "http:s//wwww.facebook/sharer/sharer.php?u="+share_url+"&t="+content+extra;
    return url
}

function twitter_share(content,share_url,twitter_name,extra){
    if(content.length > 140){
        content = content.substr(0,130)+"......";
    }

    if(share_url.indexOf("?") == -1){
        share_url += "?__backsrc=twitter";
    }else{
        share_url += "&__backsrc=twitter";
    }

    var url = "https://twitter.com/intent/tweet?url="+encodeURIComponent(share_url)+"&text="+encodeURIComponent(content)+"via="+twitter_name+extra;
    return url;
}


//各大分享组件
// 微博
// content: 分享框中得内容，不能超过140，超过的部分截掉用省略号代替
// pic_url: 分享框下面的图片，只能放一张
// share_url: 希望用户点击的网址
// extra: 额外的参数，以键值对的形式如：&key=value
function weibo_share(content,pic_url,share_url,extra){
	var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;
    
    if(content.length > 140){
        content = content.substr(0,130)+"......";
    }

    if(share_url.indexOf("?") == -1){
    	share_url += "?__backsrc=weibo";
    }else{
    	share_url += "&__backsrc=weibo";
    }

	var url = "http://service.weibo.com/share/share.php?pic="+encodeURIComponent(pic_url)+"&url="+encodeURIComponent(share_url)+"&title="+encodeURIComponent(content)+extra;
    return url;
	// window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
}

// 豆瓣
// text: 长文
// image_url: 图片链接，单张
// title: 标题
// extra: 额外的参数，以键值对的形式如：&key=value
function douban_share(text,image_url,title,extra){
	var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;
    
    if(text.length > 140){
        text = text.substr(0,130)+"......";
    }

	var url = "http://www.douban.com/share/service?image="+encodeURIComponent(image_url)+"&name="+title+"&text="+text+extra;
    return url;
	// window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
}

// qq邮箱
function qqmail_share(content,pic_url,title,share_url,site_title,extra){
	var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;

	var desc = "这是我从Ok记中看到的好东西，分享一下";

	site_title = site_title ? site_title : document.title;

	if(share_url.indexOf("?") == -1){
    	share_url += "?__backsrc=qqmail";
    }else{
    	share_url += "&__backsrc=qqmail";
    }
	
	var url = "http://mail.qq.com/cgi-bin/qm_share?url="+encodeURIComponent(share_url)+"&to=&pics="+encodeURIComponent(pic_url)+"&desc="+desc+"&summary="+encodeURIComponent(content)+"&title="+title+"&site="+document.title+extra;
	return url;
	// window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
}

//qq及时通信分享
//url
//title
//summary会以灰字显示
//desc会显示在框框中
function qqim_share(content,img_url,share_url,title,site_title,extra){
    site_title = site_title ? site_title : document.title;
    var url = "http://connect.qq.com/widget/shareqq/index.html"+
            "?url="+encodeURIComponent(share_url)+
            "&showcount=1"+
            "&desc="+encodeURIComponent(content)+
            "&summary="+encodeURIComponent(content)+
            "&title="+encodeURIComponent(title)+
            "&site="+encodeURIComponent(site_title)+
            "&pics="+encodeURIComponent(img_url)+extra;
    return url;
}

// Gmail
function gmail_share(content){
	var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;

	var url = "https://mail.google.com/mail/?ui=2&view=cm&fs=1&tf=1&su=&body="+encodeURIComponent(content)+"&shva=1&ov=0";
	return url;
    // window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
}

// qq空间
function qzone_share(content,pic_urls,title,share_url,site_title,extra){
	var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;

	var desc = "这是我从Ok记中看到的好东西，分享一下";
	site_title = site_title ? site_title : document.title;
	title = title ? title : "分享自:Ok记";
	if($.isArray(pic_urls)){
		$.each(pic_urls,function(i,v,c){pic_urls[i] = encodeURIComponent(v);});
		pic_urls = pic_urls.join("|");
	}else{
		pic_urls = encodeURIComponent(pic_urls);
	}

	if(share_url.indexOf("?") == -1){
    	share_url += "?__backsrc=qzone";
    }else{
    	share_url += "&__backsrc=qzone";
    }
	var url = "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url="+encodeURIComponent(share_url)+"&pics="+pic_urls+"&title="+title+"&desc="+desc+"&summary="+encodeURIComponent(content)+"&site="+site_title+extra;
	return url;
    // window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
}

// 腾讯微博
function qt_share(content,pic_url,share_url,extra){
	var newwin_height = 500,
        newwin_width = 800,
        newwin_top = (window.screen.height - newwin_height) / 2,
        newwin_left = (window.screen.width - newwin_width) / 2;

    if(content.length > 140){
        content = content.substr(0,130)+"......";
    }

    if(share_url.indexOf("?") == -1){
    	share_url += "?__backsrc=qt";
    }else{
    	share_url += "&__backsrc=qt";
    }

    var url = "http://share.v.t.qq.com/index.php?c=share&a=index&url="+encodeURIComponent(share_url)+"&pic="+encodeURIComponent(pic_url)+"&title="+encodeURIComponent(content)+extra;
    return url;
    // window.open(url,'','height='+newwin_height+',width='+newwin_width+',top='+newwin_top+',left='+newwin_left+',toolbar=no,menubar=no,scrollbars=yes,resizable=no,location=no,status=no');
}

function onlyNumLetterWord(str){
	if(str.length > 100 || str.length == 0){
		return false;
	}

	if(/[\!\@\#\$\%\^\&\*\(\)\·\（\）\_\+\~\<\>\:\"\?\{\}\|\,\.\;\'\[\]\-\=\`\，\。\；\‘\：\“\《\》\|\\\、\”\"\】\【]/.test(str)){
		return false;
	}
	var schar = "",escaped = "";
	for(var i=0,len=str.length; i<len; i++){
		schar = str.substr(i,1);
		if(!/[a-z0-9\s]/i.test(schar)){
			if(!/^[\u4300-\u9FCC]$/.test(schar)){
				return false;
			}
		}
	}
	return true;
}

function getDataSet(node){
	if(typeof DOMStringMap != "undefined" && node.dataset instanceof DOMStringMap){
			return node.dataset;
	}
	
	if(typeof DOMStringMap == "undefined"){
		if(node.tagName != "undefined"){
			var datas = node.outerHTML.match(/data\-[^\s]+=\"[^\s]+\"/g);
			if(datas === null){
				return null;
			}else{
				var dataset = {},prop = "",val = "";
				var len = datas.length;
				for(var i=0; i<len; i++){
					var str = datas[i];
					prop = str.slice(str.indexOf("-")+1,str.indexOf("="));
					val = str.slice(str.indexOf("=")+2,str.length-1);
					dataset[prop] = val;
				}
				return dataset;
			}
		}else{
			return null;
		}
	}
}

function src_from(str){
    var match = str.match(/\#srcin\=([_a-zA-Z0-9]+)/);
    if(match){
        return match[1];
    }else{
        return "";
    }
}

function showMessage(o){
	var typeclass = ["error","success","warning"];
	if(!o || o.msg === undefined || o.msg == ""){
		return false;
	}

	if(o.type){
		o.remove = typeclass.join(" ").replace(o.type,"");
	}else{
		o.remove = "";
	}

	jQuery("#message").html(o.msg).show();
	if(o.type !== undefined && typeof o.type == "string"){
		var left = getCenterPos(jQuery("#message").get(0),document.body).left;
		jQuery("#message").addClass(o.type).removeClass(o.remove).css("left",left ? left+"px" : "50%");
		if(o.type == "success" || o.type == "warning"){
			setTimeout(function(){
				restoreMsg();
			},2000);
		}

		if(o.type == "error"){
			jQuery("#message").on("click.message",function(){
				restoreMsg();
			}).attr("title","点击以解除").on("mouseover",function(){
				jQuery(this).addClass("hvr");
			});
		}
	}
}

function restoreMsg(){
	jQuery("#message").removeAttr("class").removeAttr("title").removeAttr("style").text("").off("click.message");
}

function isEmptyObject(obj){
	var prop;
	for(prop in obj){
		return false;
	}
	return true;
}

function getCenterPos(self,parent){
    var pos = {left:0,top:0};
    if(!self || !parent){
        return false;
    }

    if(self.tagName == undefined || parent.tagName == undefined){
        return pos;
    }

    if(self.parentNode != parent){
        parent.appendChild(self);
    }

    pos.left = (jQuery(parent).width() - jQuery(self).outerWidth()) /2;
    
    if(jQuery(parent).height() < jQuery(self).height()){
        pos.top = -(jQuery(self).height() - jQuery(parent).height()) /2;
    }else{
        pos.top = (jQuery(parent).height() - jQuery(self).height()) /2;
    }
    return pos;
}

function load_first_image(content_node){
    if(!content_node) return false;
    var feature_img = $(content_node).find("a[rel=\"image\"]").attr("data-lightbox","in-memo").eq(0).removeAttr("data-lightbox").get(0);

    if(feature_img){
        var img_node = document.createElement("img");
        //img_node.onload = ;
        is_image_url(feature_img.href,img_entity_onload,img_node);

        img_node.onerror = function(){
            //加载失败，将图片去除
            $(this).closest(".img-entity").removeClass("entity-loaded");
            this.remove();
        };

        img_node.src = feature_img.href;
        var filename = get_filename(feature_img.href);
        $(content_node).closest(".field-con").find(".entities-con .img-entity").html("<a class=\"lb entity\" data-lightbox=\"in-memo\" href=\""+feature_img.href+"\"></a><a class=\"img-downloader\" href=\""+feature_img.href+"\" download=\""+filename+"\"></a>").find("a.lb.entity").append(img_node);
    }
}

function img_entity_onload(){
    var $entity_con = $(this).closest(".img-entity");

    //通过添加类让父元素宽高度有所变化
    $entity_con.addClass("entity-loaded");

    $entity_con.find("a.lb.entity").attr("data-title",this.width+"X"+this.height);

    //加载成功，对图片进行定位缩放
    var con_width = $entity_con.width();
    var con_height = $entity_con.height();

    var img_width = this.width;
    var img_height = this.height;

    //图片只有跟容器大小比例在一定范围内才缩放，例如，如果图片比容器为<1/4的话，则不进行缩放，如果是>3/4的话，则可以让其充满容器
    var min_ratio = .85;
    //如果图片宽度大于或等于容器宽度
    if(img_width >= con_width){
        //宽度撑满容器宽度
        this.style.width = "100%";
        if(img_height >= con_height){
            //图片宽高度都大于容器宽高度
            //尝试将图片等比例缩放，让宽度与容器相等,若缩放后图片高度小于容器高度，则不进行缩放，让图片水平垂直方向上皆居中即可
            var croped_height = img_height * (con_width/img_width);
            
            if(croped_height >= con_height){
                //croped_height > 1.3 * con_height
                if( croped_height * (1-0.618) > con_height * .5 ){
                    var diff = croped_height * (1-0.618) - con_height * .5;
                    this.style.marginTop = -diff + "px";
                }else{
                    var diff = - con_height + croped_height;
                    this.style.marginTop = -diff/2 + "px";
                }
            }else{
                //缩放后的高度小于容器高度，垂直方向上居中
                var diff = con_height - croped_height;
                this.style.marginTop = diff/2 + "px";
            }
        }else{
            //缩放后的高度小于容器高度，
            //将高度撑满
            croped_width = img_width * (con_height/img_height);

            //垂直方向上居中
            var diff = croped_width - con_width;
            this.style.height = "100%";
            this.style.width = "auto";
            this.style.marginLeft = -diff/2 + "px";
        }
    }else{
        if((img_width/con_width) >= min_ratio){
            //如果宽度比在一定值以上，则让其宽度变为100%，再垂直居中或者将黄金分割线设为垂直上的中线
            this.style.width = "100%";
            var croped_height = img_height * (img_width/con_width);
            if(croped_height >= con_height){
                //croped_height > 1.3 * con_height
                if( croped_height * (1-0.618) > con_height * .5 ){
                    var diff = croped_height * (1-0.618) - con_height * .5;
                    this.style.marginTop = -diff + "px";
                }else{
                    var diff = - con_height + croped_height;
                    this.style.marginTop = -diff/2 + "px";
                }
            }else{
                //缩放后的高度小于容器高度，垂直方向上居中
                var diff = con_height - croped_height;
                this.style.marginTop = diff/2 + "px";
            }
        }else{
            //不能让图片变为100%，也就是不对其进行缩放
            //如果自然高度大于容器高度
            if(img_height > con_height){
                if(img_height >= con_height){
                    //img_height > 1.3 * con_height
                    if( img_height * (1-0.618) > con_height * .5 ){
                        var diff = img_height * (1-0.618) - con_height * .5;
                        this.style.marginTop = -diff + "px";
                    }else{
                        var diff = - con_height + img_height;
                        this.style.marginTop = -diff/2 + "px";
                    }
                }
            }else{
                var diff = con_height - img_height;
                this.style.marginTop = diff/2 + "px";
            }

        }
    }
};

function checkUrl(link_url){
    if(link_url == "" || !link_url.match(/^(http\:\/\/|https\:\/\/|ftp\:\/\/)?([a-z0-9\-]+\.){0,5}[a-z0-9\-]+\.[a-z0-9]{1,5}(\/?|\/.+)+$/i) || link_url.length > 2048){
        return false;
    }else{
        if(link_url.indexOf('http') < 0){
            link_url = "http://"+link_url;
		}
        return link_url;
    }
}

function checkLinkUrl(link_url){
	if(link_url == ""){
		showMessage({type:"warning",msg:"链接不能为空"});
		return false;
	}
	link_url = jQuery.trim(link_url);
	if(!link_url.match(/^(http\:\/\/|https\:\/\/|ftp\:\/\/)?([a-z0-9\-]+\.){0,5}[a-z0-9\-]+\.[a-z]{1,5}(\/?|\/.+)+$/i)){
		showMessage({type:"warning",msg:"请输入合法网址"});
		return false;
	}

	if(link_url.length > 2048){
		showMessage({type:"warning",msg:"地址过长"});
		return false;
	}

	if(link_url.indexOf('http') < 0){
			link_url = "http://"+link_url;
	}

	return isUrlEncoded(link_url) ? link_url : encodeURI(link_url);
}

function strip_bonus(data){
    var match;
    if(match = data.match(/[^[{]{0,}([[{].+[}]]$)/)){
        data = match[1];
    }
    return data;
}

function get_global_dates(datesarr){
    var dates = datesarr ? datesarr : new Array(),date,global_dates = new Array();
    if(dates.length > 0){
        for(var i=0; i<dates.length; i++){
            date = dates[i].split(" ")[0];
            date = date+" 00:00:00";
            date = new Date(date);
            if(isNaN(date.valueOf())){
            	// ipad 加上 00:00:00回出现invalid date
            	date = dates[i].split(" ")[0];
            	date = new Date(date);
            	global_dates.push(date.valueOf()-28800000);//28800000 == 3600 * 1000 * 8
            }else{
            	global_dates.push(date.valueOf());
            }
        }
    }
    
    return global_dates;
}

//设置需要下载链接的文件名
function get_filename(url){
	if(!!!url){
		return false;
	}

	//如果存在后缀
	if(url.match(/[^\/]+\.(?:png|jpg|jpeg|svg|bmp|gif|tiff)\b/i)){
		return url.match(/[^\/]+\.(?:png|jpg|jpeg|svg|bmp|gif|tiff)\b/i)[0];
	}else{
		if(url.match(/[^\/]+$/)) 
			return url.match(/[^\/]+$/)[0] + ".png";
		else 
			return url;
	}

	//如果不存在后缀，则将后缀一律设为png

}

//以一种显眼的小动画吸引用户注意
//@param: {operation:,node:,effect:"default"}
//operation: the operation the user is perform before this animation
//node: which node to animate as to attract user
//effect: which animation effect to use
function notify_user(){

}

//检测链接是否为图片链接
function is_image_url(url,callback,context){
	if(!!!url) return false;
	
	if($("iframe#testImg").length > 0){
		$("iframe#testImg").get(0).contentWindow.document.body.innerHTML += "<img src=\""+url+"\">";
	}else{
		var fr = document.createElement("iframe");
		fr.id = "testImg";
		fr.width = 0;
		fr.height = 0;
        fr.style.height = "0px";
        fr.style.width = "0px";
		document.body.appendChild(fr);
		fr.contentWindow.document.body.innerHTML += "<img src=\""+url+"\">";
	}

	var img = new Image();
    context = context ? context : img;
	//如果链接明显是指向的图片
	//svg格式的图片按照容器的大小来展示
	if($.isFunction(callback)){
		img.onerror = function(){callback.call(context,url,false);};
		img.onload = function(){callback.call(context,url,img);}
	}
	img.src = url;
}

function get_json_feedback(data){
    if(!!!data){
        return false;
    }
    var odata = strip_bonus(data);
    return $.parseJSON(odata)
}

function get_current_time(){
	var current_date = new Date(),
		month = parseInt(current_date.getMonth()+1) < 10 ? "0" + parseInt(current_date.getMonth()+1) : parseInt(current_date.getMonth()+1),
		day = parseInt(current_date.getDate()) < 10 ? "0" + parseInt(current_date.getDate()) : parseInt(current_date.getDate()),
		hour = parseInt(current_date.getHours()) < 10 ? "0" + parseInt(current_date.getHours()) : parseInt(current_date.getHours()),
		minutes = parseInt(current_date.getMinutes()) < 10 ? "0" + parseInt(current_date.getMinutes()) : parseInt(current_date.getMinutes()),
		seconds = parseInt(current_date.getSeconds()) < 10 ? "0" + parseInt(current_date.getSeconds()) : parseInt(current_date.getSeconds()),
	current_date = current_date.getFullYear()+"-"+month+"-"+day+" "+hour+":"+minutes+":"+seconds;
	return current_date;
}

function get_formated_time(date,rttime){
	var rttime = !!rttime ? true : false;
	if((typeof date).toLowerCase() == "object"){
		var current_date = date;
	}else{
		var current_date = new Date(date);
	}
	var month = parseInt(current_date.getMonth()+1) < 10 ? "0" + parseInt(current_date.getMonth()+1) : parseInt(current_date.getMonth()+1),
		day = parseInt(current_date.getDate()) < 10 ? "0" + parseInt(current_date.getDate()) : parseInt(current_date.getDate()),
		hour = parseInt(current_date.getHours()) < 10 ? "0" + parseInt(current_date.getHours()) : parseInt(current_date.getHours()),
		minutes = parseInt(current_date.getMinutes()) < 10 ? "0" + parseInt(current_date.getMinutes()) : parseInt(current_date.getMinutes()),
		seconds = parseInt(current_date.getSeconds()) < 10 ? "0" + parseInt(current_date.getSeconds()) : parseInt(current_date.getSeconds());
	if(rttime){
		current_date = current_date.getFullYear()+"-"+month+"-"+day+" "+hour+":"+minutes+":"+seconds;
	}else{
		current_date = current_date.getFullYear()+"-"+month+"-"+day;
	}
	
	return current_date;
}

//处理要展示的时间字符串
function format_date_text(date_text){
	if(!date_text || !!!new Date(date_text)){
		return false;
	}

	var date = new Date(date_text);
	var year = date.getFullYear();
	var month = date.getMonth() + 1;
	var day = date.getDate();
	return year+"."+month+"."+day;
}

function get_pushable_bookmarks(bookmarks){
	var default_pushable_bookmarks = [{"title":"百度一下，你就知道","link":"http://www.baidu.com","start_date":null,"end_date":null,"remark":"百度一下，你就知道"}];
	var bookmark = null,
		start_date=null,
		end_date=null,
		todays_push=new Array(),
		current_date = new Date(),
		current_date = current_date.getFullYear()+"-"+parseInt(current_date.getMonth()+1)+"-"+current_date.getDate()+" 00:00:00",
		current_date_value = new Date(current_date).valueOf(),
		start_date_value=end_date_value="";
	if(jQuery.isArray(bookmarks) && bookmarks.length > 0){
		//get all the bookmarks available for today
		for(var i=0; i<bookmarks.length; i++){
			bookmark = bookmarks[i];
			start_date = bookmark.start_date;
			end_date = bookmark.end_date;
			if(start_date == null || end_date == null){
				todays_push.push(bookmark);
			}else{
				start_date_value = new Date(start_date).valueOf();
				end_date_value = new Date(end_date).valueOf();
				if(start_date_value < current_date_value && end_date_value > current_date_value){
					todays_push.push(bookmark);
				}
			}
			
		}
		return todays_push;
	}else{
		return default_pushable_bookmarks;
	}
}

//this function will return an array of links
function get_links(text){
	var links = text.match(/((http\:\/\/|https\:\/\/|ftp\:\/\/)?([a-z0-9\-]+\.){0,5}[a-z0-9\-]+\.(com|cn|hr|com\.cn|io|org|fr|jp|tv|name|mobi|us|fm|asia|net|gov|tel|la|travel|so|biz|info|hk|me|co|in|at|bz|ag|eu|in)[^\s\,\"\'\{\}\<]{0,})/ig);
        
    var validLinks = new Array();
	if(!!links){
		for(var i=0; i<links.length;i++){
            if(links[i].indexOf("...") < 0){
				if(links[i].indexOf("http://") < 0 && links[i].indexOf("https://") < 0){
					links[i] = "http://"+links[i];
				}
				validLinks.push(links[i]);
            }
		}
	}
        return validLinks;
}


//非任务无需顺序
function update_display_order(){
	$("#search_results.results-of-tasks .note-con").each(function(){
        var new_order = $(this).index();
        $(this).attr("data-order",new_order).data("order",new_order);
    });
}

function isUrlEncoded(link){
	var tmp = link;
	while(decodeURI(tmp) != tmp){
		tmp = decodeURI(tmp);
	}
	return (encodeURI(tmp) == link); 
}

function show_waitting(area){
    area = area ? area : document.body;
    
    var areaWidth = area.offsetWidth;
    var areaHeight = area.offsetHeight;
    var top = 0;
    if(area == document.body){
        areaWidth = jQuery(window).width();
        areaHeight = jQuery(window).height();
        top = jQuery("body").scrollTop();
    }
    
    area.style.overflow = "hidden";
    jQuery(area).addClass("waitting");
    jQuery(area).append("<div class='waitting-layer' style='width:"+areaWidth+"px;top:"+top+"px;height:"+areaHeight+"px'></div>");
}

function remove_waitting(area){
    area = area ? area : jQuery(".waitting")[0];
    area.style.overflow = "auto";
    jQuery(area).removeClass("waitting");
    jQuery(".waitting-layer",area).remove();
}


//处理写入便签的内容，去除一些html标记，留下一些标记如a标记，pre标记，div转br标记,将多行空白转换为一行
function encode_content(content){
    //如果链接为纯链接的话(即文字为url)
    // content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(\<\/a\>)?/ig,function(match,p1,p2,offset,string){
    //     //链接的文字为url
    //     if(link_regexp.test(p2) || ip_link_regexp.test(p2)){
    //         return p2;
    //     }

    //     return "[a href=\""+p1+"\"]"+p2+"[/a]";
    // });

    //将图片转化为链接文字为图片url的超链接 如<a rel="image" href="http://www.baidu.com/img/logo.png">http://www.baidu.com/img/logo.png</a>
    content = content.replace(/\<img[^><]{0,}src\=["']?([^'"><]+)["']?[^><]{0,}\>/ig,"[img]$1[/img]");

    //  /\<a[^><]{0,}     href\=["']?([^'"><]+)["']?   [^><]{0,}    rel\=["']?([^<>"']+)["']?   [^><]{0,}\>   ([^><]{0,})(?:\<\/a\>)?/ig

    //如果匹配到rel属性，则保留
    if(content.match(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}rel\=["']?image["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig)){
        content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}rel\=["']?image["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"[a href=\"$1\" rel=\"image\"]$2[/a]");
    }

    //超链接则变为将超链接隐藏在文字下面的链接如 <a href="http://www.baidu.com">百度一下，你就知道</a>
    content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"[a href=\"$1\"]$2[/a]");

    //将块级元素以换行代替，并且不对<br>标签进行处理
    content = content.replace(/\<div[^\>]{0,}\>\<\/div\>/ig,"[br]");
    content = content.replace(/\<br\>/ig,"[br]");

    //保留pre标签
    content = content.replace(/\<pre[^\>]{0,}\>/ig,"[pre]");
    content = content.replace(/\<\/pre\>/ig,"[/pre]");

    //将div包起来的内容用前面附上br换行
    content = content.replace(/\<div\>/ig,"[br]");

    //去掉所有html标签
    content = content.replace(/(<([^>]+)>)/ig,"");

    //将多个换行变为一个
    //content = content.replace(/(\[br\])+/ig,"[br]");

    //去掉开头的br
    content = content.replace(/^(\[br\])/i,"");

    //还原换行
    content = content.replace(/\[br\]/ig,"<br>");
    
    //还原格式
    content = content.replace(/\[pre\]/ig,"<pre>");
    content = content.replace(/\[\/pre\]/ig,"</pre>");

    //还原图片标签，并将其转换为a标签
    // content = content.replace(/\[img\]/ig,"<img");
    // content = content.replace(/\[\/img\]/ig," />");
    // content = content.replace(/\<img[^><]{0,}src\=["']?([^'"><]+)["']?[^><]{0,}\>/ig,"<a href=\"$1\" rel=\"image\">$1</a>");
    content = content.replace(/\[img\]([^\[\]]+)\[\/img\]/ig,"<a href=\"$1\" rel=\"image\" contenteditable=\"false\">$1</a>");

    //还原a标签
    //  /\[a   [^\]\[]{0,}   href\=["']?([^'"\]\[]+)["']?  [^\]\[]{0,}\]   ([^\]\[]{0,})   (?:\[\/a\])?/ig
    if(content.match(/\[a[^\]\[]{0,}href\=["']?([^'"\]\[]+)["']?[^\]\[]{0,}rel\=["']?image["']?[^\]\[]{0,}\]([^\]\[]{0,})(?:\[\/a\])?/ig)){
        content = content.replace(/\[a[^\]\[]{0,}href\=["']?([^'"\]\[]+)["']?[^\]\[]{0,}rel\=["']?image["']?[^\]\[]{0,}\]([^\]\[]{0,})(?:\[\/a\])?/ig,"<a href=\"$1\" contenteditable=\"false\" rel=\"image\">$2</a>");
    }else{
        content = content.replace(/\[a[^\]\[]{0,}href\=["']?([^'"\]\[]+)["']?[^\]\[]{0,}\]([^\]\[]{0,})(?:\[\/a\])?/ig,"<a href=\"$1\">$2</a>");
    }
    
    return content;
}

//将图片和文字全部转化为链接再展示出来
function decode_content(content,isNew){
    var gl_fav = "http://www.google.com/s2/favicons?domain=";
    if($("body").hasClass("inside-parent")){
        var loc_origin = parent.location.origin;
    }else{
        var loc_origin = location.origin;
    }

    //如果favicon设置是打开状态，则在所有网址中添加favicon
    if($("body").hasClass("favicon_on")){
        if(isNew){
            //如果是新添加的急需展示的，则直接让其展示favicon，而不用滚动加载
            //在链接中添加图片图片节点

            if(content.match(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}rel\=["']?image["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig)){
                content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<a class=\"open type-image\" data-lightbox=\"in-memo\" href=\"$1\" rel=\"image\"><img class=\"favicon\" onerror=\"favi_load_error(this)\" onabort=\"favi_loaded(this)\" height=\"12\" style=\"padding-bottom:1px;\" src=\""+gl_fav+"$1\" />$2</a>");
            }else{
                content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<a class=\"open\" href=\""+loc_origin+"/#$1\" rel=\"link\"><img class=\"favicon\" onerror=\"favi_load_error(this)\" onabort=\"favi_loaded(this)\" height=\"12\" style=\"padding-bottom:1px;\" src=\""+gl_fav+"$1\" />$2</a>");
            }
        }else{
            if(content.match(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}rel\=["']?image["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig)){
                content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<a class=\"open type-image\" data-lightbox=\"in-memo\" href=\"$1\" rel=\"image\"><img class=\"favicon unloaded\" onerror=\"favi_load_error(this)\" onabort=\"favi_loaded(this)\" height=\"12\" style=\"padding-bottom:1px;\" data-src=\""+gl_fav+"$1\" />$2</a>");
            }else{
                content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<a class=\"open\" href=\""+loc_origin+"/#$1\" rel=\"link\"><img class=\"favicon unloaded\" onerror=\"favi_load_error(this)\" onabort=\"favi_loaded(this)\" height=\"12\" style=\"padding-bottom:1px;\" data-src=\""+gl_fav+"$1\" />$2</a>");
            }
        }
    }else{
        //如果favicon是关闭状态，则不在网址中添加favicon
        //找常展示链接
        if(content.match(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}rel\=["']?image["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig)){
            content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<a class=\"open type-image\" data-lightbox=\"in-memo\" href=\"$1\" rel=\"image\">$2</a>");
        }else{
            content = content.replace(/\<a[^><]{0,}href\=["']?([^'"><]+)["']?[^><]{0,}\>([^><]{0,})(?:\<\/a\>)?/ig,"<a class=\"open\" href=\""+loc_origin+"/#$1\" rel=\"link\">$2</a>");
        }
    }

    //若是网址的话则变成链接
    content = content.replace(link_regexp,function(match,whole,scheme,rou,offset,string){
        //console.log(string.substr(offset-7,7));
        if(match && match.indexOf(loc_origin) < 0 && match.indexOf(gl_fav) < 0){
            //只有是纯文本才给上链接，已经被标签包住的链接不再给其加上a标签
            if(string[offset-1] == ">" || string[offset+match.length] == "<") return match;
            //如果是href，也直接返回
            if(string.substr(offset-7,7).indexOf("href") >= 0) return match;
            return "<a class=\"open\" href=\""+loc_origin+"#"+match+"\">"+match+"</a>";
        }
        return match;
    });

    content = content.replace(ip_link_regexp,function(match,whole,scheme,offset,string){
        if(match && match.indexOf(loc_origin) < 0 && match.indexOf(gl_fav) < 0){
            if(string[offset-1] == ">" || string[offset+match.length+1] == "<") return match;
            //如果是href，也直接返回
            if(string.substr(offset-7,7).indexOf("href") >= 0) return match;
            return "<a class=\"open\" href=\""+loc_origin+"#"+match+"\">"+match+"</a>";
        }
        return match;
    });
    
    //去掉实体空格
    content = content.replace(/\&nbsp\;/ig," ");

    return content;
}


function favi_loaded(img){
	$(img).removeClass("unloaded");
}

function favi_load_error(img){
	//favicon加载错误,用站内一般图标代替
   	img.src = "layout/images/favicons.png";
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

function write_mode(contentdiv){
	//变为可编辑模式
    if($(contentdiv).attr("contenteditable") == "false" || $(contentdiv).attr("contenteditable") == undefined){
		$(contentdiv).attr("contenteditable",true);

		//回到纯文本状态，并对文本进行一些处理
    	$(contentdiv).html($(contentdiv).data("value"));
	}
}

function read_mode(contentdiv){
	//变为不可编辑模式
	if($(contentdiv).attr("contenteditable") == "true" || $(contentdiv).attr("contenteditable") == ""){
		$(contentdiv).attr("contenteditable",false);
		//回到富文本状态
    	$(contentdiv).html(decode_content(contentdiv.innerHTML,true));
	}
}

function highlight_colored_tags(note_con){
	//给拥有默认标签的便签加上带颜色的假边框
    if(!note_con){
	    $(".note-con.has-colored").each(function(){
	        if(!$(this).hasClass("highlighted")){
	            var $form = $("form",this),
	            	$tag_divs = $(".default_tag",this),
	            	cube_length = $tag_divs.length,
	            	cube_height = 1/cube_length * 100,
	            	i=0;

	            $tag_divs.each(function(){
	                this.style.top = i * cube_height + "%";
	                this.style.height = cube_height+"%";
	                i++;
	            });

	            $(this).addClass("highlighted");
	        }
	    });
	}else{
		if(!$(note_con).hasClass("highlighted")){
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

            $(note_con).addClass("highlighted");
        }
	}
}

function toggleHvr(reset,selector,hvrclass,tpSeletor,callback){
	//tpSeletor => selector of target's parent
    if($.isFunction(reset)){
        reset();
    }
    hvrclass = hvrclass ? hvrclass : "hvr";
    
    if(!!!tpSeletor){
    	jQuery(document).on("mouseover",selector,function(){
	        jQuery(this).addClass(hvrclass);
	    });
	    jQuery(document).on("mouseout",selector,function(){
	        jQuery(this).removeClass(hvrclass);
	        if(callback && $.isFunction(callback)){
	    		callback.call(this);
	    	}
	    });
    }else{
    	jQuery(document).on("mouseover",selector,function(){
	        jQuery(this).parentsUntil(tpSeletor).last().addClass(hvrclass);
	    });

	    jQuery(document).on("mouseout",selector,function(){
	        jQuery(this).parentsUntil(tpSeletor).last().removeClass(hvrclass);
	        if(callback && $.isFunction(callback)){
	    		callback.call(this);
	    	}
	    });
    }
    
}

function toggleFocus(reset,selector,focusClass,containerselector,callback){

    focusClass = focusClass ? focusClass : "focus";
    //parentClass : which element this focusClass will be added to
    if(containerselector){
    	 jQuery(document).on("focus",selector,function(event){
    	 	if($.isFunction(callback)){
    	 		callback.call(this,event);	
    	 	}
    	 	
            jQuery(this).parentsUntil(containerselector).last().addClass(focusClass);
        });

        jQuery(document).on("blur",selector,function(event){
            jQuery(this).parentsUntil(containerselector).last().removeClass(focusClass);
            if($.isFunction(reset)){
		        reset.call(this,event);
		    }
        });
    }else{
    	jQuery(document).on("focus",selector,function(event){
    		if($.isFunction(callback)){
    	 		callback.call(this,event);	
    	 	}
            jQuery(this).addClass(focusClass);
        });

        jQuery(document).on("blur",selector,function(event){
            jQuery(this).removeClass(focusClass);
            if($.isFunction(reset)){
		        reset.call(this,event);
		    }
        });
    }
}

function toggleClassOn(eventstr,selectors,callbefore,callback,beforeClass,afterClass){
	eventstr = eventstr || "";
	selectors = selectors || "";
	callbefore = callbefore || null;
	callback = callback || null;
	beforeClass = beforeClass || "";
	afterClass = afterClass || eventstr;

	if(eventstr == "" || selectors == ""){
		if(console) console.error("no event or selector specified");
		return false;
	}

    var eventRef = {
    "blur":"focus",
    "focus":"blur",
    "mouseover":"mouseout",
    "mouseout":"mouseover",
    "mouseup":"mousedown",
    "mousedown":"mouseup"
    };
    jQuery(document).on(eventstr,selectors,function(event){
        if($.isFunction(callbefore)){
            callbefore.call(this,event);
        }
        jQuery(this).addClass(afterClass).removeClass(beforeClass);
    });
    
    if(eventstr != "click"){
    	jQuery(document).on(eventRef[eventstr],selectors,function(event){
	    	if($.isFunction(callback)){
	            callback.call(this,event);
	        }
    	    jQuery(this).removeClass(afterClass).addClass(beforeClass);
    	});
    }
}

function toggleClick(selectors,clickclass,preventDefault,callbefore,callback){

	jQuery(document).on("click touchstart",selectors,function(event){
		event = EventUtil.getEvent(event);
		if(preventDefault){
			EventUtil.preventDefault(event);
		}

		if(jQuery(this).hasClass(clickclass)){
			if(jQuery.isFunction(callbefore)){
				callbefore.call(this,event);
			}
			jQuery(this).removeClass(clickclass)
		}else{
			if(jQuery.isFunction(callback)){
				callback.call(this,event);
			}
			jQuery(this).addClass(clickclass)
		}
	});
}

/*
 * @param: 
 * content: the html inside modal-content
 * width: width of modal 
 */
function showModal(content,width,exclass){
    width = width ? width : 500;
    if(!jQuery("body").hasClass("overlayed")){
        jQuery("body").addClass("overlayed");
        jQuery(".modal").show();
        if(width){
            jQuery(".modal-content").css("width",width+"px");
        }
        jQuery(".modal-content").append(content);
        if(exclass){
            jQuery(".modal-content").addClass(exclass);
        }
        jQuery("#bulk_text").focus();
    }
}

//验证时间格式
function validate_date(value){
	if(!!value){
		return /\d{0,4}\-[01]?[0-9]\-[0-3]?[0-9](\s[0-2]?[0-9]\:[0-5][0-9]:[0-5]?[0-9])?/.test(value);
	}
}

function removeModal(){
    if(jQuery("body").hasClass("overlayed")){
        jQuery("body").removeClass("overlayed");
        jQuery(".modal").hide();
        jQuery(".modal-content").html("");
    }
}

function get_title(content){
	var title = "";
	//第一句话为标题
    //以一个标点符号作为一句的结束
    if(content.match(/^[^\,\.\;\'\"\，\。\、\；\’\”]+/)){
        title = content.match(/^[^\,\.\;\'\"\，\。\、\；\’\”]+/)[0];
    }
    //或者内容的前20个左右的字符
    title = content.substr(0,20);
    return title;
}

var EventUtil = {
	addHandler: function(el, type, handler) {
		if (el.addEventListener) {
			el.addEventListener(type, handler, false)
		} else if (el.attachEvent) {
			el.attachEvent("on" + type, handler);
		} else {
			el["on" + type] = handler;
		}
	},

	getEvent: function(evt) {
		return evt?evt:window.event;
	},

	getTarget: function(evt) {
		return evt.target?evt.target:evt.srcElement;
	},

	preventDefault: function(evt) {
		if (evt.preventDefault) {
			evt.preventDefault();
		} else {
			evt.returnValue = false;
		}
	},

	removeHandler: function(el, type, handler) {
		if (el.removeEventListener) {
			el.removeEventListener(type, handler, false);
		} else if (el.detachEvent) {
			el.detachEvent("on" + type, handler);
		} else {
			el["on" + type] = null;
		}
	},

	stopPropagation: function(evt) {
		if (evt.stopPropagation) {
			evt.stopPropagation();
		} else {
			evt.cancelBuble = true;
		}
	},

	getRelatedTarget: function(evt) {
		if (evt.relatedTarget) {
			return evt.relatedTarget;
		} else if (evt.toElement) {
			return evt.toElement;
		} else if (evt.fromElement){
			return evt.fromElement;
		} else {
			return null;
		}
	},

	getButton: function(evt) {
		if (document.implementation.hasFeature("MouseEvents","2.0")) {
			return evt.button;
		} else {
			switch (evt.button) {
				case 0:
				case 1:
				case 3:
				case 5:
				case 7:
					return 0;
				case 2:
				case 6:
					return 2;
				case 4:
					return 1;
			}
		}
	},

	getWheelDelta: function(evt) {
		if (evt.wheelDelta) {
			//to be continue ...
		} else {
			return -evt.detail * 40;
		}
	},

	getCharCode: function(evt) {
		if (typeof evt.charCode == "number") {
			return evt.charCode;
		} else {
			return evt.keyCode;
		}
	},

	getClipboardText: function(evt){
		var clipboardData = (evt.clipboardData || window.clipboardData);
		return clipboardData.getData("text");
	},

	setClipboardText: function(evt,value){
		if(evt.clipboardData){
			return evt.clipboardData.setData("text/plain",value);
		}else if(window.clipboardData){
			return window.clipboardData.setData("text",value);
		}
	}
};

var Tag = function(o){
	this.name = o.name || "";
	this.id = o.id || 0;
	this.isid = o.isid || 0;
	return this;
};

Tag.prototype = {	
	save_url: "/tag/add",
    del_url: "/tag/del",
    alter_name_url: "/tag/alter_name",
    bulk_attach_url: "/tag/bulk_add_tag",
    set_color_url: "/tag/set_color",
    update_access_url: "/tag/update_last_access",
    pin_url: "/tag/pin",
    unpin_url: "/tag/unpin",
    properties: ["id","name"],
    save: function(callbefore,callback){
        if(arguments.length == 2){
            if(jQuery.isFunction(callbefore)){
                callbefore.call(this);
            }
        }else if(arguments.length == 1){
            callback = callbefore;
        }else{
            callback = function(){};
        }

        return (this.id && this.id>0) ? this.update(callback) : this.create(callback);
    },

    checkParam : function(){
        var valid = true,
            required_params = this.param.required,
            optional_params = this.param.optional;
        for(var i=0,len=required_params.length;i<len;i++){
            if(!this[required_params[i]]){
                valid = false;
            }else if(this[required_params[i]] && !this.is_valid(required_params[i],this[required_params[i]])){
                valid = false;
            }
        }

        return valid;
    },

    create: function(callback){
        if(this.checkParam()){
        	$.post(this.save_url,{type:"ajax",from:"web",tagname:this.name},callback);
        }
    },

    update: function(callback){
        var properties = this.properties,updatems = new Array();
        for(var i=0,len = properties.length; i<len; i++){

            if(properties[i] == "pub"){
                if(this[properties[i]] != undefined){
                    updatems.push(properties[i]);
                }
            }else{
                if(this[properties[i]] && properties[i] != "id"){
                updatems.push(properties[i]);
            }
            }
        }
        
        if(updatems.length == 1){
            var item = updatems[0];
            switch(item){
                case "name": return this.altername(callback);break;
                case "pub": return this.togglepublic(callback);break;
                default: return false;break;
            }
        }
        return false;
    },

    setColor: function(colorVal,callback){
    	if($.isFunction(colorVal)){
    		callback = colorVal;
    		colorVal = null;
    	}else{
    		callback = $.isFunction(callback) ? callback : null;
    	}
    	
    	if(colorVal && this.is_valid("colorVal",colorVal)){
    		$.post(this.set_color_url,{type:"ajax",from:"web",tag_id:this.id,colorVal:colorVal},callback);
    	}else if(colorVal == null){
    		$.post(this.set_color_url,{type:"ajax",from:"web",tag_id:this.id,colorVal:"unset"},callback);
    	}
    },

    pinIt: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.post(this.pin_url,{type:"ajax",from:"web",tag_id:this.id},callback);
    },

    unpinIt: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.post(this.unpin_url,{type:"ajax",from:"web",tag_id:this.id},callback);
    },

    updateAccess: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.post(this.update_access_url,{type:"ajax",from:"web","tag_id":this.id},callback);
    },

    altername: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var param = {id:this.id,name:this.name};
    	$.post(this.alter_name_url,{type:"ajax",from:"web","param":param},callback);
    },

    togglepublic: function(callback){
        if(this.is_valid("public",this.pub)){
            var param = {id:this.id,pub:this.pub};
            $.post(this.public_url,{type:"ajax",from:"web","param":param},callback);
        }
    },

    push: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
	    	var param = {tag_id:this.id};
	    	$.post(this.push_url,{type:"ajax",from:"web",param:param},callback);
    	}
    },

    unpush: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
	    	var param = {tag_id:this.id};
	    	$.post(this.unpush_url,{type:"ajax",from:"web",param:param},callback);
    	}
    },

    remove_from_issue: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("isid",this.isid) && this.is_valid("id",this.id)){
    		var param = {
    			tag_id: this.id,
    			isid: this.isid
    		};

    		$.post(this.remove_issue_url,{type:"ajax",from:"web",param:param},callback);
    	}
    	return this;
    },

    bulk_attach_tag: function(ids,callback){
    	callback = $.isFunction(callback) ? callback : null;

    	if($.isArray(ids) && ids.length > 0){
    		if(console) console.log(ids);
    		var param = {
    			bids: ids,
    			tid: this.id
    		};

    		$.post(this.bulk_attach_url,{type:"ajax",from:"web",param:param},callback);
    	}
    	return this;
    },

    del: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		$.post(this.del_url,{type:"ajax",from:"web",id:this.id},callback);
    	}
    },

    is_valid: function(field,value){
        switch(field){
            case "id": return $.isNumeric(value) && isFinite(value);break;
            case "isid": return $.isNumeric(value) && isFinite(value);break;
            case "name": return $.type(value) == "string" && value!="";break;
            case "public": return (parseInt(value) === 1 || parseInt(value) === 0 );break;
            case "colorVal": return /^\#(\w\w\w|\w\w\w\w\w\w)$/.test(value);
            default: return false;break;
        };
    },

    param : {
        optional : ["id"],
        required : ["name"]
    }
};

var Folder = function(o){
    this.name = o.name || "";
    this.id = o.id || 0;
    this.pub = !isNaN(o.pub) ? o.pub : undefined;
    return this;
}

Folder.prototype = {
    save_url: "/category/add",
    del_url: "/category/del",
    public_url: "/category/toggle_public",
    alter_name_url: "/category/altername",
    push_url: "/category/push",
    unpush_url: "/category/unpush",
    remove_issue_url: "/category/remove_from_issue",
    del_url: "/category/delete",
    properties: ["id","name","pub"],

    save: function(callbefore,callback){
        if(arguments.length == 2){
            if(jQuery.isFunction(callbefore)){
                callbefore.call(this);
            }
        }else if(arguments.length == 1){
            callback = callbefore;
        }else{
            callback = function(){};
        }

        return (this.id && this.id>0) ? this.update(callback) : this.create(callback);
    },

    checkParam : function(){
        var valid = true,
            required_params = this.param.required,
            optional_params = this.param.optional;
        for(var i=0,len=required_params.length;i<len;i++){
            if(!this[required_params[i]]){
                valid = false;
            }else if(this[required_params[i]] && !this.is_valid(required_params[i],this[required_params[i]])){
                valid = false;
            }
        }

        return valid;
    },

    create: function(callback){
        if(this.checkParam()){
        	$.post(this.save_url,{type:"ajax",from:"web",param:this.name},callback);
        }
    },

    update: function(callback){
        var properties = this.properties,updatems = new Array();
        for(var i=0,len = properties.length; i<len; i++){

            if(properties[i] == "pub"){
                if(this[properties[i]] != undefined){
                    updatems.push(properties[i]);
                }
            }else{
                if(this[properties[i]] && properties[i] != "id"){
               		updatems.push(properties[i]);
            	}
            }
        }
        
        if(updatems.length == 1){
            var item = updatems[0];
            switch(item){
                case "name": return this.altername(callback);break;
                case "pub": return this.togglepublic(callback);break;
                default: return false;break;
            }
        }
        return false;
    },

    altername: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var param = {folder_id:this.id,folder_name:this.name};
    	$.post(this.alter_name_url,{type:"ajax",from:"web","param":param},callback);
    },

    togglepublic: function(callback){
        if(this.is_valid("public",this.pub)){
            var param = {id:this.id,pub:this.pub};
            $.post(this.public_url,{type:"ajax",from:"web","param":param},callback);
        }
    },

    push: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		var param = {folder_id:this.id};
    		$.post(this.push_url,{type:"ajax",from:"web","param":param},callback);
    	}
    },

    unpush: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		var param = {folder_id:this.id};
    		$.post(this.unpush_url,{type:"ajax",from:"web","param":param},callback);
    	}
    },

    remove_from_issue: function(callback){
    	callback = $.isFunction(callback) ? callback : null;

    	if(this.is_valid("isid",this.isid) && this.is_valid("id",this.id)){
    		var param = {
    			isid: this.isid,
    			folder_id: this.id
    		};
    		$.post(this.remove_issue_url,{type:"ajax",from:"web",param:param},callback);
    	}
    	return this;
    },

    bulk_move_in: function(ids,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if($.isArray(ids) && ids.length  > 0){
    		Bookmark.prototype.bulkmove(ids,this.id,callback);
    	}
    	return this;
    },

    bulk_copy_in: function(ids,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if($.isArray(ids) && ids.length  > 0){
    		Bookmark.prototype.bulkcopy(ids,this.id,callback);
    	}
    	return this;
    },

    construct_item: function(page){
    	this.html = "";
    	if(page && page == "config"){
    		this.curpage = "config";
    		this.html = "<div class=\"folder public sortable\" data-cid=\""+this.id+"\"><h3><a href=\"#\" class=\"name\">"+this.name+"</a></h3><a href=\"#\" class=\"del operation\"></a><a href=\"#\" class=\"rename operation\"></a><a href=\"#\" class=\"drag operation sort_trigger\" style=\"cursor: ns-resize;\"></a></div>";
    	}
    	return this;
    },

    display_items: function(){
    	if(this.curpage == "config" && !!this.html){
    		$("#bm_cons .folder").last().after(this.html);
    	}
    },

    del: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		$.post(this.del_url,{type:"ajax",from:"web",param:this.id},callback);
    	}
    },

    is_valid: function(field,value){
        switch(field){
            case "id": return $.isNumeric(value) && isFinite(value);break;
            case "isid": return $.isNumeric(value) && isFinite(value);break;
            case "name": return $.type(value) == "string" && value!="";break;
            case "public": return (parseInt(value) === 1 || parseInt(value) === 0 );break;
            default: return false;break;
        };
    },

    param : {
        optional : ["id","public"],
        required : ["name"]
    }
};

var User = function(o){
	this.nickname = o.nickname || "";
	this.password = o.password || "";
	this.old_password = o.old_password || "";
};

User.prototype = {
	alter_nickname_url: "/user/alter_nickname",
    sync_url: "/user/sync_request",
	reset_pwd_url: "/user/reset_password",
	cancel_granted_url: "/user/cancel_granted",
	check_granted_url: "/user/check_granted",
	set_typeface_url: "/user/switch_font",
    set_theme_url: "/user/switch_theme",
    set_fontsize_url: "/user/switch_fontsize",
    show_favicon_url: "/user/show_favicon",
    set_open_mode_url: "/user/set_open_mode",
    set_threshold_size_url: "/user/set_threshold_size",
    clear_pass_url: "/user/clear_device_pass",
    set_image_drop_url: "/user/set_image_drop_bhvir",
    set_schedule_url: "/user/set_email_schedule",
    set_lang_url: "/user/switch_lang",
    swap_share_order_url: "/user/swap_share_order",
	properties: ["nickname","password"],
    fontsizes: ["small","medium","large"],
    langs: ["zh_cn","en","zh_tw","jp"],

    //发送同步请求，同步所有应用只要已经被用户授权
    sync: function(force){
        //未经过授权则不同步
        if(!!!window._evgranted && !!!window._gtgranted && !!!window._yxgranted) return false;
        
        //两次同步时间间隔必须是1个钟头
        if(!!!force && localStorage){
            var now_ms = Date.now();
            if(localStorage.last_sync != undefined){
                if( (now_ms - localStorage.last_sync) < 60*60*1000 ) return false;
            }
            localStorage.last_sync = now_ms;
        }

        if(console) console.log("syncing");

        $.ajax({
            url: this.sync_url,
            type: "get",
            timeout: 5000,
            global: true,
            data: {type:"ajax",from:"web"},
            //context
            beforeSend: function(jqXHR,options){

            },

            done: function(data){

            },

            fail: function(x,t,m){
                console.log(x);
                console.log(t);
                console.log(m);
            },

            statusCode: {
                404: function(){
                    alert("page not found");
                }
            }
        });
    },

    safe_sync: function(force){
        if(window._sync_agent){
            console.log("syncing");
            _sync_agent.postMessage({command:'sync',url:this.sync_url,data:{type:"ajax",from:"web"}});
        }else{
            this.sync(force);
        }
    },

	update: function(callback){
		var properties = this.properties,updatems = new Array();
        for(var i=0,len = properties.length; i<len; i++){
            if(this[properties[i]] && properties[i] != "id"){
                updatems.push(properties[i]);
            }
        }

        if(updatems.length == 1){
            var item = updatems[0];
            switch(item){
                case "nickname": return this.alter_nickname(callback);break;
                case "password": return this.reset_pwd(callback);break;
                default: return false;break;
            }
        }
        return false;
	},

	reset_pwd: function(callback){
		callback = $.isFunction(callback) ? callback : null;
		//必须提供旧密码
		if(!this.old_password){
			return false;
		}

		if(this.is_valid("password",this.password) && this.is_valid("password",this.old_password)){
			$.post(this.reset_pwd_url,{type:"ajax",from:"web",old_pwd:this.old_password,pwd:this.password},callback);
		}
	},

	alter_nickname: function(callback){
		callback = $.isFunction(callback) ? callback : null;
		if(this.is_valid("nickname",this.nickname)){
			$.post(this.alter_nickname_url,{type:"ajax",from:"web",nickname:this.nickname},callback);
		}
	},

	check_granted: function(app,callback){
		callback = $.isFunction(callback) ? callback : null;
		if(this.is_valid("app",app)){
			$.post(this.check_granted_url,{type:"ajax",from:"web",app:app},callback);
		}
	},

	cancel_granted: function(app,callback){
		callback = $.isFunction(callback) ? callback : null;
		if(this.is_valid("app",app)){
			$.post(this.cancel_granted_url,{type:"ajax",from:"web",app:app},callback);
		}
	},

    swap_share_order: function(src_pos,dst_pos,callback){
        callback = $.isFunction(callback) ? callback : null;
        $.post(this.swap_share_order_url,{type:"ajax",from:"web",src_pos:src_pos,dst_pos:dst_pos},callback);
    },

    //设置主题
    set_theme: function(theme_no,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("theme_no",theme_no)){
            $.post(this.set_theme_url,{type:"ajax",from:"web",theme_no:theme_no},callback);
        }
    },

    //设置语言
    set_lang: function(lang,callback){
        callback = $.isFunction(callback) ? callback : null;
        
        if(this.is_valid("lang",lang)){
            $.post(this.set_lang_url,{type:"ajax",from:"web",lang:lang},callback);
        }
    },

    //设置字体TT
    set_typeface: function(font_no,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("font_no",font_no)){
            $.post(this.set_typeface_url,{type:"ajax",from:"web",font_no:font_no},callback);
        }
    },

    //设置字体大小
    set_fontsize: function(fontsize,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("fontsize",theme_no)){
            $.post(this.set_fontsize_url,{type:"ajax",from:"web",fontsize:fontsize},callback);
        }
    },

    //设置插件打开模式
    set_open_mode: function(mode,callback){
        callback = $.isFunction(callback) ? callback : null;

        if(mode == 1 || mode == 0){
            $.post(this.set_open_mode_url,{type:"ajax",from:"web",mode:mode},callback);
        }
    },

    //是否展示网址favicon图片
    show_favicon: function(show,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(show === true || show === false){
            $.post(this.show_favicon_url,{type:"ajax",from:"web",show:show},callback);
        }
    },

    //设置能够进入图片墙的图片尺寸
    set_threshold_size: function(size,callback){
        callback = $.isFunction(callback) ? callback : null;
        $.post(this.set_threshold_size_url,{type:"ajax",from:"web",size:size},callback);
    },

    set_email_schedule: function(when,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("hour",when)){
            $.post(this.set_schedule_url,{type:"ajax",from:"web",when:when},callback);
        }
    },

    set_image_drop_bhvir: function(download,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(download == true || download == false){
            $.post(this.set_image_drop_url,{type:"ajax",from:"web",download:download},callback);
        }
    },

    //清除某设备的以保存密码强制从新登陆
    clear_device_pass: function(device,callback){
        callback = $.isFunction(callback) ? callback : null;
        $.post(this.clear_pass_url,{type:"ajax",from:"web",device:device},callback);
    },

	is_valid: function(field,value){
		switch(field){
			case "nickname": return !(/[<>()*&^%$#@!~]/.test(value) || /^\s{0,}$/.test(value) || value.length > 20);break;
			case "password": return (/[0-9a-z.]{4,}/i.test(value));break;
			case "email": return email_regexp.test(value);break;
			case "app": return (/(evernote|gtask|yinxiang)/.test(value));break;
			case "uid": return /[\d]+/.test(value) && value > 0;break;
            case "mode": return (value == 1 || value == 0);break;
            case "fontsize": return $.inArray(value,this.fontsizes) >= 0;break;
            case "font_no": return !isNaN(value);break;
            case "theme_no": return !isNaN(value);break;
            case "hour": return (value >= -1 && value < 24);break;
            case "lang": return ($.inArray(value,this.langs) >= 0 );break;
			default: return false;
		};
	}
};


var ImageItem = function(o){
	this.id = o.id || 0;
	this.url = o.url || "";
	this.width = o.width || 0;
	this.height = o.height || 0;
}

ImageItem.prototype = {
	url_lib: {
		load_images:"/image/load_images",
		get_image_tags: "/image/get_image_tags",
		exclude: "/image/exclude",
        bulk_exclude: "/image/bulk_exclude"
	},

	//加载所有图片数据
	load_images: function(tag_id,callback){
		if(isNaN(tag_id) && $.isFunction(tag_id)){
			callback = tag_id;
			tag_id = 0;
		}

		if(isNaN(tag_id)) return false;
		callback = $.isFunction(callback) ? callback : null;
		$.post(this.url_lib["load_images"],{type:"ajax",from:"web",tag_id:tag_id},callback);
	},

	//得到所有图片tag
	get_image_tags: function(callback){
		callback = $.isFunction(callback) ? callback : null;
		$.post(this.url_lib["get_image_tags"],{type:"ajax",from:"web"},callback);
	},

	//删除
	exclude: function(callback){
		callback = $.isFunction(callback) ? callback : null;
		$.post(this.url_lib["exclude"],{type:"ajax",from:"web",image_id:this.id},callback);
	},

    //批量删除
    bulk_exclude: function(exclude_ids,callback){
        if(!$.isArray(exclude_ids) || exclude_ids.length == 0) return false;
        callback = $.isFunction(callback) ? callback : null;
        $.post(this.url_lib["bulk_exclude"],{type:"ajax",from:"web",exclude_ids:exclude_ids},callback);
    },

    // 得到图片对应的便签内容
    get_note: function(){

    },

	//单张分享
	share: function(callback){

	},

	//多张分享
	bulk_share: function(callback){

	},
	
	//单张下载
	download: function(callback){

	},

	//多张下载
	buld_download: function(callback){

	}
};

var Post = function(o){
	this.id = o.id || 0;
	this.type = o.type || "";
    this.title = o.title || "";
	this.items = o.items || new Array();
    this.desc = o.desc || "";
};

Post.prototype = {
	url_lib: {
        publish: "/post/publish",
        set_title: "/post/set_title",
        set_desc: "/post/set_desc"
	},
    types: ["image","note"],

	publish: function(callback){
        callback = $.isFunction(callback) ? callback : null;

        if(this.is_valid("items",this.items) && this.is_valid("type",this.type)){
            $.post(this.url_lib["publish"],{type:"ajax",from:"web",items:this.items,post_type:this.type},callback);
        }
	},

    set_title: function(callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("title",this.title)){
            $.post(this.url_lib["set_title"],{type:ajax,from:"web",title:this.title,post_id:this.id},callback);
        }
    },

    set_desc: function(callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("desc",this.desc)){
            $.post(this.url_lib["set_desc"],{type:"ajax",from:"web",desc:this.desc,post_id:this.id},callback);
        }
    },

    is_valid: function(field,value){
        switch(field){
            case "type": return $.inArray(value,this.types) != -1;break;
            case "items": return $.isArray(value) && value.length > 0;break;
            case "desc": return value != "" && value.length < 1000;break;
            case "title": return value != "" && value.length < 100; break;
            default: return false;
        }
    }
};


var Note = function(o){
    this.title = o.title || "";
    this.id = o.id || 0;
    this.content = o.content || "";
    this.tags = o.tags || null;
    this.finished = o.finished || 0;
    this.deadline = o.deadline || 0;
    this.is_deleted = o.is_deleted || false;
    this.create_time = o.create_time || 0;
    this.task_id = o.task_id || 0;
    this.is_task = o.is_task || false;
    this.is_today = o.is_today || false;
    this.colored_tags = o.colored_tags || null;
    this.position = o.position || null;

    this.get_title = function(){
        return this.title;
    };

    this.get_content = function(){
        return this.content;
    };

    this.get_notebook = function(){

    };
    return this;
};

Note.prototype = {
	at_url : "/note/at",
	share_insite_url : "/note/share_insite",
    save_url : "/note/save",
    update_url : "/note/save",
    del_url: "/note/del",
    finish_url: "/note/finish",
    recover_url: "/note/recover",
    search_url: "/note/search",
    set_order_url: "/note/config_display_order",
    set_order_beta_url: "/note/config_display_order_beta",
    set_task_url: "/note/set_task",
    unset_task_url: "/note/unset_task",
    set_deadline_url: "/note/set_deadline",
    move_today_url: "/note/move_to_today",
    move_later_url: "/note/move_to_later",
    load_more_url: "/note/load_more",
    save_last_opened_url: "/note/save_last_opened",
    fetch_url: "/note/fetch_new",
    fetch_in_tag_url: "/note/fetch_tag_new",
    check_cache_status_url: "/note/check_cache_uptodate",
    classify_url: "/note/classify",
    add_tag_url: "/note/add_tag",
    remove_tag_url: "/note/remove_tag",
    get_info_url: "/note/get_info",
    get_tag_ids_url: "/note/get_tag_ids",
    get_num_in_tag_url: "/note/get_num_in_tag",
    load_finished_url: "/note/load_finished",
    get_dates_url: "/note/get_active_dates",
    get_recent_dates_url: "/note/get_recent_dates",
    get_recent_devices_url: "/note/get_recent_devices",
    get_note_url: "/note/get_note_by_id",
    get_notes_loc_url: "/note/get_notes_loc",
    get_notes_by_ids_url: "/note/get_notes_by_ids",
    get_history_url: "/note/get_notes_by_time",
    get_notes_by_device_url: "/note/get_notes_by_device",
    get_archived_url:"/note/get_archived_notes",//可选择需要排除的id
    load_archived_url: "/note/load_from_archive",//一次性全部加载
    get_in_tag_url: "/note/get_notes_in_tag",
    get_today_tasks_url: "/note/get_today_tasks",
    add_coords_url: "/note/add_coords",
    copy_buzz_url: "/note/copy_buzz",
    remove_buzz_url: "/note/remove_buzz",
    save_img_url: "/note/save_img",
    contribute_url: "/note/contribute",
    save_link_url: "/note/save_link",
    properties : ["id","tag_id","tag","content"],
    all_saved_con : ".all",
    finished_html: "",
    order: 0,
    limit: 10,
    param : {
        optional : ["notebook","id","content"],
        required : ["content"]
    },
    blank_note : "<div class=\"note-con new\"><form class=\"note\"><div class=\"field-con\"><div class=\"note editable expand70-600\" data-value=\"\"  spellcheck=false contenteditable=\"true\" tabIndex=\"-1\"></textarea></div><div class=\"checkbox\"></div><div class=\"bottom\"><a href=\"#\" class=\"submit\"></a><span class=\"hint\"><italic>Press <i>[ctrl+S]</i> to save or click --></italic></span></div></form></div>",
    
    checkParam : function(){
        var valid = true;
        if((this.content == "" && this.title == "") || isNaN(this.id)){
            valid = false;
        }
        var required_params = this.param.required;
        for(var i=0,len=required_params.length;i<len;i++){
            if(!this[required_params[i]]){
                valid = false;
            }
        }
        return valid;
    },

    //传入格式为 2013-04-30 23：03：32时间参数以及回调函数
    setTask: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var note = this;
    	if(this.is_valid("end_date",this.deadline)){
    		if(console) console.log(this);

    		$.post(this.set_task_url,{type:"ajax",from:"web",id:this.id,end_date:this.deadline},function(data){
    			//调用自定义回调函数
            	if($.isFunction(callback)){
            		callback(data);
            	}

            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync";
                        var params = {id:note.id,oper:"deadline",value:note.deadline,international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data:"+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync";
                        var params = {id:note.id,oper:"deadline",value:note.deadline};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data:"+data);
                            });
                        }
                    }
                }

                //如果用户允许gtask同步
                if(!!window._gtgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/task/gtsync",params = {task_id:feedback.task_id,oper:"create"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("gtask data:"+data);
                            });  
                        }
                    }
                }
    		});
    	}
    },

    unsetTask: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
        
    	if(this.is_valid("id",this.id) && this.is_valid("task_id",this.task_id)){
    		$.post(this.unset_task_url,{type:"ajax",from:"web",id:this.id,task_id:this.task_id},callback);
            //在evernote上去掉提醒
            if(!!window._evgranted){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    var url = "/note/evsync", params = {id:note.id,oper:"clear",international:1};
                    if(window._sync_agent){
                        window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                    }else{
                       $.post(url,params,function(data){
                            if(console) console.log("evernote data: "+data);
                        }); 
                    }
                }
            }

            if(!!window._yxgranted){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    var url = "/note/evsync", params = {id:note.id,oper:"clear"};
                    if(window._sync_agent){
                        window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                    }else{
                       $.post(url,params,function(data){
                            if(console) console.log("yinxiang data: "+data);
                        }); 
                    }
                }
            }

            //去掉对应的gtask任务，如果存在的话
            if(!!window._gtgranted){
                var feedback = get_json_feedback(data);
                if(feedback.status == "ok"){
                    var url = "/task/gtsync", params = {task_id:feedback.task_id,oper:"delete"};
                    if(window._sync_agent){
                        window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                    }else{
                       $.post(url,params,function(data){
                            if(console) console.log("gtask data: "+data);
                        }); 
                    }
                }
            }
    	}
    },

    moveToLater: function(callback){
    	callback = $.isFunction(callback) ? callback : null;

    	if(this.is_valid("id",this.id)){
    		$.post(this.move_later_url,{type:"ajax",from:"web",note_id:this.id},callback);	
    	}
    },

    moveToToday: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		$.post(this.move_today_url,{type:"ajax",from:"web",note_id:this.id},callback);	
    	}
    },

    setDeadline: function(set_position,callback){
    	var note = this;
    	var params;

    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id) && this.is_valid("deadline",this.deadline)){
    		if(set_position === false){
	    		//不自动给上顺序
	    		params = {type:"ajax",from:"web",id:this.id,deadline:this.deadline,set_position:false};
	    		callback = $.isFunction(callback) ? callback : null;
	    	}else{
	    		params = {type:"ajax",from:"web",id:this.id,deadline:this.deadline};
	    		callback = $.isFunction(set_position) ? set_position : null;
	    	}

    		$.post(this.set_deadline_url,params,function(data){
    			//调用自定义回调函数
            	if($.isFunction(callback)){
            		callback(data);
            	}

            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync", params = {id:note.id,oper:"deadline",value:note.deadline,international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync", params = {id:note.id,oper:"deadline",value:note.deadline};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }

                //为gtask任务设定时间，如果存在的话
                if(!!window._gtgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/task/gtsync",params = {task_id:note.task_id,oper:"due",value:note.deadline};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("gtask data: "+data);
                            });
                        }
                    }
                }
    		});
    	}
    },

    set_display_order: function(order_str,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("order_str",order_str)){
    		$.post(this.set_order_url,{type:"ajax",from:"web",order_str:order_str},callback);
    	}
    },

    set_display_order_beta: function(srcindex,dstindex,callback){
    	callback = $.isFunction(callback) ? callback : null;
        
    	$.post(this.set_order_beta_url,{type:"ajax",from:"web","srcindex":srcindex,"dstindex":dstindex},callback);
    },

    save: function(callbefore,callback){
        if(arguments.length == 2){
            if(jQuery.isFunction(callbefore)){
                callbefore.call(this);
            }
        }else if(arguments.length == 1){
            callback = callbefore;
        }else{
            callback = function(){};
        }

        return (this.id && this.id>0) ? this.update(callback) : this.create(callback);
    },

    create: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
        if(this.checkParam()){
            $.post(this.save_url,{"type":"ajax","from":"web",params:{id:this.id,title:this.title,content:this.content,tags:this.tags}},function(data){
            	if(console) console.log(data);
                //调用自定义回调函数
            	if($.isFunction(callback)){
            		callback(data);
            	}

            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok" && feedback.id){
                        var url = "/note/evsync",params = {id:feedback.id,oper:"create",international:1};
	            		
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log(data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok" && feedback.id){
                        var url = "/note/evsync",params = {id:feedback.id,oper:"create"};
                        
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log(data);
                            });
                        }
                    }
                }
            });
        }
    },

    contribute: function(callback){
        callback = $.isFunction(callback) ? callback : null;

        if(!isNaN(this.id)){
            $.post(this.contribute_url,{type:"ajax",from:"web",id:this.id},callback);
        }
    },

    _save_image: function(img){
    	$.post(this.save_img_url,{img:img,id:this.id},function(data){
    		console.log(data);
    	});
    },

    _save_link: function(link){
    	$.post(this.save_link_url,{link:link,id:this.id},function(data){
    		console.log(data);
    	});
    },

    //用户自定义的标签不在此处添加，这里只负责分类，分为五大类:任务，记事，图片，连接，联系(邮箱或电话号码或地址)
    classify: function(default_type,callback){
    	callback = $.isFunction(callback) ? callback : null;
		var stick_types = new Array(),note = this;
			this.hasImage = false;

		//在默认面板中添加
		if(default_type != "all" && default_type != "custom"){
            if(default_type == "images" || default_type == "links"){
                if(link_regexp.test(note.content) || ip_link_regexp.test(note.content)){
                    //如果包含链接才加入图片和链接标签，否则不加入此俩个标签
                    stick_types.push(default_type);
                }
            }else{
                stick_types.push(default_type);
            }
            
			if(default_type == "tasks"){
				//如果是在任务面板中添加，则将其今日设为默认完成日期
				//将任务设为今日任务
                //var date = get_formated_time(Date.now(),false);
                //this.deadline = null;
                //var note = this;
                // this.setTask(function(data){
                //     if(console) console.log(data);
                //     var response = get_json_feedback(data);
                //     if(response.status == "ok"){
                //         if(response.task_id && response.task_id > 0){
                //             //将任务id加入便签中
                //             var note_con = $(".note-con[data-id=\""+note.id+"\"]").get(0);

                //             //先将新建任务的position设为最高，再change_position("down",pos,response.position)
                //             var initpos = $(".task.note-con").not(".newly_saved").first().data("position");
                            
                //             if(!initpos){
                //             	initpos = 1;
                //             }else{
                //             	initpos++;
                //             }

                //             if(initpos){
	               //              $(note_con).data({"task-id":response.task_id,"position":initpos}).attr({"data-task-id":response.task_id,"data-position":initpos});
	               //              if(response.position){
	               //              	change_position("down",initpos,response.position);
	               //              }
	               //          }
	                        
                //             recount_today_tasks("addnew");
                //         }
                //     }else{
                //         //发送错误
                //     }
                // });	
			}
		}

		//当前不在任务面板，也不在记事面板，则默认归类为记事
		if(default_type != "tasks" && default_type !="notes"){
			stick_types.push("notes");
		}
        
        //添加新记事成功，对其内容进行进一步处理
        if(link_regexp.test(this.content) || ip_link_regexp.test(this.content)){
            //添加链接标签
        	if($.inArray("links",stick_types) === -1) stick_types.push("links");
        	var links = this.content.match(link_regexp);
            
        	//若匹配到了ip链接地址，也添加进去
        	if(ip_link_regexp.test(this.content)){
        		var ip_links = this.content.match(ip_link_regexp);
        		links.concat(ip_links);
        	}
        	
        	var len = links.length;
        	var link = "";
            
        	for(var i=0; i<len; i++){
				link = links[i];

				// //如果链接是以图片后缀结尾
				// if(link.match(/[^\/]+\.(?:png|jpg|jpeg|svg|bmp|gif|tiff)\b/i)){
				// 	//添加图片标签
				// 	this.hasImage = true;
				// 	if($.inArray("images",stick_types) === "-1") stick_types.push("images");
				// 	break;
				// }else{
					if(link.indexOf("://") == "-1"){
						link = "http://"+link;
					}

					var that = this;
					is_image_url(link,function(url,img){
						if(img){
							if(!that.hasImage){
								that.hasImage = true;

								//因为此函数是异步进行的，所以需要单独添加图片标签
								$.post(that.classify_url,{from:"web",type:"ajax",param:["images"],id:that.id},function(data){
									if(callback) callback({types:["images"],data:data});
					        	});
							}

							//保存此图片链接，尺寸
							var img_obj = {
								url: link,
								width: img.width,
								height: img.height
							};
							that._save_image(img_obj);
						}else{
							var link_obj = {
								url: link
							};
							that._save_link(link_obj);
						}
					});
				//}
        	}
        }

        if(is_contact(this.content)>0){
            //添加联系标签
            if($.inArray("contacts",stick_types) === "-1") stick_types.push("contacts");
        }
        
        if(stick_types.length > 0){
        	$.post(this.classify_url,{from:"web",type:"ajax",param:stick_types,id:this.id},function(data){
        		if(callback) callback({types:stick_types,data:data});

        		var response = get_json_feedback(data);
        		if(response.status == "ok"){
                    //附上任务的信息
                    if(response.task_id && response.task_id > 0){
                        //将任务id加入便签中
                        var note_con = $(".note-con[data-id=\""+note.id+"\"]").get(0);

                        //先将新建任务的position设为最高，再change_position("down",pos,response.position)
                        var initpos = $(".task.note-con").not(".newly_saved").first().data("position");
                        
                        if(!initpos){
                            initpos = 1;
                        }else{
                            initpos++;
                        }

                        if(initpos){
                            $(note_con).data({"task-id":response.task_id,"position":initpos}).attr({"data-task-id":response.task_id,"data-position":initpos});
                            if(response.position){
                                change_position("down",initpos,response.position);
                            }

                            //当存在今日任务的时候才进行改序，若只有以后任务，则直接放在最上方，无需改序
                            // if(response.position && initpos > response.position){
                            //     change_position("down",initpos,response.position);
                            // }
                        }
                        
                        //recount_today_tasks("addnew");

                        //在evernote上创建reminder
                        if(!!window._evgranted){
                            var url = "/note/evsync",params = {id:note.id,oper:"task_tag",international:1};
                
                            if(window._sync_agent){
                                window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                            }else{
                                $.post(url,params,function(data){
                                    if(console) console.log("evernote data: "+data);
                                });
                            }
                        }

                        if(!!window._yxgranted){
                            var url = "/note/evsync",params = {id:note.id,oper:"task_tag"};
                
                            if(window._sync_agent){
                                window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                            }else{
                                $.post(url,params,function(data){
                                    if(console) console.log("yinxiang data: "+data);
                                });
                            }
                        }

                        //创建gtask
                        if(!!window._gtgranted){
                            var url = "/task/gtsync",params = {task_id:response.task_id,oper:"create"};
                            if(window._sync_agent){
                                window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                            }else{
                                $.post(url,params,function(data){
                                    if(console) console.log("gtask data: "+data);
                                });
                            }
                        }
                    }

                    if(!!window._evgranted){
                        var url = "/note/evsync",params = {id:note.id,oper:"tag",international:1};
            
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
                    }

                    if(!!window._yxgranted){
                        var url = "/note/evsync",params = {id:note.id,oper:"tag"};
            
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
        		}
        	});
        }

    	return stick_types;
    },

    update: function(callback){
        //find all properties that have been set
        //if there is only one property has been set, we just change that one
        //else we request update method on the server
        var properties = this.properties,updatems = new Array();
        for(var i=0,len = properties.length; i<len; i++){
            if(this[properties[i]] && properties[i] != "id"){
                updatems.push(properties[i]);
            }
        }

        if(updatems.length == 1){
            var item = updatems[0];
            switch(item){
                case "content": return this.updateContent(callback);break;
                case "tag_id": return this.addTag(callback);break;
                case "deadline": return value.match(/^\d{4}\-\d{1,2}\-\d{1,2}$/);break;
                case "tag": return this.addTag(callback);break;
                default: return false;break;
            }
        }
        return false;
    },

    updateContent: function(callback){
    	var note = this;
        if(this.is_valid("content",this.content)){
            $.post(this.update_url,{"type":"ajax","from":"web",params:{id:this.id,title:this.title,content:this.content}},function(data){
            	if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"content",international:1};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"content"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }

                if(!!window._gtgranted){
                    var feedback = get_json_feedback(data);
                
                    if(feedback.status == "ok" && note.task_id && note.task_id > 0){
                        var url = "/task/gtsync",params = {task_id:note.task_id,oper:"content"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("gtask data: "+data);
                            });
                        }
                    }
                }
            });
        }
    },

    add_coords: function(coords,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var note = this;
    	if(this.is_valid("coords",coords)){
    		$.post(this.add_coords_url,{type:"ajax",from:"web",id:this.id,coords:coords},function(data){
    			if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
            			console.log(coords);
                        var url = "/note/evsync",params = {id:note.id,oper:"coords",value:coords,international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        console.log(coords);
                        var url = "/note/evsync",params = {id:note.id,oper:"coords",value:coords};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }

    		});
    	}
    },

    addTag: function(tag_id,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var note = this;
    	if(this.is_valid("id",this.id) && this.is_valid("tag_id",tag_id)){
    		$.post(this.add_tag_url,{type:"ajax",from:"web",tag_id:tag_id,note_id:this.id},function(data){
    			if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"tag",international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"tag"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }
    		});
    	}
    },

    removeTag: function(tag_id,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var note = this;
    	if(this.is_valid("id",this.id) && this.is_valid("tag_id",tag_id)){
    		$.post(this.remove_tag_url,{type:"ajax",from:"web",tag_id:tag_id,note_id:this.id},function(data){
    			if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"tag",international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"tag"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }
    		});
    	}
    },

    del: function(callback){
    	var note = this;
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		$.post(this.del_url,{"type":"ajax","from":"web",id:this.id},function(data){
    			if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"delete",international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"delete"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }

                if(_gtgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok" && note.task_id && note.task_id > 0){
                        var url = "/task/gtsync",params = {task_id:note.task_id,oper:"delete"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("gtask data: "+data);
                            });
                        }
                    }
                }
    		});
    	}
    },

    finish: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var note = this;
    	if(this.is_valid("id",this.id)){
    		$.post(this.finish_url,{"type":"ajax","from":"web",id:this.id},function(data){
    			if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"finish",international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evernote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"finish"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }

                if(!!window._gtgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok" && note.task_id && note.task_id > 0){
                        var url = "/task/gtsync",params = {task_id:note.task_id,oper:"status",value:"completed"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("gtask data: "+data);
                            });
                        }
                    }
                }
    		});
    	}
    },

    recover: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	var note = this;
    	if(this.is_valid("id",this.id)){
    		$.post(this.recover_url,{"type":"ajax","from":"web",id:this.id},function(data){
    			if($.isFunction(callback)){
            		callback(data);
            	}
            	
            	//执行后续后天操作，如进行同步
            	//如果用户设置了同步，则进行同步
            	if(!!window._evgranted){
            		var feedback = get_json_feedback(data);
            		if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"recover",value:note.deadline,international:1};
	            		if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("evenote data: "+data);
                            });
                        }
            		}
            	}

                if(!!window._yxgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok"){
                        var url = "/note/evsync",params = {id:note.id,oper:"recover",value:note.deadline};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("yinxiang data: "+data);
                            });
                        }
                    }
                }

                if(!!window._gtgranted){
                    var feedback = get_json_feedback(data);
                    if(feedback.status == "ok" && note.task_id && note.task_id>0){
                        var url = "/task/gtsync",params = {task_id:note.task_id,oper:"status",value:"needsAction"};
                        if(window._sync_agent){
                            window._sync_agent.postMessage({command:"_sync",url:url,data:params});
                        }else{
                            $.post(url,params,function(data){
                                if(console) console.log("gtask data: "+data);
                            });
                        }
                    }
                }
    		});
    	}
    },

    addBlank : function(){
        $("#blank_sheet").prepend(this.blank_note);
    },


    /*----------------- 取 -------------------*/
    fetch: function(last_refresh,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.fetch_url,{"last_refresh":last_refresh},callback);
    },

    fetch_in_tag: function(tag_id,last_refresh,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.fetch_in_tag_url,{"last_refresh":last_refresh,"tag_id":tag_id},callback);
    },

    get_notes_in_tag: function(tag_id,limit,offset_id,callback){
    	limit = !!limit ? limit : this.limit;
    	callback = $.isFunction(callback) ? callback : null;
    	
    	if(this.is_valid("tag_id",tag_id)){
    		$.post(this.get_in_tag_url,{type:"ajax",from:"web",tag_id:tag_id,offset_id:offset_id,limit:limit},callback);
    	}
    },

    get_today_tasks: function(callback){
        callback = $.isFunction(callback) ? callback : null;
        $.post(this.get_today_tasks_url,{type:"ajax",from:"web"},callback);
    },

    search: function(str,exclude_ids,limit,callback){
    	limit = !!limit ? limit : this.limit;
    	callback = $.isFunction(callback) ? callback : null;
    	//offset = !isNaN(offset) && isFinite(offset) ? offset : 0;
    	if(this.is_valid("search_str",str)){
    		$.post(this.search_url,{type:"ajax",from:"web",search_str:str,exclude_ids:exclude_ids,limit:limit},callback);
    	}
    },

    load_finished: function(limit,offset_id,callback){
    	limit = !!limit ? limit : this.limit;
    	callback = $.isFunction(callback) ? callback : null;
    	
    	
    	$.post(this.load_finished_url,{type:"ajax",from:"web",offset_id:offset_id,limit:limit},callback);
    },

    load_archived: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.load_archived_url,{type:"ajax",from:"web"},callback);
    },

    construct_item: function(exclass){
        //给便签添加额外的类
        exclass = !!exclass ? " "+exclass : "";

        //得到默认tag，及展示标签颜色值
        var str = default_class = today_class = default_tags_html = deadline_html = "",tag;
        if(this.id){
            //得到default_tag只是为了表上颜色块
            //或者名字应该取为get_colored_tag，因为不只是default tag才有color
            //如果含有带有颜色的标签
            /*if(this.colored_tags && this.colored_tags.length > 0){
                default_class = " has-colored";
                
                for(var i=0,len = this.colored_tags.length; i<len; i++){   7-13-去掉侧边颜色标记   +default_tags_html在下面的字符串中也被删除了
                    tag = this.colored_tags[i];
                    default_tags_html += "<div class=\"default_tag\" data-id=\""+tag.tag_id+"\" style=\"background:"+tag.tag_color+"\"></div>";
                }
            }
*/
            var is_task_class = this.is_task ? " task" : "";
            
            if(this.is_task && this.deadline){
                var deaddate = this.deadline.split(" ")[0];
                deadline_html = "<div class=\"deadline\"><span>"+deaddate+"</span></div>";
                var today = get_formated_time(Date.now(),false);
                //今天的任务
                if(!!parseInt(this.is_today)){
                    today_class = " today";
                }else{
                    today_class = "";
                }
            }

            var top_menu_html = "<div class=\"top-ops\">"+
                                    "<a href=\"#\" class=\"maximize-note\"><span class=\"ok-icon-maximize-note icon-font\"></span></a>"+
                                    "<a href=\"#\" class=\"minimize-note\"><span class=\"ok-icon-minimize-note icon-font\"></span></a>"+
                                "</div>";//7-13-删除了固定页面的按钮
            
            if(!parseInt(this.finished)){ //7-13-添加了字体图标
                if(this.is_task){
                    str = "<div class=\"note-con sortable task"+exclass+""+default_class+""+today_class+"\" id=\"note-"+this.id+"\" data-deadline=\""+(this.deadline ? this.deadline : 0)+"\" data-task-id=\""+(this.task_id > 0 ? this.task_id : 0)+"\" data-position=\""+this.position+"\" data-id=\""+this.id+"\">"+
                            "<form  class=\"note\"><div class=\"field-con\">"+
                            "<div class=\"entities-con\"><div class=\"img-entity\"></div></div>"+
                            "<div class=\"note editable expand0-150 loaded\" contenteditable=\"false\" tabIndex=\"-1\"  spellcheck=false >"+this.content+"</div></div>"+
                            "<div class=\"checkbox\"><span class=\"ok-icon-complete icon-font\"></span></div>"+
                            "<div class=\"bottom-menu\">"+
                                "<div class=\"op\"><a href=\"#\" class=\"more\"></a></div>"+
                                "<div class=\"op exit\"><a href=\"#\" class=\"share\"><span class=\"ok-icon-share icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"del\"><span class=\"ok-icon-del icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"cal\"><span class=\"ok-icon-cal icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"tags\"><span class=\"ok-icon-tag icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"info\"><span class=\"ok-icon-info icon-font\"></span></a></div></div>"+

                            "<a href=\"#\" class=\"drag_trigger sort_trigger\"></a>"+deadline_html+top_menu_html+"</form></div>";
                }else{
                    str = "<div class=\"note-con"+exclass+""+default_class+""+today_class+"\" id=\"note-"+this.id+"\" data-position=\""+this.position+"\" data-id=\""+this.id+"\">"+
                                "<form  class=\"note\"><div class=\"field-con\">"+
                                "<div class=\"entities-con\"><div class=\"img-entity\"></div></div>"+
                                    "<div class=\"note editable expand0-150 loaded\" contenteditable=\"false\" tabIndex=\"-1\"  spellcheck=false >"+this.content+"</div>"+
                                    "</div><div class=\"checkbox\"><span class=\"ok-icon-complete icon-font\"></span></div>"+
                                    "<div class=\"bottom-menu\"><div class=\"op\"><a href=\"#\" class=\"more\"></a></div>"+
                                    "<div class=\"op exit\"><a href=\"#\" class=\"share\"><span class=\"ok-icon-share icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"del\"><span class=\"ok-icon-del icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"cal\"><span class=\"ok-icon-cal icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"tags\"><span class=\"ok-icon-tag icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"info\"><span class=\"ok-icon-info icon-font\"></span></a></div></div>"+
                                    "<a href=\"#\" class=\"drag_trigger sort_trigger\"></a>"+top_menu_html+"</form>"+
                            "</div>";
                }
            }else{
                str = "<div class=\"note-con hidden"+is_task_class+""+exclass+""+default_class+""+today_class+"\" id=\"note-"+this.id+"\" data-deadline=\""+(this.deadline ? this.deadline : 0)+"\" data-task-id=\""+(this.task_id > 0 ? this.task_id : 0)+"\" data-position=\""+this.position+"\" data-id=\""+this.id+"\">"+
                            "<form class=\"finished note\">"+
                                "<div class=\"field-con\">"+
                                "<div class=\"entities-con\"><div class=\"img-entity\"></div></div>"+
                                "<div class=\"note editable expand0-150 loaded\" contenteditable=\"false\" tabIndex=\"-1\"  spellcheck=false >"+this.content+"</div></div>"+
                                "<div class=\"checkbox checked\"><span class=\"ok-icon-complete icon-font\"></span></div>"+
                                "<div class=\"bottom-menu\">"+
                                    "<div class=\"op\"><a href=\"#\" class=\"more\"></a></div>"+
                                    "<div class=\"op exit\"><a href=\"#\" class=\"share\"><span class=\"ok-icon-share icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"del\"><span class=\"ok-icon-del icon-font\"></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"cal\"><span class=\"ok-icon-cal icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"tags\"><span class=\"ok-icon-tag icon-font\"></span></a></div>"+
                                    "<div class=\"op hidden\"><a href=\"#\" class=\"info\"><span class=\"ok-icon-info icon-font\"></span></a></div>"+
                                "</div>"+
                                "<a href=\"#\" class=\"drag_trigger sort_trigger\"></a>"+deadline_html+top_menu_html+"</form>"+
                        "</div>";
            }
        }else{
            //如果不存在这个便签
            str = "<div class=\"note-con sortable"+is_task_class+""+exclass+" deleted\" style=\"display:none;\" data-position=\""+this.position+"\" data-id=\""+this.id+"\">"+
                        "<form  class=\"note\"><div class=\"field-con\">"+
                            "<div class=\"entities-con\"><div class=\"img-entity\"></div></div>"+
                            "<div class=\"note editable expand0-150 loaded\" contenteditable=\"false\" tabIndex=\"-1\"  spellcheck=false >"+this.content+"</div>"+
                            "<div class=\"checkbox\"><span class=\"ok-icon-complete icon-font\"></span></div>"+
                            "<div class=\"bottom-menu\">"+
                                "<div class=\"op\"><a href=\"#\" class=\"more\"></a></div>"+
                                "<div class=\"op exit\"><a href=\"#\" class=\"share\"><span class=\"ok-icon-share icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"del\"><span class=\"ok-icon-del icon-font\"></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"cal\"><span class=\"ok-icon-cal icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"tags\"><span class=\"ok-icon-tag icon-font\"></span></a></div>"+
                                "<div class=\"op hidden\"><a href=\"#\" class=\"info\"><span class=\"ok-icon-info icon-font\"></span></a></div>"+
                                "</div><a href=\"#\" class=\"drag_trigger\"></a></form>"+
                    "</div>";
        }
        
        this.html = str;
        return this;
    },

    get_notes_loc: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.get_notes_loc_url,{type:"ajax",from:"web"},callback);
    },

    get_note_by_id: function(id,callback){
        callback = $.isFunction(callback) ? callback : null;
        if(this.is_valid("id",id)){
            $.post(this.get_note_url,{type:"ajax",from:"web",id:id},callback);
        }
    },

    get_notes_by_ids: function(ids,callback){
    	if(!$.isArray(ids)){
    		return false;
    	}
    	callback = $.isFunction(callback) ? callback : null;
    	$.post(this.get_notes_by_ids_url,{type:"ajax",from:"web",ids:ids},callback);
    },

    get_info: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		$.post(this.get_info_url,{type:"ajax",from:"web",id:this.id},callback);
    	}
    },

    get_archived_notes: function(exclude_ids,limit,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.post(this.get_archived_url,{type:"ajax",from:"web",exclude_ids:exclude_ids,limit:limit},callback);
    },

    get_notes_by_time: function(time,exclude_ids,limit,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("time_or_date",time)){
    		$.post(this.get_history_url,{type:"ajax",from:"web",time:time,exclude_ids:exclude_ids,limit:limit},callback)
    	}
    },

    get_notes_by_device: function(device_name,exclude_ids,limit,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("device_name",device_name)){
    		$.post(this.get_notes_by_device_url,{type:"ajax",from:"web",device_name:device_name,exclude_ids:exclude_ids,limit:limit},callback)
    	}
    },

    get_num_in_tag: function(tag_id,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("tag_id",tag_id)){
    		$.post(this.get_num_in_tag_url,{type:"ajax",from:"web",tag_id:tag_id},callback);
    	}
    },

    check_cache_status: function(tag_id,last_refresh,num,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("tag_id",tag_id)){
    		$.get(this.check_cache_status_url,{type:"ajax",from:"web",tag_id:tag_id,last_refresh:last_refresh,num:num},callback);
    	}
    },

    save_last_opened: function(tag_id,callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("tag_id",tag_id)){
    		$.post(this.save_last_opened_url,{type:"ajax",from:"web",tag_id:tag_id},callback);
    	}
    },

    display_items: function(){
    	if(this.html){
    		$("#note #notes_con .inner-wrapper "+this.all_saved_con).append(this.html);
    	}
    	return this;
    },

    is_valid: function(field,value){
        switch(field){
            case "id": return $.isNumeric(value) && isFinite(value);break;
            case "tag_id": return $.isNumeric(value) && isFinite(value);break;
            case "task_id": return $.isNumeric(value) && isFinite(value);break;
            case "deadline": return (validate_date(value) || value == null);break;
            case "content": return $.type(value) == "string";break;
            case "search_str": return value.length < 100;break;
            case "coords": return value.match(/^\d[.0-9]+\|[.0-9]+\d$/);break;
            case "end_date": return (validate_date(value) || value==null);break;
            case "time_or_date": return validate_date(value);break;
            case "device_name": return $.type(value) == "string" && value.length < 50;break;
            case "tag": return $.type(value) == "string";break;
            case "order_str": return /^\d[\d\|]{0,}\d{0,}$/.test(value);break;
            default: return false;break;
        };
    },

    get_tag_ids: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	if(this.is_valid("id",this.id)){
    		$.post(this.get_tag_ids_url,{type:"ajax",from:"web",id:this.id},callback);
    	}
    },

    loadmore: function(exclude_ids,limit,callback){
    	callback = $.isFunction(limit) ? limit : ($.isFunction(callback) ? callback : null);
    	limit = !isNaN(limit) && limit>0 ? limit : this.limit;
    	if($.isArray(exclude_ids)){
    		$.get(this.load_more_url,{type:"ajax",from:"web",exclude_ids:exclude_ids,limit:limit},callback);
    	}
    },

    get_active_dates: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.get_dates_url,callback);
    },

    get_recent_devices: function(callback){
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.get_recent_devices_url,callback);
    },

    get_recent_dates: function(howmany,callback){
    	if(isNaN(howmany)){
    		return false;
    	}
    	callback = $.isFunction(callback) ? callback : null;
    	$.get(this.get_recent_dates_url,{"howmany":howmany},callback);
    }
};

var Triangle = function(o){
	this.bWidth = o.bWidth || 10;
	this.bColor = o.bColor || "#ccc";
	this.bgColor = o.bgColor || "transparent";
	this.toward = o.toward || "right";//then left side(border left) will be painted
	this.shadow = o.shadow || true;
	this.shadowColor = o.shadowColor || false;
	this.con = o.con || null;
	this.posi = o.posi;
}

Triangle.prototype = {
	t_html: "<div class=\"wst\"></div>",
	ts_html: "<div class=\"wst_s\"></div>",
	bWidth: 10,
	shadow: true,
	bgColor: "transparent",
	bColor: "#ccc",
	posi: 50,
	draw: function(){
		var conClasses,towards,bWidth,bColor,bgColor,props;
		var that = this;
			if($(this.con).hasClass("ws_done")){
				return false;
			}

			conClasses = $(this.con).attr("class");
			if(console) console.log(this.con);
			var matchClasses = conClasses.match(/\s?ws\_([\w]+)\_([\S]+)/g);
			if(matchClasses && matchClasses.length > 0){
				for(var i=0,len=matchClasses.length;i<len;i++){
					var matchClass = matchClasses[i].match(/\s?ws\_([\w]+)\_([\S]+)/);
					if(matchClass && matchClass.length == 3){
						that[matchClass[1]] = matchClass[2];
					}
				}
			}
			
			if(that.shadow){
				$(this.con).append(this.t_html+this.ts_html);
			}else{
				$(this.con).append(this.t_html);
			}

			var top,left,
			conW = $(this.con).prop("offsetWidth") || $(this.con).width(),
			conH = $(this.con).prop("offsetHeight") || $(this.con).height(),
			conL = $(this.con).offset().left,
			conT = $(this.con).offset().top,
			conPos = $(this.con).css("position"),
			conShadow = $(this.con).css("box-shadow"),
			conBColor = $(this.con).css("border-color"),
			conBWidth = parseInt($(this.con).css("border-width")) || 1;
			
			conBColor = that.shadowColor || conBColor;

			if(that.towards){
				switch(that.towards){
					case "right": that.opp = "left";break;
					case "left": that.opp = "right";break;
					case "bottom": that.opp = "top";break;
					case "top": that.opp = "bottom";break;
					defautl: break;
				}
			}else{
				if(console) console.warn("It seems there is no direction of triangle on the element below: ");
				if(console) console.log($(this.con).get(0));
				return false;
			}

			var style = {
				position: "absolute",
				border: that.bWidth+"px solid "+that.bgColor
			};
			style["border-"+this.opp+"-color"] = that.bColor;
			
			$(this.con).find(".wst").css(style);
			$(this.con).find(".wst_s").css(style);

			var tHeight = $(this.con).find(".wst").prop("offsetHeight") || 2*that.bWidth;
			var tWidth = $(this.con).find(".wst_s").prop("offsetWidth") || 2*that.bWidth;

			if(that.towards == "top"){
				 top = "-"+(tHeight-conBWidth);
				 left = (that.posi*2/100) * (conW - tWidth)/2;
			}

			if(that.towards == "left"){
				 top = (that.posi*2/100) * (conH - tHeight)/2;
				 left = "-"+(tWidth-2*conBWidth);
			}

			if(that.towards == "right"){
				 top = (that.posi*2/100) * (conH - tHeight)/2;
				 left = (conW-conBWidth);
			}

			if(that.towards == "bottom"){
				 left = (that.posi*2/100) * (conW - tWidth)/2;
				 top = (conH-conBWidth);
			}

			if(conPos == "static"){
				if($(this.con).get(0).offsetParent){
					top = parseInt(conT) + parseInt(top);
					left = parseInt(conL) + parseInt(left);
				}
			}

			$(this.con).find(".wst").css({top:top+"px",left:left+"px"});

			if(that.towards == "bottom"){
				$(this.con).find(".wst_s").css({top:(parseInt(top)+conBWidth)+"px",left:parseInt(left)+"px"});
			}else if(that.towards == "top"){
				$(this.con).find(".wst_s").css({top:(parseInt(top)-conBWidth)+"px",left:parseInt(left)+"px"});
			}else if(that.towards == "left"){
				$(this.con).find(".wst_s").css({top:parseInt(top)+"px",left:(parseInt(left)-conBWidth)+"px"});
			}else if(that.towards == "right"){
				$(this.con).find(".wst_s").css({top:parseInt(top)+"px",left:(parseInt(left)+conBWidth)+"px"});
			}

			
			
			var sStyle = {
				zIndex: -999
			};
			sStyle["border-"+that.opp+"-color"] = conBColor || "#ccc";
			$(this.con).find(".wst_s").css(sStyle);
			$(this.con).addClass("ws_done");
	},

	loadTriangle: function(){
		var conClasses,towards,bWidth,bColor,bgColor,props;
		var that = this;
		$(".ws_triangle").filter(":visible").each(function(){
			if($(this).hasClass("ws_done")){
				return false;
			}

			conClasses = $(this).attr("class");
			var matchClasses = conClasses.match(/\s?ws\_([\w]+)\_([\S]+)/g);
			if(matchClasses && matchClasses.length > 0){
				for(var i=0,len=matchClasses.length;i<len;i++){
					var matchClass = matchClasses[i].match(/\s?ws\_([\w]+)\_([\S]+)/);
					if(matchClass && matchClass.length == 3){
						that[matchClass[1]] = matchClass[2];
					}
				}
			}
			
			if(that.shadow){
				$(this).append(that.t_html+that.ts_html);
			}else{
				$(this).append(this.t_html);
			}

			var top,left,
			conW = $(this).prop("offsetWidth") || $(this).width(),
			conH = $(this).prop("offsetHeight") || $(this).height(),
			conL = $(this).offset().left,
			conT = $(this).offset().top,
			conPos = $(this).css("position"),
			conShadow = $(this).css("box-shadow"),
			conBColor = $(this).css("border-color"),
			conBWidth = parseInt($(this).css("border-width")) || 1;
			conBColor = that.shadowColor || conBColor;
			if(that.towards){
				switch(that.towards){
					case "right": that.opp = "left";break;
					case "left": that.opp = "right";break;
					case "bottom": that.opp = "top";break;
					case "top": that.opp = "bottom";break;
					defautl: break;
				}
			}else{
				if(console) console.warn("It seems there is no direction of triangle on the element below: ");
				if(console) console.log(this);
				return false;
			}

			var style = {
				position: "absolute",
				border: that.bWidth+"px solid "+that.bgColor
			};
			style["border-"+that.opp+"-color"] = that.bColor;
			
			$(".wst",this).css(style);
			$(".wst_s",this).css(style);

			var tHeight = $(".wst",this).prop("offsetHeight") || 2*that.bWidth;
			var tWidth = $(".wst_s",this).prop("offsetWidth") || 2*that.bWidth;

			if(that.towards == "top"){
				 top = "-"+(tHeight-conBWidth);
				 left = (that.posi*2/100)*(conW - tWidth)/2;
			}

			if(that.towards == "left"){
				 top = (that.posi*2/100)*(conH - tHeight)/2;
				 left = "-"+(tWidth-2*conBWidth);
			}

			if(that.towards == "right"){
				 top = (that.posi*2/100)*(conH - tHeight)/2;
				 left = (conW-conBWidth);
			}

			if(that.towards == "bottom"){
				 left = (that.posi*2/100)*(conW - tWidth)/2;
				 top = (conH-conBWidth);
			}

			if(conPos == "static"){
				if(this.offsetParent){
					top = parseInt(conT) + parseInt(top);
					left = parseInt(conL) + parseInt(left);
				}
			}

			$(".wst",this).css({top:top+"px",left:left+"px"});

			if(that.towards == "bottom"){
				$(".wst_s",this).css({top:(parseInt(top)+conBWidth)+"px",left:parseInt(left)+"px"});
			}else if(that.towards == "top"){
				$(".wst_s",this).css({top:(parseInt(top)-conBWidth)+"px",left:parseInt(left)+"px"});
			}else if(that.towards == "left"){
				$(".wst_s",this).css({top:parseInt(top)+"px",left:(parseInt(left)-conBWidth)+"px"});
			}else if(that.towards == "right"){
				$(".wst_s",this).css({top:parseInt(top)+"px",left:(parseInt(left)+conBWidth)+"px"});
			}
			
			var sStyle = {
				zIndex: -999
			};

			sStyle["border-"+that.opp+"-color"] = conBColor || "#ccc";
			$(".wst_s",this).css(sStyle);
			$(this).addClass("ws_done");
		});
	}
};

//在一个div上均分几个元素
jQuery.fn.monoplace = function(elemsclass){
	var $ = jQuery;
	if(this.length == 0 || $(elemsclass,this).length == 0){
		return false;
	}

	var _this = this,
		$elems = $(elemsclass,_this).css("display","none");
	$(document).ready(relocate);

	//$(window).on("resize",relocate);

	function relocate(){
		var conWidth = _this.width(),
		conHeight = _this.height(),
		conPos = _this.css("position"),
		conLeft = 0,
		$elems = $(elemsclass,_this),
		elemWidth = 0,
		elemHeights = new Array(),
		elemHeight = 0,
		elemLen = $elems.length,
		elem = null,

		partialWidth = conWidth/(elemLen+1);
		if(conPos == "static"){
			conLeft = _this.prop("offsetLeft");
		}

		for(var i=0; i<elemLen; i++){
			elem = $elems.get(i);
			elemWidth = $(elem).width();
			elemHeight = $(elem).height();
			elem.style.position = "absolute";
			elem.style.left = ((i+1) * partialWidth - elemWidth/2 + conLeft) + "px";
			$(elem).data("pos-left",elem.style.left);
			elemHeights.push(elemHeight);
		}
		var maxElemHeight = elemHeights.sort(function(a,b){if(a < b){return false; }return true;}).pop();
		if(_this.height() < maxElemHeight){
			_this.css("min-height",maxElemHeight+"px");
		}
		$elems.fadeIn();
	}
};

jQuery.fn.monoplace_beta = function(elemsclass,padding){
	var $ = jQuery;
	var padding = padding != undefined ? parseInt(padding) : 5;

	if(this.length ==0 || $(elemsclass,this).length == 0){
		return false;
	}

	var _this = this;
		$elems = $(elemsclass,_this).css({"display":"none","visibility":"hidden"});

		$(document).ready(relocate);

	function relocate(){
	var conWidth = _this.width(),
		conHeight = _this.height(),
		conPos = _this.css("position"),
		conLeft = 0,
		$elems = $(elemsclass,_this),
		elemWidth = 0,
		elemHeights = new Array(),
		elemHeight = 0,
		elemLen = $elems.length,
		elem = null,
		firstWidth = $elems.first().width(),
		lastWidth = $elems.last().width(),
		firstBar = padding + firstWidth/2,
		lastBar = padding + lastWidth/2,
		margin = (conWidth - lastBar - firstBar)/(elemLen - 1);
		
		if(conPos == "static"){
			conLeft = _this.prop("offsetLeft");
		}

		for(var i=0; i<elemLen; i++){
			elem = $elems.get(i);
			elemWidth = $(elem).width();
			elemHeight = $(elem).height();
			elem.style.position = "absolute";
			elem.style.left = (((firstBar + i*margin + conLeft - elemWidth/2)/conWidth)*100)+"%";
			//elem.style.left = (firstBar + i*margin + conLeft - elemWidth/2) + "px";
			$(elem).data("pos-left",elem.style.left);
			elemHeights.push(elemHeight);
		}
		var maxElemHeight = elemHeights.sort(function(a,b){if(a < b){return -1; }return 2;}).pop();
		if(_this.height() < maxElemHeight){
			_this.css("min-height",maxElemHeight+"px");
		}
		$elems.css("visibility","visible").fadeIn();
	}
};

var mapObj;
/*
思路：
	得到所有便签记录的经纬度 通过 geocoder 将经纬度转换为地理位置，得到相同城市或直辖市的便签，得到数量，得到相同区的便签，得到数量；
	当用户点击城市时，全部展示，以区为类别分组

	若是只有IP地址，暂无好的解决方法
*/

//初始化地图对象
function init_map(mapconid){
	mapconid = !!mapconid ? mapconid : "map_con";

	if(mapObj == undefined){
		mapObj = new AMap.Map(mapconid,{
	    	//dragEnable: false,
	    	zoomEnable: false,
	    	level: 5,
	    	scrollWheel: false,
	    	center: new AMap.LngLat(143.11615, 36.350527),
	    	touchZoom: false,
	    	resizeEnable: true
	    });
	}
}

//加载地图
function loadSticks(){
	init_map();
	//得到所有当前用户便签的添加时间以及添加经纬度
	//返回的结果应该为如下
	//[{id:23,time:2014-1-1 09:23:20,lnglat:112.23433|23.23343},
	//{id:32,time:2014-1-1 09:23:20,lnglat:112.23433|23.23343},
	//{id:24,time:2014-1-1 09:23:20,lnglat:112.23433|23.23343}]
	//取出id是为了方便点击地理标记后取出相应的便签
	
	Note.prototype.get_notes_loc(function(data){
		var feedback = get_json_feedback(data),
			tmp_lng,tmp_lat,city_info,
			note = null,
			first_note = null,
			marker = null,
			detailed_notes = new Array(),
			all_cities = {};
		
		//循环给每个便签添加上位置属性 city:(若高德返回的地理信息无city如直辖市北京则使用province) 具体信息 geo_detail:(formattedAddress)
		
		for(var i=0; i<feedback.length; i++){
			note = feedback[i];
			if(i == feedback.length-1){
				$("#map_con").addClass("loop-done");
			}

			if(!!note.lnglat && note.lnglat != ","){
				geocoder(note,all_cities); //geocoder ends
			}
		}//end outer for loop
	});
}

function get_position(callback){
    /*如果用户接受地理定位，则询问地理位置*/
    if(navigator.geolocation){
    	if(console) console.log("getting position");
        navigator.geolocation.getCurrentPosition(function(position){
            var lng = position.coords.longitude,
                lat = position.coords.latitude,
                pos = lng+","+lat;
                //将用户地理位置保存至本地存储或添加dom data
                //用于以后保存书签时添加地理信息
                if(console) console.log(pos);
                if($.isFunction(callback)) callback({lng:lng,lat:lat});
        },function(PosError){
            //PositionError {
            //   message: "User denied Geolocation",
            //   code: 1, PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3}
            switch(PosError.code){
                //根据状态码判定操作
                case 1: 
                    showMessage({type:"warning",msg:"地理定位处于启用状态，如需关闭地理定位可以点击<a href=\"#\" class=\"off-geo\">此处</a>"});
                    break; //用户拒绝定位
                case 2:
                    showMessage({type:"warning",msg:"无法获取您的位置信息"}); 
                    break; //硬件不支持或处于无网络连接状态
                case 3: 
                    showMessage({type:"warning",msg:"网络连接超时"});
                    break; //网络连接慢，获取地理位置超时
                default: showMessage({type:"warning",msg:"无法获取您的定位"});break;
            }
        });
    }
}

function renderReverse(response){
	var loc = "定位失败";
	if(console) console.log(response);
	if(response.status == "0"){
		//如果是由ip地址定位，response会有content属性
        if(response.content){
            loc = response.content.address;
            if(response.content.point){
                //暂时不用此模糊地经纬度，应该将其保存到数据库
                var latlng = response.content.point.y+"|"+response.content.point.x;
                var $note = $("#note_ops").closest(".note-con");
                if($note && $note.data("id")){
                    var note = new Note({id:$note.data("id")});
                    note.add_coords(latlng,function(data){
                        if(console) console.log(data);
                    });
                }
            }
        }else{
            var addressComponent = response.result.addressComponent;
            tmp_loc = addressComponent.province + addressComponent.city + addressComponent.district;
            loc = !!tmp_loc ? tmp_loc : loc;
        }
	}
	$(".geo-web span.loc").text(loc);
	$("#note_ops .info .location .content").text(loc).closest(".note-con").data("loc",loc);
}

//得到具体地理位置信息
function geocoder(note,all_cities){
	var coder;
	var lng = note.lnglat.split("|")[0];
	var lat = note.lnglat.split("|")[1];
	var first_note = null;
	var city_info = null;
	//加载地理编码插件  
	mapObj.plugin(["AMap.Geocoder"], function(){ //加载地理编码插件  
	    coder = new AMap.Geocoder({  
	        radius: 1000, //以已知坐标为中心点，radius为半径，返回范围内兴趣点和道路信息
	    });
	    
	    //返回地理编码结果  
	    //AMap.event.addListener(coder, "complete", geocoder_CallBack);
	    AMap.event.addListener(coder, "complete", function(data){
	    	if(data.info == "OK"){
				var addressComponent = data.regeocode.addressComponent;
				var city = (addressComponent.city != "") ? addressComponent.city : addressComponent.province;
				note.city = city;
				note.geo_detail = data.regeocode.formattedAddress;

				if(!!all_cities[city]){
					//将已存在的这个city的num加1
					all_cities[city].num++;
					all_cities[city].ids.push(note.id);
				}else{
					first_note = {lng:lng,lat:lat,city:city,num:1,ids:[note.id]};
					all_cities[city] = first_note;
					city_info = {lng:lng,lat:lat,city:city,num:1,ids:[note.id]};
					
					//为该城市创建一个地理标记
					var marker = new AMap.Marker({
						map: mapObj,
						position: new AMap.LngLat(city_info.lng,city_info.lat),
						
						//设置地理编辑点提示内容，可能是便签的标题
						content: "<div class=\"note\"><img class=\"icon\" src=\"http://webapi.amap.com/images/1.png\" /><a class=\"num\" href=\"#\">"+city_info.num+"</a></div>"
					});

					/* -------- 为地理标记添加事件监听函数 --------- */
			    	AMap.event.addListener(marker,"mouseover",function(mapEvent){
				     	//浏览器原生事件对象
				    	var event = mapEvent.originalEvent || event || window.event;
				    });

				    AMap.event.addListener(marker,"click",function(mapEvent){
				    	//geocoder(mapEvent.lnglat.lng,mapEvent.lnglat.lat);
				    	//浏览器原生事件对象
				    	var event = mapEvent.originalEvent || event || window.event;
						EventUtil.preventDefault(event);

						city_info = all_cities[city];
						
						if(!!city_info.ids){
							get_notes_by_ids(city_info.ids);
						}
				    });
				}
			}

			try{
				mapObj.setFitView();
			}catch(e){

			}

			if($("#map_con").hasClass("loop-done")){
				var cities_html = "",city_obj,ids;
				var i=0;
				for(var city_name in all_cities){
					i++;
					city_obj = all_cities[city_name];
					ids_str = city_obj.ids.join(",");

					cities_html += "<a href=\"#\" class=\"loc city-"+i+"\" title=\""+city_obj.num+"条便签\" data-ids=\""+ids_str+"\">"+city_obj.city+"</a>";
					
					$(".locs .recent-locs .city-"+i).data("ids",ids_str);

					$(".locs .recent-locs").off("click",".city-"+i);
					$(".locs .recent-locs").on("click",".city-"+i,function(event){
						event = EventUtil.getEvent(event);
						EventUtil.preventDefault(event);
						
						var ids_data = $(this).data("ids");
						
						if(!!ids_data){
							var ids_arr = ids_data.split(",");
							get_notes_by_ids(ids_arr);
						}
					});
				}

				var recent_html = $(".locs .recent-locs").html();
				if(recent_html != cities_html){
					$(".locs .recent-locs").html(cities_html);
				}
			}
			//console.log(all_cities); //Object {酒泉市: Object 31, 北京市: Object 16}
	    });

	    //逆地理编码  
	    coder.getAddress(new AMap.LngLat(lng, lat));

	    ///地理编码  
        //coder.getLocation("北京市海淀区苏州街");
	});
}

function get_notes_by_ids(ids){
	if(!!!ids || !$.isArray(ids)){
		return false;
	}
	
	Note.prototype.get_notes_by_ids(ids,function(odata){
		var feedback = get_json_feedback(odata),notes,note,noteobj;
		if(feedback.notes && feedback.notes.length > 0){
            notes = feedback.notes;
            var note_html = "";
            for(var i=0,len=notes.length; i<len; i++){
                noteobj = notes[i];
           
                note = new Note(noteobj);
                note.construct_item();
                note_html += note.html;
            }
            $("#search_results .by-loc").html("").append(note_html);

            $("#search_results .by-loc .note-con").each(function(){
                var $note = $(this).find(content_area); //".note.editable" => content_area
                if($note.length > 0){
                    $note.get(0).style.height = 0;
                    $note.get(0).style.height = Math.min(150,$note.get(0).scrollHeight) + "px";
                }
            });
            highlight_colored_tags();
        }
	});
}

//不太准确
function ip2geo(ip) {   
    //加载城市查询插件  
    mapObj.plugin(["AMap.CitySearch"], function() {  
        //实例化城市查询类  
        var citysearch = new AMap.CitySearch();  
        //自动获取用户IP，返回当前城市  
        citysearch.getLocalCity();  
        //citysearch.getCityByIp(ip);
        AMap.event.addListener(citysearch, "complete", function(result){  
             if(console) console.log(result);
        });
        AMap.event.addListener(citysearch, "error", function(result){alert(result.info);});  
    });
}

//对于不支持JSON.stringfy的浏览器载入json2.js
(function(){
    if(!!!JSON.stringify){
        var d = document,
            s = d.createElement("script");
            s.src = location.host+"/scripts/json2.js";
            s.type = "text/javascript";
            d.getElementsByTagName("head")[0].appendChild(s);
    }
})();

// var Latest_notes = (function(){
// 	//如果浏览器本地存储特性不可用，则返回错误
// 	if(!localStorage){
// 		return false;
// 	}

// 	var lls = localStorage;
// 	var lns = "latest_notes";

// 	return {
// 		add: function(id,obj){
// 			var all = lls.getAll();
// 			if(!obj.created){
// 				obj.created = get_current_time();
// 			}

// 			all[id] = obj;
// 			this.setAll(all);
// 		},

// 		remove: function(id){
// 			var all = lls.getAll();
// 				delete all[id];
// 				this.setAll(all);
// 		},

// 		update: function(id,obj){
// 			var all = lls.getAll();
// 			if(!obj.modified){
// 				obj.modified = get_current_time();
// 			}

// 			all[id] = obj;
// 			this.setAll(all);
// 		},

// 		display: function(num){
			
// 		},

// 		get: function(id){
// 			return !!this.getAll()[id] ? this.getAll()[id] : false;
// 		},

// 		getAll: function(type){
// 			type = !!type ? type : "object";
// 			if(type == "object"){
// 				if(this.exists()){
// 					return JSON.parse(lls.getItem(lns));
// 				}else{
// 					return {};
// 				}
// 			}

// 			if(type == "string"){
// 				return lls.getItem(lns);
// 			}
// 		},

// 		setAll: function(objs){
// 			if(!!objs){
// 				lls.setItem(lns,JSON.stringify(objs));
// 			}
// 		},

// 		exists: function(){
// 			return !!lls.getItem(lns) && lls.getItem(lns) != "{}";
// 		},

// 		local_stored: function(){
// 			return !!lls.local_stored;
// 		},

// 		set_flag: function(flag){
// 			return lls.setItem("local_stored",flag);
// 		},

// 		set_remote_flag: function(flag){
// 			$.post("/user/config",{local_stored_flag:!!flag});
// 		}
// 	};
// })();


(function($){
	$.fn.load_img_onscroll = function(option,onload_callback){
		var scroll_con = (option && option.container) ? option.container : window;
		var _this = this;
		if(_this.length == 0) return false;
        
        var load_img = function(){
            var that = this;
            //如果scrollTop大于图片的top-(x)px则加载图片
            if(elementInViewport(this)){
                if(option.timeout){
                    var load_timeout = setTimeout(function(){
                        //如果过了用户设定的时间，仍然在加载，则使用替代图片
                        if($(that).hasClass(option.loading_class)){
                            that.src = option.fallback_src;
                            that.onload = function(){$(this).removeClass("unloaded");}
                        }
                    },option.timeout); 

                    //加载限定时间，超过10s则取消加载用其他图片代替
                    if(onload_callback && $.isFunction(onload_callback)){
                        that.onload = function(){
                            onload_callback.call(this);
                            clearTimeout(load_timeout);
                        };
                    }
                }else{
                    if(onload_callback && $.isFunction(onload_callback)) this.onload = onload_callback;
                }

                //is_image_url($(this).data("src"));
                if($(this).data("src")) this.src = $(this).data("src");
            }
        };

        _this.each(load_img);

        $(scroll_con).on("scroll",function(event){
            $(_this.selector).each(load_img);
        });
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
