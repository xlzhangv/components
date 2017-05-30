/*! webCpu.js 2017-05-30 15:56:52 */
var WebInterface = function (urlOptions, typeOptions) {
  this.urlOptions = urlOptions;
  var typeOptions = typeOptions || {};
  for (var k in urlOptions) {
    var type = typeOptions[k] || "post";
    this[k] = new WebRequest(urlOptions[k], type);
  }
}
/**********************/
var WebAdapter = {};
WebAdapter.load = function (url, callback) {
  var script = document.createElement('script');
  script.setAttribute('src', url);
  script.setAttribute('charset', "utf-8");
  script.setAttribute("type", "text/javascript");
  if (script.readyState) {
    WebTool.bind(script, "readystatechange", function () {
      if (script.readyState === "loaded" || script.readyState === "complete") {
        if (typeof(callback) === "function") {
          callback();
        }
      }
    });
  } else {
    WebTool.bind(script, "load", function () {
      if (typeof(callback) === "function") {
        callback();
      }
    });
  }
  var _head = document.getElementsByTagName("head")[0];
  _head.appendChild(script);
  return script;
}

WebAdapter.jsonp = function (url, run) {
  var callBack = 'webAdapter_callBack_' + (new Date()).getTime();
  if (typeof(run) === "function") {
    window[callBack] = run;
  } else {
    window[callBack] = function (data) {}
  }

  if (url.indexOf("?") === -1) {
    url += "?callback=" + callBack;
  } else {
    url += "&callback=" + callBack;
  }

  var script = document.getElementById("webAdapterCallBackScript");
  if (script) {
    script.parentNode.removeChild(script);
  }
  script = document.createElement('script');
  script.id = "webAdapterCallBackScript";
  if (url.search(/\(function/) === 0) {
    script.innerHTML = url;
  } else {
    script.setAttribute('src', url);
  }
  script.setAttribute('charset', "utf-8");
  var _head = document.getElementsByTagName("head")[0];
  _head.appendChild(script);

  if (script) {
    script.parentNode.removeChild(script);
  }
}

WebAdapter.loadCSS = function (url) {
  if (url.search("{") === -1) {
    var cssLink = document.createElement('link');
    cssLink.setAttribute('type', 'text/css');
    cssLink.setAttribute('class', "TransWebCss");
    cssLink.setAttribute('rel', 'stylesheet');
    cssLink.setAttribute('href', url);
  } else {
    var cssLink = document.createElement("style");
    cssLink.innerHTML = url;
  }
  var _head = document.getElementsByTagName("head")[0];
  _head.appendChild(cssLink);
  return cssLink;
}

WebAdapter.report = function (url, params) {
  var url = WebTool.attachPrams(url, params);
  var img = document.createElement("img");
  img.src = url;
}

WebAdapter.request = function (url, type, params, callback) {
  var request = new WebRequest(url, type);
  request(params, function (data) {
    if (typeof(callback) === "function") {
      callback(data);
    }
  });
}

var WebRequest = function (url, type, options) {
  var type = type || "jsonp";
  if (type === "jsonp" || type === "noEcho") {
    return (new CustomInterface(url, type, options));
  } else {
    return (new AjaxInterface(url, type));
  }
}

var CustomInterface = function (url, type, options) {
  this.options = {};
  this.type = type || "jsonp";
  for (var k in options) {
    if (options[k] === 1) {
      this.options[k] = 1;
    }
  }
  this.url = url;
  return this.extend();
}

CustomInterface.prototype.extend = function () {
  var _this = this;  
  return (function (data, func) {
    if (_this.check(_this.options, data)) {
	  var url = _this.url;	
      if (_this.type === "jsonp") {
        url = WebTool.attachPrams(url, data);
        WebAdapter.jsonp(url, func);
      } else {
        WebAdapter.report(url, data);
      }
    }
  })
}

CustomInterface.prototype.check = function (options, params) {
  var ret = true;
  for (var k in options) {
    if (!params || !params[k]) {
      ret = false;
      console.log("Failed, miss the param of '" + k + "'.");
      break;
    }
  }
  return ret;
}

var AjaxInterface = function (url, type, dType) {
  this.url = url;
  return this.init(type);
}
AjaxInterface.prototype.init = function (type) {
  this.httpObj = this.getHttpObj();
  if (this.httpObj) {
    var _this = this;
    var url = this.url;
    return (function (query, callback) {
      if (type === "GET") {
        url = WebTool.attachPrams(url, query);
      } else {
        var data = WebTool.attachPrams("", query).split("?")[1];
      }
      _this.httpObj.onreadystatechange = function () {
        if (_this.httpObj.readyState == 4 || _this.httpObj.readyState == "complete") {
          if (typeof(callback) === "function") {
            callback(_this.httpObj.responseText);
          }
        }
      };
      _this.httpObj.open(type, url, true);
      _this.httpObj.send(data);
    });
  }
}

AjaxInterface.prototype.getHttpObj = function () {
  var xmlHttp = null;
  try {
    // Firefox, Opera 8.0+, Safari
    xmlHttp = new XMLHttpRequest();
  } catch (e) {
    //Internet Explorer
    try {
      xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");
    } catch (e) {
      xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
  }
  return xmlHttp;
}




var ViewControl = function (config, callback, mission) {
  this.config = config;
  if (typeof(callback) === "function") {
    this.callback = callback;
  }
  this.initConfig();
  this.mission = mission;
  var _self = this;
  if (this.isReady()) {
    setTimeout(function () {
      _self.execute();
    }, 100);
  }
}

ViewControl.prototype.initTask = function (task) {
  if (typeof(task) === "string") {
    task = {
      container : document.getElementById(task)
    };
  } else if (typeof(task) === "function") {
    task = {
      promise : {
        afterRender : task
      }
    };
  } else if (!!task && task.nodeName) {
    task = {
      container : task
    };
  } else if (!!task && typeof(task.container) === "string") {
    task.container = document.getElementById(task.container);
  } else {}
  return task;
}

ViewControl.prototype.initConfig = function () {
  if (this.config) {
    //init component elements;
    this.html = "";
    this.css = {};
    this.script = {};
    //Set script status
    this.sStatus = 0;
    if (typeof(this.config.script) === "string") {
      this.config.script = this.getPath(this.config.script);
	  this.sStatus = 1;
    } else if (typeof(this.config.script) === "object") {
      for (var i in this.config.script) {
        this.sStatus++;
		this.config.script[i] = this.getPath(this.config.script[i]);
      }
    }
    //set html status
    this.hStatus = 0;
    if (typeof(this.config.html) === "string" && (this.config.html.search('<') === -1)) {
      this.config.html = this.getPath(this.config.html);
	  this.htmlFetch = new WebRequest(this.config.html, "GET");
      this.hStatus = 1;
    } else {
      this.html = document.createElement("div");
      this.html.innerHTML = this.config.html || "";
    }
    //load css style
    this.prepareCss();
    //load html and script
    this.state = -1;
    this.load();
  }
}

ViewControl.prototype.load = function () {
  if (this.state === -1) {
    if (this.hStatus > 0) {
      this.prepareHtml();
    }
    if (this.sStatus > 0) {
      this.prepareScript();
    }
    this.state = 0;
  }
}

ViewControl.prototype.render = function (task) {
  //update the task state
  var task = this.initTask(task);
  if (task && typeof(task.url) === "string") {
    this.updateFromRemote(task);
  } else {
    this.update(task);
  }
}

ViewControl.prototype.updateFromRemote = function (task) {
  var _self = this;
  WebAdapter.request(task.url, task.requestType || "jsonp", task.query, function (data) {
    if (task.dataType === "json") {
      data = data.toObject();
    }
    task.data = data;
    _self.update(task);
  });
}

ViewControl.prototype.update = function (task) {
  if (this.isReady()) {
    //更新ID为参数id的Container
    var t = task.container;
    if (task.promise && typeof(task.promise.beforeRender) === "function") {
      task.promise.beforeRender(t, task.data, task);
    }
    if (t) {
      t.innerHTML = "";
      if (!!task.data && task.data.constructor.name === "Array" && task.taskType !== "single") {
        for (var i = task.data.length - 1; i > -1; i--) {
          var temp = this.initDom(task.data[i], t, task.filter);
          if (typeof(this.callback) === "function") {
            this.callback(temp, task.data[i], task);
          }
        }
      } else {
        var temp = this.initDom(task.data, t, task.filter);
        if (typeof(this.callback) === "function") {
          this.callback(temp, task.data, task);
        }
      }
    } else {
      if (typeof(this.callback) === "function") {
        this.callback(t, task.data, task);
      }
    }
    if (task.promise && typeof(task.promise.afterRender) === "function") {
      task.promise.afterRender(task.container, task.data, task);
    }
  } else {
    this.mission.push(task);
  }
}

ViewControl.prototype.execute = function () {
  if (this.isReady()) {
    for (var key in this.mission) {
      this.mission[key] = this.initTask(this.mission[key]);
      this.mission[key] && this.render(this.mission[key]);
    }
  }
}

ViewControl.prototype.initDom = function (obj, container, filter) {
  var t = document.createElement("div");
  t.setAttribute("style", "width: 100%; height: 100%; position: relative;");
  t.setAttribute("class", this.config.name);
  t.innerHTML = this.html.innerHTML.bindData(obj, filter);
  if (container && typeof(container.appendChild) === "function") {
    container.appendChild(t);
  }
  return t;
}

ViewControl.prototype.isReady = function () {
  var ret = false;
  if ((this.hStatus <= 0 && this.sStatus <= 0) || !this.config) {
    ret = true;
    this.state = 1;
  } else if (!this.html) {
    console.log("waiting html...");
  } else {
    console.log("waiting script...");
  }
  return ret;
}

ViewControl.prototype.prepareScript = function () {
  if (typeof(this.config.script) === "string" && !this.script[0]) {
    this.script[0] = this.loadScript(this.config.script);
  } else if (typeof(this.config.script) === "object") {
    for (var k in this.config.script) {
      this.script[k] = this.script[k] || this.loadScript(this.config.script[k]);
    }
  }
}

ViewControl.prototype.prepareCss = function () {
  if (typeof(this.config.css) === "string" && !this.css[0]) {
    if (this.config.css.search("{") === -1) {	 
	  this.config.css = this.getPath(this.config.css); 	  
    }
    this.css[0] = this.loadCSS(this.config.css);
  } else if (typeof(this.config.css) === "object") {
    for (var k in this.config.css) {
      if (this.config.css[k].search("{") === -1 && this.config.path) {
        this.config.css[k] = this.getPath(this.config.css[k]);
      }
      this.css[k] = this.css[k] || this.loadCSS(this.config.css[k]);
    }
  }
}

ViewControl.prototype.getPath = function(str) {
  if(this.config && this.config.path) {
	return  this.config.path + '/' + this.config.name + '/' + str; 
  }
  else {
	return this.config.name + '/' + str;  
  }
}

ViewControl.prototype.prepareHtml = function () {
  var _this = this;
  this.htmlFetch({}, function (str) {
    _this.hStatus--;
    _this.html = document.createElement("div");
    _this.html.innerHTML = str;
    _this.execute();
  });
  console.log("loading html[" + this.config.html + "]...");
}

ViewControl.prototype.loadScript = function (url) {
  var _self = this;
  //判断URL是否为script code
  var tUrl = url.replace(/\s+/g, "");
  if (tUrl.search(/\(function/) === 0) {
    setTimeout(function () {
      (new Function("return " + url))();
      _self.sStatus--;
      _self.execute();
    }, 200);
    var script = tUrl;
  } else {
    var scriptId = MurmurHash.rule(url, 31);
    var script = document.getElementById(scriptId);
    if (script) {
      script.parentNode.removeChild(script);
    }
    script = WebAdapter.load(url, function () {
        _self.sStatus--;
        _self.execute();
      });
    script.setAttribute('id', scriptId);
  }
  console.log("loading script[" + url + "]...");
  return script;
}

ViewControl.prototype.loadCSS = function (url) {
  var cssId = MurmurHash.rule(url, 31);
  var cssLink = document.getElementById(cssId);
  if (!cssLink) {
    cssLink = WebAdapter.loadCSS(url);
  }
  cssLink.setAttribute('id', cssId);
  return cssLink;
}

var MurmurHash = {
  // MurmurHash3 related functions
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // added together as a 64bit int (as an array of two 32bit ints).
  //
  x64Add : function (m, n) {
    m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
    n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
    var o = [0, 0, 0, 0];
    o[3] += m[3] + n[3];
    o[2] += o[3] >>> 16;
    o[3] &= 0xffff;
    o[2] += m[2] + n[2];
    o[1] += o[2] >>> 16;
    o[2] &= 0xffff;
    o[1] += m[1] + n[1];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[0] += m[0] + n[0];
    o[0] &= 0xffff;
    return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
  },
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // multiplied together as a 64bit int (as an array of two 32bit ints).
  //
  x64Multiply : function (m, n) {
    m = [m[0] >>> 16, m[0] & 0xffff, m[1] >>> 16, m[1] & 0xffff];
    n = [n[0] >>> 16, n[0] & 0xffff, n[1] >>> 16, n[1] & 0xffff];
    var o = [0, 0, 0, 0];
    o[3] += m[3] * n[3];
    o[2] += o[3] >>> 16;
    o[3] &= 0xffff;
    o[2] += m[2] * n[3];
    o[1] += o[2] >>> 16;
    o[2] &= 0xffff;
    o[2] += m[3] * n[2];
    o[1] += o[2] >>> 16;
    o[2] &= 0xffff;
    o[1] += m[1] * n[3];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[1] += m[2] * n[2];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[1] += m[3] * n[1];
    o[0] += o[1] >>> 16;
    o[1] &= 0xffff;
    o[0] += (m[0] * n[3]) + (m[1] * n[2]) + (m[2] * n[1]) + (m[3] * n[0]);
    o[0] &= 0xffff;
    return [(o[0] << 16) | o[1], (o[2] << 16) | o[3]];
  },
  //
  // Given a 64bit int (as an array of two 32bit ints) and an int
  // representing a number of bit positions, returns the 64bit int (as an
  // array of two 32bit ints) rotated left by that number of positions.
  //
  x64Rotl : function (m, n) {
    n %= 64;
    if (n === 32) {
      return [m[1], m[0]];
    } else if (n < 32) {
      return [(m[0] << n) | (m[1] >>> (32 - n)), (m[1] << n) | (m[0] >>> (32 - n))];
    } else {
      n -= 32;
      return [(m[1] << n) | (m[0] >>> (32 - n)), (m[0] << n) | (m[1] >>> (32 - n))];
    }
  },
  //
  // Given a 64bit int (as an array of two 32bit ints) and an int
  // representing a number of bit positions, returns the 64bit int (as an
  // array of two 32bit ints) shifted left by that number of positions.
  //
  x64LeftShift : function (m, n) {
    n %= 64;
    if (n === 0) {
      return m;
    } else if (n < 32) {
      return [(m[0] << n) | (m[1] >>> (32 - n)), m[1] << n];
    } else {
      return [m[1] << (n - 32), 0];
    }
  },
  //
  // Given two 64bit ints (as an array of two 32bit ints) returns the two
  // xored together as a 64bit int (as an array of two 32bit ints).
  //
  x64Xor : function (m, n) {
    return [m[0]^n[0], m[1]^n[1]];
  },
  //
  // Given a block, returns murmurHash3's final x64 mix of that block.
  // (`[0, h[0] >>> 1]` is a 33 bit unsigned right shift. This is the
  // only place where we need to right shift 64bit ints.)
  //
  x64Fmix : function (h) {
    h = this.x64Xor(h, [0, h[0] >>> 1]);
    h = this.x64Multiply(h, [0xff51afd7, 0xed558ccd]);
    h = this.x64Xor(h, [0, h[0] >>> 1]);
    h = this.x64Multiply(h, [0xc4ceb9fe, 0x1a85ec53]);
    h = this.x64Xor(h, [0, h[0] >>> 1]);
    return h;
  },

  //
  // Given a string and an optional seed as an int, returns a 128 bit
  // hash using the x64 flavor of MurmurHash3, as an unsigned hex.
  //
  rule : function (key, seed) {
    key = key || "";
    seed = seed || 0;
    var remainder = key.length % 16;
    var bytes = key.length - remainder;
    var h1 = [0, seed];
    var h2 = [0, seed];
    var k1 = [0, 0];
    var k2 = [0, 0];
    var c1 = [0x87c37b91, 0x114253d5];
    var c2 = [0x4cf5ad43, 0x2745937f];
    for (var i = 0; i < bytes; i = i + 16) {
      k1 = [((key.charCodeAt(i + 4) & 0xff)) | ((key.charCodeAt(i + 5) & 0xff) << 8) | ((key.charCodeAt(i + 6) & 0xff) << 16) | ((key.charCodeAt(i + 7) & 0xff) << 24), ((key.charCodeAt(i) & 0xff)) | ((key.charCodeAt(i + 1) & 0xff) << 8) | ((key.charCodeAt(i + 2) & 0xff) << 16) | ((key.charCodeAt(i + 3) & 0xff) << 24)];
      k2 = [((key.charCodeAt(i + 12) & 0xff)) | ((key.charCodeAt(i + 13) & 0xff) << 8) | ((key.charCodeAt(i + 14) & 0xff) << 16) | ((key.charCodeAt(i + 15) & 0xff) << 24), ((key.charCodeAt(i + 8) & 0xff)) | ((key.charCodeAt(i + 9) & 0xff) << 8) | ((key.charCodeAt(i + 10) & 0xff) << 16) | ((key.charCodeAt(i + 11) & 0xff) << 24)];
      k1 = this.x64Multiply(k1, c1);
      k1 = this.x64Rotl(k1, 31);
      k1 = this.x64Multiply(k1, c2);
      h1 = this.x64Xor(h1, k1);
      h1 = this.x64Rotl(h1, 27);
      h1 = this.x64Add(h1, h2);
      h1 = this.x64Add(this.x64Multiply(h1, [0, 5]), [0, 0x52dce729]);
      k2 = this.x64Multiply(k2, c2);
      k2 = this.x64Rotl(k2, 33);
      k2 = this.x64Multiply(k2, c1);
      h2 = this.x64Xor(h2, k2);
      h2 = this.x64Rotl(h2, 31);
      h2 = this.x64Add(h2, h1);
      h2 = this.x64Add(this.x64Multiply(h2, [0, 5]), [0, 0x38495ab5]);
    }
    k1 = [0, 0];
    k2 = [0, 0];
    switch (remainder) {
    case 15:
      k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 14)], 48));
    case 14:
      k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 13)], 40));
    case 13:
      k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 12)], 32));
    case 12:
      k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 11)], 24));
    case 11:
      k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 10)], 16));
    case 10:
      k2 = this.x64Xor(k2, this.x64LeftShift([0, key.charCodeAt(i + 9)], 8));
    case 9:
      k2 = this.x64Xor(k2, [0, key.charCodeAt(i + 8)]);
      k2 = this.x64Multiply(k2, c2);
      k2 = this.x64Rotl(k2, 33);
      k2 = this.x64Multiply(k2, c1);
      h2 = this.x64Xor(h2, k2);
    case 8:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 7)], 56));
    case 7:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 6)], 48));
    case 6:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 5)], 40));
    case 5:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 4)], 32));
    case 4:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 3)], 24));
    case 3:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 2)], 16));
    case 2:
      k1 = this.x64Xor(k1, this.x64LeftShift([0, key.charCodeAt(i + 1)], 8));
    case 1:
      k1 = this.x64Xor(k1, [0, key.charCodeAt(i)]);
      k1 = this.x64Multiply(k1, c1);
      k1 = this.x64Rotl(k1, 31);
      k1 = this.x64Multiply(k1, c2);
      h1 = this.x64Xor(h1, k1);
    }
    h1 = this.x64Xor(h1, [0, key.length]);
    h2 = this.x64Xor(h2, [0, key.length]);
    h1 = this.x64Add(h1, h2);
    h2 = this.x64Add(h2, h1);
    h1 = this.x64Fmix(h1);
    h2 = this.x64Fmix(h2);
    h1 = this.x64Add(h1, h2);
    h2 = this.x64Add(h2, h1);
    return ("00000000" + (h1[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (h1[1] >>> 0).toString(16)).slice(-8) + ("00000000" + (h2[0] >>> 0).toString(16)).slice(-8) + ("00000000" + (h2[1] >>> 0).toString(16)).slice(-8);
  }
}

// var MurmurHashRule = MurmurHash.rule;

var NetIdentity = function (config, callback) {
  for (var k in config) {
    this[k] = config[k];
  }
  this.id = WebTool.cookie(this.community);
  if (!this.id) {
    var _self = this;
    this.getCacheParams(this.url, function (data) {
      if (data && data["id"]) {
        _self.id = data["id"];
        // _self.community = data["id"];
      } else {
        _self.id = _self.generateId();
        _self.setCacheParams(_self.url, {
          id : _self.id,
          community : _self.community
        });
      }
      if (typeof(callback) === "function") {
        callback(_self.id);
      }
      //ID有效期100年（第一方cookie）
      WebTool.cookie(_self.community, _self.id, 365 * 100);

      //收集传播路径
      _self.trackIdentity();

    });
  } else {
    if (typeof(callback) === "function") {
      callback(this.id);
    }
    //ID有效期100年
    WebTool.cookie(this.community, this.id, 365 * 100);

    this.setCacheParams(this.url, {
      id : this.id,
      community : this.community
    });

    //收集传播路径
    this.trackIdentity();

  }
}
NetIdentity.track = 0;

NetIdentity.prototype.trackIdentity = function () {
  try {
    this.fp = MurmurHash.rule(this.getCanvasFp() + navigator.userAgent);
  } catch (e) {
    this.fp = "";
  }
  var _self = this;
  if (typeof(this.track) === "string" && NetIdentity.track === 0) {
    var hash = location.hash;
    var id = decodeURIComponent(this.urlQuery(hash, this.community));
    var tParam = {
      infector : id,
      hash : WebTool.pageHash(location.href),
      refer : document.referrer,
      fp : _self.fp
    };
    // tParam[this.community] = this.id;

    if (id && id !== "null") {
	  WebAdapter.report(WebTool.attachPrams(this.track, tParam));        	
      if (this.id != id) {
        location.hash = hash.replace(encodeURIComponent(id), encodeURIComponent(this.id));
      }
    } else {
      WebAdapter.report(WebTool.attachPrams(this.track, tParam));
      var param = {};
      param[this.community] = this.id;
      location.hash = WebTool.attachPrams(hash, param);
    }
    //每个页面只执行一次
    NetIdentity.track = 1;
  }
}

NetIdentity.prototype.getCanvasFp = function () {
  var result = [];
  // Very simple now, need to make it more complex (geo shapes etc)
  var canvas = document.createElement("canvas");
  canvas.width = 2000;
  canvas.height = 200;
  canvas.style.display = "inline";
  var ctx = canvas.getContext("2d");
  // detect browser support of canvas winding
  // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
  // https://github.com/Modernizr/Modernizr/blob/master/feature-detects/canvas/winding.js
  ctx.rect(0, 0, 10, 10);
  ctx.rect(2, 2, 6, 6);
  result.push("canvas winding:" + ((ctx.isPointInPath(5, 5, "evenodd") === false) ? "yes" : "no"));

  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = "#f60";
  ctx.fillRect(125, 1, 62, 20);
  ctx.fillStyle = "#069";
  ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 2, 15);
  ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
  ctx.font = "18pt Arial";
  ctx.fillText("Cwm fjordbank glyphs vext quiz, \ud83d\ude03", 4, 45);

  // canvas blending
  // http://blogs.adobe.com/webplatform/2013/01/28/blending-features-in-canvas/
  // http://jsfiddle.net/NDYV8/16/
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = "rgb(255,0,255)";
  ctx.beginPath();
  ctx.arc(50, 50, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(0,255,255)";
  ctx.beginPath();
  ctx.arc(100, 50, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(255,255,0)";
  ctx.beginPath();
  ctx.arc(75, 100, 50, 0, Math.PI * 2, true);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "rgb(255,0,255)";
  // canvas winding
  // http://blogs.adobe.com/webplatform/2013/01/30/winding-rules-in-canvas/
  // http://jsfiddle.net/NDYV8/19/
  ctx.arc(75, 75, 75, 0, Math.PI * 2, true);
  ctx.arc(75, 75, 25, 0, Math.PI * 2, true);
  ctx.fill("evenodd");

  result.push("canvas fp:" + canvas.toDataURL());
  return result.join("~");
}

NetIdentity.prototype.urlQuery = function (url, key) {
  if (url) {
    var re = new RegExp(key + "=([^\&]*)", "i");
    var a = re.exec(url);
    if (a == null) {
      return null;
    }
    return a[1];
  } else {
    return null;
  }
}

NetIdentity.prototype.rand = function (x) {
  var s = "";
  while (s.length < x && x > 0) {
    var r = Math.random();
    s += String.fromCharCode(Math.floor(r * 26) + (r > 0.5 ? 97 : 65));
  }
  return s;
}

NetIdentity.prototype.getCacheParams = function (url, callback) {
  if (!!window.postMessage) {
    this.getCacheParamsByMessage(url, callback);
  } else {
    this.getCacheParamsByName(url, callback);
  }
}

NetIdentity.prototype.getCacheParamsByMessage = function (url, callback) {
  var _self = this;
  if (window.addEventListener) {
    window.addEventListener('message', function (e) {
      if (typeof(callback) === "function") {
        _self.id = e.data["id"];
        _self.crossData = e.data;
        callback(e.data);
      }
    }, false)
  } else {
    window.attachEvent('onmessage', function (e) {
      if (typeof(callback) === "function") {
        _self.id = e.data["id"];
        _self.crossData = e.data;
        callback(e.data);
      }
    })
  }

  this.iframe = this.getBridgeIframe("_bridge_iframe");
  this.iframe.src = url;
}

NetIdentity.prototype.setCacheParams = function (url, params) {
  if (this.iframeSet) {
    this.iframeSet.parentNode.removeChild(this.iframeSet);
  }
  this.iframeSet = this.getBridgeIframe("_bridge_iframe_set");
  //使用hash值向跨域iframe传递参数
  this.iframeSet.src = WebTool.attachPrams(url, params);
}

NetIdentity.prototype.getCacheParamsByName = function (url, callback) {
  if (this.iframeGet) {
    this.iframeGet.parentNode.removeChild(this.iframeGet);
  }
  this.iframeGet = this.getBridgeIframe("_bridge_iframe_get");
  this.iframeGet.src = url;
  var state = 0;
  this.iframeGet.onload = function () {
    if (state === 1) {
      //使用iframe通过window.name跨域传递的参数
      var params = strToJson(this.contentWindow.name);
      if (typeof(callback) === "function") {
        callback(params);
      }
    } else if (state === 0) {
      state = 1;
      this.contentWindow.location = 'about:blank';
    }
  }
}

NetIdentity.prototype.getBridgeIframe = function (id, callback) {
  var iframe = this.iframe || document.getElementById("_bridge_iframe");
  if (iframe) {
    iframe.parentNode.removeChild(iframe);
  }
  iframe = document.createElement('iframe');
  iframe.setAttribute('allowTransparency', 'true');
  iframe.setAttribute('id', id);
  iframe.setAttribute('frameBorder', '0');
  iframe.setAttribute('scrolling', 'no');
  iframe.style.cssText = 'height:0px;width:0px;float:none;position:absolute;overflow:hidden;z-index:333333;margin:0;padding:0;border:0 none;background:none;';
  document.body.appendChild(iframe);
  iframe.onload = function () {
    if (typeof(callback) === "function") {
      callback();
    }
  }
  return iframe;
}

NetIdentity.prototype.generateId = function () {
  var href = location.href;
  var referrer = document.referrer;
  var random = this.rand(32);
  return MurmurHash.rule(this.fp + random + href + referrer + (new Date()).getTime(), 31);
}
function strToJson(str) {
  return (new Function("return " + str))();
}

var WebCpu = function (config, callback) {
  if (config) {
    this.update(callback, config);
  } else {
	if(typeof(callback) === "function") {
	  callback();	
	}
  } 
}

WebCpu.prototype.update = function (callback, config, path, identity) {
  this.callback = callback;
  this.config = config || {};
  this.config.path = path || WebCpu.path;
  this.config.name = identity || WebCpu.identity;
  try {
    var view = document.querySelector("[module]") || document.body;
  } catch (e) {}
  var _self = this;
  this.uninstall();
  this._main = new ViewControl(this.config, function (container, data) {
      if (typeof(_self.callback) === "function") {
        _self.callback(container, data);
        console.log("Execed successfully: Component main");
      }
      // initialize component missions;
      _self.excuteTasks(document);
	  console.log("Execed successfully: tasks");
    }, [{
          container : view || this.config["container"],
          url : config["url"]
        }
      ]);
}

WebCpu.prototype.excuteTasks = function (elem, flag) {
  try {
    var containers = elem.querySelectorAll("[component]");
    for (var i = 0; i < containers.length; i++) {
      var component = containers[i].getAttribute("component");
      var taskName = containers[i].getAttribute("task");
      var taskPath = containers[i].getAttribute("path");
      if (component) {
        var task =  window[taskName] || {};
        task.container = containers[i];
        this.render(component, task, taskPath);
      }
    }
  } catch (e) {
    console.log("directive excute error:");
    console.log(e);
  }
}

WebCpu.prototype.render = function (name, task, path) {
  if (!this[name]) {
    var mission = []
    if (typeof(task) === "object" && task.constructor.name === "Array") {
      mission = task;
    } else if (!!task) {
      mission = [task];
    } else {
      mission = [];
    }
    this.link(path, name, mission);
  } else if (this[name].state !== 1) {
    this[name].mission.push(task);
  } else {
    this[name].render(task);
  }
}

WebCpu.prototype.link = function (path, name, mission) {
  if (!this[name]) {
    var control = {
      path : path,
      mission : mission
    }
	if(path) {
	  WebAdapter.load(path + '/' + name + "/main.js");	
	}
	else {
	  WebAdapter.load(name + "/main.js");		
	}    
    this[name] = control;
  }
}

WebCpu.prototype.regComponent = function (name, config, callback) {
  if (this[name] && !this[name].control) {
    var _self = this;
    var config = config;
    var control = this[name];
    config.path = control.path;
    config.name = name;
    this[name] = new ViewControl(config, function (container, data, t) {
        //initial component
        callback(container, data, t);
        console.log("execed successfully: Component " + name);
      }, control.mission);
    this[name].name = name;
    this[name].control = control;
  } else {
    console.log("Reg failed: component[" + name + "]");
  }
}

WebCpu.prototype.uninstall = function () {
  if (window["webCpu"] && webCpu._main) {
    if (typeof(webCpu._main.css) === "string") {
      webCpu._main.css.parentNode.removeChild(webCpu._main.css);
    } else {
      for (var k in webCpu._main.css) {
        webCpu._main.css[k].parentNode.removeChild(webCpu._main.css[k]);
      }
    }
  }
}

window.webCpu = new WebCpu();

var WebRouter = function (config, prefix) {
  this.config = config;
  this.prefix = prefix;
  var _self = this;
  window.onhashchange = function () {	
    _self.switchPath();
  } 
  _self.switchPath();
}

WebRouter.prototype.switchPath = function(prefix) {
  this.updatePath();	
  this.pageSwitch(prefix);	
}

WebRouter.prototype.updatePath = function () {  
  this.path = this.getPath();
  return this.path;
}
WebRouter.prototype.getPath = function () {
  var hash = location.hash;
  var path = hash.split("?")[0];
  if (path.length !== 0) {
    path = path.slice(1);
  }
  path = path || "#";
  return path;
}

WebRouter.prototype.pageSwitch = function (prefix) {
  var prefix = prefix || this.prefix;
  if(typeof(prefix)==="string" && this.config && this.config.indexOf) {
	if(this.config.indexOf(this.path) === -1) {
	  this.path = this.config[0] || "index";	
	}
	var script = prefix  + "/" + this.path + "/main.js"
	//传递路由的path和模块名称;
	WebCpu.path = prefix;
	WebCpu.identity = this.path;
  }
  else {
	var script = (this.path && this.config[this.path]) || this.config["#"];  
  }
	
  var config = {
    script : script
  };
  var viewControl = new ViewControl(config);
}

WebRouter.prototype.checkAuthority = function(config, callback) {
  if(config.uid && config.url) {
	WebAdapter.request(config.url, config.type, { uid : config.uid, password : config.password }, callback);  
  }	
}

var WebTool = {};
WebTool.urlQuery = function (url, key) {
  if (url) {
    var re = new RegExp(key + "=([^\&]*)", "i");
    var a = re.exec(url);
    if (a == null) {
      return null;
    }
    return a[1];
  } else {
    return null;
  }
}

WebTool.cookieQuery = function (cookie, name) {
  if (cookie.search(name + "=") === 0) {
    var value = cookie.split(name + "=")[1].split("; ")[0];
  } else if (cookie.search("; " + name + "=") !== -1) {
    var value = cookie.split("; " + name + "=")[1].split("; ")[0];
  } else {
    var value = null;
  }
  return value;
}

WebTool.pageHash = function (url) {
  var tArr = url.split("#");
  if (tArr.length > 1) {
    return tArr[1].split("?")[0];
  } else {
    return "";
  }
}

WebTool.attachPrams = function (url, params) {
  if (url.indexOf("?") === -1) {
    flag = 0;
  } else {
    flag = 1;
  }
  for (var k in params) {
    if (flag == 0) {
      url += "?" + k + "=" + encodeURIComponent(params[k]);
      flag = 1;
    } else {
      url += "&" + k + "=" + encodeURIComponent(params[k]);
    }
  }
  return url;
}

WebTool.objectToString = function (obj) {
  if (obj && obj.constructor.name === "Object") {
    var str = "{";
    for (var k in obj) {
      if (typeof(obj[k]) === "string") {
        str += k + ":'" + obj[k] + "',";
      } else if (obj[k] && (typeof(obj[k]) === "object")) {
        str += k + ":" + this.objectToString(obj[k]) + ","
      } else {
        str += k + ":" + obj[k] + ",";
      }
    }
    if (str.length === 1) {
      str = ""
    } else {
      str = str.slice(0, str.length - 1) + "}";
    }
  } else if (obj && (obj.constructor.name === "Array")) {
    if (obj.length > 0) {
      var str = "[" + this.objectToString(obj[0]);
      for (var i = 1; i < obj.length; i++) {
        str += ',' + this.objectToString(obj[i]);
      }
      str += "]"
    } else {
      var str = "[]";
    }
  } else {
    var str = obj;
  }
  return str;
}

WebTool.copyObject = function (obj) {
  if (obj && typeof(obj) === "object") {
    var str = WebTool.objectToString(obj);
    return str.toObject();
  } else {
    return obj;
  }
}

WebTool.bind = function (node, type, listener, flag) {
  if (node.attachEvent) {
    node.attachEvent('on' + type, listener);
  } else if (node.addEventListener) {
    node.addEventListener(type, listener, flag);
  } else {}
}
WebTool.cookie = function () {
  if (arguments.length === 0) {
    return document.cookie;
  } else if (arguments.length === 1) {
    var name = arguments[0];
    var cookie = document.cookie;
    value = WebTool.cookieQuery(cookie, name);
    return value;
  } else if (arguments.length === 2) {
    var name = arguments[0];
    var value = arguments[1];
    document.cookie = name + '=' + value;
  } else if (arguments.length === 3) {
    var name = arguments[0];
    var value = arguments[1];
    var expires = arguments[2];
    var tData = new Date();
    tData.setDate(tData.getDate() + expires);
    document.cookie = name + '=' + value + ';expires=' + tData + ';path=/;';
  } else if (arguments.length === 4) {
    var name = arguments[0];
    var value = arguments[1];
    var expires = arguments[2];
    var domain = arguments[3];
    var tData = new Date();
    tData.setDate(tData.getDate() + expires);
    document.cookie = name + '=' + value + ';expires=' + tData + ';path=/;' + 'domain=' + domain;
  } else {}
}

/****************************************************************************/

String.prototype.toObject = function () {
  try {
    return (new Function("return " + this))();
  } catch (e) {
    return null;
  }
}

//模板HTML字符串与JSON对象绑定
String.prototype.bindData = function (obj, filter) {
  var ret = this;
  if (obj && typeof(obj) === "object") {
    var re = /{{([^}}]+)?}}/g;
    this.filter = filter;
    var _self = this;
    var ret = this.replace(re, function (m, t) {
        var temp = obj;
        var ret = (function () {
          var o = temp;
          var keys = t.split(".");
          for (var i = 0; i < keys.length; i++) {
            o = o[keys[i]];
          }
          var m = !(_self.filter && typeof(_self.filter[keys[i - 1]]) === "function") ? o : _self.filter[keys[i - 1]](o);
          return WebTool.objectToString(m);
        })();
        return ret;
      });
  }
  return ret;
}
