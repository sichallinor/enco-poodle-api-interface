'use strict';

//var poodleCrudInterface = require('enco-poodle-crud-interface');
//var poodleCrudInterface = require('../REPO_TDR_ENCO_POODLE_CRUD_INTERFACE/index.js');
//import poodleCrudInterface from '../REPO_TDR_ENCO_POODLE_CRUD_INTERFACE/index';
import poodleCrudInterface from 'enco-poodle-crud-interface';

//var poodleDavInterface = require('enco-poodle-dav-interface');
//var poodleDavInterface = require('../REPO_TDR_ENCO_POODLE_DAV_INTERFACE/index.js');
//import poodleDavInterface from '../REPO_TDR_ENCO_POODLE_DAV_INTERFACE/index';
import poodleDavInterface from 'enco-poodle-dav-interface';

//var poodleStoreInterface = require('');
//var poodleStoreInterface = require('./services/ApiService_LocalStorage.js');
import poodleStoreInterface from './services/ApiService_LocalStorage';



//module.exports =  {
export default {

//================================================================================

    // NEW V2 CLEAN FUNCTIONS (SPECIFIC INTERFACE LOGIC IS DELEGATED TO THE INTERFACE SERVICE)

    // NOTE : KEEP IT SIMPLE ... NOT COMPLETE IN THIS LAYER YET !!!!!!
    // NOTE : PURPOSE OF THIS LAYER IS 
    //        1) TO ACT AS A SINGLE INTERFACE FOR MULTIPLE APIS 
    //        2) FORWARD MODES AS INPUT TO THE RESPECTIVE APIS
    //        3) AGGREATE DATA FROM DIFFERENT APIS 
    //
    // NOTE : THIS CLASS UNDERSTANDS APIS AND WHAT TO SEND - BUT IT DOES NOT UNDERSTAND ANY SERVICE SPECIFIC LOGIC
    // NOTE : THE SERVICE CLASSES UNDERSTAND THEIR OWN LOGIC - BUT THEY DO NOT UNDERSTAND MODE  

//================================================================================




    getInterface(mode){
        if(mode.apitype==="localstorage"){
            // LOCAL STORAGE
            return poodleStoreInterface;
        }else if(mode.apitype==="phpcrud" || mode.apitype==="labrador"){
            return poodleCrudInterface;
        }else if(mode.apitype==="caldav" || mode.apitype==="carddav"){
            return poodleDavInterface;
        }
        console.log("ERROR : NO APITYPE FOUND")
        return null;
    },



    authenticateIfNecessary(mode){
        var interF = this.getInterface(mode);
        if(interF) return interF.authenticateIfNecessary(mode);
        return null;
    },

    authenticateWithEmailPassword(mode){
        var interF = this.getInterface(mode);
        if(interF) return interF.authenticateWithEmailPassword(mode);
        return null;
    },

    loginCheck(mode){
        var interF = this.getInterface(mode);
        if(interF) return interF.loginCheck(mode);
        return null;
    },

    logout(mode){
        var interF = this.getInterface(mode);
        if(interF) return interF.logout(mode);
        return null;
    },

    register(mode){
        var interF = this.getInterface(mode);
        if(interF) return interF.register(mode);
        return null;
    },


    setActivity(mode,activityType,value){
        if(!mode.hasOwnProperty('activity')) mode['activity'] = {}
        mode.activity[activityType] = value;
    },


    getItems(mode=null) {
        var self = this;
        var promises = [];

        this.setActivity(mode,'is_reading',true)

        if( mode.mode_type==='items_aggregator' && mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.getItems(childMode);
                if(prom) promises.push(prom);
            }
        }
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='items' || !mode.hasOwnProperty('mode_type')){
                console.log("items...")
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.getItems(mode);
                if(prom) promises.push(prom);
            }
        }catch(err){
            console.log("ERROR : ",err);

            this.setActivity(mode,'is_reading',false)
            return null;
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {

                    // AGREGATOR ... 
                    if( mode.mode_type==='items_aggregator' && mode.hasOwnProperty('modes') ){
                        mode.aggregateChildrensData();
                    }

                    self.setActivity(mode,'is_reading',false)

                    if(values.length===1) {
                        resolve(values[0]) // resolve with the result of a single promise
                    }else{
                        resolve(values); // resolve with an array of all the results from all the promises
                    }
       
                }).catch(error => { 
                    if(error && error.message){
                        console.log("API ERROR GETTING DATA : ",error.message)
                    }else{
                        console.log("API ERROR GETTING DATA")
                    }

                  self.setActivity(mode,'is_reading',false)
                  reject();
                });
            });
        }else{
            self.setActivity(mode,'is_reading',false)
            return null;
        }

    },


    getItem(mode=null) {
        //return this.getInterface(mode).getItem(mode);

        var self = this;
        var promises = [];

        //mode['is_reading']=true;
        self.setActivity(mode,'is_reading',true)

        if( mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.getItem(childMode);
                if(prom) promises.push(prom);
            }
        }
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='model' || !mode.hasOwnProperty('mode_type') ){
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.getItem(mode);
                if(prom) promises.push(prom);
            }
        }catch(err){
            console.log("ERROR : ",err);
            mode['is_reading']=false;
            return null;
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {
                    //self.aggregateChildrensData(mode);
                    self.setActivity(mode,'is_reading',false)
                    resolve(values);        
                }).catch(error => { 
                  console.error(error.message)
                  //mode['is_reading']=false;
                  self.setActivity(mode,'is_reading',false)
                  reject();
                });
            });
        }else{
            //mode['is_reading']=false;
            self.setActivity(mode,'is_reading',false)
            return null;
        }

    },



    // UPDATE OF THE PRIMARY MODEL
    updateItem(mode=null) {
        console.log("updateItem (API) : starting for mode_ref : ",mode.reference);
        //return this.getInterface(mode).updateItems(mode);
        
        var self = this;
        var promises = [];
        /*
        if( mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.updateItem(childMode);
                if(prom) promises.push(prom);
            }
        
        */
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='items' || !mode.hasOwnProperty('mode_type')){
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.updateItem(mode);
                // IF A PROMISE HAS BEEN RETURNED ... ADD IT
                // HOWEVER THE updateItems FUNCTION MAY RETURN NULL (nothing to do)
                if(prom) promises.push(prom);

            }
        }catch(err){
            console.log("ERROR : UPDATING ",err.message,mode);
            //throw "ERROR : UPDATING ITEMS";
            //return null
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {
                    if(values.length===1) {
                        resolve(values[0])
                    }else{
                        resolve(values)
                    }
                }).catch(error => { 
                  console.error(error.message)
                  reject();
                });
            });
        }else{
            return null;
        }

    },
    // FOR BULK UPDATES (NORMALLY STORED IN "models_bulk")
    updateItems(mode=null) {
        //return this.getInterface(mode).updateItems(mode);
        var self = this;
        var promises = [];
        /*
        if( mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.updateItems(childMode);
                if(prom) promises.push(prom);
            }
        }*/
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='items' || !mode.hasOwnProperty('mode_type')){
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.updateItems(mode);
                // IF A PROMISE HAS BEEN RETURNED ... ADD IT
                // HOWEVER THE updateItems FUNCTION MAY RETURN NULL (nothing to do)
                if(prom) promises.push(prom);
            }
        }catch(err){
            console.log("ERROR : UPDATING ",err.message,mode);
            //throw "ERROR : UPDATING ITEMS";
            //return null
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {
                    resolve(values);
                }).catch(error => { 
                  console.error(error.message)
                  reject();
                });
            });
        }else{
            return null;
        }

    },

    createItem(mode=null) {
        //return this.getInterface(mode).createItem(mode);

        var self = this;
        var promises = [];

        /*
        if( mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.createItem(childMode);
                if(prom) promises.push(prom);
            }
        }*/
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='items' /*|| !mode.hasOwnProperty('mode_type')*/){
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.createItem(mode);
                // IF A PROMISE HAS BEEN RETURNED ... ADD IT
                // HOWEVER THE updateItems FUNCTION MAY RETURN NULL (nothing to do)
                if(prom) promises.push(prom);
            }
        }catch(err){
            console.log("ERROR : CREATING ",err.message,mode);
            //throw "ERROR : UPDATING ITEMS";
            //return null
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {
                    resolve(values);
                }).catch(error => { 
                  console.error(error )
                  reject();
                });
            });
        }else{
            return null;
        }

    },
    // FOR BULK UPDATES (NORMALLY STORED IN "models_bulk")
    createItems(mode=null) {
        //return this.getInterface(mode).updateItems(mode);
        var self = this;
        var promises = [];
        if( mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.createItems(childMode);
                if(prom) promises.push(prom);
            }
        }
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='items' /*|| !mode.hasOwnProperty('mode_type')*/){
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.createItems(mode);
                // IF A PROMISE HAS BEEN RETURNED ... ADD IT
                // HOWEVER THE updateItems FUNCTION MAY RETURN NULL (nothing to do)
                if(prom) promises.push(prom);
            }
        }catch(err){
            console.log("ERROR : CREATING ",err.message,mode);
            //throw "ERROR : UPDATING ITEMS";
            //return null
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {
                    resolve(values);
                }).catch(error => { 
                  console.error(error.message)
                  reject();
                });
            });
        }else{
            return null;
        }

    },


    deleteItem(mode=null) {
        //return this.getInterface(mode).deleteItem(mode);


        var self = this;
        var promises = [];
        if( mode.hasOwnProperty('modes') ){
            // ---------------------------------------
            // get a promise from each child mode
            for(var i=0; i<mode.modes.length; i++){
                var childMode = mode.modes[i];
                var prom = this.deleteItem(childMode);
                if(prom) promises.push(prom);
            }
        }
        // ---------------------------------------
        // and get a promise from this parent mode
        try{
            if(mode.mode_type==='items' /*|| !mode.hasOwnProperty('mode_type')*/){
                var prom = null;
                var interF = this.getInterface(mode);
                if(interF) prom = interF.deleteItem(mode);
                // IF A PROMISE HAS BEEN RETURNED ... ADD IT
                // HOWEVER THE updateItems FUNCTION MAY RETURN NULL (nothing to do)
                if(prom) promises.push(prom);
            }
        }catch(err){
            console.log("ERROR : CREATING ",err.message,mode);
            //throw "ERROR : UPDATING ITEMS";
            //return null
        }
        
        if(promises.length>0){
            // ---------------------------------------
            // execute all promises
            return new Promise(function(resolve, reject) {
                Promise.all(promises).then(function(values) {
                    resolve(values);
                }).catch(error => { 
                  console.error(error.message)
                  reject();
                });
            });
        }else{
            return null;
        }

    }


}