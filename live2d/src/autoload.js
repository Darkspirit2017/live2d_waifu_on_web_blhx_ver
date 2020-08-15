const live2d_path = "./live2d";

const css_path = live2d_path + '/css';
const src_path = live2d_path + '/src';
const lib_path = src_path + '/lib';


function autoload() {

    var isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile)
        return;


    $("<link>").attr({ href: css_path + "/waifu.css", rel: "stylesheet", type: "text/css" }).appendTo("head");
    $("<link>").attr({ href: css_path + "/font-awesome.css", rel: "stylesheet", type: "text/css" }).appendTo("head");

    $("head").append('<script type="text/javascript" src="' + lib_path + '/pixi/pixi.min.js' + '"></script>');
    $("head").append('<script type="text/javascript" src="' + lib_path + '/pixi/pixi-sound.js' + '"></script>');
    $("head").append('<script type="text/javascript" src="' + lib_path + '/core/live2dcubismcore.min.js' + '"></script>');
    $("head").append('<script type="text/javascript" src="' + lib_path + '/framework/live2dcubismframework.min.js' + '"></script>');
    $("head").append('<script type="text/javascript" src="' + lib_path + '/framework/live2dcubismpixi.min.js' + '"></script>');
    $("head").append('<script type="text/javascript" src="' + src_path + '/live2dWaifu.js' + '"></script>');



    $("body").append(`<div id="waifu">
    <div id="waifu-tips"></div>
        <canvas id="live2d" width="300" height="300"></canvas>
        <div id="waifu-tool">
            <span class="fa fa-lg fa-user-circle"></span>
            <span class="fa fa-lg fa-comment"></span>
            <span class="fa fa-lg fa-street-view"></span>
            <span class="fa fa-lg fa-camera-retro"></span>
            <span class="fa fa-lg fa-info-circle"></span>
            <span class="fa fa-lg fa-times"></span>
        </div>
    </div>`);

    //初始化看板娘，会自动加载指定目录下的 waifu-tips.json
    Live2DWaifu = new L2DWaifu();
    Live2DWaifu.initL2DWaifu();
    console.log(Live2DWaifu.modelNameList);

    $("body").append('<div class="live2d-tool hide-live2d no-select" onclick="hideModel()"><div class="keys">Hide</div></div>');
    $("body").append('<div class="live2d-tool switch-live2d no-select" onclick="switchModels()"><div class="keys">Switch</div></div>');
    $("body").append('<div class="live2d-tool save-live2d no-select" onclick="muteModel()"><div class="keys">Mute</div></div>');

}
autoload()