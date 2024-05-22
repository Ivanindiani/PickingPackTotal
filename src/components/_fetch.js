const ipRemota2 = '172.16.10.78:8888';
var apiURL;

const ApiAUTH = '214b0c3777a0e89cf338272ccc2234c2';

const defaultHeaders = {
	'Content-Type': 'application/json',
	'Authorization': ApiAUTH
};

const defaultTimeout = 90000; // 1min + 30seg
//import Ping from 'react-native-ping';

const fetchIvan = (ipDefault = null) => {
	//auth: ApiAUTH,
	return {
		get(ruta, params, token, lang, headers = defaultHeaders, timeout = defaultTimeout) {
			return new Promise(async function(resolve, reject) {
				let status = 0;
				let resHeaders = {};
				if(token) {
					headers = {...headers, authorization: token, };
				}
				if(lang) {
					headers = {...headers, lenguaje: lang};
				}

				let noResponder = false;
				let timersito = setTimeout(function(){
					noResponder = true;
					console.log("Tiempo agotado");
					reject({error: {message: "Tiempo de espera agotado"}});
				},timeout-100);

				//console.log('special code',error.code, error.message);
				
				apiURL = "http://"+(ipDefault || ipRemota2);
				/*try {
					const ms = await Ping.start(ipLocal,{ timeout: 50 });
					console.log(ms+"ms");
					apiURL = "http://"+ipLocal;
				} catch (error) {
					console.log('special code',error.code, error.message);
					//apiURL = "http://"+ipRemota;
					try {
						apiURL = "http://"+ipRemota;
						function pruebaServer1(ms) {
							return new Promise(async function(resolve, reject) {
								setTimeout(function() {
									reject(new Error("timeout"))
								}, ms)

								const response = await fetch(apiURL+"/ping", {headers: headers, timeout: ms});
								return resolve(await response.json())
							})
						}
						const [json, error] = await pruebaServer1(800);

						if(error || !json.status) {
							throw new Error("No hay conexión con el servidor "+ipRemota)
						}
					} catch (error) {
						console.log('special code',error.message);
						apiURL = "http://"+ipRemota2;
					}
				}*/
				
				console.log(apiURL+ruta);
				fetch(apiURL+ruta+(params ? "?"+params:""), {
					method: 'GET',
					headers: headers,
					timeout: timeout,
					compress: true
				})
				.then((response) => {
					if(noResponder) return;
					clearTimeout(timersito);
					status = response.status;
					for(let head of response.headers.entries()){
						resHeaders[head[0]] = head[1];
					}
					return response.text();
				})
				.then((text) => {
					try {
						text = JSON.parse(text);
					} catch {
						// text plane
					}
					return text;
				})
				.then(data => {
					if(status === 200) {
						resolve({status, data, headers: resHeaders});
					} else {
						reject({status, error: data, headers: resHeaders});
					}
				})
				.catch(error => {
					if(noResponder) return;
					clearTimeout(timersito);
					reject({error: error.stack});
				})

			});
		},

		put(ruta, data, token, lang, headers = defaultHeaders, timeout = defaultTimeout, urlencoded=false) {
			return new Promise(async function(resolve, reject) {
				let status = 0;
				let resHeaders = {};
				if(token) {
					headers = {...headers, authorization: token, };
				}
				if(lang) {
					headers = {...headers, lenguaje: lang};
				}
				let noResponder = false;
				let timersito = setTimeout(function(){
					noResponder = true;
					console.log("Tiempo agotado");
					reject({error: {message: "Tiempo de espera agotado"}});
				},timeout);

				//console.log('special code',error.code, error.message);
				apiURL = "http://"+(ipDefault || ipRemota2);
				/*try {
					const ms = await Ping.start(ipLocal,{ timeout: 50 });
					console.log(ms+"ms");
					apiURL = "http://"+ipLocal;
				} catch (error) {
					console.log('special code',error.code, error.message);
					//apiURL = "http://"+ipRemota;
					try {
						apiURL = "http://"+ipRemota;
						function pruebaServer1(ms) {
							return new Promise(async function(resolve, reject) {
								setTimeout(function() {
									reject(new Error("timeout"))
								}, ms)

								const response = await fetch(apiURL+"/ping", {headers: headers, timeout: ms});
								return resolve(await response.json())
							})
						}
						const [json, error] = await pruebaServer1(800);

						if(error || !json.status) {
							throw new Error("No hay conexión con el servidor "+ipRemota)
						}
					} catch (error) {
						console.log('special code',error.message);
						apiURL = "http://"+ipRemota2;
					}
				}*/

				console.log(apiURL);
				fetch(apiURL+ruta, {
					method: 'PUT',
					headers: headers,
					timeout: timeout,
					body: urlencoded ? data:JSON.stringify(data),
					compress: true
				})
				.then((response) => {
					if(noResponder) return;
					clearTimeout(timersito);
					status = response.status;
					for(let head of response.headers.entries()){
						resHeaders[head[0]] = head[1];
					}
					return response.text();
				})
				.then((text) => {
					try {
						text = JSON.parse(text);
					} catch {
						// text plane
					}
					return text;
				})
				.then(data => {
					if(status === 200) {
						resolve({status, data, headers: resHeaders});
					} else {
						reject({status, error: data, headers: resHeaders});
					}
				})
				.catch(error => {
					if(noResponder) return;
					clearTimeout(timersito);
					reject({error: error.stack});
				})
			});
		},

		post(ruta, data, token, lang, headers = defaultHeaders, timeout = defaultTimeout, urlencoded=false) {
			return new Promise(async function(resolve, reject) {
				let status = 0;
				let resHeaders = {};
				if(token) {
					headers = {...headers, authorization: token};
				}
				if(lang) {
					headers = {...headers, lenguaje: lang};
				}
				let noResponder = false;
				let timersito = setTimeout(function(){
					noResponder = true;
					console.log("Tiempo agotado");
					reject({error: {message: "Tiempo de espera agotado"}});
				},timeout);

				//console.log('special code',error.code, error.message);
				apiURL = "http://"+(ipDefault || ipRemota2);
				/*try {
					const ms = await Ping.start(ipLocal,{ timeout: 50 });
					console.log(ms+"ms");
					apiURL = "http://"+ipLocal;
				} catch (error) {
					console.log('special code',error.code, error.message);
					//apiURL = "http://"+ipRemota;
					try {
						apiURL = "http://"+ipRemota;
						function pruebaServer1(ms) {
							return new Promise(async function(resolve, reject) {
								setTimeout(function() {
									reject(new Error("timeout"))
								}, ms)

								const response = await fetch(apiURL+"/ping", {headers: headers, timeout: ms});
								return resolve(await response.json())
							})
						}
						const [json, error] = await pruebaServer1(800);

						if(error || !json.status) {
							throw new Error("No hay conexión con el servidor "+ipRemota)
						}
					} catch (error) {
						console.log('special code',error.message);
						apiURL = "http://"+ipRemota2;
					}
				}*/

				console.log(apiURL);
				fetch(apiURL+ruta, {
					method: 'POST',
					headers: headers,
					timeout: timeout,
					body: urlencoded ? data:JSON.stringify(data),
					//compress: true
				})
				.then((response) => {
					if(noResponder) return;
					clearTimeout(timersito);
					status = response.status;
					for(let head of response.headers.entries()){
						resHeaders[head[0]] = head[1];
					}
					return response.text();
				})
				.then((text) => {
					try {
						text = JSON.parse(text);
					} catch {
						// text plane
					}
					return text;
				})
				.then(data => {
					if(status === 200) {
						resolve({status, data, headers: resHeaders});
					} else {
						reject({status, error: data, headers: resHeaders});
					}
				})
				.catch(error => {
					if(noResponder) return;
					clearTimeout(timersito);
					reject({error: error.stack});
				})

			});
		},

		delete(ruta, data, token, lang, headers = defaultHeaders, timeout = defaultTimeout, urlencoded=false) {
			return new Promise(async function(resolve, reject) {
				let status = 0;
				let resHeaders = {};
				if(token) {
					headers = {...headers, authorization: token, };
				}
				if(lang) {
					headers = {...headers, lenguaje: lang};
				}
				let noResponder = false;
				let timersito = setTimeout(function(){
					noResponder = true;
					console.log("Tiempo agotado");				
					reject({error: {message: "Tiempo de espera agotado"}});
				},timeout);
				
				//console.log('special code',error.code, error.message);
				apiURL = "http://"+(ipDefault || ipRemota2);
				/*try {
					const ms = await Ping.start(ipLocal,{ timeout: 50 });
					console.log(ms+"ms");
					apiURL = "http://"+ipLocal;
				} catch (error) {
					console.log('special code',error.code, error.message);
					//apiURL = "http://"+ipRemota;
					try {
						apiURL = "http://"+ipRemota;
						function pruebaServer1(ms) {
							return new Promise(async function(resolve, reject) {
								setTimeout(function() {
									reject(new Error("timeout"))
								}, ms)

								const response = await fetch(apiURL+"/ping", {headers: headers, timeout: ms});
								return resolve(await response.json())
							})
						}
						const [json, error] = await pruebaServer1(800);

						if(error || !json.status) {
							throw new Error("No hay conexión con el servidor "+ipRemota)
						}
					} catch (error) {
						console.log('special code',error.message);
						apiURL = "http://"+ipRemota2;
					}
				}*/

				console.log(apiURL);
				fetch(apiURL+ruta, {
					method: 'DELETE',
					headers: headers,
					timeout: timeout,
					body: urlencoded ? data:JSON.stringify(data),
					compress: true
				})
				.then((response) => {
					if(noResponder) return;
					clearTimeout(timersito);
					status = response.status;
					for(let head of response.headers.entries()){
						resHeaders[head[0]] = head[1];
					}
					return response.text();
				})
				.then((text) => {
					try {
						text = JSON.parse(text);
					} catch {
						// text plane
					}
					return text;
				})
				.then(data => {
					if(status === 200) {
						resolve({status, data, headers: resHeaders});
					} else {
						reject({status, error: data, headers: resHeaders});
					}
				})
				.catch(error => {
					if(noResponder) return;
					clearTimeout(timersito);
					reject({error: error.stack});
				})
			});
		},

		isJson(json){
			try{
				JSON.parse(json);
				return true;
			} catch {
				return false;
			}
		}
	}
};

export default fetchIvan;
