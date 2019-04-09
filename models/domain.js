module.exports = (sequelize, DataTypes) => (
    sequelize.define('domain' , {
        host : {
            //api 연결 호스트 제공 
            type : DataTypes.STRING(80),
            allowNull : false,
        },
        type : {
            //유료와 무료를 구분 
            type : DataTypes.STRING(10),
            allowNull : false,
        },
        clientSecret : {
            //비밀키 발급
            type : DataTypes.STRING(40),
            allowNull : false,
        }
    }, {
        timestamp : true,
        paranoid : true,
        //복구하기 위한 장치 
        validate : {
            //입력받은 data의 타입 등을 추가로 검사 
            unknownType(){
                if(this.type !== 'free' && this.type !== 'premium'){
                    throw new Error('Type should have free or premium ');
                }
            }

        }
    })
);