const express = require('express');
const uuidv4 = require('uuid/v4');

const { User , Domain } = require('../models');
const router = express.Router();

router.get('/', (req, res, next) => {
    if(req.user){
        User.findOne({
            where: { 'id' : req.user.id },
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
    } else {
        res.render('login');
    }
        
});

router.post('/domain', (req, res, next) => {
    
        Domain.create({
            userId : req.user.id,
            host : ModifyHost,
            type : req.body.type,
            clientSecret : uuidv4()
        })
            .then(() => {
                res.redirect('/');
            })
            .catch((error) => {
                console.error(error);
                next(error);
            })
});

module.exports = router;