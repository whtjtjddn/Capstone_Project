// 레벨별 라우팅 해놓는 파일

// home routes

const HOME = '/';
const LOGIN = '/login';
const JOIN = '/join';
const POST_JOIN = '/post_join';
const LOGOUT = '/logout';

// user router

const MAIN = '/main';
const USER = '/user';
const DEAL = '/deal';
const CHECKELEC = '/check-elec';

// deal Router

const TRANSACTION = '/transaction';
const WRITE = '/write_transaction';
const CHECKTRADE = '/:id';
const TRADING = '/trading';

const routes = {
	home: HOME,
	login: LOGIN,
	join: JOIN,
	postJoin: POST_JOIN,
	logOut: LOGOUT,
	main: MAIN,
	user: USER,
	deal: DEAL,
	checkElec: CHECKELEC,
	transAction: TRANSACTION,
	write: WRITE,
	checkTrade: (id) => {
		if (id) {
			return `/${id}`;
		} else {
			return CHECKTRADE;
		}
	},
	trading: TRADING
};

export default routes;
