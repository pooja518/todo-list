
const express = require("express");
const app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());
const path = require("path");

const {Todo} = require("./models");

app.set("view engine","ejs");

app.get("/",async (req,res)=> {
  const allTodos = await Todo.getTodos();
  if(req.accepts("html")){
    res.render('index',{
      allTodos
    });
  }
  else{
    res.json({
      allTodos
    });
  }
});

app.use(express.static(path.join(__dirname,'public')));

app.get("/todos", (req, res) => {
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

module.exports = app;