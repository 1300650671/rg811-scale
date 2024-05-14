//中测院 静态流量点 atp     30     60      90      120       150
//国家院 静态流量点 atp     50     100     120     150
//国家院 静态流量点 stp20   55.2   111.3   132.3   163.7

//国家院 静态压力点         0.5    2.0     5.0

//国家院 潮气量            400     600     800
var sensors_config = [{
        "sensors_number": 0,
        "sensors_name": "气路流量",
        "sensors_value": [-180, -160, -140, -120, -100, -90, -80, -70, -60, -50, -40, -30, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25,30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160, 170, 180]
    },
    {
        "sensors_number": 1,
        "sensors_name": "气路压力",
        "sensors_value": [-15, -5, -2, -0.5, 0, 0.5, 2, 5, 15]
    },
    {
        "sensors_number": 2,
        "sensors_name": "差压",
        "sensors_value": [0, 0.5, 2, 5, 15, 20, 30]
    },
    {
        "sensors_number": 3,
        "sensors_name": "超低压",
        "sensors_value": [0, 0.2, 0.5, 0.7, 1, 1.5]
    },
    {
        "sensors_number": 4,
        "sensors_name": "潮气量",
        "sensors_value": [100, 200, 400, 600, 800, 1000, 1800, 2200]
    },
    {
        "sensors_number": 5,
        "sensors_name": "测距",
        "sensors_value": [100, 200, 400, 600, 800, 1000, 1800, 2200]
    },
];

$(document).ready(function() {
    initSensor();
    $('.editKeduData').delegate('.col-md-2', 'change', function() {
        // $(".col-md-2").click(function () {
        //获取传感器的序号
        var index = $(".col-md-2").index(this);
        sensors_select = index;
        let i = 0;
        if (sensors_value[sensors_select]["flag"] != 0) {
            for (var k in sensors_value[sensors_select]["value"]) { //遍历packJson 对象的每个key/value对,k为key
                // alert(k + " " + sensors_value[sensors_select]["value"][k]);
                $("#input" + i + "0").val(k);
                $("#input" + i + "1").val(sensors_value[sensors_select]["value"][k]);
                i++;
            }
        }
        $('#formModal').modal('show')
    });

});

function initSensor() {
    var html = "";
    $(".sensorNameList").html(html);
    for (let i = 0; i < sensors_config.length; i++) {
        html += "<div class=\"col-md-2\">\n" +
            "                            <div class=\"panel panel-solid-danger s" + sensors_config[i].sensors_number + "\">\n" +
            "                                <div class=\"panel-heading\">\n" +
            "                                    <h3 class=\"panel-title\">" + sensors_config[i].sensors_name + "</h3>\n" +
            "                                </div>\n" +
            "                                <div class=\"panel-body\">\n" +
            "                                    红色：未刻度<br>绿色：未刻度\n" +
            "                                </div>\n" +
            "                            </div>\n" +
            "                        </div>";
    }
    $(".sensorNameList").html(html);
}