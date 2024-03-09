const express = require("express")

const app = express()
const Sequelize = require("sequelize");
const session = require("express-session");
const cookieParser = require("cookie-parser");

app.set('view engine', 'ejs')
app.use(express.urlencoded({extended:false}))
app.use(express.static('public'))
app.use(
  session({
      secret: "your-secret-key",
      resave: false,
      saveUninitialized: false,
  })
);

app.use(cookieParser());
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
      next();
  } else {
      res.redirect("/login");
  }
};


const sequelize = new Sequelize(
  'notes2',
  'postgres',
  '12345qwert',
  {
    dialect: 'postgres',
  },
);
const Users = sequelize.define("users", {
  user_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  user_name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  user_login: {
    type: Sequelize.STRING,
    allowNull: false
  },
  user_password: {
    type: Sequelize.STRING,
    allowNull: false
  },
 
});

const Note = sequelize.define("note", {
  note_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true,
    allowNull: false
  },
  user_id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    allowNull: false
  },
  note_title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  note_date: {
    type: Sequelize.STRING,
    allowNull: false
  },
  note_desc: {
    type: Sequelize.STRING,
    allowNull: false
  },
 
});

 

app.get("/", (req, res)=>{
    res.redirect("/login")
})


app.get("/logout", (req, res) => {
  req.session.destroy(() => {
      res.clearCookie("sessionId");
      res.redirect("/login");
  });
});

app.get("/home", isAuthenticated, (req,res)=>{
  Note.findAll({where: {user_id:  req.session.user.user_id}, raw: true }).then(data=>{
    let data2 = {
      username: req.session.user.user_name,
      notes: data,
      title:"",
      date:"",
      desc:""
    }
    res.render("main", data2)
  }).catch(err=>console.log(err));
})




app.get("/login", (req, res)=>{
    let data = {error:""}
    res.render("login", data)
})

app.get("/registration", (req, res)=>{
    res.render("registration")
})
app.get('/change-notes/change/:id', isAuthenticated, (req, res)=>{
  Note.findAll({where: {note_id: req.params.id}}).then(data=>{
    let data2 = {
      username: req.session.user.user_name,
      notes: data,
      title:data[0].note_title,
      date:data[0].note_date,
      desc:data[0].note_desc
    }
    Note.destroy({where: {note_id: req.params.id}}).then((data2)=>{
      console.log(data2)
    }).catch(err=>console.log(err))
    res.render("main", data2)

  }).catch(err=>console.log(err));

  

})

app.get('/change-notes/delete/:id', (req, res)=>{
  Note.destroy({where: {note_id: req.params.id} }).then(() => {
    res.redirect("/home");
  }).catch(err=>console.log(err));
  

})
app.post("/add-notes", isAuthenticated, (req, res)=>{
 
  Note.create({ user_id:  req.session.user.user_id, note_title: req.body.title, note_date: req.body.date, note_desc: req.body.desc}).then(()=>{
    res.redirect("/home");
  }).catch(err=>console.log(err));
  
})
app.post("/check-login", (req, res)=>{
    console.log(req.body.login, req.body.password)
    Users.findAll({where: {user_login:req.body.login, user_password: req.body.password},raw: true }).then(data=>{
    if(data.length>0){
      console.log(data[0].user_id)
      Note.findAll({where: {user_id:data[0].user_id},raw: true }).then(data2=>{
        console.log(data2)
        let main_data = {
          username: data[0].user_name,
          notes:data2,
          title:"",
          date:"",
          desc:""
          }
          req.session.user = data[0]
          res.cookie("sessionId", req.sessionID);
         res.render("main", main_data)
      }).catch(err=>console.log(err));
    }
    else{
      let data1 = {error:"Неверный логин или пароль"}
       res.render("login",data1)
    }
    }).catch(err=>console.log(err));
    
   
})

app.post("/user-registration", (req,res)=>{
    console.log(req.body.name, req.body.password)
    Users.create({ user_name: req.body.name,  user_login:req.body.login, user_password: req.body.password}).then(()=>{
      res.redirect("/home");
    }).catch(err=>console.log(err));
    
    
})
const PORT = 3003

sequelize.sync().then(()=>{
  app.listen(PORT, function(){
    console.log("Сервер ожидает подключения...");
  });
}).catch(err=>console.log(err));