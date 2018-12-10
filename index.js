var Service, Characteristic;
var request = require('sync-request');

var url 

module.exports = function (homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-wifi-switch", "SimpleWifiSwitch", SimpleWifiSwitch);
}


function SimpleWifiSwitch(log, config) {
    this.log = log;
    this.state = false;
    this.name = config["name"];
}

SimpleWifiSwitch.prototype = {

    httpRequest: function (url, body, method, username, password, sendimmediately, callback) {
        request({
                    url: url,
                    body: body,
                    method: method,
                    rejectUnauthorized: false
                },
                function (error, response, body) {
                    callback(error, response, body)
                })
    },

    getPowerState: function (callback) {
        var res = request('GET', 'http://192.168.0.1/xml/GlobalSettings.xml', {} );
        var matchs = new RegExp(/(?:<BandMode>)(\d)(?:<\/BandMode>)/,'gi').exec(res.body)
        if(matchs && matchs.length) {
            this.state = matchs[3] !== '3';
        }
        callback(null, this.state);
    },

    setPowerState: function(powerOn, callback) {
        var body;
        var login = request('GET', 'http://192.168.0.1/login/Login.txt?password=admin&user=admin', {});
        var onOff = powerOn ? '3' : '1';
        var res = request('GET', 'http://192.168.0.1/setWirelessBandMode.html?WirelessBandMode=' + onOff);
		if(res.statusCode > 400){
			this.log('HTTP power function failed');
			callback(error);
		}else{
			this.log('HTTP power function succeeded!');
	    	callback();
		}
    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {
        var informationService = new Service.AccessoryInformation();

        informationService
                .setCharacteristic(Characteristic.Manufacturer, "Luca Manufacturer")
                .setCharacteristic(Characteristic.Model, "Luca Model")
                .setCharacteristic(Characteristic.SerialNumber, "Luca Serial Number");

        switchService = new Service.Switch(this.name);
        switchService
                .getCharacteristic(Characteristic.On)
                .on('get', this.getPowerState.bind(this))
                .on('set', this.setPowerState.bind(this));

    
        return [switchService];
    }
};