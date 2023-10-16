import express, { Request, Response } from "express";

const app = express();
const port = 8080; // default port to listen

// Define a route handler for the default home page
app.get("/", (req: Request, res: Response) => {
    res.send("Hello world!");
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server started at http://localhost:${port}`);
});
