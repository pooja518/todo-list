
const express = require("express");
const app = express();

var csrf = require('tiny-csrf');
var cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST","PUT","DELETE"])); 

const path = require("path");

const {Todo} = require("./models");

app.set("view engine","ejs");

function getCurrentDate() {
  const today = new Date();

  // Get the year, day, and month
  const year = today.getFullYear();
  let day = today.getDate();
  let month = today.getMonth() + 1; // Months are 0-based, so add 1

  // Ensure day and month have two digits
  day = day.toString().padStart(2, '0');
  month = month.toString().padStart(2, '0');

  // Format the date as "YYYY-DD-MM"
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

// Example usage
const today = getCurrentDate();
//console.log(currentDate); // Output: "2023-26-09"



app.get("/",async (req,res)=> {
  const overDue = await Todo.overdue_todos(today);
  const dueToday = await Todo.duetoday_todos(today);
  const dueLater = await Todo.duelater_todos(today);
  const completedItems = await Todo.completed_todos();
  if(req.accepts("html")){
    res.render('index',{
      overDue,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: req.csrfToken(),
    });
  }
  else{
    res.json({
      overDue,dueToday,dueLater
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
    const title = req.body.title;
    const dueDate = req.body.dueDate;
    const todo = await Todo.addTodo({title: title, dueDate: dueDate, completed: false});

    //console.log(dueDate == today);
    
    return res.redirect("/");
  }
  catch(error){
    console.log(error);
    return res.status(422);
  }
  
});

app.put("/todos/:id/",async (req,res)=>{
    console.log("Update a todo with id :",req.params.id);
    const todo = await Todo.findByPk(req.params.id);

    const status = todo.completed;
    try{
      const updatedTodo = await todo.setCompletionStatus(status);
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
    return res.json({success:true});
    //return res.json(deletedTodo);
    
  }
  catch(error){
    console.log(error);
    return res.send(false);
    //return res.status(422).json(error);
  }
});

module.exports = app;