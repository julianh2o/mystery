"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const app = (0, express_1.default)();
const port = 8080; // default port to listen
// Define a route handler for the default home page
app.get("/", (req, res) => {
  res.send("Hello world!");
});
// Start the Express server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
