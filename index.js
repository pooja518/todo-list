
const app = require("./app");

const port = 3000;

app.get("/",(req,res)=> {
  res.send(<h1>Hello world!</h1>);
});

app.listen(port, () => {
  console.log(`Server started at node ${port}`);
});
