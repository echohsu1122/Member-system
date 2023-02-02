//建立資料庫連線
const mongo = require("mongodb");
const uri = "mongodb+srv://root:root123@cluster0.ftav2x1.mongodb.net/?retryWrites=true&w=majority";
const client = new mongo.MongoClient(uri);
let db = null;
client.connect(async function (err) {
    if (err) {
        console.log("db fail", err);
        return;
    }
    db = client.db("member-system");
    console.log("資料庫連線成功")
})

//後端:建立網站伺服器基礎設定
const express = require("express");
const app = express();
const session = require("express-session");
app.use(session({
    secret: "anything",
    resave: false,
    saveUninitialized: true
}))
app.set("view engine", "ejs");
app.set("views", './views');
app.use(express.static("public"));
//處理POS方法傳遞進來的參數
app.use(express.urlencoded({ extended: true }));

//建立需要的路由
app.get("/", function (req, res) {
    res.render("index.ejs");
});
app.get("/member", async function (req, res) {
    if (!req.session.member) {
        res.redirect("/");
        return;
    }
    const name = req.session.member.name;
    const collection_name = db.collection("member");
    const collection_mes = db.collection("messages");
    let result_member = await collection_name.find({});
    let result_mes = await collection_mes.find({});
    let data_name = [];
    let data_mes = [];
    await result_member.forEach(function (member) {
        data_name.push(member);
    })
    await result_mes.forEach(function (messages) {
        data_mes.push(messages);
    });
    res.render("member.ejs", { name: name, data_name: data_name, data_mes: data_mes });
});
app.get("/error", function (req, res) {
    const msg = req.query.msg;
    //動態帶入錯誤訊息
    res.render("error.ejs", { msg: msg })
});
//登出
app.get("/signout", function (req, res) {
    req.session.member = null;
    res.redirect("/");

})
//登入路由
app.post("/signin", async function (req, res) {
    const email = req.body.email;
    const password = req.body.password;
    const collection = db.collection("member");
    let result = await collection.findOne({
        $and: [
            { email: email, password: password }
        ]
    });
    if (result === null) {
        res.redirect("/error?msg=登入失敗，郵件密碼輸入錯誤");
        return;
    }
    req.session.member = result
    res.redirect("/member");

});

//註冊路由
app.post("/signup", async function (req, res) {
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    const collection = db.collection("member");
    let result = await collection.findOne({
        email: email
    });
    if (result !== null) {
        res.redirect("/error?msg=註冊失敗");
        return;
    }
    result = await collection.insertOne({
        name: name, email: email, password: password
    });
    res.redirect("/");

});
app.post("/w", async function (req, res) {
    const name = req.body.name;
    const message = req.body.message;
    const date = new Date().toLocaleString();
    const collection = db.collection("messages");
    result = await collection.insertOne({
        name: name, message: message, date: date
    });
    res.redirect("/member");

});



//http://localhost:3000/
app.listen(3000, function () {
    console.log("伺服器啟動");
})