//建立資料庫連線
const mongo =require("mongodb");
const uri="mongodb+srv://root:root123@cluster0.ftav2x1.mongodb.net/?retryWrites=true&w=majority";
const client = new mongo.MongoClient(uri);
let db =null;
client.connect(async function(err){
    if(err){
        console.log("db fail",err);
        return;
    }
    db =client.db("member-system");
    console.log("db sussess")
})

//後端:建立網站伺服器基礎設定
const express=require("express");
const app =express();
const session = require("express-session");
app.use(session({
    secret:"anything",
    resave:false,
    saveUninitialized:true
}))
app.set("view engine","ejs");
app.set("views",'./views');
app.use(express.static("public"));
//處理POS方法傳遞進來的參數
app.use (express.urlencoded({extended:true}));

//建立需要的路由
app.get("/",function(req,res){
    res.render("index.ejs");
});
app.get("/member",function(req,res){
    res.render("member.ejs");
});
app.get("/error",function(req,res){
    const msg = req.query.msg;
    //動態帶入錯誤訊息
    res.render("error.ejs",{msg})
});
//註冊路由
app.post("/signup", async function(req,res){
    const name =req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const collection = db.collection("member");
    let result = await collection.findOne({
        email:email
    });
    if(result!== null){
        res.redirect("/error?msg=註冊失敗");
    }
    result = await collection.insertOne({
        name:name,email:email,password:password
    });
    res.redirect("/");

});


//http://localhost:3000/
app.listen(3000,function(){
    console.log("Sever started");
})