'use strict';

var poodleCrudInterface = require('enco-poodle-crud-interface');
var poodleDavInterface = require('enco-poodle-dav-interface');


module.exports =  {

    getInterface(mode){
        if(mode.apitype==="phpcrud"){
            return poodleCrudInterface;
        }else if(mode.apitype==="caldav" || mode.apitype==="carddav"){
            return poodleDavInterface;
        }
    }


    getItems(mode=null) {
        return getInterface(mode).getItems(mode);
    },

    getItem(mode=null) {
        return getInterface(mode).getItem(mode);
    },

    updateItem(mode=null) {
        return getInterface(mode).updateItem(mode);
    },

    createItem(mode=null) {
        return getInterface(mode).createItem(mode);
    },

    deleteItem(mode=null) {
        return getInterface(mode).deleteItem(mode);
    }


}