(function () {
  var config = {
    css : "style.css"
  } 
  webCpu.regComponent("NavPanel", config, function(container, data, task){
	var nav = document.createElement("ul");
	nav.setAttribute("class", "NavIndex");
	container.appendChild(nav);
	var sheet = document.createElement("div");
	sheet.setAttribute("class", "NavSheetArea");
	container.appendChild(sheet);
	task.sheets = {};
	task.navItems = {};
	for(var i = 0; i < data.length; i++) {
	  var li = document.createElement("li");
	  li.innerHTML = data[i];
	  li.setAttribute("flag", data[i]);
	  nav.appendChild(li);
	  var sheetItem = document.createElement("div");
	  sheetItem.setAttribute("class", "NavSheet");
	  sheet.appendChild(sheetItem);
	  var _sheetItem = document.createElement("div");
	  _sheetItem.setAttribute("class", "_NavSheet");
	  sheetItem.appendChild(_sheetItem);
	  task.sheets[data[i]] = _sheetItem;
	  task.navItems[data[i]] = li;
	}
	
	var navIndex = $(container).find(".NavIndex li");  
	var navSheet = $(container).find(".NavSheet");
	navIndex.on("click", function(){
	  navIndex.removeClass("active");	
	  $(this).addClass("active");	
	  var index = $(this).index();
	  navSheet.hide();
	  navSheet.eq(index).show();
	  if(typeof(task.promise.switchPanel) === "function") {
		task.promise.switchPanel(navSheet.eq(index)[0], $(this).attr("flag"), task);  
	  }
	})
	navIndex.eq(0).click();
  }); 
  
  webCpu["NavPanel"].switchNavPanel = function(container, n) {
	var navIndex = $(container).find(".NavIndex li");  
	navIndex.eq(n-1).click();  
  }

})();