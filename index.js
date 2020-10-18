
app = require("express");
server = app();

session = require("express-session")({
  secret: "my-secret",
  resave: true,
  saveUninitialized: true
})
server.use(session);   //ses for managing users

sharedsession = require("express-socket.io-session");

require("ejs");
//Set View Engine To EJS
server.set("view engine", "ejs");
//Set Static Directory
server.use(app.static(__dirname));
const bodyParser = require('body-parser');
server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json());
var db
var socid
//mongodb
var io
MongoClient = require('mongodb').MongoClient

MongoClient.connect("mongodb://localhost:27017/users", function (err, database) {
  if(err){
    console.log(err)
  }
db=database

});
var ser = server.listen(5000)
 io = require('socket.io').listen(ser);
 io.use(sharedsession(session));
 
io.on("connection", socket => {
  socid = socket.id
  console.log("socket hai", socket.handshake.session.uname)

  db.collection("userdetails").update({ "username": socket.handshake.session.uname }, { $set: { 'sockid': socid } })

  socket.on("sendmsg", data => {
    //can move this code in friend requsest and if field is not avaliabe he is not friend

      userwhichsending = socket.handshake.session.uname
      towhomesend = data["tosend"]
      //if user exist in his field then do nothing

      //if user does not exist in his field then update this
      socid = socket.id

      console.log("to send" + data["tosend"])
      db.collection("userdetails").find({ "username": { $eq: data["tosend"] } }, { fields: { sockid: 1, _id: 0 } }).toArray(function (err, result) {
        if (io.sockets.sockets[(result[0])["sockid"]] != undefined) {
          io.sockets.to((result[0])["sockid"]).emit("chat-messages", data["msg"])  //geting sock id of user to send msg
          console.log((result[0])["sockid"])

          //if user onlione then only send msg via socket else insert it in database  
        }
        db.collection("messages").update({ "username": data["tosend"] }, { $push: { [socket.handshake.session.uname + '.oldmsgs']: [data["msg"], Date.now()] } })

      });
  
  });

});


server.post("/",async (req, res) => {
  console.log("fsdf", req.body.target)

  if (req.session.uname != undefined) {

      var uskemsg = [], meremsg = []

      await db.collection("messages").find({ username: req.session.uname }, { fields: { [req.body.target + '.oldmsgs']: 1 } }).toArray(function (err1, resuone) {
        if (!err1) {
          try { meremsg = resuone[0][req.body.target]["oldmsgs"] } catch (e) { }
        } else { }

      });
      await db.collection("messages").find({ username: req.body.target }, { fields: { [req.session.uname + '.oldmsgs']: 1 } }).toArray(function (err, resutwo) {
        if (!err) {
          try {
            uskemsg = resutwo[0][req.session.uname]["oldmsgs"]
          } catch (exception) { }
        }
        console.log("uskemsg" + uskemsg[uskemsg.length-1])
        console.log("mere msg" + meremsg)
        
        res.render("chat.ejs",{ name:req.body.target, meremsg: meremsg, uskemsg: uskemsg });
      });


  }
  else
    res.redirect('/reg')
});

server.get("/reg/", (req, res) => {
  res.render("index.ejs");
});

server.post("/signin/", (req, res) => {
    db.collection("userdetails").find({ "username": req.body.username, "password": req.body.password }, { fields: { _id: 1 } }).toArray(function (err, result) {
      console.log("unampe pass result" + result)
      if (result.length >= 1) {
        ses = req.session;
        ses.uname = req.body.username;
        console.log("loged in" + ses.uname)
    
        res.redirect("/mainscreen/")
      }
      else {
        //handle wrong input
        console.log("username or passwrod do not match")
      }
    });
});

server.post("/register/", (req, res) => {
    var collection = db.collection('userdetails');
    var registerdetails = {'username': req.body.username, 'phoneno': req.body.phoneno, 'password': req.body.password, 'online': true, "lastseen": "", sockid: "" }
    console.log("db me insert hua")

    ses = req.session;
    uname = req.body.username
    ses.uname = req.body.username
    collection.insert(registerdetails)
    console.log(socid)
    collection.update({ "username": ses.uname }, { $set: { 'sockid': socid } })

    var collection = db.collection('messages');
    collection.insert({"username":req.body.username})

    res.redirect("/mainscreen/")

});


server.get('/dis/', (req, res) => {
  ses = req.session;
  console.log(ses.uname, req.cookies[ses.uname])
});

server.get('/mainscreen/', (req, res) => {

    //display all users to chat exept own
    ses = req.session;
    if (ses.uname != undefined) {
      db.collection("userdetails").find({ "username": { $ne: ses.uname } }, { fields: { username: 1, online: 1, lastseen: 1, _id: 0 } }).toArray(function (err, result) {
        if (err) throw err;
        console.log(result);
        res.render("mainscreen.ejs", { 'users': result });
        console.log('result')
        console.log(ses.uname)
      });
    }
    else {
      res.redirect('/reg')
    }

});
