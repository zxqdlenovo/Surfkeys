/**
 * @module SK
 */
SK = {};
/**
 * Method to access to the preferences of the surfkeys
 * @namespace SK
 * @method Prefs
 */
SK.Prefs = function() {
  return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.surfkeys.");
}
/**
 * Method to access to the default preferences of the surfkeys
 * @namespace SK
 * @method Prefs
 */
SK.DefaultPrefs = function() {
  return Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getDefaultBranch("extensions.surfkeys.");
}
/**
 * @namespace SK
 */
SK.Sites = {
  /**
   * @namespace SK.Sites
   * @method createSiteStr
   * @param {String} site the url or regexp for a site
   * @param {String,Null} [next] pattern for the "next" link
   * @param {String,Null} pnextrev pattern for the "prev" link
   * @param {} lastid
   * @type String
   */
  createSiteStr: function(site, next, prev, lastid) {
    if(!lastid) {
      var lastid = SK.Prefs().getIntPref('lastsiteid');
      lastid++;
    }
    SK.Prefs().setIntPref('lastsiteid', lastid);
    return '{"id":"' + lastid + '","site":"' + site + '","next":"' + next + '","prev":"' + prev + '"}';
  },
  /**
   * Generate javascript object from a JSON string
   * @param {String} [patterns]
   * @return a the javascript object which generated from the pattern
   * @type Array
   */
  getSites: function(patterns) {
    if(!patterns) {
      patterns = SK.Prefs().getCharPref('resultpattern');
    }
    patterns = decodeURIComponent(patterns);
    try {
      patterns = eval('(' + patterns + ')');
    } catch(e) {
      patterns = [];
    }
    return patterns;
  },
  /**
   * @param {Integer} id the id of the site
   * @return a site object
   * @type Object
   */
  getSiteFromID: function(id) {
    var sites = this.getSites();
    for(var i = 0, sl = sites.length; i < sl; i++) {
      if(sites[i].id == id) {
        return sites[i];
      }
    }
    return false;
  },
  /**
   * @param {String} url the url of the site which shuld match
   * @return a site object
   * @type Object
   */
  getSiteFromURL: function(url) {
    var sites = this.getSites();
    for(var i = 0, sl = sites.length; i < sl; i++) {
      if(sites[i].site == url) {
        return sites[i];
      }
    }
    return false;
  },
  addSiteToArray: function(site) {
    var sites = this.getSites(), overwrited;
    for(var i = 0, sl = sites.length; i < sl; i++) {
      if(sites[i].id == site.id) {
        sites[i] = site;
        overwrited = true;
        break;
      }
    }
    if(!overwrited) {
      sites.push(site);
    }
    return sites;
  },
  /**
   * converts all the sites object to string
   * @param {Array} sites 
   * @returns the sites as a string to make possible to stor them
   * @type String
   */
  sitesToString: function(sites) {
    var str = new Array();
    for(var i = 0, sl = sites.length; i < sl; i++) {
      str.push(this.createSiteStr(sites[i].site, sites[i].next, sites[i].prev, sites[i].id));
    }
    return  '[' + str.join(',') + ']';
  },
  /**
   * @param Object site A site object {site: foo, next: bar, prev: baz, [id:foobar]}
   */
  addSite: function(site) {
    var sites = this.addSiteToArray(site);
    this.setSites(this.sitesToString(sites));
  },
  removeSite: function(id) {
    /**
     * @private
     */
    var sites = this.getSites();
    for(var i = 0, sl = sites.length; i < sl; i++) {
      if(sites[i].id == id) {
        sites.splice(i, 1);
        break;
      }
    }
    this.setSites(this.sitesToString(sites));
  },
  /**
   * Update the site preference
   * @param {String} sites string sites
   */
  setSites: function(sites) {
    SK.Prefs().setCharPref('resultpattern', encodeURIComponent(sites));
  },
  logSelected: function() {
    SKLog.log('logselected: ', this.selectedSite.site);
  }
};
SK.Keys = {
  getKeys: function(keys) {
    if(!keys) {
      keys = SK.Prefs().getCharPref("keys");
    }
    try {
      keys = eval('(' + keys + ')');
    } catch(e) {
      keys = {};
    }
    try {
      var defaults = eval('(' + SK.DefaultPrefs().getCharPref('keys') + ')');
    } catch(e) {
      var defaults = {};
    }
    for(var i in defaults) {
      if(typeof keys[i] == 'undefined') {
        keys[i] = defaults[i];
      }
    }
    return keys;
  },
  setKeys: function(keys) {
    if(typeof keys != 'string') {
      keys = this.keysToString(keys);
    }
    SK.Prefs().setCharPref('keys', keys);
  },
  /**
   * @param {String} id The ID of the hotkey
   * @param {String} key The key of the hotkey
   * @param {Boolean} shift Shift modifier on/off
   * @param {Boolean} alt Alt modifier on/off
   * @param {Boolean} control Control modifier on/off
   * @param {Boolean} disabled Enabled/disabled hotkey
   * @type String
   */
  createKeyStr: function(id, key, shift, alt, control, disabled) {
    return id + ':{key:"' + key + '",shift:' + shift + ',alt:' + alt + ',control:' + control + ',disabled:' + disabled + '}';
  },
  /**
   * @param {Object} keys JS object
   * @type String
   */
  keysToString: function(keys) {
    var str = new Array();
    for(k in keys) {
      str.push(SK.Keys.createKeyStr(k, keys[k].key, keys[k].shift, keys[k].alt, keys[k].control, keys[k].disabled));
    }
    return  '{' + str.join(',') + '}';
  },
  /**
   * Check for items, which are the same in the paramter object
   * @param {Object} keys
   * @return true if the keys contains conflicting items
   * @type Boolean
   */
  isConflict: function(keys) {
    var o = {};
    for(var i in keys) {
      for(var j in o) {
        if(j != i && keys[i].key == o[j].key && keys[i].alt == o[j].alt && keys[i].shift == o[j].shift && keys[i].disabled == o[j].disabled) {return true};
      }
      o[i] = keys[i];
    }
    return false;
  }
};
