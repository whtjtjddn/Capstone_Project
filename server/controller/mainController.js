import routes from '../routes';
import Device from '../models/device';
import User from '../models/user';
import Transaction from '../models/transaction';

/**** GET Method ****/
// 원격 페이지 rendering
export const home = async (req, res) => {
	let deviceObjList = []; // 이 데이터를 front에 넘길것
	try {
		const { deviceList } = req.user;

		for (let i = 0; i < deviceList.length; i++) {
			let device = await Device.findOne({ PK: deviceList[i] });
			deviceObjList.push(JSON.parse(JSON.stringify(device)));
		}
	} catch (e) {
		console.log('error: ' + e);
	} finally {
		res.render('route_main', {
			pageTitle: 'Main',
			topNav: 'remote',
			deviceList: deviceObjList
		});
	}
};

// 전력확인 페이지 rendering
export const checkElec = async (req, res) => {
	const { PK } = req.user;
	let user;

	try {	// DB 수정
		user = await User.findOne({ PK: PK });
	} catch(e) {
		return res.redirect('/message/' + "Error: 데이터베이스 로딩 오류");
	}
	let resultObj = {
		eUsage: user.eUsage,
		eCharge: user.eCharge,
		eSupply: user.eSupply
	};

	if (req.method === "POST")
        return res.status(200).json(resultObj);

	res.render('checkElec', {
		pageTitle: 'Check Elec',
		topNav: 'checkElec',
		resultObj
	});
};

// 내 정보 페이지 rendering
export const userProfile = async (req, res) => {
	const { PK, name, email, batteryMax, contact } = req.user;

	if (req.method === "POST") {
		console.log("User POST METHOD~~~~~~~~~");
		const { input_email, input_name, input_contact, input_batteryMax } = req.body;

		try {	// DB 수정
			await User.findOneAndUpdate( { PK: PK }, {
				name: input_name,
				email: input_email,
				batteryMax: input_batteryMax,
				contact: input_contact
			});
		} catch(e) {
			console.log("DB Error", e);
		} finally {
			res.redirect('/main/user');
		}
	}
	const tmpUser = {
		'PK': PK,
		'name': name,
		'email': email,
		'batteryMax': batteryMax,
		'contact': contact
	}
	res.render('profile', {
		pageTitle: 'Profile',
		user: tmpUser
	});
};

// 현재 거래 페이지 rendering
export const status = async (req, res) => {
	const nowUser = req.user;	// 현재 사용자
	let transaction_seller;		// 거래-구매자
	let transaction_buyer;		// 거래-판매자

	try {	// DB 수정
		transaction_seller = await Transaction.findOne({ seller: nowUser.PK, status: 3 });
		transaction_buyer = await Transaction.findOne({ buyer: nowUser.PK, status: 3 });
	} catch (e) {
		return res.redirect('/message/' + "Error: 데이터베이스 로딩 오류");
	}

	if (transaction_buyer != null) {
		const buyer = nowUser;
		const seller = await User.findOne({ PK: transaction_buyer.seller });
		const data = {
			buy: buyer.name,
			sell: seller.name,
			reqAmount: transaction_buyer.reqAmount,
			amount_send: transaction_buyer.amount_send
		}
		
		if (req.method === "POST") {
			let resultObj = {
				reqAmount: transaction_buyer.reqAmount,
				amount_send: transaction_buyer.amount_send
			};
			return res.status(200).json(resultObj);
		}

		res.render('transactionStatus', {
			pageTitle: 'status',
			topNav: 'transAction',
			isBuyer: true,
			dat: JSON.stringify(data),
			data
		});
	} else if (transaction_seller != null) {
		const buyer = await User.findOne({ PK: transaction_seller.buyer });
		const seller = nowUser;
		const data = {
			buy: buyer.name,
			sell: seller.name,
			reqAmount: transaction_seller.reqAmount,
			amount_send: transaction_seller.amount_send
		}

		if (req.method === "POST") {
			let resultObj = {
				reqAmount: transaction_seller.reqAmount,
				amount_send: transaction_seller.amount_send
			};
			return res.status(200).json(resultObj);
		}

		res.render('transactionStatus', {
			pageTitle: 'status',
			topNav: 'transAction',
			isBuyer: false,
			transAction: transaction_seller,
			dat: JSON.stringify(data),
			data
		});
	} else {
		res.redirect('/main');
	}
};

/**** POST Method ****/
// 디바이스 추가 함수
export const addDevice = async (req, res) => {
	const { name, port } = req.body;

	// 입력값 검사
	if (name === '' || port === undefined) {
		// 오류 반환 & 새로고침
		return res.send('<script type="text/javascript">alert("전자기기 이름 또는 포트를 선택해주세요.");location.href="/";</script>');
	}
	try {
		let deviceList = await Device.find({});
		let PK = deviceList.length == 0 ? 0 : 1;

		// 추가할 device의 PK 지정
		if (PK) {
			PK = 0;
			for (let i = 0; i < deviceList.length; i++) {
				if (PK < deviceList[i].PK) {
					PK = deviceList[i].PK;
				}
			}
		}

		// device 생성
		const newDevice = await Device.create({
			name,
			port,
			status: true,
			PK: PK + 1
		});

		// user의 deviceList 수정
		const user = req.user;
		const newList = user.deviceList;
		newList.push(newDevice.PK);
		await User.findByIdAndUpdate(user.id, {
			$set: {
				deviceList: newList
			}
		});
		res.redirect(routes.home);
	} catch (e) {
		res.send('<script type="text/javascript">alert("오류 발생: ' + e + '");location.href="/";</script>');
	}
};

// 디바이스 삭제 함수
export const deleteDevice = async (req, res) => {
	try {
		const { deleteTarget } = req.body;
		console.log('start delete');
		const target = await Device.findOne({ name: deleteTarget });
		const tarPK = target.PK;

		await Device.deleteOne({ name: deleteTarget });
		const modList = req.user.deviceList;
		const idx = modList.indexOf(tarPK);
		modList.splice(idx, 1);
		await User.findOneAndUpdate(
			{ PK: req.user.PK },
			{ deviceList: modList }
		);
	} catch (e) {
		console.log(e);
	} finally {
		res.redirect(routes.main);
	}
};


// 원격 기기 제어 함수
export const remoteOnOff = async (req, res) => {
	const {productId} = req.body;

	try{
		let device = await Device.findOne({PK : productId});
		await Device.findOneAndUpdate({PK : productId} , {
			status : device.status ? false : true
		})
		device = await Device.findOne({PK : productId});
	} catch(e){
		console.log(e);
	} finally{
		res.redirect(routes.main);
	}
};

export const deviceModification = async (req, res) => {
	const { modName, name } = req.body;

	try {
		await Device.findOneAndUpdate(
			{ name: name },
			{ name: modName }
		);
		console.log(await Device.find({}));
	} catch (e) {
		console.log(e);
	} finally {
		res.redirect(routes.main);
	}
};
