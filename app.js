

const express = require("express");
const app = express();

var csrf = require('tiny-csrf');
var cookieParser = require('cookie-parser');

const bodyParser = require('body-parser');

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

const path = require("path");

const {Todo,User} = require("./models");

const passport = require('passport');
const connectEnsureLogin = require('connect-ensure-login');
const session = require('express-session');
const LocalStrategy = require('passport-local');
const bcrypt = require('bcrypt');
const saltRounds = 10;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));


app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long",["POST","PUT","DELETE"])); 
app.set("view engine","ejs");

app.use(session({
  secret: "my-super-secret-key-21728172615261562",
  cookie: {
    maxAge: 24*60*60*1000
  }
}))

app.use(passport.initialize());

app.use(passport.session());

passport.use(new LocalStrategy({
  usernameField: 'email',
  passwordField: 'password'
  },(username,password,done)=> {
    User.findOne({
      where: {
        email: username,
        password: password
      }
    })
    .then((user)=> {
      return done(null, user)
    }).catch((error)=> {
      return (error)
    })
  }
))

passport.serializeUser((user,done)=>{
  console.log("Serializing user in session",user.id);
  done(null,user.id);
})

passport.deserializeUser((id,done)=> {
  User.findByPk(id)
  .then(user=> {
    done(null,user)
  })
  .catch(error=> {
    done(error,null)
  })
})





app.get("/",async (req,res)=> {
  res.render('index',{
    title: "Todo application",
    csrfToken: req.csrfToken(),
  });
});


app.get("/todos",connectEnsureLogin.ensureLoggedIn(), async (req,res)=> {
  const overDue = await Todo.overdue_todos(today);
  const dueToday = await Todo.duetoday_todos(today);
  const dueLater = await Todo.duelater_todos(today);
  const completedItems = await Todo.completed_todos();
  if(req.accepts("html")){
    res.render('todos',{
      title: "Todo application",
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


app.get("/signup",(req,res)=> {
  res.render("signup",{
    title: "Signup",
    csrfToken: req.csrfToken()
  });
})


app.post("/users",async (req,res)=>{
   //console.log(req.body.firstName)
   const hashedPwd = await bcrypt.hash(req.body.password,saltRounds);
   console.log(hashedPwd);
   try{
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPwd
  
     });
     req.login(user,(err)=>{
      if(err){
        console.log(err);
      }
      res.redirect("/todos");
     })
   }
   catch(err){
    console.log(err);
   }
   
})

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