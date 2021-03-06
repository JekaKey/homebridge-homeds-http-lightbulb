var request = require("request");
var fs = require("fs");
var Service, Characteristic;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    On = homebridge.hap.Characteristic.On;

    homebridge.registerAccessory("homebridge-homeds-http-lightbulb", "HomeDSHttpLightbulb", HomeDSAccessory);
}

function HomeDSAccessory(log, config) {
    this.log = log;
    this.name = config["name"];
    this.stateUrl = config["stateUrl"];
    this.onUrl = config["onUrl"];
    this.offUrl = config["offUrl"];
    this.poolingInterval = config["poolingInterval"];
    this.method = config["method"];

    this.lightservice = new Service.Lightbulb(this.name, this.name);
    if (this.method == undefined) {this.method = 'get'}

    this.On = this.lightservice.getCharacteristic(On);

    this.lightservice
        .getCharacteristic(Characteristic.On)
        .on('get', this.getState.bind(this))
        .on('set', this.setState.bind(this));

    this.init();

}

HomeDSAccessory.prototype = {

    init: function() {
        setTimeout(this.monitorState.bind(this), 2000);
    },
    monitorState: function() {
        // this.log("monitor state");

        request[this.method]({
            url: this.stateUrl
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                var state = 1;

                var response = JSON.parse(body)

                if (response.result == "false") {
                  state = 0;
                }

                if (state != this.On.value) {
                    this.On.setValue(state);
                }

            } else {
                this.log("Server error");
            }
        }.bind(this));

        setTimeout(this.monitorState.bind(this), this.poolingInterval);

    },
    getState: function(callback) {

        this.log("Getting current state...");
        request[this.method]({
            url: this.stateUrl
        }, function(err, response, body) {
            if (!err && response.statusCode == 200) {
                var state = 1;

                var response = JSON.parse(body)

                if (response.result == "false") {
                  state = 0;
                }

                callback(null, state);

            } else {
                this.log("Error server get state",err);
                callback(null);
            }
        }.bind(this));

    },
    setState: function(state, callback) {

        this.log('Set lamp state to: ' + state);
        var url = (state == 1) ? this.onUrl : this.offUrl;
        this.log("URL: "+url);

        request[this.method]({
            url: url
        }, function(err, response, body) {
          this.log('Server response: '+body);
            if (!err && response.statusCode == 200) {
                callback(null);
            } else {
                this.log("Error server set state",err);
                callback(null);
            }
        }.bind(this));

    }

}

HomeDSAccessory.prototype.getServices = function() {
    return [this.lightservice];
}