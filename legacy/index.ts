import express, { Request, Response } from "express";
import fs from "fs";
import path from "path";
import CardReader from "./cardreader";
import { Client } from "node-scp";
import PixelPusher from "./pixelpusher";
import _ from "lodash";
import YAML from 'yaml'

import { registerFont, createCanvas, loadImage, Canvas, Image, CanvasRenderingContext2D } from 'canvas';
// @ts-ignore
import BDFFont from "bdf-canvas";

const pixelpusher = new PixelPusher("192.168.0.154", 2390);

const app = express();
const port = 8080; // default port to listen

const wrapText = (font: any, text: string, width: number): string[] => {
  const lines = [];
  const words = text.split(" ");
  let accum: string[] = [];
  while (words.length) {
    const next = words.shift()!;
    const lineWidth = font.measureText([...accum, next].join(" "))
    if (lineWidth.width > width) {
      if (accum.length) lines.push(accum.join(" "));
      accum = [next];
    } else {
      accum = [...accum, next];
    }
  }
  if (accum.length) lines.push(accum.join(" "));
  return lines;
}

const parseInstruction = (inst: string) => {
  const [cmd, ...opts] = inst.split(" ");
  const params: Record<string, unknown> = {};
  let opt: string | undefined = undefined;
  while (opt = opts.shift()) {
    if (!opt || !opt.startsWith("#")) {
      opts.unshift(opt);
      break;
    }

    const [key, value] = opt!.slice(1).split("=");
    params[key] = value || true;
    if (String(parseInt(value)) == String(value)) params[key] = parseInt(value)
  }
  return { cmd, params, remain: opts.join(" "), opts };
}

const render = async (instructions: string[]) => {
  console.log("Rendering", instructions);
  const canvas: Canvas = createCanvas(64, 32);
  const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

  const font = new BDFFont.BDFFont(await fs.promises.readFile("./resources/6x10.bdf", "utf-8"));
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (const inst of instructions) {
    ctx.fillStyle = "#0f6";
    const { cmd, params, remain } = parseInstruction(inst);
    if (cmd === "TEXT") {
      const text = remain;
      console.log({ params, text })
      const wrapped = wrapText(font, text as string, 62);

      if (params.color) ctx.fillStyle = `${params.color}`;

      let y = params.y as number || 6;
      console.log({ y })
      const MAX_LINES = 4;
      const LINE_HEIGHT = 8;
      for (const line of _.take(wrapped, MAX_LINES)) {
        font.drawText(ctx, line, params.x || 1, y);
        console.log("draw text", line, params.x || 1, y)
        y += LINE_HEIGHT
      }
    } else if (cmd === "IMAGE") {
      const image = await loadImage(path.join(__dirname, "img", remain));
      params.x = params.x || 0;
      params.y = params.y || 0;
      params.w = params.w || image.width;
      params.h = params.h || image.height;

      ctx.drawImage(image, params.x as number, params.y as number, params.w as number, params.h as number);
    }
  }

  await pixelpusher.doSendCanvas(canvas);
  // return canvas.createPNGStream().pipe(res);
}

const cardScanned = async (id: string) => {
  const config = YAML.parse(await fs.promises.readFile(path.join(__dirname, "default.yml"), "utf-8"))
  const card = _.find(config.cards, { id });
  if (!card) {
    render(["TEXT Error"]);
  } else {
    render(card.default);
  }
}

app.use(express.static('public'))
app.use("/img", express.static('img'))

app.get("/icons", async (req: Request, res: Response) => {
  const iconsDir = path.join(__dirname, "img", "icons");
  const icons = await fs.promises.readdir(iconsDir);
  const ret = _.map(icons, (icon) => `icons/${icon}`);
  res.json(ret);
});

app.get("/default.yml", async (req: Request, res: Response) => {
  res.send(await fs.promises.readFile(path.join(__dirname, "default.yml"), "utf-8"));
});

app.get("/scan", async (req: Request, res: Response) => {
  const id = req.query.id;
  await cardScanned(id as string);
  res.send("OK");
});


// Start the Express server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
