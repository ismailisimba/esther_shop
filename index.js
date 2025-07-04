const express = require('express');
const path = require('path');
const formidable = require('formidable');
const dataMan = require("./dataman");
const dataManager = new dataMan();

const crypt = require("./crypto");
const crypto = new crypt();

const cookieMan = require("./cookieMan");
const cookieManager = new cookieMan();
const cookieParser = require('cookie-parser');
const axios = require("axios");
const { title } = require('process');


const port = parseInt(process.env.PORT)|| 8080;

const app = express();


const sensitiveColumns = ['createdAt', 'updatedAt', 'itemId', 'pageId'];




app.use(express.static(path.join(__dirname, 'public_files/stylish/')));

app.use(cookieParser()); // Use cookie-parser middleware globally


const server = app.listen(port,() => {
    console.log(`Grantman listening on port ${port}`);
  });
  


  app.get("/",(req,res,next)=>{
    const filePath = "public_files/stylish/index2.html";

      dataManager.parseHtmlContent(filePath,"livedata").then(async(data)=>{

          //res.send(data);
          //console.log(data,"data")
          const updatedData = await dataManager.checkPageItems(data);
          dataManager.updateHtmlPage(data, filePath, req, res);

      }).catch((err)=>{
        console.log(err);
      })
  });


  app.post('/auth/login', (req, res) => {
    // Create an instance of Formidable to parse the form data
      const form = new formidable.IncomingForm();
    
      form.parse(req, async(err, fields, files) => {
          if (err) {
              console.error('Error parsing the form:', err);
              return res.status(500).send('An error occurred while parsing the form.');
          }
                const data = JSON.parse(fields.inputs[0])

                
                const email = data[0]['login-email']
                
                const user = await cookieManager.searchForUser(email);
                
                if(user!=null){
                  const secret = user.secret;
                  const pass = data[0]['login-password']
                  const masterKey = await cookieManager.getMasterKey()             
                  const decryptedSecret = crypto.decrypt(secret,masterKey)
                  const passDec = typeof decryptedSecret.password === "undefined"?decryptedSecret:decryptedSecret.password[0];
                  
                  if(passDec===pass){
                    await cookieManager.startSession("loggedInUser_login",req,res,user.email,"user",user.username,"out","in");
                    res.send({user:"logged-in!",userData: res.locals.plainCookie});
                  }else{
                    res.send({"wrong":"pass",pass:pass})
                  }
                }else{
                  res.send({"no":"user"})
                }
      });
});


app.post('/auth/register', (req, res) => {
  // Handle user registration
  const form = new formidable.IncomingForm();
  form.parse(req, async(err, fields, files) => {
    if (err) {
        console.error('Error parsing the form:', err);
        return res.status(500).send('An error occurred while parsing the form.');
    }

    const data = JSON.parse(fields.inputs[0])

    
    // Extract fields data
    const email = data[0]["applicant-email"];
    const password = data[0]["applicant-password"];
    const fname = data[0]["given_name"];
    const lname = data[0]["family_name"]
    const secret = crypto.encrypt(JSON.stringify({fname:fname,lname:lname,email:email,password:[password]}),await cookieManager.getMasterKey())

    // TODO: Add your logic here to handle the donor sign-up
       const resVal = cookieManager.validateSignUpInputs(email,password, await cookieManager.getPublicKey())
        if(resVal.success){
            const x = await cookieManager.searchForUser(email);
            if(x===null||x==="null"){
              const prefix = req.headers.host?.includes("localhost")?"http://":"https://";
              const tempFileName = await dataManager.uploadOrUpdateJson("esther_shop","temp/"+"_"+email.replace("@","_").replaceAll(".","_"),"signupJson",{email,password},email)
              const emailB64 = "From: 'me'\r\n" +
              "To: " + email + "\r\n" +
              "Subject: " + "Esther's Shop Sign-Up " + "\r\n" +
              "Content-Type: text/html; charset='UTF-8'\r\n" +
              "Content-Transfer-Encoding: base64\r\n\r\n" +
              "<!DOCTYPE html>" +
              "<body>" +
              "<h3 style='font-size:18px;'>Please click or paste the link below on your browser to finish sign up</h3>" +
              "<p>"+"<a href='"+prefix+req.headers.host+"/complete-registration/"+encodeURIComponent(tempFileName)+"/"+encodeURIComponent(secret)+"'>"+prefix+req.headers.host+"/complete-registration/"+encodeURIComponent(tempFileName)+"/"+encodeURIComponent(secret)+"</a>"+"</p>"
              "</body>" +
              "</html>";
                  const x = await dataManager.createGmailDraft(emailB64,res);
                  const emailID = x.id;
                  const z = await dataManager.updateGmailDraft(`https://gmail.googleapis.com/gmail/v1/users/me/drafts/`+emailID,emailB64)
                  const w = await dataManager.sendGmailDraft(`https://www.googleapis.com/gmail/v1/users/me/drafts/send`,emailID)
                
                res.json({user:'new user  validated succesfully',w,success:true});
             }else{
            res.json({user:"exists!"});

             }
            }else{
                res.json(resVal);
            }
    // For demonstration, send back the parsed fields
});
});

app.get('/auth/logout',[cookieManager.checkIfLogIn ],async (req,res)=>{
  cookieManager.startSession("loggedOutUser",req,res,req.headers.origin||req.headers.host,"user",JSON.stringify(req.cookies.Grantman),"none","none");
  res.cookie('Grantman',"null", { maxAge: 1000, httpOnly: true,sameSite:"none",secure:true,overwrite: true });
  res.send({"logged":"out!"})
})

app.post('/auth/admin-upgrade', [cookieManager.checkIfLogIn ],async (req, res, next) => {
  // Handle user registration
  const form = new formidable.IncomingForm();
  form.parse(req, async(err, fields, files) => {
    if (err) {
        console.error('Error parsing the form:', err);
        return res.status(500).send('An error occurred while parsing the form.');
    }

    const data = fields
    const code = data["upgrade-code"][0]
    req.params.id = "settings/admin_upgrade_codes.json"
    const existingCodes = await dataManager.getThisFile(req,res,next,true)
    const status = dataManager.checkAndUpdateArray(code,existingCodes)

    console.log(status,"status")

    if (status.status){
      await dataManager.uploadOrUpdateJson("esther_shop","settings","admin_upgrade_codes.json",status.updatedArray,"default")
      const prefix = req.headers.host?.includes("localhost")?"http://localhost:8080/":"https://";
    const response = await axios.get(prefix+'settings.json');
    const settings = response.data;
  
    // Extract default permissions based on userType
    const defaultPermissions = (userType) => {
      const permissions = settings.permissions[userType];
      return JSON.stringify(permissions);
    };
  
    const userPermissions = res.locals.plainCookie.userType.includes("admin") ? defaultPermissions('superadmin') : defaultPermissions('admin');

    const updateRes = await dataManager.updateBigQueryRow(
      "users",
      res.locals.plainCookie.user,
      {"userType":{value:res.locals.plainCookie.userType.includes("admin") ? 'superadmin' : 'admin'},
      "userType_type":"STRING",
      "permissions":{value:userPermissions},
      "permissions_type":"JSON",},
      {"email":{value:res.locals.plainCookie.user},
      "email_type":"STRING"}
      )

    console.log(updateRes,"data")
    res.send(updateRes);

    }else{
      res.send({success:false});
    }
    

  
    // For demonstration, send back the parsed fields
});
});

app.get("/complete-registration/:id/:secret",async(req,res,next)=>{
  const userSecret = req.params.secret;
  const plainSecret = crypto.decrypt(userSecret,await cookieManager.getMasterKey())
  res.locals.plainCookie = {};
  res.locals.plainCookie.user = plainSecret.email;
  const userFile = await dataManager.getThisFile(req,res,next,true)
  //await dataManager.deleteFileAndFolderIfNeeded(req,res);
  //add approved domain check
  if(userFile&&userFile.email){
    const y = await dataManager.createUser({fname:plainSecret.fname,lname:plainSecret.lname,email:plainSecret.email,secret:crypto.encrypt(JSON.stringify(plainSecret),await cookieManager.getMasterKey()),userType:"normal"},req)
    await cookieManager.startSession("loggedInUser_login",req,res,plainSecret.email,"user",plainSecret.email,"out","in");
    res.redirect("/")
  }else{
    
  res.send("Wrong-link. Sign up again at <a href='./../../'>this link</a>")
  }
  
});

app.get('/checkloginstatus',async (req,res,next)=>{
  const status = await cookieManager.checkIfLogInToo(req,res,next);
  const plainCookie = res.locals.plainCookie;
  res.send({status,plainCookie});
})



app.get("/getcolnames/:database",[cookieManager.checkIfLogIn ],async(req,res,next)=>{
  try{
    
    const data = req.params.database;
    cookieManager.startSession("loggedInUser_gettingColumnNames",req,res,res.locals.plainCookie.user||"default_User",data,data,"noChange","readOnly");
    if(!data){
      throw makeErrorResponse({"Invalid name":"Column or Database"},'Column or Database name error');
    }
    await dataManager.getColumnNames(data).then(items=>{
      res.send(items);
    });

}catch(e){
    res.send(e);
}

})

app.get("/getpagesettings",[cookieManager.checkIfLogIn ],async(req,res,next)=>{
  try{
    
    cookieManager.startSession("loggedInUser_gettingPageSettings",req,res,res.locals.plainCookie.user||"default_User","pages","pageSettingsJson","noChange","readOnly");
    req.params.id = "settings/page_settings.json"
    
    const x = await dataManager.getThisFile(req,res,next,true)
    res.send(x);

}catch(e){
    res.send(e);
}

})

app.get("/paginate/:database/:page/:orderby/:ordertype/:pagesize?",[cookieManager.checkIfLogIn ],async(req,res,next)=>{
  try{
    const pageNo = parseInt(req.params.page,10);
    const data = req.params.database;
    const orderby = req.params.orderby;
    const ordertype = req.params.ordertype;
    const pagesize = req.params.pagesize||25;
    cookieManager.startSession("loggedInUser_paginate",req,res,res.locals.plainCookie.user||"default_User",data,pageNo,"noChange","readOnly");
    if(pageNo<=0){
      throw makeErrorResponse({"Page starts at":"1"},'Page Number Error');
    }
   const x = await dataManager.getThisPageofData(data,pageNo,orderby,ordertype,pagesize);
   res.send(x);

}catch(e){
    res.send(e);
}

})

app.post("/search",[cookieManager.checkIfLogIn],async(req,res,next)=>{
  try{
    const form = new formidable.IncomingForm({ multiples: Infinity, maxFileSize: 135 * 1024 * 1024, maxFieldsSize: 135 * 1024 * 1024 });
  
  form.parse(req, async function (err, fields, files) {
    if(err){
      console.log(err,"bbbb")
    }else{
        //add checks for sensitive tables
    
    const bodyobj = typeof fields === "object" && typeof fields.inputs ==="undefined"?fields:JSON.parse(fields.inputs[0]);
    
    //const bodyobjtoo = typeof fields.inputs[0] === "string"? JSON.parse(fields.inputs[0]):bodyobj;
    const queryResults = await dataManager.searchWithCriteria(bodyobj);
    cookieManager.startSession("loggedInUser_searching",req,res,res.locals.plainCookie.user||"default_User",bodyobj.tableId,"userSearch","noChange",JSON.stringify(bodyobj));
    res.send(queryResults);
    }

  })
  
}catch(e){
    res.send(e);
}

})



app.post('/update-items/:action/:itemId', [cookieManager.checkIfLogIn], async (req, res, next) => {
    const { action, itemId } = req.params;
    const newItemId = itemId === null||itemId === "null"?dataManager.generateUuid():itemId;
    const allowedActions = ['add', 'update', 'delete'];

    if (!allowedActions.includes(action)) {
        return res.status(400).send({ error: 'Invalid action' });
    }

    const userPermissions = res.locals.plainCookie.userPermittedActions;
    if (!userPermissions.canAdd && action === 'add' || !userPermissions.canEdit && action === 'update' || !userPermissions.canDelete && action === 'delete') {
        return res.status(403).send({ error: 'Permission denied' });
    }

    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing the form:', err);
            return res.status(500).send('An error occurred while parsing the form.');
        }

        // Remove sensitive columns
        sensitiveColumns.forEach(column => {
            delete fields[column];
        });

        // Handle file uploads
        const fileFields = ['pictures', 'documents', 'files'];
        const fileUploadPromises = fileFields.map(async field => {
            if (files[field]) {
                const uploadedFiles = await dataManager.uploadFilesToGCS(files[field], `items/${newItemId}`, 'esther_shop', res.locals.plainCookie.user);
                fields[field] = JSON.stringify(uploadedFiles);
            }
        });

        await Promise.all(fileUploadPromises);

        // Fetch schema to match column types
        let schema;
        try {
            const response = await dataManager.getColumnNames("items")
            schema = response;
        } catch (error) {
            console.error('Error fetching schema:', error);
            return res.status(500).send({ error: 'An error occurred while fetching the schema' });
        }

        // Prepare data for BigQuery
        const data = {};
        schema.columns.forEach(column => {
            if (fields[column.name]) {
                data[column.name] = [fields[column.name]];
                data[`${column.name}_type`] = [column.type];
            }else if(column.name === "itemId"){
                data[column.name] = [newItemId];
                data[`${column.name}_type`] = ["STRING"];
            }

        });

        try {
            const result = await dataManager.modifyBigQueryTable(action, 'items', data, 'itemId');
            res.send(result);
        } catch (error) {
            console.error('Error modifying BigQuery table:', error);
            res.status(500).send({ error: 'An error occurred while modifying the table' });
        }
    });
});


/*app.post('/update-pages', [cookieManager.checkIfLogIn], async (req, res, next) => {
    const form = new formidable.IncomingForm();
    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing the form:', err);
            return res.status(500).send('An error occurred while parsing the form.');
        }

        // Fetch existing settings JSON
        let settings;
        try {
          req.params.id = "settings/page_settings.json"
    
          const x = await dataManager.getThisFile(req,res,next,true)

          settings = x;
        } catch (error) {
            console.error('Error fetching settings:', error);
            return res.status(500).send({ error: 'An error occurred while fetching the settings' });
        }

        // Create searchObject for all page IDs
        const searchObject = {
            "advanceSearchValues": [],
            "basicSearch": "",
            "returnAll": "true",
            "sortBy": "default",
            "tableId": "pages",
            "orderType": "ascending"
        };

        console.log(fields,"fields")

        // Group pages by pageId and generate version for new entries
        const pages = Object.keys(fields).reduce((acc, key) => {
          console.log(key,"key")
          console.log(acc,"acc")
            const [pageId, field] = key.split('_');
            if (!acc[pageId]) {
                acc[pageId] = { pageId, version: 1, fields: {} };
            }
            acc[pageId].fields[field] = fields[key];
            return acc;
        }, {});

        console.log(pages,"pages")

        // Fetch existing pages from BigQuery
        let existingPages;
        try {
            const response = await dataManager.searchWithCriteria(searchObject);
            existingPages = response;
        } catch (error) {
            console.error('Error fetching existing pages:', error);
            return res.status(500).send({ error: 'An error occurred while fetching existing pages' });
        }

        // Update version for new entries
        Object.values(pages).forEach(page => {
            const existingPage = existingPages.find(p => p.pageId === page.pageId);
            if (existingPage) {
                page.version = existingPage.version + 1;
            }
        });

        // Update page settings JSON
        settings.pages = Object.values(pages).map(page => ({
            pageId: page.pageId,
            version: page.version,
            fields: page.fields
        }));

        try {
            await dataManager.uploadOrUpdateJson('esther_shop', 'settings', 'page_settings.json', settings, res.locals.plainCookie.user);
        } catch (error) {
            console.error('Error updating page settings JSON:', error);
            return res.status(500).send({ error: 'An error occurred while updating the page settings JSON' });
        }

        // Save new versions of the pages to BigQuery
        const savePromises = Object.values(pages).map(async page => {
            const data = {
                pageId: [page.pageId],
                version: [page.version],
                ...Object.keys(page.fields).reduce((acc, key) => {
                  console.log(key,"key")
                  console.log(acc,"key")
                  console.log(page,"page")
                    acc[key] = [page.fields[key]];
                    acc[`${key}_type`] = ['STRING'];
                    return acc;
                }, {})
            };

            console.log(data,"data")

            try {
                await dataManager.modifyBigQueryTable('add', 'pages', data, 'pageId');
            } catch (error) {
                console.error('Error saving new version of the page:', error);
                throw error;
            }
        });

        try {
            await Promise.all(savePromises);
            res.send({ success: true });
        } catch (error) {
            res.status(500).send({ error: 'An error occurred while saving the new versions of the pages' });
        }
    });
});*/



app.post('/update-pages', [cookieManager.checkIfLogIn], async (req, res, next) => {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing the form:', err);
      return res.status(500).send({ error: 'An error occurred while parsing the form.' });
    }

    // 1) Fetch existing settings JSON
    let settings;
    try {
      req.params.id = "settings/page_settings.json";
      settings = await dataManager.getThisFile(req, res, next, true);
      // In case settings.pages doesn't exist yet
      if (!settings.pages) {
        settings.pages = [];
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      return res.status(500).send({ error: 'An error occurred while fetching the settings' });
    }

    // 2) Get ALL pages from BigQuery (check if any exist)
    const searchObject = {
      "advanceSearchValues": [],
      "basicSearch": "",
      "returnAll": "true",
      "sortBy": "default",
      "tableId": "pages",
      "orderType": "ascending"
    };

    let existingPages = [];
    try {
      const response = await dataManager.searchWithCriteria(searchObject);
      existingPages = response || [];
    } catch (error) {
      console.error('Error fetching existing pages:', error);
      return res.status(500).send({ error: 'An error occurred while fetching existing pages' });
    }

    console.log(existingPages.length,"key2")

    // Convert existing pages into a lookup map by pageId
    const existingPagesMap = existingPages.reduce((acc, page) => {
      acc[page.pageId] = page;
      return acc;
    }, {});

    // 3) Group new inputs by pageId
    // fields object keys are like "somePageId_title", "somePageId_content", etc.
    // We'll split on '_' to isolate the pageId from the field name
    const newPagesData = {};
    for (const key of Object.keys(fields)) {
      newPagesData[key] = {fields: {},pageId:"",version:0};
      newPagesData[key].fields["content"] = fields[key][0];
      newPagesData[key].pageId = key;
      newPagesData[key].version = 0;
    }

    // 4) Determine versioning for each pageId
    //    - If pageId exists in existingPagesMap, version = existing version + 1
    //    - Else version = 1
    Object.values(newPagesData).forEach((pageObj) => {
      const existingPage = existingPagesMap[pageObj.pageId];
      if (existingPage && existingPage.version) {
        pageObj.version = Number(existingPage.version) + 1;
      } else {
        pageObj.version = 1;
      }
    });

    // 5) Update the in-memory settings (page_settings.json) 
    //    - If pageId already exists in settings.pages, we can either replace or maintain a history.
    //      For simplicity, we’ll update or add as a new entry for that pageId with the new version.
    //    - If you desire to keep multiple entries in page_settings.json for historical versions,
    //      you can modify this logic to push to an array, etc.

    // Create a quick map from settings.pages to update easily
    const settingsPagesMap = settings.pages.reduce((acc, page) => {
      acc[page.pageId] = page;
      return acc;
    }, {});

    Object.values(newPagesData).forEach((pageObj) => {
      settingsPagesMap[pageObj.pageId] = {
        pageId: pageObj.pageId,
        version: pageObj.version,
        fields: pageObj.fields
      };
    });

    // Flatten that map back to an array
    settings.pages = Object.values(settingsPagesMap);

    console.log(settings,"settings")
    // 6) Write to page_settings.json in GCS
    try {
      await dataManager.uploadOrUpdateJson(
        'esther_shop',
        'settings',
        'page_settings.json',
        settings,
        res.locals.plainCookie.user
      );
    } catch (error) {
      console.error('Error updating page_settings.json:', error);
      return res.status(500).send({ error: 'An error occurred while updating the page settings JSON' });
    }

    // 7) Finally, write these new/updated pages to BigQuery
    //    We do an 'add' operation which effectively inserts a new record for each new version.
    //    The unique key in BigQuery is typically pageId + version if needed. 
    //    But if the schema only uses pageId as the primary key, you may need to do an update
    //    with pageId as the key, or store a composite key. Example below shows we just do 'add', 
    //    so each new version is an insert.
    const bigQueryPromises = Object.values(newPagesData).map(async (pageObj) => {
      const { pageId, version, fields } = pageObj;
      const data = {
        pageId: [dataManager.generateUuid()],
        pageId_type: ['STRING'],
        title:[pageId],
        title_type:['STRING'],
        version: [version],
        version_type: ['INTEGER'],
      };
      // Convert page fields to BigQuery format
      Object.keys(fields).forEach((field) => {
        data[field] = [fields[field]];
        data[`${field}_type`] = ['STRING'];
      });

      try {
        console.log(data,"data")
        // If you are storing a composite key (pageId, version) in BigQuery, you may want to do:
        // await dataManager.modifyBigQueryTable('add', 'pages', data, /* 'pageId,version' or something similar */);
        await dataManager.modifyBigQueryTable('add', 'pages', data, 'pageId');
      } catch (error) {
        console.error(`Error upserting page ${pageId} version ${version} in BigQuery:`, error);
        throw error;
      }
    });

    try {
      await Promise.all(bigQueryPromises);
      return res.send({ success: true });
    } catch (error) {
      console.Console.log(error,"error")
      return res.status(500).send({ error: 'An error occurred while saving pages to BigQuery' });
    }
  });
});


app.get("/newuuid",(req,res,next)=>{
  res.send(dataManager.generateUuid())
});