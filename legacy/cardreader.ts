import * as HID from "node-hid";
import EventEmitter from "events";

const keys = "1234567890";

class CardReader extends EventEmitter {
  reader?: HID.HID;

  constructor() {
    super();
    //console.log("device:", HID.devices());
    try {
      this.reader = new HID.HID("/dev/hidraw0");

      let accum: string[] = [];
      this.reader.on("data", (data: Buffer) => {
        const [_, __, v] = data;
        if (v === 0x28) {
          this.emit("cardScanned", accum.join(""));
          accum = [];
        } else if (v === 0x00) {
          return;
        } else {
          accum.push(keys[v - 0x1e]);
        }
      });
    } catch (err) {
      console.log("Failed to connect to card reader");
    }
  }
}

export default CardReader;
