const LIVE2DCUBISMCORE = Live2DCubismCore;

let L2DWaifu = function () {
    this.waifuTag = '#waifu'; // 模型渲染的位置 以'.'开头为class名, 以'#'开头为id名

    // 后端接口
    this.waifuTipsJson = './live2d/src/waifu-tips.json'; // 模型台词 
    this.currentModel = 'dujiaoshou_4'; // 默认live2d模型名称
    this.modelListPath = './live2d/assets/model_list.json'; // live2d模型列表
    this.modelsDir = './live2d/assets/'; // live2d模型目录 

    // 工具栏设置
    this.showToolMenu = true; // 显示 工具栏     按钮，可选 true(真), false(假)
    this.canCloseLive2d = true; // 显示 关闭看板娘  按钮，可选 true(真), false(假)
    this.canSwitchModel = true; // 显示 模型切换    按钮，可选 true(真), false(假)
    this.canTakeScreenshot = true; // 显示 看板娘截图  按钮，可选 true(真), false(假)
    this.canTurnToHomePage = true; // 显示 返回首页    按钮，可选 true(真), false(假)
    this.canTurnToAboutPage = true; // 显示 跳转关于页  按钮，可选 true(真), false(假)

    // 提示消息选项
    this.showHitokoto = true; // 显示一言
    this.showF12OpenMsg = true; // 显示控制台打开提示
    this.showCopyMessage = true; // 显示 复制内容 提示
    this.showWelcomeMessage = true; // 显示进入面页欢迎词


    //模型相关
    this.waifuScale = 16; // live2d渲染模型的比例
    this.waifuWidth = 320; // 看板娘窗口大小，例如 '280x250', '600x535'
    this.waifuHeight = 320;
    this.waifuXOffset = 0; // 模型x轴偏移 
    this.waifuYOffset = 0; // 模型y轴偏移 
    this.waifuMinWidth = '768px'; // 面页小于 指定宽度 隐藏看板娘，例如 'disable'(禁用), '768px'
    this.waifuVolume = 0.05; // 音量
    this.waifuOnMute = false;
    this.waifuVoiceDiable = false; // 不加载声音


    //waifu-tips相关
    this.waifuTipsSize = '250x70'; // 提示框大小，例如 '250x70', '570x150'
    this.waifuEdgeSide = 'left:0'; // 看板娘贴边方向，例如 'left:0'(靠左 0px), 'right:30'(靠右 30px)
    this.waifuDraggable = 'unlimited'; // 拖拽样式，例如 'disable'(禁用), 'axis-x'(只能水平拖拽), 'unlimited'(自由拖拽)
    this.waifuDraggableRevert = false; // 松开鼠标还原拖拽位置，可选 true(真), false(假)

    this.aboutPageUrl = 'https://github.com/Darkspirit2017'; // 关于页地址, '{URL 网址}'

    //模型动作属性    碧蓝航线独有动作名称 - login home mail idle touch_body touch_head touch_special wedding main_1 main_2 main_3 mission mission_complete
    this.modelNameList = [];
    this.soundList = []; //soundName:message
    this.motionList = []; //动作名:动作索引 + 动作索引:动作名
    this.motionCount = 0; //模型计数器

    this.messageTimer = null;
    this.soundTimer = null;

    this.modelIndex = 0;

    this.playingSound = false;

    //PIXI渲染
    this.app = null;

    //测试用，加载时间起点，不保证准确性
    this.firstInit = true;
    this.startTime;
};

L2DWaifu.prototype.initL2DWaifu = function () {
    this.initWidget();

    this.initModel();
};


L2DWaifu.prototype.initWidget = function () {
    if (screen.width <= 768) return;
    sessionStorage.removeItem("waifu-text");

    /* 加载看板娘样式 */
    this.waifuTipsSize = this.waifuTipsSize.split('x');
    this.waifuEdgeSide = this.waifuEdgeSide.split(':');

    $("#live2d").attr("width", this.waifuWidth);
    $("#live2d").attr("height", this.waifuHeight);
    $("#waifu-tips").width(this.waifuTipsSize[0]);
    $("#waifu-tips").height(this.waifuTipsSize[1]);

    if (this.waifuEdgeSide[0] === 'left') $(this.waifuTag).css("left", this.waifuEdgeSide[1] + 'px');
    else if (this.waifuEdgeSide[0] === 'right') $(this.waifuTag).css("right", this.waifuEdgeSide[1] + 'px');


    if (this.waifuMinWidth !== 'disable') {
        this.waifuResize();
        $(window).resize(function () {
            this.waifuResize()
        }.bind(this));
    }

    //移动模型
    try {
        let axis = null;

        if (this.waifuDraggable === 'axis-x') axis = 'x';

        $(this.waifuTag).draggable({
            axis: axis,
            revert: this.waifuDraggableRevert,
            start: function () {
                this.playSound('touch_2');
            }.bind(this)
        }).css("position", "fixed");
    } catch (err) {
        console.log('[Error] JQuery UI is not defined. ' + err)
    }

    if (this.showToolMenu) {
        //回到首页
        if (this.canTurnToHomePage)
            $("#waifu-tool .fa-user-circle").click(function () {
                window.location = location.port ? `${location.protocol}//${location.hostname}:${location.port}/` : `${location.protocol}//${location.hostname}/`;
            });

        //一言
        if (this.showHitokoto) $("#waifu-tool .fa-comment").click(this.showHitokotoTips.bind(this));

        //切换模型
        if (this.canSwitchModel) $("#waifu-tool .fa-street-view").click(this.switchModels.bind(this));

        if (this.canTakeScreenshot)
            $("#waifu-tool .fa-camera-retro").click(function () {
                this.showMessage("照好了嘛，是不是很可爱呢？", 6000, 9);
                //照相功能，以后添加
            }.bind(this));

        //关于页面
        if (this.canTurnToAboutPage)
            $("#waifu-tool .fa-info-circle").click(function () {
                window.open(this.aboutPageUrl);
            }.bind(this));

        //live2d退出
        if (this.canCloseLive2d)
            $("#waifu-tool .fa-times").click(function () {
                this.hideModel();
            }.bind(this));
    }
    //控制台监测trick
    if (this.showF12OpenMsg) {
        const devtools = () => { };
        console.log("%c", devtools);
        devtools.toString = () => {
            showMessage("哈哈，你打开了控制台，是想要看看我的小秘密吗？", 6000, 9);
        };
    }
    //复制提醒
    if (this.showCopyMessage) $(document).on("copy", function () {
        this.showMessage("你都复制了些什么呀，转载要记得加上出处哦！", 6000, 9);
    }.bind(this));
    $(document).on("visibilitychange", function () {
        if (!document.hidden) this.showMessage("哇，你终于回来了～", 6000, 9);
    }.bind(this));
    //
    if (this.showWelcomeMessage) {
        this.initWelcomeMessage();
    }

    let messageArray = ["已经过了这么久了呀，日子过得好快呢……", "使用Chrome可以获得最佳浏览体验哦！", "嗨～快来逗我玩吧！", "拿小拳拳锤你胸口！"];

    if ($(".fa-share-alt").is(":hidden")) messageArray.push("记得把小家加入Adblock白名单哦！");

    this.initWaifuTips();
};

L2DWaifu.prototype.initWelcomeMessage = function () {
    let SiteIndexUrl = location.port ? `${location.protocol}//${location.hostname}:${location.port}/` : `${location.protocol}//${location.hostname}/`,
        text; //自动获取主页
    if (location.href === SiteIndexUrl) { //如果是主页
        let now = new Date().getHours();
        if (now > 23 || now <= 5) text = "你是夜猫子呀？这么晚还不睡觉，明天起的来嘛？";
        else if (now > 5 && now <= 7) text = "早上好！一日之计在于晨，美好的一天就要开始了。";
        else if (now > 7 && now <= 11) text = "上午好！工作顺利嘛，不要久坐，多起来走动走动哦！";
        else if (now > 11 && now <= 14) text = "中午了，工作了一个上午，现在是午餐时间！";
        else if (now > 14 && now <= 17) text = "午后很容易犯困呢，今天的运动目标完成了吗？";
        else if (now > 17 && now <= 19) text = "傍晚了！窗外夕阳的景色很美丽呢，最美不过夕阳红～";
        else if (now > 19 && now <= 21) text = "晚上好，今天过得怎么样？";
        else if (now > 21 && now <= 23) text = ["已经这么晚了呀，早点休息吧，晚安～", "深夜时要爱护眼睛呀！"];
        else text = "好久不见，日子过得好快呢……";
    } else if (document.referrer !== "") {
        let referrer = document.createElement("a");
        referrer.href = document.referrer;
        let domain = referrer.hostname.split(".")[1];
        if (location.hostname === referrer.hostname) text = '欢迎阅读<span style="color:#0099cc;">『' + document.title.split(' - ')[0] + '』</span>';
        else if (domain === 'baidu') text = 'Hello！来自 百度搜索 的朋友<br/>你是搜索 <span style="color:#0099cc;">' + referrer.search.split('&wd=')[1].split('&')[0] + '</span> 找到的我吗？';
        else if (domain === 'so') text = 'Hello！来自 360搜索 的朋友<br/>你是搜索 <span style="color:#0099cc;">' + referrer.search.split('&q=')[1].split('&')[0] + '</span> 找到的我吗？';
        else if (domain === 'google') text = 'Hello！来自 谷歌搜索 的朋友<br/>欢迎阅读<span style="color:#0099cc;">『' + document.title.split(' - ')[0] + '』</span>';
        else text = 'Hello！来自 <span style="color:#0099cc;">' + referrer.hostname + '</span> 的朋友';
    } else text = '欢迎阅读<span style="color:#0099cc;">『' + document.title.split(' - ')[0] + '』</span>';
    this.showMessage(text, 7000, 8);
};

L2DWaifu.prototype.waifuResize = function () {
    $(window).width() <= Number(this.waifuMinWidth.replace('px', '')) ? $(this.waifuTag).hide() : $(this.waifuTag).show();
};


L2DWaifu.prototype.showHitokotoTips = function () {
    if (!this.showHitokoto) return;
    this.showMessage(messageArray[Math.floor(Math.random() * messageArray.length)], 6000, 9);
};

L2DWaifu.prototype.initWaifuTips = function (waifuTipsJsonPath = this.waifuTipsJson) {

    $.getJSON(waifuTipsJsonPath, this.parseWaifuTipsJson.bind(this));
};

L2DWaifu.prototype.parseWaifuTipsJson = function (result) {
    $.each(result.mouseover, function (index, tips) {
        $(document).on("mouseover", tips.selector, function () {
            let text = Array.isArray(tips.text) ? tips.text[Math.floor(Math.random() * tips.text.length)] : tips.text;
            text = text.replace("{text}", $(this).text());
            this.showMessage(text, 4000, 8);
        }.bind(this));
    }.bind(this));

    $.each(result.seasons, function (index, tips) {
        let now = new Date(),
            after = tips.date.split("-")[0],
            before = tips.date.split("-")[1] || after;
        if ((after.split("/")[0] <= now.getMonth() + 1 && now.getMonth() + 1 <= before.split("/")[0]) && (after.split("/")[1] <= now.getDate() && now.getDate() <= before.split("/")[1])) {
            let text = Array.isArray(tips.text) ? tips.text[Math.floor(Math.random() * tips.text.length)] : tips.text;
            text = text.replace("{year}", now.getFullYear());
            this.showMessage(text, 7000, true);
        }
    }.bind(this));
}


L2DWaifu.prototype.showMessage = function (text, timeout, priority) {
    //console.log(text, timeout, priority);
    if (!text) return;
    if (!sessionStorage.getItem("waifu-text") || sessionStorage.getItem("waifu-text") < priority) {
        if (this.messageTimer) {
            clearTimeout(this.messageTimer);
            this.messageTimer = null;
        }
        if (Array.isArray(text)) text = text[Math.floor(Math.random() * text.length)];
        //console.log(text);
        sessionStorage.setItem("waifu-text", priority);
        $("#waifu-tips").stop().html(text).fadeTo(500, 1);
        this.messageTimer = setTimeout(function () {
            sessionStorage.removeItem("waifu-text");
            $("#waifu-tips").fadeTo(1000, 0);
        }, timeout);
    }
};

L2DWaifu.prototype.loadModelList = function (modelList = this.modelListPath) {
    $.getJSON(modelList, this.parseModelListJson.bind(this))
        .done(function () {
            console.log('Model list initialized successfully!');
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            console.log('Unable to load model list! ' + textStatus);
        })
};

L2DWaifu.prototype.parseModelListJson = function (data) {
    let len = data['models'].length;
    for (let i = 0; i < len; i++)
        this.modelNameList.push(data['models'][i]);
}

L2DWaifu.prototype.switchModels = function () {
    if (this.modelIndex + 1 === this.modelNameList.length)
        this.modelIndex = -1;
    this.currentModel = this.modelNameList[++this.modelIndex];
    console.log('Switching to new model ' + this.currentModel);
    this.initModel();
};



L2DWaifu.prototype.getModelPath = function (modelName = this.currentModel) { //'./live2d/Resources/z23/z23.model3.json'
    return this.modelsDir + modelName + '/' + modelName + '.model3.json';
};



//简单发送AJAX异步请求读取json文件
L2DWaifu.prototype.initModel = function (modelName = this.currentModel) {

    this.loadModelList(); //加载live2d模型列表
    this.resetModel(); //变量初始化

    let url = this.getModelPath(modelName);

    let modelJsonData = this.doAjax(url);

    this.loadModel(modelJsonData, url);
};

L2DWaifu.prototype.doAjax = function (url) {
    var obj;

    $.ajax({
        url: url,
        async: false,
        success: function (ajax) {
            obj = ajax;
        },
        error: function (error) {
            console.error('Response error, Message:' + error);
        }
    });

    return obj;
}


L2DWaifu.prototype.resetModel = function () {
    this.stopSound();
    this.startTime = new Date().getTime();
    if (!this.firstInit) { //如果不是第一次登录，所有变量初始化
        this.app.stop();
        PIXI.loader.reset();
        PIXI.utils.destroyTextureCache();
        this.motionCount = 0;
        this.motionList = [];
    }
    this.firstInit = false;
};


//加载模型
L2DWaifu.prototype.loadModel = function (data, modelPath) {
    let model3Obj = {
        data: data,
        url: modelPath.substr(0, modelPath.lastIndexOf('/') + 1)
    };

    for (const key in data.FileReferences.Motions) {
        this.loadMotions(data.FileReferences.Motions[key]);
    }
    this.loadSoundList();

    //调用此方法直接加载，并传入设置模型的回调方法
    new LIVE2DCUBISMPIXI.ModelBuilder().buildFromModel3Json(PIXI.loader.on("progress", this.loadProgressHandler.bind(this)), model3Obj, this.setModel.bind(this));
};

//加载动作文件
L2DWaifu.prototype.loadMotions = function (motions) {
    let modelPath = this.getModelPath();
    if (motions.length > 0) {
        for (let i = 0; i < motions.length; i++) {
            //加载所有motion3.json
            PIXI.loader.add('motion' + (this.motionCount + 1), modelPath.substr(0, modelPath.lastIndexOf('/') + 1) + motions[i].File, {
                xhrType: PIXI.loaders.Resource.XHR_RESPONSE_TYPE.JSON
            });
            let mName = motions[i].File;
            mName = mName.substring(mName.lastIndexOf('/') + 1, mName.length - 13);
            this.motionList[mName] = this.motionCount;
            this.motionList[this.motionCount] = mName;
            this.motionCount++;
        }
    } else {
        console.error('Missing motion files');
    }
};

//设置模型的回调方法
L2DWaifu.prototype.setModel = function (model) {
    let canvas = document.querySelector(this.waifuTag);
    let view = canvas.querySelector('canvas');

    this.app = new PIXI.Application(this.waifuWidth, this.waifuHeight, {
        transparent: true,
        view: view
    });
    this.app.stage.addChild(model);
    this.app.stage.addChild(model.masks);

    let motions = this.initMotions(model, PIXI.loader.resources);
    this.initModelEyeTracking(model, canvas, motions);
    this.setOnResize(model);
};

//设置模型动作
L2DWaifu.prototype.initMotions = function (model, resources) {
    //动作数组，存放格式化好的动作数据
    let motions = [];
    for (const key in resources) {
        if (key.indexOf('motion') !== -1) {
            motions.push(LIVE2DCUBISMFRAMEWORK.Animation.fromMotion3Json(resources[key].data));
        }
    }
    let timeOut;
    if (motions.length > 0) {
        window.clearTimeout(timeOut);
        model.animator.addLayer("motion", LIVE2DCUBISMFRAMEWORK.BuiltinAnimationBlenders.OVERRIDE, 1.0);
        if (null != this.motionList['login'] && null != this.motionList['idle']) { //如果有登录和待机动作，则在登录动作完成后切换到待机动作
            model.animator.getLayer("motion").play(motions[this.motionList['login']]);
            this.playSound('login');
            timeOut = setTimeout(function () {
                model.animator.getLayer("motion").play(motions[this.motionList['idle']]);
            }.bind(this), motions[this.motionList['login']].duration * 1000);
        } else {
            //如果没有登录动作，则默认播放第一个动作
            model.animator.getLayer("motion").play(motions[0]);
        }
    }
    return motions;
};

//设置鼠标追击
L2DWaifu.prototype.initModelEyeTracking = function (model, canvas, motions) {
    let rect = canvas.getBoundingClientRect();
    let center_x = this.waifuWidth / 2 + rect.left,
        center_y = this.waifuHeight / 2 + rect.top;
    let mouse_x = center_x,
        mouse_y = center_y;
    let angle_x = model.parameters.ids.indexOf("ParamAngleX");
    if (angle_x < 0) {
        angle_x = model.parameters.ids.indexOf("PARAM_ANGLE_X");
    }
    let angle_y = model.parameters.ids.indexOf("ParamAngleY");
    if (angle_y < 0) {
        angle_y = model.parameters.ids.indexOf("PARAM_ANGLE_Y");
    }
    let eye_x = model.parameters.ids.indexOf("ParamEyeBallX");
    if (eye_x < 0) {
        eye_x = model.parameters.ids.indexOf("PARAM_EYE_BALL_X");
    }
    let eye_y = model.parameters.ids.indexOf("ParamEyeBallY");
    if (eye_y < 0) {
        eye_y = model.parameters.ids.indexOf("PARAM_EYE_BALL_Y");
    }
    this.app.ticker.add(function (deltaTime) {
        rect = canvas.getBoundingClientRect();
        center_x = this.waifuWidth / 2 + rect.left;
        center_y = this.waifuHeight / 2 + rect.top;
        let x = mouse_x - center_x;
        let y = mouse_y - center_y;
        model.parameters.values[angle_x] = x * 0.1;
        model.parameters.values[angle_y] = -y * 0.1;
        model.parameters.values[eye_x] = x * 0.005;
        model.parameters.values[eye_y] = -y * 0.005;
        model.update(deltaTime);
        model.masks.update(this.app.renderer);
    }.bind(this));
    let scrollElm = this.isBodyOrHtml();
    let mouseMove;
    document.body.addEventListener("mousemove", function (e) {
        window.clearTimeout(mouseMove);
        mouse_x = e.pageX - scrollElm.scrollLeft;
        mouse_y = e.pageY - scrollElm.scrollTop;
        mouseMove = window.setTimeout(function () {
            mouse_x = center_x, mouse_y = center_y
        }, 5000);
    });

    //点击随机动作
    let timeOut;
    document.body.addEventListener("click", function (e) {
        window.clearTimeout(timeOut);
        if (motions.length === 0) {
            return;
        }
        if (rect.left < mouse_x && mouse_x < (rect.left + rect.width) && rect.top < mouse_y && mouse_y < (rect.top + rect.height)) {
            let rand = Math.floor(Math.random() * motions.length);
            model.animator.getLayer("motion").stop();
            model.animator.getLayer("motion").play(motions[rand]);
            this.playSound(this.motionList[rand]);
            //如果有待机动作，则在随机播放动作结束后回到待机动作
            if (null != this.motionList['idle']) {
                timeOut = setTimeout(function () {
                    model.animator.getLayer("motion").play(motions[this.motionList['idle']]);
                }.bind(this), motions[rand].duration * 1000);
            } else model.animator.getLayer("motion").play(motions[0]);
        }
    }.bind(this));
    let onblur = false;
    let onfocusTime;
    sessionStorage.setItem('Onblur', '0');
    window.onblur = function () {
        if ('0' === sessionStorage.getItem('Onblur')) {
            onfocusTime = setTimeout(function () {
                sessionStorage.setItem('Onblur', '1');
            }, 30000);
        }
    };
    window.onfocus = function () {
        window.clearTimeout(onfocusTime);
        if (motions.length > 0) {
            if ('1' === sessionStorage.getItem('Onblur')) {
                model.animator.getLayer("motion").stop();
                if (null != this.motionList['home'] && null != this.motionList['idle']) { //如果有回港和待机动作，则在登录动作完成后切换到待机动作
                    model.animator.getLayer("motion").play(motions[this.motionList['home']]);
                    this.playSound('home');
                    onfocusTime = setTimeout(function () {
                        model.animator.getLayer("motion").play(motions[this.motionList['idle']]);
                        sessionStorage.setItem('Onblur', '0');
                    }.bind(this), motions[this.motionList['login']].duration * 1000);
                } else {
                    //如果没有，则默认播放第一个动作
                    model.animator.getLayer("motion").play(motions[0]);
                }
            }
        }
    }.bind(this);
};

//设置浏览器onResize事件
L2DWaifu.prototype.setOnResize = function (model) {
    let onResize = function (event) {
        if (event === void 0) {
            event = null;
        }
        let width = this.waifuWidth;
        let height = this.waifuHeight;
        this.app.view.style.width = width + "px";
        this.app.view.style.height = height + "px";
        this.app.renderer.resize(width, height);
        model.position = new PIXI.Point(this.waifuWidth / 2 + this.waifuXOffset, this.waifuHeight / 2 + this.waifuYOffset);
        model.scale = new PIXI.Point(this.waifuScale, this.waifuScale);
        model.masks.resize(this.app.view.width, this.app.view.height);
    }.bind(this);
    onResize();
    window.onresize = onResize;
};

//获取页面内容方法
L2DWaifu.prototype.isBodyOrHtml = function isBodyOrHtml() {
    if ('scrollingElement' in document) {
        return document.scrollingElement;
    }
    if (navigator.userAgent.indexOf('WebKit') !== -1) {
        return document.body;
    }
    return document.documentElement;
};

//加载模型Handler，监控加载进度
L2DWaifu.prototype.loadProgressHandler = function loadProgressHandler(loader) {
    console.log("progress: " + Math.round(loader.progress) + "%");
    //有可能值会小于100，但是也加载完毕，比如99.9999999997这样
    if (Math.round(loader.progress) >= 100) {
        let loadTime = new Date().getTime() - this.startTime;
        console.log('Model initialized in ' + loadTime / 1000 + ' second');
        PIXI.loader.off("progress", loadProgressHandler); //监听事件在加载完毕后取消
    }
};

L2DWaifu.prototype.loadSoundList = function () {
    if (this.waifuVoiceDiable) {
        this.waifuOnMute = true;
        return;
    }

    this.resetSoundList();

    $.getJSON(this.getSoundJsonPath(), function (data) {

        for (let i = 0; i < data['sounds'].length; i++) {
            let sound = data['sounds'][i];
            let name = sound['File'];
            name = name.substring(0, name.lastIndexOf('.'));
            this.soundList[name] = sound['message'];
        }

    }.bind(this))
        .done(function () {
            this.waifuOnMute = false;
            console.log('Sound list initialized successfully!');
        }.bind(this))
        .fail(function () {
            this.waifuOnMute = true;
            console.log('Unable to load sound list!');
        }.bind(this))
};

L2DWaifu.prototype.resetSoundList = function () {
    this.soundList = {}; //清空声音列表

    clearTimeout(this.soundTimer);
    PIXI.sound.stopAll();
    PIXI.sound.removeAll();
    this.playingSound = false;
    this.waifuOnMute = false;
};

L2DWaifu.prototype.getSoundJsonPath = function (modelName = this.currentModel) {
    return this.modelsDir + modelName + '/' + modelName + '.sounds.json';
};

L2DWaifu.prototype.getSoundPath = function (soundName) {
    return this.modelsDir + this.currentModel + '/sounds/' + soundName + '.mp3';
};

//碧蓝航线独有动作名称 - login home mail idle touch_body touch_head touch_special wedding main_1 main_2 main_3 mission mission_complete
L2DWaifu.prototype.playSound = function (motionName, callback = null) {

    let soundName = motionName;
    let duration;

    //动作名与语音名的对应关系
    if (motionName === 'touch_body' || motionName === 'idle' || motionName === 'effect') soundName = 'touch_1';
    else if (motionName === 'touch_special') soundName = 'touch_2';
    else if (motionName === 'touch_head') soundName = 'feeling5';
    else if (motionName === 'wedding') soundName = 'propose';
    else if (motionName === 'mission') soundName = 'task';
    else if (motionName === 'complete') soundName = 'expedition';

    if (!this.waifuOnMute && !this.playingSound) {
        PIXI.sound.stopAll();
        this.playingSound = true;
        clearTimeout(this.soundTimer);

        if (!PIXI.sound.exists(soundName)) {
            PIXI.sound.add(soundName, {
                url: this.getSoundPath(soundName),
                volume: this.waifuVolume,
                preload: true,
                loaded: function () {
                    this.playSoundWithMessage(soundName);
                    if (typeof callback == 'function') callback(duration);
                }.bind(this)
            });
        } else {
            this.playSoundWithMessage(soundName);
            if (typeof callback == 'function') callback(duration);
        }
    } else this.showMessage(this.soundList[soundName], duration, 10);
};

L2DWaifu.prototype.playSoundWithMessage = function (soundName) {
    let sound = PIXI.sound.find(soundName);
    sound.play();

    let duration = sound.duration * 1000;
    this.showMessage(this.soundList[soundName], duration, 10);

    this.soundTimer = setTimeout(function () {
        this.stopSound();
    }.bind(this), duration);
};

//模型开关
L2DWaifu.prototype.hideModel = function () {
    waifu_visibility = document.querySelector(this.waifuTag);
    this.stopSound();
    if (waifu_visibility.hidden === false) {
        this.playSound('lose', function (duration) {
            setTimeout(function () {
                $(this.waifuTag).animate({
                    left: -500
                }, 5000, function () {
                    this.waifuOnMute = true;
                    this.app.stop();
                    this.app.view.hidden = true;
                    waifu_visibility.hidden = true;
                    document.querySelector('.hide-live2d').querySelector('.keys').innerHTML = 'Show';
                }.bind(this));
            }.bind(this), duration);
        }.bind(this));
    } else {
        this.waifuOnMute = false;
        this.app.start();
        this.app.view.hidden = false;
        waifu_visibility.hidden = false;
        $(this.waifuTag).animate({
            left: 0
        }, 5000);
        this.playSound('complete');
        document.querySelector('.hide-live2d').querySelector('.keys').innerHTML = 'Hide';
    }
};

L2DWaifu.prototype.stopSound = function () {
    PIXI.sound.stopAll();
    this.playingSound = false;
};

L2DWaifu.prototype.muteModel = function () {
    if (this.waifuOnMute) {
        this.showMessage("就知道主人是不会不理我的(๑¯◡¯๑)", 6000, 10);
        this.waifuOnMute = false;
        PIXI.sound.unmuteAll();
        document.querySelector('.save-live2d').querySelector('.keys').innerHTML = 'Mute';
    } else {
        PIXI.sound.stopAll();
        this.showMessage("主人喜欢的是...安静点的女孩子吗？", 6000, 10);
        this.waifuOnMute = true;
        PIXI.sound.muteAll();
        document.querySelector('.save-live2d').querySelector('.keys').innerHTML = 'UnMute';
    }
};