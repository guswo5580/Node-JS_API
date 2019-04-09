const express = require('express');
const axios = require('axios');

const router = express.Router();

//Api 를 향해 client에서 발급받은 키를 통해 인증 받는 절차
router.get('/test', async(req, res, next) => {
    try {
        if(!req.session.jwt){
            //세션에 토큰이 저장되어 있는지 확인 후 
            //없다면 API 서버를 향해 발급받은 key를 통해 token 발급을 요청
            const tokenResult = await axios.post('http://localhost:8002/v1/token',{
                clientSecret : process.env.CLIENT_SECRET 
            });
            //token을 받았다면 세션에 저장
            if(tokenResult.data && tokenResult.data.code === 200){
                req.session.jwt = tokenResult.data.token
            }else {
                //token 발급에 실패한다면 실패가 담겨있는 data를 반환 
                return res.json(tokenResult.data);
            }
        }
        //토큰이 존재하거나 발급을 받았다면 api요청문을 보낸다 
        const result = await axios.get('http://localhost:8002/v1/test', {
            headers : { authorization : req.session.jwt }, 
        });
        return res.json(result.data);
    }
    catch(error){
        console.error(error);
        
        if(error.response.status === 419){
            //Token 만료 및 실패, 미리 지정해둔 코드로 에러가 발생하는 경우
            return res.json(error.response.data);
        }
        return next(error);
    }
});

module.exports = router;