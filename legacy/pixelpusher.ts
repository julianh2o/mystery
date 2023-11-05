import * as dgram from "dgram";
import { Buffer } from "buffer";
import util from "util";
import sharp from "sharp";
import { Canvas } from "canvas";

class PixelPusher {
  ip: string;
  port: number;
  constructor(ip: string, port: number) {
    this.ip = ip;
    this.port = port;
  }

  async doSend(p: string) {
    let img = await sharp(p);
    console.log(await img.metadata())
    img = img.resize(64, 32, { fit: "contain" });
    const buf = await img.raw().toBuffer();
    await this.sendScreen(buf);
  }

  async doSendCanvas(canvas: Canvas) {
    const bgra = canvas.toBuffer("raw");
    const rgb = Buffer.alloc(3 * (bgra.length / 4));
    let dstIndex = 0;
    for (let srcIndex = 0; srcIndex < bgra.length; srcIndex += 4) {
      rgb[dstIndex + 0] = bgra[srcIndex + 2]; //red
      rgb[dstIndex + 1] = bgra[srcIndex + 1]; //green
      rgb[dstIndex + 2] = bgra[srcIndex + 0]; //blue
      dstIndex += 3;
    }
    await this.sendScreen(rgb);
  }

  async sendScreen(buf: Buffer) {
    const SEGMENT_SIZE = 16;
    const LEDS_PER_BUF = 64;
    let led = 0;
    // console.log(buf.length)
    while (true) {
      if (buf.length - led * 3 <= 0) break;
      const frame = Buffer.alloc(3 * LEDS_PER_BUF + 1);
      const copyBytes = Math.min(3 * LEDS_PER_BUF, buf.length - led * 3);
      frame[0] = led / SEGMENT_SIZE;
      buf.copy(frame, 1, led * 3, led * 3 + copyBytes)
      // for (let i = 1; i < copyBytes; i += 3) {
      //   frame[i] = 0;
      //   frame[i + 1] = 255;
      //   frame[i + 2] = 255;
      // }
      // frame[1] = 0;
      // frame[2] = 0;
      // frame[3] = 0;
      led += LEDS_PER_BUF;
      // console.log("FRAME", frame);
      await this.send(frame);
      await new Promise((resolve, reject) => setTimeout(resolve, 15));
    }
  }

  async send(message: Buffer) {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket("udp4");

      client.send(
        message,
        this.port,
        this.ip,
        (err: Error | null, bytes: number) => {
          if (err) reject(err);
          resolve(bytes);
          client.close();
        },
      );
    });
  }
}

export default PixelPusher;
