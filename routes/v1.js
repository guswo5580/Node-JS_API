const express = require('express');
const jwt = require('jsonwebtoken');

const {verifyToken} = require('./middlewares');
const { Domain, User, Post, HashTag} = require('../models');

const router = express.Router();

// Token 에 대한 검사
router.post('/token', async(req, res) => {
    const {clientSecret} = req.body;
    try {
        const domain = await Domain.findOne({
            where : {clientSecret},
            include : {
                model : User,
                attribute : ['nick', 'id'],
            },
        });
        //발급한 토큰이 아닐 경우
        if(!domain){
            return res.status(401).json({
                code : 401,
                message : 'This domain is not enrolled'
            });
        }

        //발급한 토큰이 맞는 경우
        const token = jwt.sign({
            //jwt 내의 sign 을 통해 인증
            id : domain.user.id,
            nick : domain.user.nick,
        }, process.env.JWT_SECRET, {
            //.env의 비밀키를 통해 확인
            expiresIn : '1m',
            //만료 시간
            issuer : 'peaceocean',
            //배포자
        });
        return res.json({
            //인증을 거치고 토큰 발급
            code : 200,
            message : 'Token is published',
            token
        });
    }catch(error){
        return res.status(500).json({
            code : 500,
            message : 'server error'
        });
    }
});
//api 를 통하는 모든 정보는 json으로 통일!

module.exports = router;