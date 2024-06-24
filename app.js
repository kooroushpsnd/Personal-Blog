const express = require('express')
const path = require('path')
const app = express()
const globalErrorHandler = require('./controller/errorController')
const AppError = require('./utils/appError')

//front templates
app.set('view engine' ,'pug')
app.set('views' ,path.join(__dirname ,'views'))
app.use(express.urlencoded({extended : true}))

app.use(express.static(path.join(__dirname ,'public')))

app.all('*' , (req ,res ,next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!` ,404))
})

app.use(globalErrorHandler)

module.exports = app;