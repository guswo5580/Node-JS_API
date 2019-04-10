const express = require('express');
const jwt = require('jsonwebtoken');

const { verifyToken , premiumApiLimiter, apiLimiter} = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');
const cors = require('cors');
const url = require('url');

const router = express.Router();

// router.use(cors());
//cors 모듈 -- origin header가 없는 origin 변화에 대한 정보 요청 시 발생하는 문제를 해결하는 모듈
//모든 router에 적용할 것이라면 router.use로 사용 가능 

router.use(async (req, res, next) => {
    //DB에 저장되어있는 api를 요청한 Domain의 host 정보 get 
    const domain = await Domain.find({
        where : { host : url.parse(req.get('origin')).host },
        //요청이 들어온 host에 대해 db의 host와 같은지 비교
    });
    if(domain){
        //db에 일치하는 host가 있는 경우 cors 실행
        cors({ origin : req.get('origin') })(req, res, next);    
    }else {
        //없다면 이용 x
        next();
    }
});

router.use( async (req, res, next) => {
    const domain = await Domain.find({
        where : { host : url.parse(req.get('origin')).host },
        //요청이 들어온 host에 대해 db의 host와 같은지 비교
    });
    if(domain.type === 'premium'){
        premiumApiLimiter(req, res, next);
        //domain type에 따라 다른 apiLimiter 를 적용
        
    }else {//type === free 
        apiLimiter(req, res, next);
    }
});

router.post('/token', async (req, res) => {
  const { clientSecret } = req.body;
  try {
    const domain = await Domain.findOne({
      where: { clientSecret },
      include: {
        model: User,
        attribute: ['nick', 'id'],
      },
    });
    if (!domain) {
      return res.status(401).json({
        code: 401,
        message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요',
      });
    }
    const token = jwt.sign({
      id: domain.user.id,
      nick: domain.user.nick,
    }, process.env.JWT_SECRET, {
      expiresIn: '1m', // 1분
      issuer: 'peaceocean',
    });
    return res.json({
      code: 200,
      message: '토큰이 발급되었습니다',
      token,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      code: 500,
      message: '서버 에러',
    });
  }
});

router.get('/test', verifyToken, (req, res) => {
    res.json(req.decoded);
  });

router.get('/post/mine', verifyToken, (req, res) => {
    //내가 작성한 게시글을 가져오기
    Post.findAll({
        where : {userId : req.decoded.id}
        //Post db에서 나의 id를 대조하여 모든 post를 가져온다 
    })
    .then((posts) => {
        console.log(posts);
        res.json({
            code : 200,
            payload : posts
            //응답 코드와 함께 모든 게시글 응답 
        });
    })
    .catch((error) => {
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : 'server error'
        });
    })
});

router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    //검색한 해시태그에 대한 게시글을 가져오는 경우 
    try {
        const hashtag = await Hashtag.find({
            //해시태그 db에서 모든 글을 찾는다
            where : { title : req.params.title}
        })
        if(!hashtag){
            //없다면 없음을 반환
            return res.status(404).json({
                code : 404,
                message : "검색결과 없음"
            });
        }
        const posts = await hashtag.getPosts();
        //검색결과가 있다면 getPost 연결 db를 검색하여 정보를 반환 
        return res.json({
            code : 200,
            payload : posts
        });
    }catch(error){
        return res.status(500).json({
            code : 500,
            message : 'server error'
        });
    }
});

router.get('/follower', verifyToken, async (req, res) => {
    //팔로워 목록을 가져오는 경우 
    try {
        const user = await User.find({
            where : {id : req.decoded.id}
            //id는 verifyToken에서 설정 decoded 내부의 id와 비교
        });
        const follower = await user.getFollowers({
            attributes : ['id', 'nick'],
        });
        //연결 db를 불러오기 
        return res.json({
            code : 200,
            follower,
        });
    }
    catch(error) {
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : 'server error'
        });
    }
});

router.get('/following', verifyToken, async (req, res) => {
    try {
        const user = await User.find({
            where : {id : req.decoded.id}
        });
        const following = await user.getFollowings({
            attributes : ['id', 'nick'],
        });
        return res.json({
            code : 200,
            following,
        });
    }
    catch(error) {
        console.error(error);
        return res.status(500).json({
            code : 500,
            message : 'server error'
        });
    }
});
module.exports = router;
