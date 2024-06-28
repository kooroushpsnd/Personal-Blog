const express = require('express')

const globalErrorHandler = require('./controller/errorController')
const cookieParser = require('cookie-parser')
const AppError = require('./utils/appError')
const userRouter = require('./routes/userRoutes')
const blogRouter = require('./routes/blogRoutes')

const app = express()
//front templates

app.use(express.urlencoded({extended : true}))
app.use(express.json({limit : '10kb'}))
app.use(cookieParser());


app.use('/api/v1/users' ,userRouter)
app.use('/api/v1/blogs' ,blogRouter)

app.all('*' , (req ,res ,next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!` ,404))
})

app.use(globalErrorHandler)

module.exports = app;