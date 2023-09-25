
const express = require("express");
const app = express();
const port = 3000;
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const {Todo} = require("./models");



app.get("/todos", (req, res) => {
  res.send("Hello world!");
  console.log("Todo list");
  
});

app.post("/todos", async (req, res) => {
  console.log("Creating a todo", req.body);
  try{
    const todo = await Todo.addTodo({title: req.body.title, dueDate: req.body.dueDate, completed: false});
    return res.json(todo);
  }
  catch(error){
    console.log(error);
    return res.status(422);
  }
  
});

app.put("/todos/:id/markAsCompleted",async (req,res)=>{
    console.log("Update a todo with id :",req.params.id);
    const todo = await Todo.findByPk(req.params.id);
    try{
      const updatedTodo = await todo.markAsCompleted();
      return res.json(updatedTodo);
    }
    catch(error){
      console.log(error);
      return res.status(422);
    }
    
});

app.delete("/todos/:id",async (req,res)=>{
    console.log("delete a todo with id:",req.params.id); 
    const todo = await Todo.findByPk(req.params.id);
  try{
    const deletedTodo = await todo.deleteId(req.params.id);
    return res.send(true);
    //return res.json(deletedTodo);
    
  }
  catch(error){
    console.log(error);
    return res.send(false);
    //return res.status(422).json(error);
  }
});

app.listen(port, () => {
  console.log(`Server started at node ${port}`);
});
