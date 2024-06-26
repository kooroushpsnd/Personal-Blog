const User = require('./../models/userModel')
const catchAsync = require('./../utils/catchAsync')
const jwt = require('jsonwebtoken')
const AppError = require('./../utils/appError')
const {promisify} = require('util')
const crypto = require('crypto')

const signToken = id => {
    return jwt.sign({id} , process.env.JWT_SECRET , {
        expiresIn : process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user ,statusCode ,res) => {
    const token = signToken(user._id)
    const cookieOptions = {
        expires : new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
        ),
        httpOnly : true
    }

    res.cookie('jwt' ,token ,cookieOptions)

    user.password = undefined

    res.status(statusCode).json({
        status : 'success',
        token,
        data : {
            user 
        }
    })
}

exports.signUp = catchAsync(async(req ,res ,next) => {
  const newUser = await User.create(req.body)
  
  createSendToken(newUser ,201 ,res)
})

exports.login = catchAsync(async(req ,res ,next) => {
    const {email ,password} = req.body

    if(!email || !password){
        return next(new AppError('Please provide email and password!' ,401))
    }

    const user = await User.findOne({email}).select('+password')

    if(!user){
        return next(new AppError('incorrect email!' ,401))
    }
    if(!(await user.correctPassword(password ,user.password))){
        return next(new AppError('incorrect password!' ,401))
    }

    createSendToken(user ,200 ,res)
})

exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    })
    res.status(200).json({ status: 'success' });
  };
  

//protect route , users who login can enter
exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check of it's there
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.jwt) {
      token = req.cookies.jwt;
    }
  
    if (!token) {
      return next(
        new AppError('You are not logged in! Please log in to get access.', 401)
      );
    }
  
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  
    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new AppError(
          'The user belonging to this token does no longer exist.',
          401
        )
      );
    }
  
    // 4) Check if user changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
    }
  
    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
  });

exports.restrictTo = (...roles) => {
    return (req ,res ,next) => {
        if(!roles.includes(req.user.role)){
            return next(
                new AppError('You do not have premission to perform this action' ,403)
            )
        }
        next()
}}

exports.forgotPassword = catchAsync(async(req ,res ,next) => {
    const user = await User.findOne({ email : req.body.email })
    if(!user){
        return next(new AppError('There is no user with email address' ,404))
    }

    const resetToken = user.createPasswordResetToken()
    await user.save({validateBeforeSave : false})

    const reserURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetpassword/${resetToken}`
    try{
        await new Email(user ,reserURL).sendPasswordReset()

        res.status(200).json({
            status : 'success',
            message : 'Token sent to email~'
    })}catch(err){
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave : false })

        return next(new AppError(
            'There was an error sending the eamil. Try again later!',
            500
        ))
    }
})
exports.resetPassword = catchAsync(async(req ,res ,next) => {
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')
    
    const user = await User.findOne({
        passwordResetToken : hashedToken,
        passwordResetExpires : {$gt : Date.now()}
    })

    if(!user) return next(new AppError('Token is invalid or has expired' ,400))

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save()
    
    createSendToken(user ,200 ,res)
})

exports.updatePassword = catchAsync(async(req ,res ,next) => {
    const user = await User.findById(req.user.id).select('+password')

    if(!(await user.correctPassword(req.body.passwordCurrent ,user.password))){
        return next(new AppError('Your current password is wrong' ,401))
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    await user.save()

    createSendToken(user ,200 ,res)
})

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
      try {
        // 1) verify token
        const decoded = await promisify(jwt.verify)(
          req.cookies.jwt,
          process.env.JWT_SECRET
        );
  
        // 2) Check if user still exists
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
          return next();
        }
  
        // 3) Check if user changed password after the token was issued
        if (currentUser.changedPasswordAfter(decoded.iat)) {
          return next();
        }
  
        // THERE IS A LOGGED IN USER
        res.locals.user = currentUser;
        return next();
      } catch (err) {
        return next();
      }
    }
    next();
  };
