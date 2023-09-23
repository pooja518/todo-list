const { request } = require("express");

const express = require("express");
const app = express();
const port = 3000;

app.get("/todos", (req, res) => {
  //res.send("Hello world!");
  console.log("Todo list");
});

app.post("/todos", (req, res) => {
  console.log("Creating a todo", req.body);
});

app.put("/todos/:id/markAsCompleted",(req,res)=>{
    console.log("Update a todo with id :",req.params.id);
});

app.delete("/todos/:id",(req,res)=>{
    console.log("delete a todo with id:",req.params.id);
});

app.listen(port, () => {
  console.log(`Server started at node ${port}`);
});
