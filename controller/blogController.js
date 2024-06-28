const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const Blog = require('../models/blogModel')

exports.createBlog = catchAsync(async(req ,res ,next) => {
    let date = new Date()
    const blog = await Blog.findOne({day : date.getDate()})
    if(blog){
        return next(new AppError('you already have made a blog today please try to edit it' ,400)) 
    }

    const new_blog = await Blog.create({
        journey : req.body.journey,
        day : date.getDate(),
        me : req.user.id
    })

    res.status(200).json({
        staus : 'success',
        data : new_blog
    })
})

exports.editBlog = catchAsync(async(req ,res ,next) => {
    let date = new Date()
    const old_blog = await Blog.findOne({day : date.getDate()})
    const blog = await Blog.findOneAndUpdate({day : date.getDate()} , {journey : old_blog.journey + ' ' + req.body.journey})
    if(!blog){
        return next(new AppError('no Blog founded' ,404)) 
    }

    res.status(200).json({
        staus : 'success',
        data : blog
    })
})

exports.deleteBlog = catchAsync(async(req ,res ,next) => {
    const blog = await Blog.findByIdAndDelete(req.params.id)

    if (!blog) {
      return next(new AppError('No document found with that ID', 404));
    }

    res.status(204).json({
        status : 'deleted' ,
        data : Null
    })
})

exports.getAllBlogs = catchAsync(async(req ,res ,next) => {
    const Blogs = await Blog.find({ me : req.user.id})

    if (Blogs.length == 0) {
        return next(new AppError('No document found with that ID', 404));
    }
  
    res.status(200).json({
        status : 'success' ,
        data : Blogs
    })
})

exports.getBlog = catchAsync(async(req ,res ,next) => {
    const Blogs = await Blog.findone({_id : req.params.id})

    if (!Blogs) {
        return next(new AppError('No document found with that ID', 404));
    }
  
    res.status(200).json({
        status : 'success' ,
        data : Blogs
    })
})