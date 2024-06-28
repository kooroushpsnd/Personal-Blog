const mongoose = require('mongoose')

const blogSchema = new mongoose.Schema({
    day : Date,
    journey : {
        type : String,
        require : [true ,'A blog must have a journey']
    },
    me : [{
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    }],
     __v: { type: Number, select: false}
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

blogSchema.pre(/^find/ ,function(next){
    this.populate({
        path:'me',
        select : '-__v -_id -role'
    })

    this.select('-id')

    next()
})

const Blog = mongoose.model('Blog' ,blogSchema)

module.exports = Blog