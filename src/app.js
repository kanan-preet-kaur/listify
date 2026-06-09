const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const taskRoutes = require("./routes/taskRoutes");
require("dotenv").config();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));
app.use("/tasks", taskRoutes);

async function main() {
  await mongoose.connect(process.env.MONGO_URL);
}

main()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log(err);
  });

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

app.listen(process.env.PORT, () => {
  console.log(`Server is listening to port ${process.env.PORT}`);
});
