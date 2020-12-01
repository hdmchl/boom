//docs: https://github.com/abandonware/noble

const noble = require('@abandonware/noble');

const ARGS = process.argv.slice() || [];
const option = ARGS[2] ? ARGS[2].toLowerCase() : false;

let BOOM_UUID = false;

switch (option) {
case 'mbp':
  BOOM_UUID = 'd448eb5df8794d539d343f9540e9444e'; //MBP
  break;
case 'fmbp':
  BOOM_UUID = 'c2fe00be910c41b9940d5ecc20bcdbb9'; //fMBP
  break;
default:
  process.exit(0);
}

const BOOM_SERVICE_UUID = '61fe';
const BOOM_POWER_CHARACTERISTIC_UUID = 'c6d6dc0d07f547ef9b59630622b01fd3';
const BOOM_POWER_VALUE = Buffer.from('8C8590CCCFB601', 'hex');

const TIMEOUT = 15000;
let SCAN_TIMEOUT;
let CONNECT_TIMEOUT;

let finishCallback = (err) => {
  if (err) console.log('Error!', err);

  noble.stopScanning();
  clearTimeout(SCAN_TIMEOUT);
  clearTimeout(CONNECT_TIMEOUT);
  process.exit(0);
}

noble.on('stateChange', (state) => {
  if (state === 'poweredOn') {
    noble.startScanning();
    SCAN_TIMEOUT = setTimeout(finishCallback, TIMEOUT, 'Scanning timed out.');
  } else {
    noble.stopScanning();
  }
});

noble.on('discover', (peripheral) => {
  //console.log(peripheral.uuid)
  
  if (peripheral.uuid === BOOM_UUID) {
    clearTimeout(SCAN_TIMEOUT);
    noble.stopScanning();

    peripheral.connect();
    CONNECT_TIMEOUT = setTimeout(finishCallback, TIMEOUT, 'Connection timed out. Are you already connected?');

    peripheral.connect(err => {
      clearTimeout(CONNECT_TIMEOUT);
      if (err) finishCallback(err);

      peripheral.discoverSomeServicesAndCharacteristics(
        [BOOM_SERVICE_UUID], 
        [BOOM_POWER_CHARACTERISTIC_UUID], 
        (err, services, characteristics) => {
          if (err) finishCallback(err);

          characteristics.forEach(chara => {
            if (chara.uuid === BOOM_POWER_CHARACTERISTIC_UUID) {
              chara.write(BOOM_POWER_VALUE, false, finishCallback);
            }
          });
      }); 
    });
  };
});