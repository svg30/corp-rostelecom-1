const express = require('express')
const hbs = require('express-handlebars')
const path = require('path')
const cookieParser = require('cookie-parser')
const request = require('request')
const cheerio  = require("cheerio")
const getPage = require('./parse')
const mongoose = require('mongoose')
const session = require('express-session')
const MongoStore = require('connect-mongo')(session)



mongoose.connect('mongodb://localhost:27017/todolist', {useNewUrlParser: true, useUnifiedTopology: true})

const todoModel = require('./models/todo_item')
const usersModel = require('./models/users')

const passport = require('./auth')


const app = express()
app.use(express.json())

app.use(express.urlencoded({extended: false}))

app.use(cookieParser())

app.use(express.static('public'))

//express + hbs
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'default',
    layoutsDir: path.join(__dirname, 'views', 'layouts'),
    partialsDir: path.join(__dirname, 'views', 'partials'),
}))



app.set('view engine', 'hbs')


app.use(session({
    resave: true,
    saveUninitialized: false,
    secret: 'fudduisafyiudsayfodysfysdfydsiyfdtausfuaysdytf8dstyf87dsaf',
    store: new MongoStore({mongooseConnection: mongoose.connection})
}))
app.use(passport.initialize)
app.use(passport.session)

//Проверка на авторизацию пользователя
app.use('/users', passport.isAuthenticated)
app.use('/todo', passport.isAuthenticated)


app.get('/', (req, res) => {
    res.send("Ok!")
})

app.get('/news', (req, res) => {
    let countNews = req.cookies.newsCount ? req.cookies.newsCount : null
    links = getPage()
    res.render('news', {layout: 'default', countNews})
})


app.post('/news', (req, res) => {
    let countNews = 5
    if(req.body.news_count){
        countNews = parseInt(req.body.news_count)
    }
    res.cookie('newsCount', countNews)
    res.render('news', {layout: 'default', countNews})
})


app.get('/todo', async (req, res) => {
    const todo_items = await todoModel.find({author: req.user.email}).lean()

    //res.json(messages)
    console.log(todo_items)
    //const messages2  = JSON.parse(JSON.stringify(messages))
    res.render('todolist', {layout: 'default', todo_items: todo_items})
})


app.post('/todo',  async (req, res) => {
    const id = req.body.item_id ? req.body.item_id : null;
    console.log("*********",id)
    if(!id || id == "") {
        const item = new todoModel({author: req.user.email, title: req.body.title, text: req.body.text, doneAt: null})
        item.save(function (err, doc) {
            if (err) {
                res.json(err)
                return
            }
        })
    }else{
        const item = await todoModel.update({_id: id}, {title : req.body.title, text: req.body.text})
    }
    res.redirect('/todo')
})

app.get('/todo/check/:id', async (req, res) => {
    const id = req.params.id ? req.params.id : null;
    const item = await todoModel.update({_id: id}, {doneAt : new Date()})

//    res.json(message)
    console.log('check', id)
    //const messages2  = JSON.parse(JSON.stringify(messages))
    //const messages2  = JSON.parse(JSON.stringify(messages))
    //res.render('messages', {layout: 'default', messages: messages})
})
app.get('/todo/uncheck/:id', async (req, res) => {
    const id = req.params.id ? req.params.id : null;
    const item = await todoModel.update({_id: id}, {doneAt : null})
//    const message = await messagesModel.findById({_id: id}).lean()

//    res.json(message)
    console.log('uncheck', id)
    //const messages2  = JSON.parse(JSON.stringify(messages))
    //const messages2  = JSON.parse(JSON.stringify(messages))
    //res.render('messages', {layout: 'default', messages: messages})
})

app.get('/users', (req, res) => {
    //console.log(req.test)
    //console.log(req.body)
    //res.send("Users!")

    res.render('users', {layout: 'default', users})
})

app.get('/users/:username', (req, res) => {
    // console.log(req.params)

    const user = users[req.params.username] ? users[req.params.username] : null
    res.render('user', {layout: 'default', user})
})
app.get('/register', (req, res) => {
    res.render('register', {layout: 'default'})
})

app.post('/register', async (req, res) => {
    const {repassword, ...restBody} =  req.body

    // const restBody = req.body
    // const repassword = restBody.repassword
    // delete restBody.repassword

    if(restBody.password === repassword){
        const user = new usersModel(restBody)
        await user.save()
        res.redirect('/auth')
    }
    res.redirect('/register?err=repassword')
})

app.get('/auth', (req, res) => {
    const {error} = req.query
    res.render('auth', {layout: 'default', error})
})

app.post('/auth', passport.authenticate)

app.get('/logout', (req, res) => {
    req.logout()
    res.redirect('/auth')
})

app.listen(4000, () => {
    console.log('Server started...')
})


