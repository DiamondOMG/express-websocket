const express = require("express");
const WebSocket = require("ws");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware สำหรับจัดการ JSON body
app.use(bodyParser.json());

// สร้าง WebSocket server
const wss = new WebSocket.Server({ port: 3001 });
const clients = new Map(); // เก็บข้อมูลผู้ใช้ที่เชื่อมต่อ

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    if (data.id) {
      clients.set(data.id, ws); // บันทึกการเชื่อมต่อโดยใช้ id
      console.log(`Client connected with id: ${data.id}`);
    }
  });

  ws.on("close", () => {
    clients.forEach((client, id) => {
      if (client === ws) {
        clients.delete(id);
        console.log(`Client disconnected with id: ${id}`);
      }
    });
  });
});

// Endpoint สำหรับรับข้อความจาก Postman
app.post("/send-message", (req, res) => {
  const { message, id } = req.body;

  const client = clients.get(id);
  if (client) {
    client.send(JSON.stringify({ message: `Echo: ${message}`, id }));
    res.status(200).send({ status: "Message sent to WebSocket" });
  } else {
    res.status(400).send({ error: "Invalid ID" });
  }
});

// เริ่มเซิร์ฟเวอร์ Express
app.listen(port, () => {
  console.log(`HTTP server running at http://localhost:${port}`);
});
