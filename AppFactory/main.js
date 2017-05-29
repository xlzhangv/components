(function () {
  var config = {
    css : "style.css",
    html : '<div class="AppFactory_topArea">'
			+'<div class="AppFactory_headerArea">'
				+'<label class="AppFactory_titleArea">Web编辑器</label>'
				+'<label class="AppFactory_switchViewBtn"><span>预览</span><span>源码</span></label>'		
				+'<label class="AppFactory_refreshItem"><span>还原</span></label>'	
			+'</div>'
			+'<div class="AppFactory_containerArea">'
				+'<div class="AppFactory_codeArea"></div>'
				+'<div class="AppFactory_previewArea"></div>'
			+'</div>'
		+'</div>'
		+'<div class="AppFactory_footerArea"></div>'
  }
  webCpu.regComponent("AppFactory", config, function (container, data, task) {
    //ToDo: Initial
    var codes = task.data.codes;
    if (task.data.title) {
      $(container).find(".AppFactory_titleArea").html(task.data.title);
    }
    initView(task);

    $(container).find(".AppFactory_switchViewBtn").click(function () {
      $(container).find(".AppFactory_containerArea>.AppFactory_previewArea").toggle();
      $(container).find(".AppFactory_switchViewBtn>span").toggle();
      if (!$(container).find(".AppFactory_containerArea>.AppFactory_previewArea").is(":hidden")) {
        task.appItem.previewWebPage($(container).find(".AppFactory_containerArea>.AppFactory_previewArea")[0]);
      }
    });

    $(container).find(".AppFactory_refreshItem").click(function () {
      if (task.data.loc !== "remote") {
        for (var k in task.appItem.editors) {
          task.appItem.editors[k].setValue(task.data.codes[k]);
        }
      } else {
        refreshWebPage(task);
      }
    });

    if (task.data.mode === "static") {
      $(container).find(".AppFactory_headerArea").hide();
      $(container).find(".AppFactory_containerArea").css("top", "0px");
    } else {
      $(container).find(".AppFactory_headerArea").show();
      $(container).find(".AppFactory_containerArea").css("top", "40px");
    }
  });

  webCpu["AppFactory"].previewWebPage = function (task) {
    task.appItem.previewWebPage($(task.container).find(".AppFactory_previewArea")[0]);
  }

  var refreshWebPage = function (task) {
    var codeMap = {
      javascript : "javascript",
      html : "htmlmixed",
      head : "htmlmixed",
      css : "css"
    }
    task.appItem = new AppFactory($(task.container).find(".AppFactory_previewArea")[0], task._containers, codeMap, task.data.codes, task.data.loc);
    return task.appItem;
  }

  var initAppFactory = function (codes, container, pTask) {
    var navTask = {
      container : container,
      promise : {
        switchPanel : function (container, flag, task) {
          if (task.appItem) {
            task.appItem.initEditor(flag);
          }
        },
        afterRender : function (container, data, task) {
          var containers = {};
          for (var k in codes) {
            containers[k] = task.sheets[k];
          }
          pTask._containers = containers;
          task.appItem = refreshWebPage(pTask);
        }
      },
      data : [],
      taskType : "single"
    }
    for (var k in codes) {
      navTask.data.push(k);
    }
    webCpu.render("NavPanel", navTask);
  }

  var initView = function (task) {
    var container = task.container;
    var codes = task.data.codes;
    initAppFactory(codes, $(container).find(".AppFactory_codeArea")[0], task);
    $(container).find(".AppFactory_switchViewBtn>span").hide();
    if (task.data.flag === "code") {
      $(container).find(".AppFactory_containerArea>.AppFactory_previewArea").hide();
      $(container).find(".AppFactory_switchViewBtn>span:eq(0)").show();
    } else {
      $(container).find(".AppFactory_containerArea>.AppFactory_previewArea").show();
      $(container).find(".AppFactory_switchViewBtn>span:eq(1)").show();
      if (task.data.loc !== "remote") {
        task.appItem.previewWebPage($(container).find(".AppFactory_previewArea")[0]);
      }
    }
  }

  var AppFactory = function (container, containers, modeMap, data, loc) {
    this._containers = containers;
    this.modeMap = modeMap;
    this.container = container;
    this.data = {};
    var _self = this;
    if (loc !== "remote") {
      for (var k in containers) {
        this.data[k] = data[k] || "";
      }
    } else {
      this.count = 0;
      for (var k in containers) {
        this.count++;
        (function () {
          var t = k;
          $.get(data[t], function (data) {
            _self.count--;
            _self.data[t] = data || "";
            _self.initEditor(t);
            if (_self.count === 0) {
              setTimeout(function () {
                _self.previewWebPage(_self.container);
              }, 200);
            }
          });
        })();
        if (_self.modeMap[k] === "htmlmixed" && k !== "head") {
          this.data[k] = "loading...";
        } else {
          this.data[k] = "";
        }

      }
    }
    this.editors = {};
    var _self = this;
    for (var k in containers) {
      this.initEditor(k);
    }
  }

  AppFactory.prototype.initEditor = function (key) {
    var _self = this;
    if (this._containers[key] && this.modeMap[key]) {
      this._containers[key].innerHTML = "";
      this.editors[key] = new CodeMirror(this._containers[key], {
          lineNumbers : true,
          value : this.data[key],
          mode : this.modeMap[key]
        });
      this.editors[key].on("change", function (e) {
        _self.data[key] = e.getValue();
      });
    }
  }

  AppFactory.prototype.previewWebPage = function (container) {
    this.container = container;
    var pageString = "<html>"
       + "<head>"
       + (this.data['head'] || "")
       + "</head>"
       + "<style>"
       + (this.data['css'] || "")
       + "</style>"
       + "<body>"
       + (this.data['html'] || "")
       + "</body>"
       + "<script>"
       + (this.data['javascript'] || "")
       + "</script></html>";
    var task = {
      container : container,
      data : {
        url : "data:text/html;charset=utf-8," + encodeURIComponent(pageString)
      }
    }
    webCpu.render("WebApp", task);
  }

  AppFactory.prototype.previewComponent = function () {}

})();
