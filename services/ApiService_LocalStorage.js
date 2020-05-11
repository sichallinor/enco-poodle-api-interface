'use strict';


//----------------
// POODLE-MODE IN DEV MODE
//var Mode = require('enco-poodle-mode');
//var Mode = require('../../REPO_TDR_ENCO_POODLE_MODE/index.js');
//import { Mode } from '../../REPO_TDR_ENCO_POODLE_MODE/index';
//import { Mode } from '../../REPO_TDR_ENCO_POODLE_MODE/index';

//----------------
// POODLE-UTILS IN DEV MODE
import poodleUtils from 'enco-poodle-utils';


//module.exports =  {
export default {



    debug : true,

    mode : null,

    default_mode : { 
                    // API MODE PROPERTIES
                    apitype : null,
                    urlbase : null,
                    urlpath : null,
                    port : 80,

                    // REQUEST
                    search_phrase : null,
                    context : null,
                    identity : null,

                    // RESULT : ITEMS
                    items : [],
                    // RESULT : MODEL
                    models : [],

                    schemas : []
                },


    alterMode(mode){
        if(this.mode){
            this.mode = Object.assign(this.mode, mode);
        }else{
            this.mode = mode;
        }
        if(this.debug) console.log("MODE ALTERED TO : ", this.mode);
        return this.mode;
    },
    setMode(mode){
        this.mode = mode;
        if(this.debug) console.log("MODE SET AS : ", this.mode);
    },	
    getMode(){
    	return this.mode;
    },

    requireModePropertiesOrError(arr){
        if(this.debug)  console.log("requireModePropertiesOrError");
    	var mode = this.getMode();
    	var missing = [];
    	for(var i=0; i<arr.length; i++){
    		if(!mode.hasOwnProperty(arr[i]) || mode[arr[i]]===null ){
    			missing.push(arr[i]);
    		}
    	}
    	if(missing.length>0){
            //throw "ERROR : MODE IS MISSING PROPS : " + missing;
    		console.log("ERROR : MODE IS MISSING PROPS : ",missing);
            //throw "ERROR : MODE IS MISSING PROPS : " + missing;
    		return false
    	}


    	return true;
    },

    getItems(mode=null) {
        var self = this;
    	if(mode) this.setMode(mode)
    	mode = this.getMode();
    	//------------------------

        var destiation_arr = mode.items;

        // STORE REFERENCES
        //var schema = (mode.schemas && mode.schemas.length>0) ? mode.schemas[0] : null;

        if(this.debug)  console.log("getItems");


        return new Promise(function(resolve, reject) {

            destiation_arr.length = 0; // TO EMPTY THE ARRAY

            // LOOP EVERYTHING IN LOCALSTORAGE AND PLACE INTO THE ITEMS
            for (var prop in localStorage){
                var jstr = localStorage.getItem(prop);
                try{
                    var jobj = JSON.parse(jstr)
                    //set as not DIRTY (saved)
                    self.setCompleteHierarchyNotDirty(jobj)

                    destiation_arr.push(jobj);
                }catch(ex){
                }
            }

            console.log("getItems : RESULT : ",destiation_arr.length)

            resolve();

        });


    },

    getItem(mode=null) {

    },

    updateItem(mode=null) {
        console.log("updateItem (LOCAL) : starting for mode_ref : ",mode.reference);
        return this.storeItem(mode);
    },
    updateItems(mode=null) {

    },

    createItem(mode=null) {
        console.log("createItem : starting for mode_ref : ",mode.reference);
        return this.storeItem(mode);
    },

    storeItem(mode=null){
        var self = this;
        if(mode) this.setMode(mode)
        mode = this.getMode();
        //------------------------
        if(!mode.models || mode.models.length==0) {
            console.log("createItem : no models");
            return null;
        }
        var outgoingModel = mode.models[0];

        return new Promise(function(resolve, reject) {
            console.log("createItem : (promise) starting");
            try{
                var id = ""
                if(outgoingModel.hasOwnProperty('id')){
                    id = outgoingModel.id;
                }else{
                    id = poodleUtils.generateUID();
                    outgoingModel['id'] = id;
                }
                var outgoingModelStr = JSON.stringify(outgoingModel);
                console.log("createItem : string to store : ",outgoingModelStr)
                localStorage.setItem(id,outgoingModelStr);
                
                //set as not DIRTY (saved)
                //outgoingModel._dirty = false;
                self.setCompleteHierarchyNotDirty(outgoingModel)
                //----


                console.log("createItem : (promise) resolving");
                resolve();
            }catch(err){
                console.log("createItem : (promise) rejecting",err);
                reject();
            }

        }); 
    },

    
    setCompleteHierarchyNotDirty(obj){
        if(obj.hasOwnProperty("_dirty")) obj._dirty = false;

        for(var key in obj) {
            var child = obj[key];
            if(Array.isArray(child)){
                for(var i=0; i<child.length; i++){
                    var childItem = child[i];
                    if(typeof childItem === 'object' && childItem !== null){
                        this.setCompleteHierarchyNotDirty(childItem)
                    }
                }
            }else if(typeof child === 'object' && child !== null){
                this.setCompleteHierarchyNotDirty(child)
            }
        }
    },
    

    deleteItem(mode=null) {
        if(mode) this.setMode(mode)
        mode = this.getMode();
        //------------------------
        if(!mode.models || mode.models.length==0) {
            console.log("deleteItem : no models");
            return null;
        }
        var outgoingModel = mode.models[0];

        if(this.debug)  console.log("deleteItem");
        

        return new Promise(function(resolve, reject) {
            console.log("deleteItem : (promise) starting");
            try{
                var id = ""
                if(outgoingModel.hasOwnProperty('id')){
                    id = outgoingModel.id;

                    localStorage.removeItem(id)
                    console.log("deleteItem : (promise) resolving");
                    resolve();
                }else{
                    reject();
                }
            }catch(err){
                console.log("deleteItem : (promise) rejecting",err);
                reject();
            }
            //---------------------------------------------
        });
    },


}