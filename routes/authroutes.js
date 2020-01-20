const {Router} = require('express');
const bcrypt = require('bcrypt');
const {check, validationResult} = require('express-validator');
const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');
const router = Router();

// /api/auth/register
router.post('/register', 
[
    check('email', 'email isnt corect!').isEmail(),
    check('password', 'min password length is 6 characters !')
        .isLength({min: 6})
],
async (req, res) => {
    try {

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'registration data is incorrect'
            })
        }

        const {email, password} = req.body;

        const candidate = await User.findOne({email});

        if (candidate) {
            return res.status(400).json({message: 'This user already exists'});
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({email, password: hashedPassword});

        await user.save();

        res.status(201).json({message: 'User created!'});



    } catch(e) {
        res.status(500).json({message: 'Something went wrong, try again'});
    }
});

// /api/auth/login
router.post('/login',
[
    check('email', 'enter a correct email').normalizeEmail().isEmail(),
    check('password', 'enter a password').exists()
],
 async (req, res) => {
    try {

        const errors = validationResult(req);

        if(!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array(),
                message: 'incorrect login or password'
            })
        }

        const {email, password} = req.body;

        const user = await User.findOne({email});

        if(! user) {
            return res.status(400).json({message: 'User doesn`t exist'});
        }

        const isMatch = await bcrypt.compare(password, user.password)

        if(!isMatch) {
            return res.status(400).json({message: 'Incorect login or password'});
        }

        const token = jwt.sign(
            {userId: user.id},
            config.get('jwtSecret'),
            {expiresIn: '1h'}
        );

        res.json({token, userId: user.id});


    } catch(e) {
        res.status(500).json({message: e.message});
    }
});

module.exports = router;