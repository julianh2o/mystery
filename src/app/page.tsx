'use client'

import Image from 'next/image'
import styles from './page.module.css'
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import axios from "axios";
import useAxios from 'axios-hooks'
import { useEffect } from 'react';
import { fabric } from "fabric";
import React from "react";
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react'
import NoSSR from 'react-no-ssr';
import _ from "lodash";
import { ChromePicker, RGBColor } from "react-color";
import { BaseBrush } from 'fabric/fabric-impl';
import { Button } from '@mui/material';

axios.defaults.baseURL = 'http://localhost:3000';

const SCALE_X = 10;
const SCALE_Y = 10;
const GRID_DIMENSIONS = { x: 64, y: 32 };

const useCanvas = (width: number, height: number) => {
  const canvas = React.useRef<HTMLCanvasElement>(document.createElement("canvas"));
  useEffect(() => {
    canvas.current.width = width;
    canvas.current.height = height;
  }, [canvas]);

  return canvas.current;
}

const setPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, g: number, b: number, a = 255) => {
  const idata = ctx.createImageData(1, 1);
  idata.data[0] = r;
  idata.data[1] = g;
  idata.data[2] = b;
  idata.data[3] = a;
  ctx.putImageData(idata, x, y);
}

const createGrid = (w: number, height: number) => {
  const elements = [];
  for (let x = 0; x < GRID_DIMENSIONS.x; x++) {
    for (let y = 0; y < GRID_DIMENSIONS.y; y++) {
      var rect = new fabric.Rect({
        left: x * SCALE_X,
        top: y * SCALE_Y,
        fill: "white",
        stroke: "#ccc",
        strokeWidth: 1,
        width: SCALE_X,
        height: SCALE_Y,
      });
      elements.push(rect);
    }
  }

  return new fabric.Group(elements, { selectable: false })
}

interface Point2D {
  x: number;
  y: number;
}

function calcStraightLine(start: Point2D, end: Point2D) {
  var points: Point2D[] = new Array();
  // Translate coordinates
  var x1 = start.x;
  var y1 = start.y;
  var x2 = end.x;
  var y2 = end.y;
  // Define differences and error check
  var dx = Math.abs(x2 - x1);
  var dy = Math.abs(y2 - y1);
  var sx = (x1 < x2) ? 1 : -1;
  var sy = (y1 < y2) ? 1 : -1;
  var err = dx - dy;
  // Set first coordinates
  points.push({ x: x1, y: y1 });
  // Main loop
  while (!((x1 == x2) && (y1 == y2))) {
    var e2 = err << 1;
    if (e2 > -dy) {
      err -= dy;
      x1 += sx;
    }
    if (e2 < dx) {
      err += dx;
      y1 += sy;
    }
    // Set coordinates
    points.push({ x: x1, y: y1 });
  }
  // Return the result
  return points;
}

function createBrush(radius: number, hardness: number, color: RGBColor) {
  const canvas = document.createElement('canvas');
  canvas.width = 1 + radius * 2;
  canvas.height = 1 + radius * 2;
  const ctx = canvas.getContext('2d')!;

  // Draw a soft circular brush on the canvas
  const gradient = ctx.createRadialGradient(1 + radius, 1 + radius, 0, 1 + radius, 1 + radius, radius);
  const rgbString = `${color.r}, ${color.g}, ${color.b}`;
  gradient.addColorStop(0, `rgba(${rgbString}, 1)`);
  gradient.addColorStop(hardness, `rgba(${rgbString}, 1)`);
  gradient.addColorStop(1, `rgba(${rgbString}, 0)`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  return canvas;
}

const drawBrush = (ctx: CanvasRenderingContext2D, brush: HTMLCanvasElement, x: number, y: number) => {
  const offset = { x: (brush.width - 1) / 2, y: (brush.height - 1) / 2 }
  ctx.drawImage(brush, x - offset.x, y - offset.y)
}


const PixelRenderer: React.FC<{ color: RGBColor, onUpdate: (canvas: HTMLCanvasElement) => void }> = ({ color, onUpdate }) => {
  const { editor, onReady } = useFabricJSEditor();

  const pixelCanvas = useCanvas(64, 32);

  const _onReady = (canvas: fabric.Canvas) => {
    canvas.setDimensions({ width: 700, height: 400 });
    canvas.isDrawingMode = true;
    const brush = new fabric.PatternBrush(canvas);
    brush.getPatternSrc = () => document.createElement("canvas");
    canvas.freeDrawingBrush = brush;

    const grid = createGrid(GRID_DIMENSIONS.x, GRID_DIMENSIONS.y);
    const imgInstance = new fabric.Image(pixelCanvas, {
      left: 0,
      top: 0,
      scaleX: SCALE_X,
      scaleY: SCALE_Y,
      imageSmoothing: false,
    });

    canvas.add(grid);
    canvas.add(imgInstance);

    onReady(canvas);
  }

  React.useEffect(() => {
    if (!editor) return;
    const canvas = editor.canvas;

    let held = false;
    canvas.on('mouse:down', function (options) {
      held = true;
    });
    canvas.on('mouse:move', function (options) {
      if (!color) return;
      if (held) {
        const brush = createBrush(5, .7, color);
        const rastered = _.map(canvas.freeDrawingBrush._points, p => ({ x: Math.floor(p.x / SCALE_X), y: Math.floor(p.y / SCALE_Y) }));
        const points = _.reduce(rastered, (acc: Point2D[], curr: Point2D) => {
          if (acc.length === 0) return [curr];
          return [...acc, ...calcStraightLine(_.last(acc)!, curr)]
        }, [])
        const ctx = pixelCanvas.getContext("2d");
        if (!ctx) throw new Error("No context!");
        for (const p of points) {
          setPixel(ctx, p.x, p.y, color.r, color.g, color.b, (color.a ?? 1) * 255);
          drawBrush(ctx, brush, p.x, p.y)
        }
        canvas.renderAll();
      }
    });
    canvas.on('mouse:up', function (options) {
      held = false;
      onUpdate(pixelCanvas);
    });
    canvas.on('path:created', function (e) {
      canvas.remove(e.path);
    })

    return () => {
      canvas.off("mouse:down");
      canvas.off("mouse:move");
      canvas.off("mouse:up");
    }
  }, [editor, color])

  return (<FabricJSCanvas onReady={_onReady} />)
}

function insertLine(ref: ReactCodeMirrorRef, newLine: string, addWhitespace = true) {
  console.log(ref);
  var doc = editor.getDoc();
  var cursor = doc.getCursor(); // gets the line number in the cursor position
  var line = doc.getLine(cursor.line); // get the line contents
  var pos = { // create a new object to avoid mutation of the original selection
    line: cursor.line,
    ch: line.length // set the character position to the end of the line
  }
  const whitespace = line.substring(0, line.length - line.trimStart().length);
  doc.replaceRange(`\n${addWhitespace ? whitespace : ""}${newLine}`, pos); // adds a new line
}

function insertImageLine(ref: ReactCodeMirrorRef, insertText: string) {
  const selection = ref.view?.state.selection!;
  const cursor = selection.main.head;
  const content = ref.view?.state.doc.toString();
  const lineBeginning = content?.lastIndexOf("\n", cursor)! + 1;
  const lineEnding = content?.indexOf("\n", cursor)!;
  const line = content?.substring(lineBeginning, lineEnding)!;
  const whitespace = line.substring(0, line.length - line.trimStart().length);
  ref.view?.dispatch({
    changes: {
      from: lineEnding + 1,
      to: lineEnding + 1,
      insert: `${whitespace}${insertText}\n`
    },
    selection: { anchor: lineEnding + 1 }
  })
}

export default function Home() {
  const refs = React.useRef<ReactCodeMirrorRef>({});
  const [pixelCanvas, setPixelCanvas] = React.useState<HTMLCanvasElement>(document.createElement("canvas"));

  const [color, setColor] = React.useState<RGBColor>({ r: 255, g: 0, b: 0, a: 255 });
  const [{ data, loading, error }, refetch] = useAxios(
    '/api/yml'
  )

  const sendPixelData = (canvas: HTMLCanvasElement) => {
    console.log("sending pixels", canvas.toDataURL())
    setPixelCanvas(canvas);
    axios.post("/api/send", { data: canvas.toDataURL() });
  }

  const sendConfig = (content: string) => {
    axios.post("/api/yml", { content });
  }

  if (loading) return "Loading..";

  return (
    <main>
      <NoSSR>
        <Container>
          <Box>
            <Card>
              <CodeMirror
                ref={refs}
                value={data}
                onChange={(value) => sendConfig(value)}
              />

              <Button onClick={() => insertImageLine(refs.current, `- "IMAGE ${pixelCanvas.toDataURL()}"`)}>Insert Image</Button>

              <PixelRenderer color={color} onUpdate={(canvas: HTMLCanvasElement) => sendPixelData(canvas)} />

              <ChromePicker color={color} onChangeComplete={(c) => setColor(c.rgb)} />
            </Card>
          </Box>
        </Container>
      </NoSSR>
    </main>
  );
}