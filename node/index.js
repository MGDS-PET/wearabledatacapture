"use strict";
var jf = require('jsonfile')
var Bean = require('ble-bean')

var file = "data.json"
var obj = {name: 'bean'}

var intervalId;
var connectedBean;

Bean.discover(function(bean){
  connectedBean = bean;
  process.on('SIGINT', exitHandler.bind(this));

  bean.on("accell", function(x, y, z, valid){
    var status = valid ? "valid" : "invalid";
    var dataname = Date.toString(); 
    obj[dataname] = x + ',' + y + ',' + z;
    // console.log("received " + status + " accell\tx:\t" + x + "\ty:\t" + y + "\tz:\t" + z );
    console.log(dataname);
  });

  bean.on("disconnect", function(){
    process.exit();
  });

  bean.connectAndSetup(function(){

    var readData = function() {

      bean.requestAccell(
      function(){
        console.log("request accell sent");
      });

      bean.readBatteryLevel(function(battery){
          console.log("battery:", battery);
      });

      bean.readManufacturerName(function(manufacturer){
          console.log("manufacturer", manufacturer);  
          obj.nname = manufacturer; 
      });

      bean.on("serial", function(data, valid){
          console.log(data.toString());
      });


    }

    intervalId = setInterval(readData,1000);

  });

});

process.stdin.resume();//so the program will not close instantly
var triedToExit = false;

//turns off led before disconnecting
var exitHandler = function exitHandler() {

    // writes data to a json file
    jf.writeFile(file, obj, function(err){
        console.log(err);
    });

  var self = this;
  if (connectedBean && !triedToExit) {
    triedToExit = true;
    console.log('Turning off led...');
    clearInterval(intervalId);
    connectedBean.setColor(new Buffer([0x0,0x0,0x0]), function(){});
    //no way to know if succesful but often behind other commands going out, so just wait 2 seconds
    console.log('Disconnecting from Device...');
    setTimeout(connectedBean.disconnect.bind(connectedBean, function(){}), 2000);
  } else {
    process.exit();
  }
};
