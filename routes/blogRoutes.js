const express = require('express')
const blogController = require('../controller/blogController')
const authController = require('../controller/authController')
const userController = require('../controller/userController')

const router = express.Router()

router.use(authController.protect)

router
    .route('/createblog')
    .post(blogController.createBlog)


router
    .route('/editblog')
    .post(blogController.editBlog)

router
    .route('/deleteblog')
    .post(blogController.deleteBlog)

router
    .route('/')
    .get(blogController.getAllBlogs)

router
    .route('/:id')
    .get(blogController.getBlog)

module.exports = router