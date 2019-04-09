const jwt = require('jsonwebtoken');
const RateLimit = require('express-rate-limit');

exports.isLoggedIn = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.status(403).send('로그인 필요');
  }
};

exports.isNotLoggedIn = (req, res, next) => {
  if (!req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/');
  }
};

exports.verifyToken = (req, res, next) => {
  try {
    req.decoded = jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    return next();
  }catch(error){
    if(error.name === 'TokenExpiredError'){
      return res.status(419).json({ 
        code : 419,
        message : 'Token is expried'
      });
    }
    return res.status(401).json({
      code : 401,
      message : 'Token is not valid'
    });
  }
};

//api 서버에 대한 사용량 제한
exports.apiLimiter = new RateLimit({
  windowMs : 60 * 1000,
  //해당 시간 동안, ms기준 
  max : 1,
  //최대 횟수
  delayMs : 0,
  //요청 간 간격
  handler(req, res) {
    //어겼을 경우 메세지
    res.status(this.satusCode).json({
      code : this.statusCode, //429
      message : '1분에 한번만 요청해주세요'
    })
  }
});

//새로운 api 서버를 만들었을 때,
//기본의 api 서버는 사용이 불가능하도록 
exports.deprecated = (req, res) => {
  res.status(410).json({
    //올바른 요청이라도 무조건 400대의 상태코드를 반환 
    code : 410,
    message : '새로운 버전을 이용하세요'
  });
};
