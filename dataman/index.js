const crypt = require("../crypto");
const crypto = new crypt();
const {BigQuery} = require('@google-cloud/bigquery');
const bigqueryClient = new BigQuery();
const adminEmail = 'nerdyjinnyas@gmail.com';

const { Storage } = require('@google-cloud/storage');
const fs = require('fs');
const fs2 = require('fs').promises;
const path = require('path');
const { JSDOM } = require('jsdom');
const TOKEN_PATH = path.join(__dirname, 'private', 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'private', 'credentials.json');
const { OAuth2Client } = require('google-auth-library');
//const gClientId = "984361836876-ss43mi45jc5c7udn1d0vd84go0gct1tc.apps.googleusercontent.com"
//const client = new OAuth2Client(gClientId);
const { google } = require('googleapis');
const axios = require("axios");
const storage = new Storage();



const projectId = 'ismizo';
const datasetId = 'esther_dataset';
const tableId = 'users';
const tableId2 = 'sessions';
const tableId3 = 'items';
const tableId4 = 'pages';
const TMP = '';


class dataMan {
    constructor(){

        this.parseHtmlContent = parseHtmlContent;
        this.updateHtmlPage = updateHtmlPage;
        this.checkPageItems = checkPageItems;
        this.uploadOrUpdateJson = uploadOrUpdateJson;
        this.createGmailDraft = createGmailDraft;
        this.updateGmailDraft = updateGmailDraft;
        this.sendGmailDraft = sendGmailDraft;
        this.deleteFileAndFolderIfNeeded = deleteFileAndFolderIfNeeded;
        this.generateUuid = generateUuid;
        this.createUser = createUser;
        this.getThisFile = getThisFile;
        this.getColumnNames = getColumnNames;
        this.getBigQueryRow = getBigQueryRow;
        this.updateBigQueryRow = updateBigQueryRow;
        this.modifyBigQueryTable = modifyBigQueryTable;
        this.checkAndUpdateArray = checkAndUpdateArray;
        this.uploadFilesToGCS = uploadFilesToGCS;
        this.getThisPageofData = getThisPageofData;
        this.searchWithCriteria = searchWithCriteria;
        
    }
  }


  function checkAndUpdateArray(data, data1) {
    const index = data1.indexOf(data);
    if (index !== -1) {
        data1.splice(index, 1);
        return { updatedArray: data1, status: true };
    } else {
        return { updatedArray: data1, status: false };
    }
}


async function uploadFilesToGCS(formidableFiles, prefix, bucketName,owner) {
  const promises = [];
  const fileNames = [];
  const numOfFiles = formidableFiles.fileInput?.length || formidableFiles.length


  // Iterate over the files in the formidable files object
  for (let i=0; i<numOfFiles;i++) {
    const file =  formidableFiles.fileInput? formidableFiles.fileInput[i]:formidableFiles[i];
    const existance = await checkOriginalNameInFolder(prefix,bucketName,file.originalFilename);
    const gcFilePath = prefix+"/"+ file.newFilename; // Using newFilename from Formidable
    const gcFile = storage.bucket(bucketName).file(gcFilePath);
  
      if (file && !existance) {
          

          // Define the storage file path with the prefix
      

          // Create a promise to handle the upload
          const promise = gcFile.save(fs.readFileSync(file.filepath), {
              metadata: {
                  contentType: file.mimetype,
                  metadata: {
                      originalName: file.originalFilename,
                      originalOwner: owner
                  }
              }
          }).then(() => {
              console.log(`File ${file.originalFilename} uploaded to ${gcFilePath}`);
          }).catch(error => {
              console.error(`Failed to upload ${file.originalFilename}:`, error);
          });

          promises.push(promise);
          fileNames.push(gcFilePath);

      }else{

          fileNames.push(existance)
        
        console.log("existing file, didn't upload")
      }
  }

  // Wait for all uploads to complete
  await Promise.all(promises);
  return fileNames;
}


async function checkOriginalNameInFolder(folderName, bucketName, originalFileName) {
  try {
      const files = await storage.bucket(bucketName).getFiles({ prefix: folderName });
      for (const file of files[0]) {
          const [metadata] = await file.getMetadata();
          if (metadata.metadata && metadata.metadata.originalName === originalFileName) {
              return metadata.name; // Match found
          }
      }
      return false; // No match found
  } catch (error) {
      console.error('Error checking original names:', error);
      throw error;
  }
}



  async function uploadOrUpdateJson(bucketName, folderName, fileName, jsonData,owner) {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(`${folderName}/${fileName}`);
    const exists = await file.exists();
  
    try {
        if (exists[0]) {
            // Update existing file
            await file.save(JSON.stringify(jsonData), {
                contentType: 'application/json',
                metadata: {
                    // You can set additional metadata here if needed
                    metadata:{ originalName: fileName,
                      originalOwner: owner}
                }
            });
            console.log('File updated successfully');
        } else {
            // Upload new file
            await bucket.file(`${folderName}/${fileName}`).save(JSON.stringify(jsonData), {
                contentType: 'application/json',
                metadata: {
                    // You can set additional metadata here if needed
                   metadata:{ originalName: fileName,
                    originalOwner: owner}
                }
            });
            console.log('File uploaded successfully');
        }
        return `${folderName}/${fileName}`;
    } catch (error) {
        console.error('An error occurred:', error);
        throw error;
    }
  }


  const deleteFileAndFolderIfNeeded = async (req, res) => {
    const filename = req.params.id ? req.params.id : req.params.itemId;
    const file = storage.bucket("grantman").file(filename);
  
    try {
        const [exists] = await file.exists();
        if (!exists) {
            return {"no":"file!"}
        }
  
        const [metadata] = await file.getMetadata();
        if (metadata.metadata.originalOwner !== res.locals.plainCookie.user) {
            return res.status(403).send({ error: "No permission to delete file" });
        }
  
        await file.delete();
        console.log(`File ${filename} deleted.`);
  
        // Check if the folder is empty
        /*const folderPath = filename.substring(0, filename.lastIndexOf('/'));
        const [files] = await storage.bucket("grantman").getFiles({ prefix: folderPath });
  
        if (files.length > 0) {
            // Delete the folder
            const folder = storage.bucket("grantman").file(folderPath);
            await folder.delete();
            console.log(`Folder ${folderPath} deleted.`);
        }*/
  
        //res.send({ message: "File and empty folder deleted successfully" });
        return { message: "File and empty folder deleted successfully" };
    } catch (error) {
        console.error("Error in deleteFileAndFolderIfNeeded:", error);
        res.status(500).send({ error: "Internal server error" });
    }
  };

  function generateUuid() {
    // Implementation of a simple UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  const createUser = async (googleBasicObj = {},req) => {
      // Fetch default permissions
      const prefix = req.headers.host?.includes("localhost")?"http://localhost:8080/":"https://";
      const response = await axios.get(prefix+'settings.json');
      const settings = response.data;
    
      // Extract default permissions based on userType
      const defaultPermissions = (userType) => {
        const permissions = settings.permissions[userType];
        return JSON.stringify(permissions);
      };
    
      const userPermissions = googleBasicObj.userType.includes("admin") ? defaultPermissions('admin') : defaultPermissions('normal');

      console.log(userPermissions,"userPermissions")
    
      // Define the user object with default permissions
      const user = {
        username: googleBasicObj.fname+"_"+googleBasicObj.lname,
        email: googleBasicObj.email,
        gooogleThumbnail: "",
        secret: googleBasicObj.secret,
        userType: googleBasicObj.userType,
        permissions: userPermissions
      };
    
      const query = `
        INSERT INTO \`${projectId}.${datasetId}.${tableId}\`
        (userId, username, email, createdAt, updatedAt, secret, userType, permissions)
        VALUES (@userId, @username, @email, @createdAt, @updatedAt, @secret, @userType, @permissions)
      `;
    
      const options = {
        // Specify a job configuration to set optional job resource properties.
        configuration: {
          query: {
            query: query,
            useLegacySql: false,
            parameterMode: "NAMED",
            queryParameters: [
              {
                "name": "userId",
                "parameterType": {
                  "type": "STRING"
                },
                "parameterValue": {
                  "value": generateUuid()
                }
              },
              {
                "name": "username",
                "parameterType": {
                  "type": "STRING"
                },
                "parameterValue": {
                  "value": user.username
                }
              },
              {
                "name": "email",
                "parameterType": {
                  "type": "STRING"
                },
                "parameterValue": {
                  "value": user.email
                }
              },
              {
                "name": "createdAt",
                "parameterType": {
                  "type": "TIMESTAMP"
                },
                "parameterValue": {
                  "value": new Date().toISOString()
                }
              },
              {
                "name": "updatedAt",
                "parameterType": {
                  "type": "TIMESTAMP"
                },
                "parameterValue": {
                  "value": new Date().toISOString()
                }
              },
              {
                "name": "secret",
                "parameterType": {
                  "type": "STRING"
                },
                "parameterValue": {
                  "value": user.secret
                }
              },
              {
                "name": "userType",
                "parameterType": {
                  "type": "STRING"
                },
                "parameterValue": {
                  "value": user.userType
                }
              },
              {
                "name": "permissions",
                "parameterType": {
                  "type": "JSON"
                },
                "parameterValue": {
                  "value": user.permissions
                }
              }
            ]
          },
          labels: { 'example-label': 'example-value' },
        },
      };
    
      return await doBigQueryJob(options);
    };



/**
 * Parses an HTML file and extracts elements with visible text, images, audio, or video content.
 * Optionally, filters by a specific custom "data-..." attribute.
 * @param {string} filePath - Path to the HTML file.
 * @param {string} [customTag] - Optional custom attribute suffix to filter elements (e.g., "custom" for "data-custom").
 * @returns {Promise<Array<Object>>} - An array of objects representing elements with relevant content.
 */
async function parseHtmlContent(filePath, customTag = null) {
    return new Promise((resolve, reject) => {
        const absolutePath = path.resolve(filePath);

        fs.readFile(absolutePath, 'utf-8', (err, data) => {
            if (err) {
                return reject(`Error reading file: ${err.message}`);
            }

            try {
                const dom = new JSDOM(data);
                const document = dom.window.document;
                const elements = [];
                const customAttribute = customTag ? `data-${customTag}` : null;

                // Helper function to add an element if it matches the criteria
                const addElement = (el, type, attributes) => {
                    if (!customAttribute || el.hasAttribute(customAttribute)) {
                        elements.push({
                            type,
                            tag: el.tagName.toLowerCase(),
                            id: el.id||null,
                            attributes: customAttribute ? { [customAttribute]: el.getAttribute(customAttribute) } : {},
                            ...attributes,
                        });
                    }
                };

                // Extract text content
                document.body.querySelectorAll('*').forEach((el) => {
                    const visibleText = el.textContent.trim();
                    if (visibleText && el.nodeName !== 'SCRIPT' && el.nodeName !== 'STYLE') {
                        addElement(el, 'text', { content: visibleText });
                    }
                });

                // Extract images
                document.querySelectorAll('img').forEach((img) => {
                    if (img.src) {
                        addElement(img, 'image', { src: img.src, alt: img.alt || null });
                    }
                });

                // Extract audio
                document.querySelectorAll('audio').forEach((audio) => {
                    if (audio.src) {
                        addElement(audio, 'audio', { src: audio.src });
                    }
                });

                // Extract video
                document.querySelectorAll('video').forEach((video) => {
                    if (video.src) {
                        addElement(video, 'video', { src: video.src });
                    }
                });

                // Extract links
                document.querySelectorAll('a').forEach((link) => {
                    if (link.href) {
                        addElement(link, 'link', { href: link.href, text: link.textContent || null });
                    }
                });

                resolve(elements);
            } catch (parseError) {
                reject(`Error parsing HTML: ${parseError.message}`);
            }
        });
    });
}




/**
 * Updates an HTML file based on an array of objects and returns the updated HTML.
 * @param {Array<Object>} elementsArray - Array of objects with updated values.
 * @param {string} filePath - Path to the HTML file.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @returns {void}
 */
function updateHtmlPage(elementsArray, filePath, req, res) {
    const absolutePath = path.resolve(filePath);

    fs.readFile(absolutePath, 'utf-8', (err, data) => {
        if (err) {
            return res.status(500).send(`Error reading file: ${err.message}`);
        }

        try {
            const dom = new JSDOM(data);
            const document = dom.window.document;

            elementsArray.forEach((el) => {
                const { tag, id, attributes, content, src, alt } = el;

                // Find the element by its ID
                const selector = id ? `#${id}` : null;
                const matchedElement = selector ? document.querySelector(tag + selector) : null;

                if (matchedElement) {
                    // Update based on the tag type
                    if (tag === 'img') {
                        // Update attributes for images
                        if (src) matchedElement.setAttribute('src', src);
                        if (alt) matchedElement.setAttribute('alt', alt);
                    } else if (tag === 'video' || tag === 'audio') {
                        // Update attributes for video/audio
                        if (src) matchedElement.setAttribute('src', src);
                        if (attributes) {
                            Object.entries(attributes).forEach(([attrName, attrValue]) => {
                                matchedElement.setAttribute(attrName, attrValue);
                            });
                        }
                    } else if (tag === 'text' || tag === 'p' || tag === 'span') {
                        // Update text content for text elements
                        if (content) matchedElement.textContent = content;
                    } else if (tag === 'link') {
                        // Update attributes for links
                        if (attributes) {
                            Object.entries(attributes).forEach(([attrName, attrValue]) => {
                                matchedElement.setAttribute(attrName, attrValue);
                            });
                        }
                        if (content) matchedElement.textContent = content;
                }
            }});

            //console.log("Data:", elementsArray);
            //console.log("Updated HTML:", dom.serialize());

            // Send updated HTML as response
            res.status(200).send(dom.serialize());
        } catch (updateError) {
            res.status(500).send(`Error updating HTML: ${updateError.message}`);
        }
    });
}




async function checkPageItems(data) {
 

    const query = `
        SELECT pageId, content
        FROM \`${projectId}.${datasetId}.${tableId4}\`
        WHERE pageId IN (${data.map(item => `'${item.id}'`).join(', ')})
    `;

    const advanceSearchValues =data.map((item) => {
        return { name: 'pageId', value: item.id, checked: true };
    });

    //console.log(advanceSearchValues,"advanceSearchValues");

    //console.log(query,"advanceSearchValuesToo");

    const [rows] = await searchWithCriteria({ tableId: tableId4, advanceSearchValues:advanceSearchValues, returnAll: true });

    const updatedData = typeof rows === 'undefined' ? data: data.map(item => {
        const row = rows.find(row => row.id === item.id);
        if (row) {
            return { ...item, content: row.content };
        } else {
            return null;
        }
    }).filter(item => item !== null);

    return updatedData;
}

const searchWithCriteria = async (searchObject) => {
    try {
      //console.log(searchObject," Iam re ceiving???")
      let whereClauses = [];
      let queryParameters = [];
      let orderByClause = '';
      let limitClause = "LIMIT 1000000000";
  
      // Fetching column names from the table
      const dataset = bigqueryClient.dataset(datasetId);
      const table = dataset.table(searchObject.tableId);
      const [metadata] = await table.getMetadata();
      const allColumns = metadata.schema.fields.filter(item => item.type === 'STRING').map(field=>field.name);
  
      let groupedCriteria = {};
      let index =0
      for (const criteria of searchObject.advanceSearchValues) {
        if (criteria.checked && criteria.value) {
          const parameterType = criteria.name === "stock" || criteria.name === "version"? "INTEGER" : "STRING";
          
          if (!groupedCriteria[criteria.name]) {
            groupedCriteria[criteria.name] = [];
          }
  
          if (Array.isArray(criteria.value)) {
            criteria.value.forEach((val, index) => {
              groupedCriteria[criteria.name].push({
                value: val,
                parameterName: `${criteria.name}${index}`,
                parameterType: parameterType
              });
            });
          } else {
            groupedCriteria[criteria.name].push({
              value: criteria.value,
              parameterName: `${criteria.name}${index}`,
              parameterType: parameterType
            });
            index++;
          }
        }
  
        if ((criteria.start || criteria.start == 0) && criteria.end) {
          const parameterType = criteria.name === "stock" || criteria.name === "version" ? "INTEGER" : "TIMESTAMP";
  
          whereClauses.push(`${criteria.name} BETWEEN @start${criteria.name} AND @end${criteria.name}`);
          queryParameters.push(
            {
              name: `start${criteria.name}`,
              parameterType: { type: parameterType },
              parameterValue: { value: criteria.start }
            },
            {
              name: `end${criteria.name}`,
              parameterType: { type: parameterType },
              parameterValue: { value: criteria.end }
            }
          );
        }
      }
  
      Object.keys(groupedCriteria).forEach(key => {
        let orConditions = groupedCriteria[key].map(crit => {
          queryParameters.push({
            name: crit.parameterName,
            parameterType: { type: crit.parameterType },
            parameterValue: { value: crit.value }
          });
          return `${key} = @${crit.parameterName}`;
        });
  
        whereClauses.push(`(${orConditions.join(' OR ')})`);
      });
  
    if (searchObject.basicSearch && Array.isArray(allColumns) && allColumns.length > 0) {
      const words = searchObject.basicSearch.split(' ').filter(word => word.length > 0);
      
      // Outermost AND clause to ensure all words are found
      const allWordsFoundClauses = words.map((word, index) => {
          // Inner OR clause to allow each word to be found in any column
          const wordFoundInAnyColumnClauses = allColumns.map(columnName => 
              `LOWER(${columnName}) LIKE LOWER(@word${index})`
          ).join(' OR ');
          
          return `(${wordFoundInAnyColumnClauses})`;
      }).join(' AND ');
      
      whereClauses.push(`(${allWordsFoundClauses})`);
      
      words.forEach((word, index) => {
          queryParameters.push({
              name: `word${index}`,
              parameterType: { type: "STRING" },
              parameterValue: { value: `%${word}%` }
          });
      });
    }
  
  
  
      let whereStatement = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      
      let newOrder = "";
      let orderBy = "";
      if(searchObject.tableId==="items" && !searchObject.sortBy ){
        newOrder="updatedAt ASC,";
        orderBy = "name"
      }else{
        newOrder = "createdAt";
      }
  
      if (searchObject.sortBy&&searchObject.sortBy!='default') {
        const orderType = searchObject.orderType?.toLowerCase() === 'descending' ? 'DESC' : 'ASC';
        orderByClause = `ORDER BY ${searchObject.sortBy} ${orderType}`;
      }else if(searchObject.sortBy==='default'){
        orderByClause = `ORDER BY createdAt ASC`;
      }else{
        const orderType = searchObject.orderType?.toLowerCase() === 'descending' ? 'DESC' : 'ASC';
        orderByClause = `ORDER BY ${newOrder} ${orderBy} ${orderType}`;
      }
  
      const query = `SELECT * FROM \`${projectId}.${datasetId}.${searchObject.tableId}\` ${whereStatement} ${orderByClause} ${limitClause}`;
      //console.log("query",query)
      //onsole.log(whereStatement,"wherr")
      //console.log(whereStatement.length,"wherr")
      const options = {
        configuration: {
          query: {
            query: query,
            useLegacySql: false,
            parameterMode: "NAMED",
            queryParameters: queryParameters
          },
          labels: { 'example-label': 'example-value' }
        }
      };
  
      if(whereStatement.length===0&&!searchObject.returnAll){
        return []
      }else{
        const results = await doBigQueryJob(options);
        return results;
      }
  
    } catch (e) {
      console.log(e);
      return e;
    }
    };




    async function createGmailDraft(msg,res) {
      try {
        const url = `https://www.googleapis.com/upload/gmail/v1/users/${adminEmail}/drafts`;
        const oAuth2Client = await getOauth2Client();
        const { token } = await oAuth2Client.getAccessToken();
        const config = {
          method: "post",
          url: url,
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-type": "message/rfc822",
          },
          data: {
            "message": {
                    "raw": msg
              }
            }
          }
        const x = axios(config).then((response) => {
                      return response.data;
                    }).catch((error) => {
                      console.log(error.response.data);
                      return(error.response.data);
                    });
        return x;
      } catch (error) {
        console.log(error);
        res.send(error);
      }
    }

    const updateGmailDraft = async (url, rawMessage) => {
      const oAuth2Client = await getOauth2Client();
      const { token } = await oAuth2Client.getAccessToken();
      const base64Email = Buffer.from(rawMessage).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
      try {
        const config = {
          method: 'PUT',
          url: url, // Make sure this URL is the correct endpoint for updating drafts
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: {
            message: {
              raw: base64Email, // Your base64 encoded email
            }
          }
        };
        const response = await axios(config);
    
        // Handle the response however you like
        //console.log("Draft updated: ", response.data);
        
        return response.data;
      } catch (error) {
        console.error("Error in updating draft: ", error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Data: ", error.response.data);
          //console.error("Status: ", error.response.status);
          //console.error("Headers: ", error.response.headers);
          //console.log("newErr",error.errors[0])
        }
    
        return null;
      }
    };

    const sendGmailDraft = async (url, draftId) => {
      const oAuth2Client = await getOauth2Client();
      const { token } = await oAuth2Client.getAccessToken();
      
      try {
        const config = {
          method: 'POST',
          url: url, // This should be the URL for sending drafts in Gmail API
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: {
            id: draftId,  // ID of the draft you want to send
          }
        };
    
        const response = await axios(config);
    
        // Handle the response however you like
        //console.log("Draft sent: ", response.error);
        
        return response.data;
    
      } catch (error) {
        //console.error("Error in sending draft: ", error);
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.error("Data N89: ", error.response.data.error);
          //console.error("Status: ", error.response.status);
          //console.error("Headers: ", error.response.headers);
          //console.log("newErr",error.errors)
        }
    
        return error;
      }
    };


    const getThisFile = async (req, res, next, internal = false) => {
      const filename = req.params.id ? req.params.id : req.params.itemId;
      const file = storage.bucket("esther_shop").file(filename);
    
      let exists = await file.exists();

      
    
      if (exists[0]) {
        // File exists in main location
        const meta = await file.getMetadata().then(function (data) {
          const metadata = data[0];
          return metadata;
        });
    
        const tableId = filename.split("/")[0];
        const itemId = filename;
        const status = filename.includes("profile-picture") || filename.includes("settings/")|| filename.includes("temp/") 
          ? "check_owner"
          : await getBigQueryRow(tableId, itemId, "status").then(e => { return e.response[0]?.status || e.response });

          
    
        if (meta.metadata.originalOwner === res.locals.plainCookie.user || res.locals.plainCookie.userType.includes("admin") || (status === "published") || filename.includes("settings/")|| filename.includes("temp/")) {
          const fileData = await file.download().then(function (data) {
            const contents = data[0];
            return contents;
          }).catch(e => {
            console.log(e);
          });
    
          if (internal) {
            try {
              // Attempt to parse the file data as JSON
              const jsonData = JSON.parse(fileData.toString());
              return jsonData;
            } catch (e) {
              // If parsing fails, return "file not JSON"
              return "file not JSON";
            }
          } else {
            const originalName = meta.metadata.originalName;
            const contentType = meta.contentType;
            const extension = `.${contentType.split("/")[1]}`;
    
            let finalFilename;
            if (originalName.toLowerCase().endsWith(extension.toLowerCase())) {
              finalFilename = originalName;
            } else {
              finalFilename = originalName + extension;
            }
    
            res.set('Content-Disposition', `inline; filename="${finalFilename}"`);
            res.contentType(contentType);
            res.send(fileData);
          }
    
        } else {
          res.send({ "no": "permission!" });
        }
        
    
      } else {
        // File does not exist in original location
        // Attempt to fetch from dummyTemplates folder
        
        const lastSegment = filename.split("/").pop();
      
        const dummyFile = storage.bucket("esther_shop").file(`settings/${lastSegment}`);
        const dummyExists = await dummyFile.exists();
        
    
        if (dummyExists[0]) {
          // Dummy file found
          const dummyData = await dummyFile.download().then(data => data[0]).catch(e => console.log(e));
    
          const meta = await dummyFile.getMetadata().then(function (data) {
            const metadata = data[0];
            return metadata;
          });
    
          if (internal) {
            try {
              const jsonData = JSON.parse(dummyData.toString());
              return jsonData;
            } catch (e) {
              return "file not JSON";
            }
          } else {
            // Assume dummy templates are JSON files for simplicity
            const contentType = meta.contentType;
            const extension = `.${contentType.split("/")[1]}`;
    
            res.set('Content-Disposition', `inline; filename="${lastSegment+"."+extension}"`);
            res.contentType(contentType);
            res.send(dummyData);
          }
        } else {
          // Not found in dummyTemplates either
          if (internal) {
            return { "no": "file!" }
          } else {
            res.send({ "no": "file!" });
          }
        }
      }
    };

    async function getThisPageofData(data,pNo,orderBy,orderType,pagesize){
        
          try{
            const pageS = pagesize;
        const retObj = {};
        let orderAsc = orderType.toLowerCase() === 'descending' ? 'DESC' : 'ASC';
        //const testDeets = await carTab.getMetadata();
        const dataset = bigqueryClient.dataset(datasetId);
        const table = dataset.table(data);
        const [metadata] = await table.getMetadata();
        retObj.numOfItems = metadata.numRows;
        retObj.pageOffset = (pNo-1)*pageS;
        retObj.totalPages = retObj.numOfItems%pageS>0?(retObj.numOfItems/pageS)+1:retObj.numOfItems/pageS;
        retObj.totalPages = parseInt(retObj.totalPages,10);
        
        if(retObj.pageOffset<retObj.numOfItems){
          
        }else{
          //console.log(retObj,"retObj")
          throw makeErrorResponse({"Last page is":retObj.totalPages},'Page Number Error');
        }
        retObj.currentPage = pNo;
        retObj.pagesize = pageS
       
        
    
        retObj.orderType = orderAsc;
        retObj.orderBy = orderBy;
        const rowQuer2 =`SELECT * FROM ${projectId}.${datasetId}.${data}
          ORDER BY  ${orderBy} ${orderAsc} LIMIT ${pageS} OFFSET @pageOffset`
      
        const options2 = {
          // Specify a job configuration to set optional job resource properties.
          configuration: {
            query: {
              query: rowQuer2,
              useLegacySql: false,
              parameterMode:"NAMED",
              queryParameters:[{
                "name": "pageOffset",
                "parameterType": {
                  "type":"INTEGER"
                },
                "parameterValue": {
                  "value":retObj.pageOffset
                }
              }
            ]
            },
            labels: {'example-label': 'example-value'},
            
          },
        };
        const rows = await doBigQueryJob(options2);
        //console.log(rows,"retObj22333")
        return { success: true, response: rows, info: retObj };
          }catch(e){
            return e;
          }
      }

    async function getBigQueryRow(tableId, rowId, columnName = null, idColumnName = 'id') {
      try {
          let query;
          if (columnName) {
              // Retrieve specific column value from a row
              query = `SELECT ${columnName} FROM \`${datasetId}.${tableId}\` WHERE ${idColumnName} = @rowId;`;
          } else {
              // Retrieve entire row
              query = `SELECT * FROM \`${datasetId}.${tableId}\` WHERE ${idColumnName} = @rowId;`;
          }
    
          const queryParameters = [{
              name: 'rowId',
              parameterType: { type: 'STRING' }, // Adjust the type accordingly
              parameterValue: { value: rowId }
          }];
    
          const options = {
              configuration: {
                  query: {
                      query: query,
                      useLegacySql: false,
                      parameterMode: "NAMED",
                      queryParameters: queryParameters
                  }
              }
          };
    
          const rows = await doBigQueryJob(options);
          return { success: true, response: rows };
      } catch (error) {
          console.error('An error occurred:', error);
          return { error: 'An error occurred while retrieving the row' };
      }
    }


    async function updateBigQueryRow(tableId, rowId, data, searchColumn = null) {
    try {
        const updateColumns = Object.keys(data).filter(key => !key.includes('_type'));
        const updateSetClauses = updateColumns.map(key => `${key} = @${key}`);
        
        let whereClause = '';
        let searchParam = {};
  
        // If a searchColumn is provided, use it for the WHERE clause instead
        if (searchColumn && typeof searchColumn === 'object') {
            const searchColumnName = Object.keys(searchColumn)[0];
            whereClause = `${searchColumnName} = @searchValue`;
            searchParam = {
                name: 'searchValue',
                parameterType: { type: searchColumn[`${searchColumnName}_type`] },
                parameterValue: { value: searchColumn[searchColumnName].value }
            };
        }else{
          whereClause = 'id = @id';
          searchParam = {
              name: 'id',
              parameterType: { type: 'STRING' }, // Assuming 'id' is of type STRING
              parameterValue: { value: rowId }
          };

        }
  
        const updateQuery = `UPDATE \`${datasetId}.${tableId}\` SET ${updateSetClauses.join(', ')} WHERE ${whereClause};`;


        
  
        const queryParameters = updateColumns.map(key => ({
            name: key,
            parameterType: { type: data[`${key}_type`] },
            parameterValue: { value: data[key].value }
        }));
  
        queryParameters.push(searchParam);

  
        const updateOptions = {
            configuration: {
                query: {
                    query: updateQuery,
                    useLegacySql: false,
                    parameterMode: "NAMED",
                    queryParameters: queryParameters
                }
            }
        };
  
        // Execute the update query
        const res1 = await doBigQueryJob(updateOptions);
        // Select the id of the updated row
        const selectQuery = `SELECT * FROM \`${datasetId}.${tableId}\` WHERE ${whereClause};`;

        
  
        const selectOptions = {
            configuration: {
                query: {
                    query: selectQuery,
                    useLegacySql: false,
                    parameterMode: "NAMED",
                    queryParameters: [searchParam]
                }
            }
        };
  
        const rows = await doBigQueryJob(selectOptions);
  
        if (rows && rows.length > 0) {

          let obj = {};
          if(tableId==="users"){
              obj.email = rows[0].email
              obj.username = rows[0].username
              obj.userType = rows[0].userType
          }else{
              obj = rows
          }

            return { success: true, ogRes:res1, id: obj };
        } else {
            return { error: 'No rows found' };
        }
    } catch (error) {
        console.error('An error occurred:', error);
        return { error: 'An error occurred while updating the row',rowId,tableId };
    }
  }

  async function modifyBigQueryTable(action, tableId, data, idColumn = 'id') {
    try {
      let query = '';
      let queryParameters = [];
      const columns = Object.keys(data).filter(key => !key.endsWith('_type'));
      const updateColumns = Object.keys(data).filter(key => !key.endsWith('_type') && key !== idColumn);
  
      switch (action) {
        case 'add':
          let createdDate = new Date().toISOString().split('T')[0];
          let addCreatedDate = false;
  
          if (!columns.includes('createdAt')) {
            columns.push('createdAt');
            addCreatedDate = true;
          }
  
          query = `INSERT INTO \`${datasetId}.${tableId}\` (${columns.join(', ')}) VALUES (${columns.map((_, i) => `@param${i}`).join(', ')});`;
  
          queryParameters = columns.map((key, i) => {
            if (key === 'createdAt' && addCreatedDate) {
              return {
                name: `param${i}`,
                parameterType: { type: 'STRING' },
                parameterValue: { value: createdDate },
              };
            } else {
              return {
                name: `param${i}`,
                parameterType: { type: data[`${key}_type`][0] },
                parameterValue: { value: data[key][0] },
              };
            }
          });
          break;
  
        case 'update':
          const updateSetClauses = updateColumns.map(key => `${key} = @${key}`);
          query = `UPDATE \`${datasetId}.${tableId}\` SET ${updateSetClauses.join(', ')} WHERE ${idColumn} = @${idColumn};`;
          queryParameters = updateColumns.map(key => ({
            name: key,
            parameterType: { type: data[`${key}_type`][0] },
            parameterValue: { value: data[key][0] },
          }));
          queryParameters.push({
            name: idColumn,
            parameterType: { type: data[`${idColumn}_type`][0] },
            parameterValue: { value: data[idColumn][0] },
          });
          break;
  
        case 'delete':
          query = `DELETE FROM \`${datasetId}.${tableId}\` WHERE ${idColumn} = @${idColumn};`;
          queryParameters = [{
            name: idColumn,
            parameterType: { type: data[`${idColumn}_type`][0] },
            parameterValue: { value: data[idColumn][0] },
          }];
          break;
  
        default:
          throw new Error('Invalid action');
      }
  
      const options = {
        configuration: {
          query: {
            query: query,
            useLegacySql: false,
            parameterMode: "NAMED",
            queryParameters: queryParameters,
          },
          labels: { 'example-label': 'example-value' },
        },
      };
  
      await doBigQueryJob(options);
  
      let fetchQuery = '';
      const sort2 = "name";
      switch (action) {
        case 'add':
          fetchQuery = `SELECT * FROM \`${datasetId}.${tableId}\` WHERE ${columns.map((col, i) => `${col} = @param${i}`).join(' AND ')} ORDER BY ${idColumn} DESC LIMIT 1;`;
          break;
        case 'update':
          fetchQuery = `SELECT * FROM \`${datasetId}.${tableId}\` WHERE ${updateColumns.map((col, i) => `${col} = @${col}`).join(' AND ')} ORDER BY ${sort2} ASC LIMIT 1;`;
          break;
        case 'delete':
          return { success: true, id: data[idColumn][0] };
      }
  
      const fetchOptions = {
        configuration: {
          query: {
            query: fetchQuery,
            useLegacySql: false,
            parameterMode: "NAMED",
            queryParameters: queryParameters,
          },
        },
      };
  
      const fetchRows = await doBigQueryJob(fetchOptions);
      if (fetchRows && fetchRows.length > 0) {
        return { success: true, id: fetchRows[0] };
      } else {
        return { error: 'No rows found' };
      }
  
    } catch (error) {
      console.error('An error occurred:', error);
      return { error: 'An error occurred while modifying the table' };
    }
  }
  


    async function getColumnNames(tableId) {
        try {
          // Initialize BigQuery client
          const bigquery = new BigQuery();
      
          // Get table metadata
          const dataset = bigquery.dataset(datasetId);
          const table = dataset.table(tableId);
          const [metadata] = await table.getMetadata();
      
          // Extract and return column names and types
          const dataBaseInfo = {};
          const columnInfo = metadata.schema.fields.map(field => ({
            name: field.name,
            type: field.type
          }));
    
          dataBaseInfo.columns = columnInfo;
          dataBaseInfo.name = tableId;
          dataBaseInfo.numOfRows = metadata.numRows;
      
          return dataBaseInfo;
      
        } catch (error) {
          console.error(`Error fetching column information: ${error}`);
          throw error;
        }
      }


    async function getOauth2Client() {
        try {
          const credRes = await credentials(); // Assuming this function is correctly fetching the credentials
          //const { client_id, client_secret, redirect_uri, refresh_token } = credRes.installed;
          //console.log("credRes",credRes)
      
          const oAuth2Client = new google.auth.OAuth2(credRes.currToken.client_id, credRes.currToken.client_secret, credRes.webCred.web.redirect_uris);
      
          // Check if we have a valid access_token, if not, get a new one using the refresh_token
          if (!oAuth2Client.credentials.access_token) {
            if (credRes.currToken.refresh_token) {
              const refresh_token = credRes.currToken.refresh_token;
              oAuth2Client.setCredentials({ refresh_token });
              const newTokens = await oAuth2Client.refreshAccessToken(); // This will throw an error if the refresh fails
              oAuth2Client.setCredentials(newTokens.credentials); // It contains both access and refresh tokens
            } else {
              throw new Error('No refresh token is set.');
            }
          }
      
          return oAuth2Client;
      
        } catch (error) {
          console.error('Error in getOauth2Client:', error);
          throw error; // rethrowing the error after logging it, you can also return error data if you prefer
        }
      }
      
      
      const credentials =async()=>{
        const obj = {}
        obj.webCred = JSON.parse(await fs2.readFile(CREDENTIALS_PATH));
        obj.currToken = JSON.parse(await fs2.readFile(TOKEN_PATH));
        return obj;
      }


    const doBigQueryJob =async (options)=>{
        const job = await bigqueryClient.createJob(options);
        const rows = await job[0].getQueryResults();
        return rows[0];
      }




module.exports = dataMan;