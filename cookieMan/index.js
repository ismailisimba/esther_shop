const crypt = require("../crypto");
const KJUR = require('jsrsasign');
const crypto = new crypt();
const {BigQuery} = require('@google-cloud/bigquery');
const bigqueryClient = new BigQuery();
const path = require('path');

const fs = require('fs').promises;



const projectId = 'ismizo';
const datasetId = 'esther_dataset';
const tableId = 'users';
const tableId2 = 'sessions';
const tableId3 = 'items';
const tableId4 = 'pages';
const TMP = '';


const TOKEN_PATH = path.join(__dirname, 'private', 'masterkey.json');


class cookieMan {
    constructor(){
        this.startSession = startSession
        this.customDateFormater = customDateFormater;
        this.customDateFormaterEAT = customDateFormaterEAT;
        this.getMasterKey = getMasterKey;
        this.makeACookie = makeACookie;
        this.getThisCookie = getThisCookie;
        this.getPersKey = getPersKey;
        this.ipCheck = ipCheck;
        this.decodeJWT = decodeJWT;
        this.random52 = random52;
        this.getPublicKey = getPublicKey
        this.checkIfLogIn = checkIfLogIn;
        this.checkIfLogInToo = checkIfLogInToo;
        this.getDefaultAdminCode = getDefaultAdminCode;
        this.validateSignUpInputs = validateSignUpInputs;
        this.checkUserType = checkUserType;
        this.checkIfOurCookie = checkIfOurCookie;
        this.checkAdminType = checkAdminType;
        this.searchForUser = searchForUser;
        

     
    }
  }


  const checkIfLogIn = async (req,res,next)=>{
    const msg = crypto.decrypt(req.cookies.Grantman, await getMasterKey());
    const nMsg = msg==undefined?{"useris":"notin"}:msg;
    if(nMsg&&nMsg.user){
         const { year, month, day, hour, minute, second } = nMsg.date;
         const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        const cookieDate = new Date(dateString);
        const currentDate = new Date();
        const timeDifference = currentDate - cookieDate;
        const eightHoursInMilliseconds = 8 * 60 * 60 * 1000;
          if (timeDifference <= eightHoursInMilliseconds) {
            res.locals.plainCookie = nMsg;
            getThisCookie(req.cookies.Grantman,nMsg);
                next();
                } else {
                  await startSession("loggedOutUser",req,res,req.headers.origin||req.headers.host);
                  res.cookie('Grantman',"null", { maxAge: 1000, httpOnly: true,sameSite:"none",secure:true,overwrite: true });
                  res.status(401).send({"no":"permission"})
                }
    }else{
        res.status(401).send({"no":"permission"})
    }
}

const checkIfLogInToo = async (req,res,next)=>{
  const msg = crypto.decrypt(req.cookies.Grantman, await getMasterKey());
  const nMsg = msg==undefined?{"useris":"notin"}:msg;
  if(nMsg&&nMsg.user){
    const { year, month, day, hour, minute, second } = nMsg.date;
    const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const cookieDate = new Date(dateString);
    const currentDate = new Date();
    const timeDifference = currentDate - cookieDate;
    const eightHoursInMilliseconds = 8 * 60 * 60 * 1000;
      if (timeDifference <= eightHoursInMilliseconds) {
        res.locals.plainCookie = nMsg;
        getThisCookie(req.cookies.Grantman,nMsg);
            return true;
            } else {
              return false;
            }
  }else{
      return false;
  }
}

const checkIfOurCookie = async (cookie)=>{
  //console.log(cookie,"passedCookie")
  const msg = crypto.decrypt(cookie, await getMasterKey());
  const nMsg = msg==undefined?{"wrong":"cookie!"}:msg;
  
  if(nMsg&&nMsg.user){
    const cookieRes = await getThisCookie(cookie,nMsg)
    if(cookieRes&&cookieRes===true){
      return {status:true,cookie:msg}
    }else{
      return {status:false}
    }
      
  }else{
      return {status:false}
  }
}

const checkUserType = async (req,res,next)=>{
  const userType = res.locals.plainCookie.userType;
  const donorOnlyRoutes = [
    "/confirmdefaultadminaccesscode/:code",
    "/getallusernames",
    "/upgradeadminaccesscode/:code",
    "/update-a-table/:table/:action/:redirect?",
    "/update-table-cell/:table/:action/:itemId/:redirect?",
    "/getendpointlist",
    "/paginate/:database/:page/:orderby/:ordertype/:pagesize?",
    "/send-email-notification",
    "/search",
    "/dashboard-data/:column?",
    "/libraries/super-admin-console",
    "/program-dashboard-data",
    "/solicitation-dashboard-data",
    "/project-dashboard-data",
    "/rank-applications",
    "/shortlist-applications",
    "/award-applications",
    "/send-email-notification"

    
  ]
  const status1 = req.params.table&&req.params.table==="project" && req.params.action&&req.params.action==="update"&&userType==="applicant"?true:false;
  const status2 = req.params.table&&req.params.table==="reports" && req.params.action&&req.params.action==="update"&&userType==="applicant"?true:false;
  //console.log(status1,"d1")
  //console.log(status2,"d2")
  if(status1||status2){
    next();
  }else if(donorOnlyRoutes.indexOf(req.route.path)!=-1&&userType==="applicant"){
    res.send("no permission!").end()
}else{
  next();
  }
  
}

const checkAdminType = async (req,res,next)=>{
  const userType = res.locals.plainCookie.superAdminType;
 
  const status1 = userType==="superadmin"?true:false;
  
  if(status1){
    next();
  }else{
    res.send("no permission!").end()
  }
  
}


const startSession = async (action,req,res,email,tableId,itemId,oldVal,newVal)=>{
    const obj = {};
    if(action==="loggedInUser_login"||action==="createdUser"||action==="loggedInUserWithGoogle"||action==="createdUserWithGoogle_applicant"||action==="createdUserWithGoogle_donor"||action==="loggedInUser_adminUpgrade"){
        const ip = req.ip;
        const ip2 = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
        const date = customDateFormater();
        obj["res"] = await makeACookie(ip,ip2,email,action,date);
        const msg = crypto.decrypt(obj.res, await getMasterKey());
        const nMsg = msg==undefined?{"useris":"notin"}:msg;
        if(nMsg&&nMsg.user){
          res.locals.plainCookie = nMsg;
          res.locals.lockedCookie = obj.res;
        }else{
           
        }
        obj.ip = ip;
        obj.ip2 = ip2;
        obj.date = JSON.stringify(date);
        res.cookie('Grantman',obj.res, { maxAge: 28800000, httpOnly: true,sameSite:"none",secure:true,overwrite: true });
    

    }else if(action==="refresh-a-cookie"){
      const ip = req.ip;
      const ip2 = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
      const date = customDateFormater();
      obj["res"] = await makeACookie(ip,ip2,email,action,date);
      const msg = crypto.decrypt(obj.res, await getMasterKey());
      const nMsg = msg==undefined?{"useris":"notin"}:msg;
      if(nMsg&&nMsg.user){
        res.locals.plainCookie = nMsg;
      }else{
         
      }
      obj.ip = ip;
      obj.ip2 = ip2;
      obj.date = JSON.stringify(date);
      res.cookie('Grantman',obj.res, { maxAge: 28800000, httpOnly: true,sameSite:"none",secure:true,overwrite: true });
      //return obj.res;

  }else if(action==="loggedOutUser"){
      const ip = req.ip;
        const ip2 = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
        const date = customDateFormater();
        obj["res"] = res.locals.plainCookie;
        obj.ip = ip;
        obj.ip2 = ip2;
        obj.date = JSON.stringify(date);
    }else{
      const ip = req.ip;
      const ip2 = req.headers['x-forwarded-for'] || req.socket.remoteAddress ;
      const date = customDateFormater2();
      obj["ros"] = res.locals.plainCookie ||"noCookie! -- logged out!";
      obj.ip = ip;
      obj.ip2 = ip2;
      obj.date = JSON.stringify(date);
    }
    const query = ` INSERT INTO \`${projectId}.${datasetId}.${tableId2}\` (sessionId, action, userId, string_field_3, string_field_4, currentTime, cookie, table, item, oldVal, newVal)
    VALUES (@sessionId, @action, @userId, @string_field_3, @string_field_4, @currentTime, @cookie, @table, @item, @oldVal, @newVal)`;
    const options = {
      // Specify a job configuration to set optional job resource properties.
      configuration: {
        query: {
          query: query,
          useLegacySql: false,
          parameterMode:"NAMED",
          queryParameters:[{
            "name": "sessionId",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":generateUuid()
            }
          },{
            "name": "action",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":action
            }
          },{
            "name": "userId",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":email
            }
          },{
            "name": "string_field_3",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":obj.ip
            }
          },{
            "name": "string_field_4",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":obj.ip2
            }
          },{
            "name": "currentTime",
            "parameterType": {
              "type":"TIMESTAMP"
            },
            "parameterValue": {
              "value":new Date(obj.date)
            }
          },{
            "name": "cookie",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":obj.res||obj.ros
            }
          },{
            "name": "table",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":tableId
            }
          },{
            "name": "item",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":itemId
            }
          },{
            "name": "oldVal",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":oldVal
            }
          },{
            "name": "newVal",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":newVal
            }
          },
        ]
        },
        labels: {'example-label': 'example-value'},
        
      },
    };
    
     await doBigQueryJob(options);
     return obj.res||obj.ros;
}

function generateUuid() {
    // Implementation of a simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }


async function makeACookie(ip,ip2,username,action,date){
    const bodyObj = {};
    const user = await getUser(username);
    bodyObj["date"] = date
    bodyObj["ipadd"] = ip;
    bodyObj["ipaddf"] = ip2;
    bodyObj["user"] = user.email;
    bodyObj["userType"] = user.userType
    bodyObj["userPermittedActions"] = JSON.parse(user.permissions)
    bodyObj["superAdminType"] = user.userType==="superadmin"?user.userType:"notsuperadmin";
    bodyObj["username"] = user.username;
    bodyObj["action"] = action;
    const publBod = crypto.encrypt(JSON.stringify(bodyObj), await getMasterKey())
    return publBod;
  }


const customDateFormater = () =>{
    Date.prototype.toDateInputValue = (function() {
        var local = new Date(this);
        local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
        return local.toJSON();
    });
    const dateVar = new Date().toDateInputValue().toString();
    const year = dateVar.slice(0,4);
    const month = dateVar.slice(5,7);
    const day = dateVar.slice(8,10);
    const hour = dateVar.slice(11,13);
    const minute = dateVar.slice(14,16);
    const second = dateVar.slice(17,23);
    const tzone = dateVar.slice(10,11) + dateVar.slice(23,24);
    const dateVal = {year,month,day,hour,minute,second,tzone};
    return dateVal;
}

const customDateFormater2 = () =>{
  Date.prototype.toDateInputValue = (function() {
      var local = new Date(this);
      local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
      return local.toJSON();
  });
  const dateVar = new Date().toDateInputValue().toString();
  const year = dateVar.slice(0,4);
  const month = dateVar.slice(5,7);
  const day = dateVar.slice(8,10);
  const hour = dateVar.slice(11,13);
  const minute = dateVar.slice(14,16);
  const second = dateVar.slice(17,23);
  const tzone = "UTC";
  const dateVal = {year,month,day,hour,minute,second,tzone};
  return dateVal;
}

const customDateFormaterEAT = () =>{
  Date.prototype.toDateInputValue = (function() {
      var local = new Date(this);
      local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
      return local.toJSON();
  });
  const myhour = (new Date().getUTCHours())+3;
  const dateVar = new Date().toDateInputValue().toString();
  const myminute = dateVar.slice(14,16);
  const mysec = dateVar.slice(17,23);
  return dateToAgaFormat(dateVar) +" "+ myhour + ":" + myminute +":" +mysec +" EAT";
}

function dateToAgaFormat(date) {
  const inputValue = date;  // Gets the value in YYYY-MM-DD format
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const dateObj = new Date(inputValue);
  const day = dateObj.getDate().toString().padStart(2, '0');
  const month = months[dateObj.getMonth()];
  const year = dateObj.getFullYear().toString().substring(-2); // Gets the last 2 digits of the year
  const formattedDate = `${day}-${month}-${year}`;
  return formattedDate;
}

const searchForUser=async(userEmail="")=>{


  try{
    
    if (!isEmailValid(userEmail)) {
        console.log(userEmail,"Invalid email format");
    }else{
      const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE email = @email`;
      const options = {
        // Specify a job configuration to set optional job resource properties.
        configuration: {
          query: {
            query: query,
            useLegacySql: false,
            parameterMode:"NAMED",
            queryParameters:[{
              "name": "email",
              "parameterType": {
                "type":"STRING"
              },
              "parameterValue": {
                "value":userEmail
              }
            },
          ]
          },
          labels: {'example-label': 'example-value'},
          
        },
      };

  
      const results = await doBigQueryJob(options);
      if (results && results.length > 0) {
        return results[0];
      } else {
        return null;
      }

    }
    /*if (!agaEmailCheck(userEmail)) {
      throw new Error('Invalid email format. Use AGA Email');
    }*/

   

  }catch(e){
    console.log(e);
    return(e)
  }

}


const getMasterKey =async()=>{
  const obj = JSON.parse(await fs.readFile(TOKEN_PATH));
  return obj.keyVal;
}


const getPublicKey =async()=>{
  const obj = JSON.parse(await fs.readFile(TOKEN_PATH));
  return obj.keyValToo;
}


const getDefaultAdminCode =async(code)=>{
    const obj = JSON.parse(await fs.readFile(TOKEN_PATH));
    return obj.keyValThree===code?true:false;
  }



const getThisCookie=async(cookie="",msg)=>{
  const nMsg = msg;
  try{
 
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId2}\` WHERE sessionId = @sessionId`;
    const options = {
      // Specify a job configuration to set optional job resource properties.
      configuration: {
        query: {
          query: query,
          useLegacySql: false,
          parameterMode:"NAMED",
          queryParameters:[{
            "name": "sessionId",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":cookie
            }
          },
        ]
        },
        labels: {'example-label': 'example-value'},
        
      },
    };

    const results = await doBigQueryJob(options);
    //console.log(results,"cookie from table")
    if (results && results.length > 0) {

      const onCook = results[0];
      if(onCook!=null&&onCook.cookie&&onCook.email===nMsg.user){
        const { year, month, day, hour, minute, second } = nMsg.date;
        const dateString = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
        const cookieDate = new Date(dateString);
        const currentDate = new Date();
        const timeDifference = currentDate - cookieDate;
        const eightHoursInMilliseconds = 24 * 60 * 60 * 1000;
        if(timeDifference > eightHoursInMilliseconds){
          console.log(cookie,"cookie is stale")
          return false
        }else{
          return true
        }
      }else{
          console.error("Unrecognized cookie! - "+JSON.stringify(onCook))
      }
      
     // return results[0];
    } else {
      return null;
    }

  }catch(e){
    console.log(e);
    return(e)
  }

}

const getUser=async(msg)=>{
  const nMsg = msg;
  try{
 
    const query = `SELECT * FROM \`${projectId}.${datasetId}.${tableId}\` WHERE email = @email`;
    const options = {
      // Specify a job configuration to set optional job resource properties.
      configuration: {
        query: {
          query: query,
          useLegacySql: false,
          parameterMode:"NAMED",
          queryParameters:[{
            "name": "email",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":nMsg
            }
          },
        ]
        },
        labels: {'example-label': 'example-value'},
        
      },
    };

    const results = await doBigQueryJob(options);
    if (results && results.length > 0) {
           return results[0];
    } else {
      return null;
    }

  }catch(e){
    console.log(e);
    return(e)
  }

}

const getPersKey=async(cookie="")=>{

  try{
 
    const query = `SELECT secret FROM \`${projectId}.${datasetId}.${tableId}\` WHERE email = @email`;
    const options = {
      // Specify a job configuration to set optional job resource properties.
      configuration: {
        query: {
          query: query,
          useLegacySql: false,
          parameterMode:"NAMED",
          queryParameters:[{
            "name": "email",
            "parameterType": {
              "type":"STRING"
            },
            "parameterValue": {
              "value":cookie
            }
          },
        ]
        },
        labels: {'example-label': 'example-value'},
        
      },
    };

    const results = await doBigQueryJob(options);
    if (results && results.length > 0) {
      return results[0];
    } else {
      return null;
    }

  }catch(e){
    console.log(e);
    return(e)
  }

}





const ipCheck = (req, res, next) => {
  const origin = checkRequestOrigin(req);
  const corsWhitelist = [
    'https://grantman-czivjdfhnq-ez.a.run.app',
    'https://script.google.com',
    'https://storage.googleapis.com',
    'http://localhost:8080',
    'http://localhost:8000',
    'http://localhost:8000/',
    'http://127.0.0.1:8000',
    'http://127.0.0.1:8000/',
    'http://localhost:8080/loginwithgoogle',
    'http://localhost:8000/loginwithgoogle',
    'https://stepp-gms-czivjdfhnq-bq.a.run.app',
    'https://stepp-gms2-czivjdfhnq-bq.a.run.app',
    'grantman-czivjdfhnq-ez.a.run.app',
    'stepp-gms-czivjdfhnq-bq.a.run.app',
    'stepp-gms2-czivjdfhnq-bq.a.run.app',
    'script.google.com',
    'storage.googleapis.com',
    'localhost:8080',
    'localhost:8000',
    '127.0.0.1:8000',
    '127.0.0.1:8000/',
  ];

  if (corsWhitelist.indexOf(origin) !== -1) {
    res.append('Access-Control-Allow-Origin', origin);
    res.append('Access-Control-Allow-Headers', 'x-requested-with, Content-Type, Content-Disposition, origin, authorization, accept, client-security-token');
    res.append('Access-Control-Allow-Credentials', 'true');
    res.append('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
    res.append('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.append('sec-fetch-site', 'cross-site');
    res.header('Access-Control-Expose-Headers', 'Content-Disposition');
    console.log("Fetch origin recognized and headers set");

    if (req.method === 'OPTIONS') {
      return res.status(200).end();  // For preflight requests
    }

    next();
  } else {
    console.log("Fetch from " + origin + " is not recognized");
    res.send(`<h1>Please access this website from <a href="https://grantman-czivjdfhnq-ez.a.run.app/" target="_blank">this link.</a></h1>`);
  }
};

function checkRequestOrigin(req){
  const obj = {};
  if(typeof req.headers.origin!=="undefined"&&req.headers.origin!=="null"&&req.headers.origin!==null){
    //console.log(req.headers?.origin||undefined,"This is origin")
    obj.val = req.headers.origin;
  }else if(typeof req.headers.host!=="undefined"&&req.headers.host!=="null"&&req.headers.host!==null){
    //console.log(req.headers?.host||undefined,"This is host")
    obj.val = req.headers.host;
  }else{
    obj.val = "undefined";
    console.log("We could not read the source from header");
    console.log(req.headers);
  }
  return obj.val;
}



const isEmailValid = (email) => {
    // Basic regex for email validation
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return re.test(email);
};

    const isPasswordValid = (password)=> {
      const errors = [];
      // Check for length
      if (password.length < 8) {
          errors.push("Password must be at least 8 characters long.");
      }

      // Check for lowercase letter
      if (!/[a-z]/.test(password)) {
          errors.push("Password must contain at least one lowercase letter.");
      }

      // Check for uppercase letter
      if (!/[A-Z]/.test(password)) {
          errors.push("Password must contain at least one uppercase letter.");
      }

      // Check for a number
      if (!/[0-9]/.test(password)) {
          errors.push("Password must contain at least one number.");
      }

      // Check for a symbol
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          errors.push("Password must contain at least one special character (symbol).");
      }

      // Check for spaces (password should not contain spaces)
      if (/\s/.test(password)) {
          errors.push("Password should not contain spaces.");
      }

      // Return errors or success
      if (errors.length > 0) {
          return errors.join(" ");
      } else {
          return true;
      }
    };

const isAccessCodeValid = (accessCode) => {
    // Example validation: check if access code is not empty and has a specific pattern/length
    // Modify this according to your actual access code format
    return accessCode?.length >= 52;
};



const validateSignUpInputs = (email = undefined, password = undefined, accessCode = undefined, organization = undefined) => {
    if (!isEmailValid(email)) {
        return { success: false, message: 'Invalid email format.' };
    }

    if (isPasswordValid(password)!=true) {
        return { success: false, message: isPasswordValid(password) };
    }

    if (!isAccessCodeValid(accessCode)) {
        return { success: false, message: 'Invalid access code.' };
    }

    /*if (!isOrganizationValid(organization)) {
        return { success: false, message: 'Organization name cannot be empty.' };
    }*/

    // If all validations pass
    return { success: true, message: 'All inputs are valid.' };
};

// Example usage
//const validationResult = validateSignUpInputs('user@example.com', 'password123', 'ACCESS12345', 'Organization Name');




function decodeJWT(jwtToken) {
  try {
    const decodedToken = KJUR.jws.JWS.parse(jwtToken);
    if (decodedToken === null) {
      throw new Error('Invalid JWT token');
    }

    const { payloadObj } = decodedToken;
    return payloadObj;
  } catch (error) {
    console.error('Error decoding JWT token:', error.message);
    return null;
  }
}


function random52(){
  const deck = ["ah","ak","as","ac","kh","kk","ks","kc","qh","qk","qs","qc","jh","jk","js","jc","10h","10k","10s","10c","9h","9k","9s","9c","8h","8k","8s","8c","7h","7k","7s","7c","6h","6k","6s","6c","5h","5k","5s","5c","4h","4k","4s","4c","3h","3k","3s","3c","2h","2k","2s","2c"]
   // Make a copy of the original array to avoid modifying the input array
   const shuffledArr = deck.slice();
   let n = shuffledArr.length;
 
   // Fisher-Yates shuffle algorithm
   for (let i = n - 1; i > 0; i--) {
     // Generate a random index from 0 to i (inclusive)
     const j = Math.floor(Math.random() * (i + 1));
 
     // Swap elements at indices i and j
     [shuffledArr[i], shuffledArr[j]] = [shuffledArr[j], shuffledArr[i]];
   }
 
   return joinStringsWithoutSpacesAndSymbols(shuffledArr);
}


function joinStringsWithoutSpacesAndSymbols(arr) {
  // Filter out non-string elements from the array
  const stringArray = arr.filter(item => typeof item === 'string');

  // Join the strings without spaces or symbols
  const resultString = stringArray.join('');

  return resultString;
}



const doBigQueryJob =async (options)=>{
  const [job] = await bigqueryClient.createJob(options);
  const [rows] = await job.getQueryResults();
  return rows;
}












  module.exports = cookieMan;