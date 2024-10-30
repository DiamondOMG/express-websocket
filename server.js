const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware สำหรับจัดการ JSON body
app.use(bodyParser.json());

// สร้าง HTTP server ที่มี WebSocket รวมอยู่ในพอร์ตเดียวกัน
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const clients = new Map(); // เก็บข้อมูลผู้ใช้ที่เชื่อมต่อ

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.screenId) {
      clients.set(data.screenId, ws); // บันทึกการเชื่อมต่อโดยใช้ screenId
      console.log(`Client connected with screenId: ${data.screenId}`);
    }
  });

  ws.on("close", () => {
    clients.forEach((client, screenId) => {
      if (client === ws) {
        clients.delete(screenId);
        console.log(`Client disconnected with screenId: ${screenId}`);
      }
    });
  });
});

// Endpoint สำหรับรับข้อความจาก Postman
app.post("/send-message", (req, res) => {
  const { customItemId, itemId, libraryItemId, screenId } = req.body;

  const client = clients.get(screenId);
  if (client) {
    // ส่งข้อมูลทั้งหมดไปยัง frontend
    const message = {
      customItemId,
      itemId,
      libraryItemId,
      screenId,
    };

    client.send(JSON.stringify(message));
    res.status(200).send({ status: "Message sent to WebSocket" });
  } else {
    res.status(400).send({ error: "Invalid screenId" });
  }
});

// เริ่มเซิร์ฟเวอร์ HTTP และ WebSocket บนพอร์ตเดียวกัน
server.listen(port, () => {
  console.log(`HTTP and WebSocket server running at http://localhost:${port}`);
});
