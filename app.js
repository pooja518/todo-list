const express = require("express");
const app = express();

var csrf = require("tiny-csrf");
var cookieParser = require("cookie-parser");

const bodyParser = require("body-parser");

function getCurrentDate() {
  const today = new Date();

  // Get the year, day, and month
  const year = today.getFullYear();
  let day = today.getDate();
  let month = today.getMonth() + 1; // Months are 0-based, so add 1

  // Ensure day and month have two digits
  day = day.toString().padStart(2, "0");
  month = month.toString().padStart(2, "0");

  // Format the date as "YYYY-DD-MM"
  const formattedDate = `${year}-${month}-${day}`;

  return formattedDate;
}

// Example usage
const today = getCurrentDate();
//console.log(currentDate); // Output: "2023-26-09"

const path = require("path");

const { Todo, User } = require("./models");

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const flash = require("connect-flash");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(cookieParser("shh! some secret string"));
app.use(csrf("this_should_be_32_character_long", ["POST", "PUT", "DELETE"]));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "my-super-secret-key-21728172615261562",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());

app.use(passport.session());
app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.use(flash());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid password" });
          }
        })
        .catch((error) => {
          return done(err);
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serializing user in session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.get("/", async (req, res) => {
  res.render("index", {
    title: "Todo application",
    csrfToken: req.csrfToken(),
  });
});

app.get("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const userId = req.user.id;
  const overDue = await Todo.overdue_todos(today, userId);
  const dueToday = await Todo.duetoday_todos(today, userId);
  const dueLater = await Todo.duelater_todos(today, userId);
  const completedItems = await Todo.completed_todos(userId);
  if (req.accepts("html")) {
    res.render("todos", {
      title: "Todo application",
      overDue,
      dueToday,
      dueLater,
      completedItems,
      csrfToken: req.csrfToken(),
    });
  } else {
    res.json({
      overDue,
      dueToday,
      dueLater,
    });
  }
});

app.get("/signup", (req, res) => {
  res.render("signup", {
    title: "Signup",
    csrfToken: req.csrfToken(),
  });
});

app.get("/login", (req, res) => {
  res.render("login", {
    title: "Login",
    csrfToken: req.csrfToken(),
  });
});

app.get("/signout", (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.post("/todos", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  console.log("Creating a todo", req.body);
  console.log(req.user);
  if (req.body.title.length == 0) {
    req.flash("error", "Please fill the todo");
    return res.redirect("/todos");
  }
  if (req.body.dueDate.length == 0) {
    req.flash("error", "Please fill the date");
    return res.redirect("/todos");
  }

  try {
    const title = req.body.title;
    const dueDate = req.body.dueDate;
    const todo = await Todo.addTodo({
      title: title,
      dueDate: dueDate,
      completed: false,
      userId: req.user.id,
    });

    //console.log(dueDate == today);

    return res.redirect("/todos");
  } catch (error) {
    console.log(error);
    return res.status(422);
  }
});

app.post("/users", async (req, res) => {
  //console.log(req.body.firstName)
  if (req.body.firstName.length == 0) {
    req.flash("error", "Please fill the first name");
    return res.redirect("/signup");
  }
  if (req.body.lastName.length == 0) {
    req.flash("error", "Please fill the last name");
    return res.redirect("/signup");
  }
  if (req.body.email.length == 0) {
    req.flash("error", "Please fill the email");
    return res.redirect("/signup");
  }
  if (req.body.password.length == 0) {
    req.flash("error", "Please fill the password");
    return res.redirect("/signup");
  }

  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  console.log(hashedPwd);
  try {
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPwd,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      } else {
        req.flash("success", "sign up successfull");
      }
      res.redirect("/todos");
    });
  } catch (err) {
    console.log(err);
    req.flash("error", "User already exists");
    return res.redirect("/signup");
  }
});

app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    console.log(req.user);
    res.redirect("/todos");
  }
);

app.put(
  "/todos/:id/",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("Update a todo with id :", req.params.id);
    const todo = await Todo.findByPk(req.params.id);

    const status = todo.completed;
    try {
      const updatedTodo = await todo.setCompletionStatus(status);
      return res.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return res.status(422);
    }
  }
);

app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    console.log("delete a todo with id:", req.params.id);
    const todo = await Todo.findByPk(req.params.id);
    try {
      const deletedTodo = await todo.deleteId(req.params.id, req.user.id);
      return res.json({ success: true });
      //return res.json(deletedTodo);
    } catch (error) {
      console.log(error);
      return res.send(false);
      //return res.status(422).json(error);
    }
  }
);

module.exports = app;
