const Task = require("../models/Task");

const GetTasks = async (req, res) => {
  try {
    const tasks = await Task.find();

    res.status(200).json({
      message: "Tasks fetched successfully",
      tasks
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message
    });
  }
};

const CreateTask = async (req, res) => {
  try {
    const { title, description, completed } = req.body;

    const task = new Task({
      title,
      description,
      completed
    });

    const savedTask = await task.save();

    res.status(201).json({
      message: "Task created successfully",
      task: savedTask
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to create task",
      error: error.message
    });
  }
};

const UpdateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, completed } = req.body;

    const updatedTask = await Task.findByIdAndUpdate(
      id,
      { title, description, completed },
      { new: true, runValidators: true }
    );

    if (!updatedTask) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to update task",
      error: error.message
    });
  }
};

const DeleteTask = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTask = await Task.findByIdAndDelete(id);

    if (!deletedTask) {
      return res.status(404).json({
        message: "Task not found"
      });
    }

    res.status(200).json({
      message: "Task deleted successfully",
      task: deletedTask
    });
  } catch (error) {
    res.status(400).json({
      message: "Failed to delete task",
      error: error.message
    });
  }
};

module.exports = { CreateTask, GetTasks, UpdateTask, DeleteTask };
