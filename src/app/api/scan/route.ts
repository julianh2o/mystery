import { type NextRequest } from "next/server"
import fs from "fs/promises";
import path from "path";
import PixelPusher from "@/pixelpusher";
import YAML from "yaml"
import _ from "lodash";
import { render } from "@/renderer";

export async function GET(request: NextRequest) {
    const id = request.nextUrl.searchParams.get("id");
    const config = YAML.parse(await fs.readFile("/home/julian/mystery/current.yml", "utf-8"))
    const card = _.find(config.cards, { id });
    const canvas = await render(card ? card.default : ["TEXT Error"]);
    const pixelpusher = new PixelPusher("192.168.0.156", 2390);
    await pixelpusher.doSendCanvas(canvas);
    return new Response("OK", {
        status: 200,
    })
}