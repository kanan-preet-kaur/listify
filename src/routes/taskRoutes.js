const express = require("express");
const {
  CreateTask,
  GetTasks,
  UpdateTask,
  DeleteTask
} = require("../controllers/taskController");

const router = express.Router();

router.get("/", GetTasks);
router.post("/", CreateTask);
router.put("/:id", UpdateTask);
router.delete("/:id", DeleteTask);

module.exports = router;
