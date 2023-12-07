import path from "path";
import fs from "fs/promises";
import _ from "lodash";
import { registerFont, createCanvas, loadImage, Canvas, Image, CanvasRenderingContext2D } from 'canvas';
// @ts-ignore
import BDFFont from "bdf-canvas";

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

export const imageFromDataURL = async (data: string) => {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
        img.onload = resolve;
        img.src = data;
    });
    return img;
}

export const render = async (instructions: string[]) => {
    console.log("Rendering", instructions);
    const canvas: Canvas = createCanvas(64, 32);
    const ctx: CanvasRenderingContext2D = canvas.getContext('2d');

    const font = new BDFFont.BDFFont(await fs.readFile("./resources/6x10.bdf", "utf-8"));
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
            const isDataURL = remain.startsWith("data:image/png");
            const image = isDataURL ? await imageFromDataURL(remain) : await loadImage(path.join(__dirname, "img", remain));
            params.x = params.x || 0;
            params.y = params.y || 0;
            params.w = params.w || image.width;
            params.h = params.h || image.height;

            ctx.drawImage(image, params.x as number, params.y as number, params.w as number, params.h as number);
        }
    }

    return canvas;
}
