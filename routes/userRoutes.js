const express = require('express')
const userController = require('../controller/userController')
const authController = require('../controller/authController')

const router = express.Router()

router.post('/login' ,authController.login)
router.post('/signup' ,authController.signUp)
router.get('/logout' ,authController.logout)

router.use(authController.protect)

router.delete('/deleteMe' ,userController.deleteMe)

router.patch('/updateMyPassword' ,authController.updatePassword)

module.exports = router