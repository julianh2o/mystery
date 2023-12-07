import { type NextRequest } from 'next/server'
import fs from "fs/promises";

const CONFIG_PATH = "/home/julian/mystery/current.yml";

export async function GET(request: NextRequest) {
    const yml = await fs.readFile(CONFIG_PATH, "utf-8");
    return new Response(yml, {
        status: 200,
    })
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const content = body.content;
    await fs.writeFile(CONFIG_PATH, content, "utf-8");
    return new Response("OK", {
        status: 200,
    })
}

