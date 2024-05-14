var port;
var reader;
var writer;
var keepReading = false;
var $ipt;
var sensors_value = [{
        "name": 0,
        "flag": 0,
    },
    {
        "name": 1,
        "flag": 0,
    },
    {
        "name": 2,
        "flag": 0,
    },
    {
        "name": 3,
        "flag": 0,
    },
    {
        "name": 4,
        "flag": 0,

    },
    {
        "name": 5,
        "flag": 0,

    },
    {
        "name": 6,
        "flag": 0,

    },
    {
        "name": 7,
        "flag": 0,

    },
    {
        "name": 8,
        "flag": 0,

    },
    {
        "name": 9,
        "flag": 0,

    },
    {
        "name": 10,
        "flag": 0,

    },
    {
        "name": 11,
        "flag": 0,

    },
    {
        "name": 12,
        "flag": 0,

    },
    {
        "name": 13,
        "flag": 0,

    },
    {
        "name": 14,
        "flag": 0,

    },
    {
        "name": 15,
        "flag": 0,

    },
    {
        "name": 16,
        "flag": 0,

    },
    {
        "name": 17,
        "flag": 0,

    },
    {
        "name": 18,
        "flag": 0,

    },
    {
        "name": 19,
        "flag": 0,

    },
];
var sensors_select;
var flow_read_timeid = null;

$(document).ready(function() {
    // 连接按钮
    $(".saveAuth").click(() => {

        if (checkStatus()) {
            return;
        }
        var cgq = $("#cgqAuth").prop("checked");
        var huxi = $("#huxiAuth").prop("checked");
        var wuchuang = $("#wuchuangAuth").prop("checked");
        var xinfei = $("#xinfeiAuth").prop("checked");
        var mazui = $("#mazuiAuth").prop("checked");

        var flag = "" + Number(cgq) + Number(huxi) + Number(wuchuang) + Number(xinfei) + Number(mazui);

        var flag_num = parseInt(flag, 2);

        $(".saveAuth").attr("disabled", "disabled");
        sendAuth(flag_num);
        setTimeout(function() {
            sendHV();
        }, 500);
        setTimeout(function() {
            sendSV();
        }, 1000);
        setTimeout(function() {
            sendSN();
        }, 1500);
        setTimeout(function() {
            sendP();
            $(".saveAuth").removeAttr("disabled");
            alert("写入完成！");
        }, 2000);
    });

    $(".connect").click(() => {
        if (!keepReading) {
            connectSerial();
        } else {
            alert("请先断开串口链接！");
        }
    });

    // 断开连接
    $(".disconnect").click(async() => {
        if (checkStatus()) {
            return;
        }
        keepReading = false;
        changeStatus();
        reader.cancel();
    });

    $('.editKeduData').delegate('input', 'change', function() {
        var key = "s" + sensors_select;
        var res = [];
        $("#formModal input").each(function() {
            if ($(this).val() != "") {
                var kv = {};
                kv[$(this).attr("id")] = $(this).val();
                res.push(kv);
            }
        });
        var str = JSON.stringify(res);
        setCookie(key, str, 30);

        var flowDatas = $(this).parents(".flowDatas");
        var aim = Number(flowDatas.find("label").html());
        var level = Number(flowDatas.find("input").eq(0).val());
        if (aim * level < 0) {
            level = 0 - level;
        }
        if (flowDatas.find("input").eq(0).val() != "") {
            flowDatas.find("input").eq(0).val(level);
        }

    });

    //保存并写入单个
    $(".btn_save_write").click(async() => {
        if (checkStatus()) {
            return;
        }

        // changeSymbol();

        sensors_value[sensors_select].value = "";

        let valueOk = -99999;
        for (let i = 0; i < $(".editKeduData").find("input").length / 2; i++) {
            if ($(".editKeduData").find("#input" + i + "0").val() != "") {
                let value1 = $(".editKeduData").find("#input" + i + "1").val();
                let value2 = $(".editKeduData").find("#input" + i + "0").val();
                if (Number(value1) < Number(valueOk)) {
                    alert("请检查 右侧传感器值顺序是否正确！");
                    return;
                }
                valueOk = value1;
                var test = Number(value1);
                /*
                if (!Number(value1)) {
                    $(".editKeduData").find("#input" + i + "1").css("border", "2px solid red");
                    alert("数据有误!");
                    return;
                } else {
                    $(".editKeduData").find("#input" + i + "1").css("border", "2px solid #e8ebed");
                }
                if (!Number(value2)) {
                    $(".editKeduData").find("#input" + i + "0").css("border", "2px solid red");
                    alert("数据有误!");
                    return;
                } else {
                    $(".editKeduData").find("#input" + i + "0").css("border", "2px solid #e8ebed");
                }
                */
                sensors_value[sensors_select].value += " " + Number(value1).toFixed(3) + " " + Number(value2).toFixed(3);
            }
        }
        sensors_value[sensors_select]["flag"] = 1;
        sendOneData(sensors_select);
        $('#formModal').modal('hide');
    });

    $(".btn_clear_all").click(function() {
        if (confirm("确定要清空所有数据吗？此操作不可恢复。")) {
            $(".editKeduData").find("input").val("");
            $(".editKeduData").find("input").change();
        }

    });

    //取消
    $(".btn_back").click(async() => {
        $("#formModal").modal('hide');
        $("input").val("");
    });

    //删除单个
    $(".btn_del_one").click(async() => {
        if (checkStatus()) {
            return;
        }
        let res_string = "unit_factor 17 ";
        res_string = res_string + sensors_select;
        res_string = res_string + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    });

    //删除单个本底
    $(".btn_clear_bendi").click(async() => {
        if (checkStatus()) {
            return;
        }
        let res_string = "unit_factor 85 ";
        res_string = res_string + sensors_select;
        res_string = res_string + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    });

    //读取单个
    $(".btn_read").click(async() => {
        if (checkStatus()) {
            return;
        }
        let res_string = "unit_factor 50 ";
        res_string = res_string + sensors_select;
        res_string = res_string + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    });

    //删除全部
    $(".del_sensor_value_all").click(async() => {
        if (checkStatus()) {
            return;
        }
        let res_string = "unit_factor 34";
        res_string = res_string + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    });

    //刷新写入状态
    $(".refresh_all").click(async() => {
        if (checkStatus()) {
            return;
        }
        let res_string = "unit_factor 51";
        res_string = res_string + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    });

    //选择传感器
    $('.sensorNameList').delegate('.col-md-2', 'click', function() {
        // $(".col-md-2").click(function () {
        //获取传感器的序号
        var className = $(this).find(".panel").attr("class");
        className = className.split(" ");
        var index = "";
        for (let i = 0; i < className.length; i++) {
            if (className[i].indexOf("s") > -1 && className[i].length <= 3) {
                index = className[i].replace("s", "");
            }
        }
        // var index = className[2].replace("s");
        // var index = $(".col-md-2").index(this);
        sensors_select = index;

        // modal-title
        if (sensors_select == 0) {
            clearInterval(flow_read_timeid);
            flow_read_timeid = setInterval(() => {
                qilu_flow_now();
            }, 1000)
        }

        for (var j = 0; j < sensors_config.length; j++) {
            if (sensors_config[j].sensors_number == sensors_select) {
                var html = "";
                $(".editKeduData").html(html);
                for (let i = 0; i < sensors_config[j].sensors_value.length; i++) {
                    html = "<div class=\"form-group flowDatas\">\n" +
                        "       <label for=\"inpu" + i + "0\" class=\"col-sm-3 control-label d" + i + "\">" + sensors_config[j].sensors_value[i] + "</label>\n" +
                        "       <div class=\"col-sm-3\">\n" +
                        "           <input type=\"text\" class=\"form-control\" id=\"input" + i + "0\" placeholder=\"标准器示值\">\n" +
                        "       </div>\n" +
                        "       <div class=\"col-sm-3\">\n" +
                        "           <input type=\"text\" class=\"form-control\" id=\"input" + i + "1\" placeholder=\"传感器示值\">\n" +
                        "       </div>\n" +
                        "       <div class=\"col-sm-3\">\n" +
                        "           <button type=\"button\" class=\"btn btn-info btn_read_one_flow\">读取</button>\n" +
                        "       </div>\n" +
                        "</div>";
                    $(".editKeduData").append(html);
                }
                break;
            }
        }

        $('#formModal').modal('show');

        var str = getCookie("s" + sensors_select);
        if (str != "") {
            var arr = JSON.parse(str);
            for (var k = 0; k < arr.length; k++) {
                var json = arr[k];
                for (var key in json) { //遍历json对象的每个key/value对,p为key
                    $(".editKeduData").find("#" + key).val(json[key]);
                }
            }
        }
    });
    //读取一个气流值
    $(".editKeduData").delegate(".btn_read_one_flow", "click", function() {
        if (checkStatus()) {
            return;
        }
        $ipt = $(this).parents(".flowDatas").find("input").eq(1);
        read_one_flow_value(sensors_select);
        // console.log($ipt);
        $(".editKeduData").find(".btn_read_one_flow").attr("disabled", "disabled");
    });
});

function checkStatus() {
    if (!keepReading) {
        alert("请先连接串口");
        return true;
    }
    return false;
}

//连接按钮
async function connectSerial() {
    port = await navigator.serial.requestPort();
    await port.open({
        baudRate: 115200
    }); // set baud rate
    keepReading = true;

    reader = port.readable.getReader();
    writer = port.writable.getWriter();
    var res = "";
    changeStatus();
    while (port.readable && keepReading) {
        try {
            while (true) {
                const {
                    value,
                    done
                } = await reader.read();
                if (done) {
                    // Allow the serial port to be closed later.
                    reader.releaseLock();
                    // Allow the serial port to be closed later.
                    writer.releaseLock();
                    break;
                }
                if (value) {
                    for (var i = 0; i < value.length; i++) {
                        res += String.fromCharCode(value[i]);
                    }
                    var lenthF = res.match(/F/g);
                    if (lenthF.length == 0) {
                        res = ""; //没有起始符号，清除
                    }
                    if (lenthF.length >= 4) {
                        var str = res.split("FF")[1];
                        var json = JSON.parse(str);
                        if (json.type == 1) {

                        }
                        if (json.type == 0) {
                            delete json["type"];
                            changeSensorsStatus(json);
                        }
                        if (json.type == 2) {
                            delete json["type"];
                            changeValue(json);
                        }
                        if (json.type == 3) {
                            delete json["type"];
                            changeBaseInfo(json);
                        }
                        if (json.type == 4) {
                            delete json["type"];
                            $ipt.val(parseFloat(json["value"]));
                            $ipt.change();
                            $(".editKeduData").find(".btn_read_one_flow").removeAttr("disabled");
                            flow_read_timeid = setInterval(() => {
                                qilu_flow_now();
                            }, 1000)
                        }
                        if (json.type == 5) {
                            delete json["type"];
                            $(".modal-title").html(json["value"]);
                        }

                        res = "";
                    }
                } else {
                    res = "";
                }
            }
        } catch (error) {
            // Handle non-fatal read error.
            // console.error(error);
            res = "";
        } finally {
            console.log(port.readable, keepReading);
        }
    }
    await port.close();
    console.log("port closed");
}

//改变链接图标颜色
function changeStatus() {
    if (keepReading) {
        $(".connect").html('<svg t="1635399235432" width="25px" height="25px" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3926"><path d="M923.875556 732.728889c-2.275556-54.613333-25.031111-104.675556-65.991112-145.635556l-65.991111-65.991111c-20.48-20.48-54.613333-20.48-75.093333 0-20.48 20.48-20.48 54.613333 0 75.093334l65.991111 65.991111c20.48 20.48 34.133333 47.786667 34.133333 75.093333 0 18.204444-2.275556 45.511111-25.031111 68.266667-20.48 20.48-45.511111 25.031111-63.715555 25.031111-27.306667 0-56.888889-13.653333-79.644445-34.133334l-166.115555-166.115555c-40.96-40.96-45.511111-104.675556-9.102222-141.084445 20.48-20.48 20.48-54.613333 0-75.093333-20.48-20.48-54.613333-20.48-75.093334 0-38.684444 38.684444-56.888889 86.471111-56.888889 138.808889 0 54.613333 22.755556 111.502222 65.991111 154.737778l166.115556 166.115555c40.96 40.96 97.848889 65.991111 154.737778 65.991111 52.337778 0 102.4-20.48 138.808889-56.888888 40.96-40.96 61.44-95.573333 56.888889-150.186667z m0 0" fill="#1afa29" p-id="3927"></path><path d="M309.475556 452.835556c-2.275556 0-2.275556 0 0 0l-45.511112-45.511112-22.755555-22.755555c-20.48-20.48-34.133333-45.511111-36.408889-72.817778 0-18.204444 2.275556-45.511111 25.031111-68.266667 20.48-20.48 45.511111-25.031111 63.715556-25.031111 27.306667 0 56.888889 11.377778 79.644444 34.133334l166.115556 166.115555c40.96 40.96 45.511111 104.675556 9.102222 141.084445-20.48 20.48-20.48 54.613333 0 75.093333 20.48 20.48 54.613333 20.48 75.093333 0 38.684444-38.684444 56.888889-86.471111 56.888889-138.808889 0-54.613333-22.755556-111.502222-65.991111-154.737778l-166.115556-166.115555c-40.96-40.96-97.848889-65.991111-154.737777-65.991111-52.337778 0-102.4 20.48-138.808889 56.888889-38.684444 38.684444-59.164444 93.297778-56.888889 147.911111 2.275556 54.613333 25.031111 104.675556 65.991111 145.635555l22.755556 22.755556 43.235555 45.511111c20.48 20.48 54.613333 20.48 75.093333 0 22.755556-20.48 25.031111-54.613333 4.551112-75.093333z m0 0" fill="#1afa29" p-id="3928"></path></svg>');
        setTimeout(function() {
            getBaseInfo();
        }, 2000);

    } else {
        $(".connect").html('<svg t="1635399235432" width="25px" height="25px" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="3926"><path d="M923.875556 732.728889c-2.275556-54.613333-25.031111-104.675556-65.991112-145.635556l-65.991111-65.991111c-20.48-20.48-54.613333-20.48-75.093333 0-20.48 20.48-20.48 54.613333 0 75.093334l65.991111 65.991111c20.48 20.48 34.133333 47.786667 34.133333 75.093333 0 18.204444-2.275556 45.511111-25.031111 68.266667-20.48 20.48-45.511111 25.031111-63.715555 25.031111-27.306667 0-56.888889-13.653333-79.644445-34.133334l-166.115555-166.115555c-40.96-40.96-45.511111-104.675556-9.102222-141.084445 20.48-20.48 20.48-54.613333 0-75.093333-20.48-20.48-54.613333-20.48-75.093334 0-38.684444 38.684444-56.888889 86.471111-56.888889 138.808889 0 54.613333 22.755556 111.502222 65.991111 154.737778l166.115556 166.115555c40.96 40.96 97.848889 65.991111 154.737778 65.991111 52.337778 0 102.4-20.48 138.808889-56.888888 40.96-40.96 61.44-95.573333 56.888889-150.186667z m0 0" fill="#d81e06" p-id="3927"></path><path d="M309.475556 452.835556c-2.275556 0-2.275556 0 0 0l-45.511112-45.511112-22.755555-22.755555c-20.48-20.48-34.133333-45.511111-36.408889-72.817778 0-18.204444 2.275556-45.511111 25.031111-68.266667 20.48-20.48 45.511111-25.031111 63.715556-25.031111 27.306667 0 56.888889 11.377778 79.644444 34.133334l166.115556 166.115555c40.96 40.96 45.511111 104.675556 9.102222 141.084445-20.48 20.48-20.48 54.613333 0 75.093333 20.48 20.48 54.613333 20.48 75.093333 0 38.684444-38.684444 56.888889-86.471111 56.888889-138.808889 0-54.613333-22.755556-111.502222-65.991111-154.737778l-166.115556-166.115555c-40.96-40.96-97.848889-65.991111-154.737777-65.991111-52.337778 0-102.4 20.48-138.808889 56.888889-38.684444 38.684444-59.164444 93.297778-56.888889 147.911111 2.275556 54.613333 25.031111 104.675556 65.991111 145.635555l22.755556 22.755556 43.235555 45.511111c20.48 20.48 54.613333 20.48 75.093333 0 22.755556-20.48 25.031111-54.613333 4.551112-75.093333z m0 0" fill="#d81e06" p-id="3928"></path></svg>');
    }
}

//改变传感器颜色
function changeSensorsStatus(json) {
    for (var key in json) {
        $("." + key).removeClass("panel-solid-danger");
        $("." + key).removeClass("panel-solid-success");
        $("." + key).addClass(json[key] == 0 ? 'panel-solid-danger' : 'panel-solid-success');
    }
}

//读出来的值写入表格
function changeValue(json) {
    var count = 0;
    for (var key in json) {
        if (count % 2 === 0) {
            $("#input" + parseInt(count / 2) + "1").val(json[key]);
            $("#input" + parseInt(count / 2) + "1").change();
        } else {
            $("#input" + parseInt(count / 2) + "0").val(json[key]);
            $("#input" + parseInt(count / 2) + "0").change();
        }
        count++;
    }
}

//基本信息写入
function changeBaseInfo(json) {
    $("#SNInput").val(json["sn"]);
    $("#HVInput").val(json["hv"]);
    $("#SVInput").val(json["sv"]);
    $("#PInput").val(json["pt"]);

    Number(json["cgq"]) == $("#cgqAuth").prop("checked") ? "" : $("#cgqAuth").click();
    Number(json["hx"]) == $("#huxiAuth").prop("checked") ? "" : $("#huxiAuth").click();
    Number(json["wc"]) == $("#wuchuangAuth").prop("checked") ? "" : $("#wuchuangAuth").click();
    Number(json["xf"]) == $("#xinfeiAuth").prop("checked") ? "" : $("#xinfeiAuth").click();
    Number(json["mz"]) == $("#mazuiAuth").prop("checked") ? "" : $("#mazuiAuth").click();
}

//读取一个流量值
async function read_one_flow_value(sensor) {
    clearInterval(flow_read_timeid);
    let res_string = "unit_factor 86 " + sensor + "\r\n";
    let res_u8 = stringToUint8Array(res_string);
    await writer.write(res_u8);
}

//发送单条数据
async function sendOneData(sensor) {
    if (sensors_value[sensor]["flag"] = 0)
        return;
    let res_string = "unit_factor 0 ";
    res_string = res_string + sensor;

    res_string = res_string + sensors_value[sensor].value;
    res_string = res_string + "\r\n";
    let res_u8 = stringToUint8Array(res_string);
    await writer.write(res_u8);
}

async function sendAuth(order) {
    let res_string = "unit_factor 68 " + order + "\r\n";
    let res_u8 = stringToUint8Array(res_string);
    await writer.write(res_u8);
}

//字符串转数组
function stringToUint8Array(str) {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
        arr.push(str.charCodeAt(i));
    }

    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array
}

async function sendHV() {
    if ($("#HVInput").val() != "") {
        let res_string = "unit_factor 80 " + $("#HVInput").val() + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    }
}

async function sendSV() {
    if ($("#SVInput").val() != "") {
        let res_string = "unit_factor 81 " + $("#SVInput").val() + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    }
}

async function sendSN() {
    if ($("#SNInput").val() != "") {
        let res_string = "unit_factor 83 " + $("#SNInput").val() + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    }
}

async function sendP() {
    if ($("#PInput").val() != "") {
        let res_string = "unit_factor 82 " + $("#PInput").val() + "\r\n";
        let res_u8 = stringToUint8Array(res_string);
        await writer.write(res_u8);
    }
}

async function getBaseInfo() {
    let res_string = "unit_factor 84\r\n";
    let res_u8 = stringToUint8Array(res_string);
    await writer.write(res_u8);
}

async function qilu_flow_now() {
    let res_string = "unit_factor 87\r\n";
    let res_u8 = stringToUint8Array(res_string);
    await writer.write(res_u8);
}