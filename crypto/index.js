const CryptoJS = require("crypto-js");
function decrypt (transitmessage, pass) {
    try{
      //console.log("lePass","- - - - -"+pass+"- - - - -")
      //console.log("leTrans","- - - - -"+transitmessage+"- - - - -")
      var salt = CryptoJS.enc.Hex.parse(transitmessage.substr(0, 32));
      var iv = CryptoJS.enc.Hex.parse(transitmessage.substr(32, 32))
      var encrypted = transitmessage.substring(64);
      
      var key = CryptoJS.PBKDF2(pass, salt, {
          keySize: 256/32,
          iterations: 100
        });
    
      var decrypted = CryptoJS.AES.decrypt(encrypted, key, { 
        iv: iv, 
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC
        
      })
      //console.log("decrypt_pre_encode",decrypted)
      decrypted = decrypted.toString(CryptoJS.enc.Utf8);
      //decrypted = decrypted.toString();
      //console.log("decrypt_post_encode",decrypted)
      const decrOg = decrypted;

      //decrypted = decrypted.length>3?decrypted:"wrongpass";

      

        try {
            // Attempt to parse the decrypted data as JSON
            const parsed = JSON.parse(decrypted);
            // If parsing is successful, assign the parsed object back to decrypted
            decrypted = parsed;
        } catch (e) {
          decrypted = decrOg.length > 3 ? decrOg : "wrongpass";
            // If parsing fails, it means decrypted doesn't contain valid JSON,
            // so we keep its current value (or it has already been set to "wrongpass")
        }

      return decrypted;
  
    }catch(error){
      const obj = {"failed":"atdecrypt","err":error}
      return obj;
    }
    
   
  }



  function encrypt (msg, pass) {
    var salt = CryptoJS.lib.WordArray.random(128/8);
    
    var key = CryptoJS.PBKDF2(pass, salt, {
        keySize: 256/32,
        iterations: 100
      });
  
    var iv = CryptoJS.lib.WordArray.random(128/8);
    
    var encrypted = CryptoJS.AES.encrypt(msg, key, { 
      iv: iv, 
      padding: CryptoJS.pad.Pkcs7,
      mode: CryptoJS.mode.CBC
      
    });
    
    // salt, iv will be hex 32 in length
    // append them to the ciphertext for use  in decryption
    var transitmessage = salt.toString()+ iv.toString() + encrypted.toString();
    return transitmessage;
  }


  class crypt {
    constructor(){
        this.encrypt = encrypt;
        this.decrypt = decrypt;
    }
  }

  module.exports = crypt;