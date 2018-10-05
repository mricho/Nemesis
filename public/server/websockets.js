const usb = require("usb");
const WebSocketServer = require("websocket").server;
const devices = require("./devices");
const http = require("http");
const STM32USB = require("./devices/STM32USB.json");

const server = http.createServer((request, response) => {
  // process HTTP request. Since we're writing just WebSockets
  // server we don't have to implement anything.
});

server.listen(9002, () => {});

// create the server
wsServer = new WebSocketServer({
  httpServer: server
});

let connectedDevice;
const clients = [];

// WebSocket server
wsServer.on("request", request => {
  var connection = request.accept(null, request.origin);
  clients.push(connection);
  // Detect add/insert
  usb.on(`attach`, device => {
    if (device.deviceDescriptor.idVendor === STM32USB.vendorId) {
      devices.get((err, port) => {
        connectedDevice = port;
        if (connectedDevice) {
          connectedDevice.connected = true;
          connection.sendUTF(JSON.stringify(connectedDevice));
        }
      });
    }
  });

  // Detect remove
  usb.on(`detach`, device => {
    console.log(device);
    if (device.deviceDescriptor.idVendor === STM32USB.vendorId) {
      connection.sendUTF(
        JSON.stringify({
          dfu: false,
          connected: false
        })
      );
      clearInterval(wsServer.telemetryInterval);
    }
  });
  // This is the most important callback for us, we'll handle
  // all messages from users here.
  connection.on("message", message => {});

  connection.on("close", connection => {
    clearInterval(wsServer.telemetryInterval);
  });
});

const notifyProgress = data => {
  clients.forEach(client =>
    client.sendUTF(
      JSON.stringify({
        progress: data + "\n"
      })
    )
  );
};

const notifyTelem = telemetryData => {
  telemetryData.telemetry = true;
  clients.forEach(client => client.sendUTF(JSON.stringify(telemetryData)));
};

wsServer.telemetryInterval;
module.exports = {
  wsServer: wsServer,
  clients: clients,
  notifyProgress: notifyProgress,
  notifyTelem: notifyTelem
};
