const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const validator = require('validator')
const AppError = require('../utils/appError')

const userSchema = new mongoose.Schema({
    name : {
        type : String,
        required : [true , 'Please tell us your name']
    },
    email : {
        type : String,
        required : [true ,'Please provide your email'],
        unique : true,
        lowercase : true,
        validator : [validator.isEmail ,'Please provide a valid email']
    },
    role : {
        type : String,
        enum : ['user' ,'admin'],
        default : 'user'
    },
    password : {
        type : String,
        required : [true ,'please provide a password'],
        minlentgh : 8,
        select : false
    },
    passwordConfirm : {
        type : String,
        required : [true ,'please provide a password'],
        validate : {
            validator : function(el){
                return el === this.password
            },
            message : 'Passwords are not the same'
        }
    },
    passwordChangedAt : Date,
    passwordResetToken : String,
    passwordResetExpires : Date,
    active : {
        type : Boolean,
        default : true,
        select : false
    }
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

userSchema.methods.correctPassword = async function(candidatePassword , password){
    return await bcrypt.compare(candidatePassword ,password)
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp){
    if(this.passwordChangedAt){
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        )
        return JWTTimestamp < changedTimestamp
    }

    return false
}

userSchema.pre('save' , async function(next){
    if(!this.isModified('password')) return next()
    
    this.password = await bcrypt.hash(this.password ,12)

    this.passwordConfirm = undefined
})

userSchema.pre('save' , function(next){
    if(!this.isModified('password') || this.isNew) return next()

    this.passwordChangedAt = Date.now() - 1000
    next()
})

userSchema.pre(/^find/ ,function(next){
    this.find({active : {$ne : false}})
    next()
})

userSchema.methods.createPasswordResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex')

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex')

    this.passwordResetExpires = Date.now() + 600000

    return resetToken
}

const User = mongoose.model('User' , userSchema)

module.exports = User