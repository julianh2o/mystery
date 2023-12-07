import { type NextRequest } from "next/server"
import fs from "fs/promises";
import path from "path";
import PixelPusher from "@/pixelpusher";
import YAML from "yaml"
import _ from "lodash";
import { render } from "@/renderer";
import { Canvas, Image } from 'canvas';


export async function POST(request: NextRequest) {
    const body = await request.json();
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = resolve;
        img.src = body.data;
    });
    console.log(img)
    // await new Promise(r => img.onload = r);
    // const canvas = await render(card ? card.default : ["TEXT Error"]);
    const pixelpusher = new PixelPusher("192.168.0.156", 2390);
    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    await pixelpusher.doSendCanvas(canvas);
    return new Response("OK", {
        status: 200,
    })
}