const request = require('request-promise');
const cheerio = require('cheerio');
const moment = require('moment');

const {
  baseUrl,
  boingoUrl,
  loginUrl,
  username,
  password,
} = require('./config');


const checkLogin = async () => {
  let result;
  try {
    result = await request.get(baseUrl);
  } catch (error) {
    return console.log(error);
  }
  return result.indexOf('Logout') !== -1;
}

const login = async () => {
  let result;
  try {
    result = await request.get(baseUrl);
  } catch (error) {
    return console.log(error);
  }
  let $ = cheerio.load(result);
  const postKey = $('[name=postKey]').val();
  if (postKey === undefined) {
    return console.log('No postKey found. Maybe logged in.');
  }
  const SSID = result.substr(result.indexOf('?SSID=') + '?SSID='.length, 32);
  const data = {
    locale: 'jp',
    Roaming: 1,
    system: 'wi2net',
    loginUrl: 'https://service.wi2.ne.jp/wi2net/Wi2RoamingLogin.php',
    postKey,
    SSID,
  };
  let url = `${boingoUrl}?`;
  for (let key of Object.keys(data)) {
    url = `${url}${key}=${data[key]}&`;
  }
  let boingoPage;
  try {
    boingoPage = await request.get(url);
  } catch (error) {
    return console.log(error);
  }
  const landingPage = encodeURI(`/${url.replace(boingoUrl)}`, '');
  const loginData = {
    partner_array: '',
    UserName: username,
    Password: password,
    relative_links: 1,
    Roaming: 1,
    locale: 'jp',
    system: 'wi2net',
    sha: '0',
    landingPage,
    Submit: 'Login',
    postKey,
    SSID,
  };
  let loginResult;
  try {
    loginResult = await request.post(loginUrl, {
      form: loginData,
    });
  } catch (error) {
    return console.log(errror);
  }
  $ = cheerio.load(loginResult);
  const onload = $('body').attr('onload');
  const redirectUrl = onload.substr(15, onload.length - 17);
  try {
    await request.get(redirectUrl);
  } catch (error) {
    return console.log(error);
  }
  return console.log('login successful');
}

const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const doCheck = async () => {
  if (!await checkLogin()) {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'not login');
    await login();
  } else {
    console.log(moment().format('YYYY-MM-DD HH:mm:ss'), 'logged in');
  }
  await sleep(5000);
  await doCheck();
}

doCheck().then().catch(err => console.log(err));
