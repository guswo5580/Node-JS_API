const express = require('express');

const { User , Domain } = require('../models');
const router = express.Router();

router.get('/', (req, res, next) => {
    User.find({
        where : { id : req.user && req.user.id},
        include : { model : Domain }, 
    })
        .then( (user) => {
            res.render('login', {
                user, 
                loginError : req.flash('login Error'),
                domains : user && user.domains, 
            })
        })
        .catch( (error) => {
            console.error(error);
            next(error);
        })
});

module.exports = router;