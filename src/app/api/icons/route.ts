import { type NextRequest } from 'next/server'
import fs from "fs/promises";
import path from "path";
import _ from "lodash";

export async function GET(request: NextRequest) {
    const icons = await fs.readdir("/home/julian/mystery/public/icons");
    const ret = _.map(icons, (icon: string) => `icons/${icon}`);
    return Response.json(ret);
}
