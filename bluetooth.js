var ringcommDevice;
var mainGattServer;
var mainService;
var mainChar1;

var mainChar1Data = [];

var textEnabled = false;

const cmdToAction = {
  2: sendText,
};

function sendText() {
  if (textEnabled) {
    const msg = $("#text-preset-input").val();
    console.log("SENDING TEXT: " + msg);
  }
}

function onPairDeviceClicked() {
  console.log("Requesting Ring Comm...");
  navigator.bluetooth
    .requestDevice({
      filters: [{ services: [MAIN_SERVICE_UUID] }, { name: "Ring Comm" }],
    })
    .then((device) => {
      console.log("> Requested " + device.name + " (" + device.id + ")");
      ringcommDevice = device;
      return device.gatt.connect();
    })
    .then((server) => {
      console.log("> Connected to GATT Server ");
      mainGattServer = server;
      return server.getPrimaryService(MAIN_SERVICE_UUID);
    })
    .then((service) => {
      console.log("> Found service");
      mainService = service;
      return service.getCharacteristic(MAIN_CHAR1_UUID);
    })
    .then((characteristic) => {
      mainChar1 = characteristic;
      render();
      return characteristic.startNotifications().then((_) => {
        console.log("> Started notifications");
        characteristic.addEventListener(
          "characteristicvaluechanged",
          handleNotification
        );
      });
    })
    .catch((error) => {
      console.log("Argh! " + error);
    });
}

function onClearDataClicked() {
  mainChar1Data = [];
  render();
}

function onEnableTextClicked() {
  textEnabled = !textEnabled;

  $("#text-preset-input").css("display", textEnabled ? "block" : "none");
}

function handleNotification(event) {
  const value = event.target.value;
  mainChar1Data.push(value);
  handleDataActions(value);
  render();
}

function handleDataActions(data) {
  const cmd = data.getUint8(0);
  if (cmdToAction[cmd]) {
    cmdToAction[cmd]();
  }
}

function render() {
  // render device info
  if (ringcommDevice != undefined) {
    $("#device-info").css("display", "block");
    $("#no-device-info").css("display", "none");

    $("#device-info #name").text(ringcommDevice.name);
    $("#device-info #id").text(ringcommDevice.id);
    $("#device-info #connected").text(
      ringcommDevice.gatt.connected ? "true" : "false"
    );
  }
  // render data container
  $("#data-container").empty();
  for (const d of mainChar1Data) {
    var strData = "0x";
    for (let i = 0; i < d.byteLength; i++) {
      strData += ("00" + d.getUint8(i).toString(16)).slice(-2);
    }
    $("#data-container").append(`<div>${strData}<div>`);
  }
}
