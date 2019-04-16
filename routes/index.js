const express = require('express');
const axios = require('axios');

const router = express.Router();

const version1 = 'v1';
const version2 = 'v2';

//Api 를 향해 client에서 발급받은 키를 통해 인증 받는 절차
router.get('/test', async(req, res, next) => {
    try {
        if(!req.session.jwt){
            //세션에 토큰이 저장되어 있는지 확인 후 
            //없다면 API 서버를 향해 발급받은 key를 통해 token 발급을 요청
            const tokenResult = await axios.post(`http://localhost:8002/${version2}/token`,{
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
        const result = await axios.get(`http://localhost:8002/${version2}/test`, {
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

//토큰 만료되어 이용이 불가한 상황을 대비하여
//토큰이 만료되었다면 토큰을 다시 발급받고 이용할 수 있도록 함수를 선언해주자
const request = async (req, api) => {
    // console.log(req.headers.host);
    try {
        if(!req.session.jwt){
            const tokenResult = await axios.post(`http://localhost:8002/${version2}/token`,{
                clientSecret : process.env.CLIENT_SECRET,
                host : req.headers.host
            });
            req.session.jwt = tokenResult.data.token;     
        }
        return await axios.get(`http://localhost:8002/${version2}${api}`,{
            //각 요청에서 어떤 정보를 api로 지정하느냐를 담아서 api를 요청한다
            headers : { authorization : req.session.jwt},
        });
    }catch(error){
        console.log(error);
        if(error.response.status < 500 ){
            return error.response;
        }
        throw error;
    }
};

// Client ---> mypost ---> API's /posts/mine 
router.get('/mypost', async (req, res, next) => {
    try {
        const result = await request(req, '/post/mine');
        res.json(result.data);
    } catch(error){
        console.error(error);
        next(error);
    }
}); 

//Client ---> /search/:hashtag ---> API's /posts/hashtag/title
router.get('/search/:hashtag', async (req, res, next) => {
    try {
        const result = await request(
            req, `/posts/hashtag/${encodeURIComponent(req.params.hashtag)}`,
            //encodeURIComponent = 주소 작성시 한글이 있으면 생기는 문제 해결
        );
        res.json(result.data);
    }catch(error) {
        console.error(error);
        next(error);
    }
});

//Client ---> /follower ---> API's /follower
router.get('/follower', async (req, res, next) => {
    try{
        const result = await request(req, '/follower');
        res.json(result.data);
    }catch(error){
        if(error.code){
            console.log(error);
            next(error);
        }
    }
});

//Client ---> /following ---> API's /following
router.get('/following', async (req, res, next) => {
    try{
        const result = await request(req, '/following');
        res.json(result.data);
    }catch(error){
        if(error.code){
            console.log(error);
            next(error);
        }
    }
});

//CORS Error에 발생 여부 확인
//프론트 내에서 origin (localhost:8000) -> (localhost:8001)
//등으로 origin 이 변화되며 요청을 보낼 경우 
//내부에 access header가 존재하지 않아 문제가 생긴다 
router.get('/', (req, res) => {
    res.render('main', { key : process.env.CLIENT_SECRET});
});
module.exports = router;