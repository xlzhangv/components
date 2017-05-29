(function () {
  var config = {
    // css: "style.css"
  }

  webCpu.regComponent("WebApp", config, function (container, data, task) {
	
	var iframes = container.getElementsByTagName("iframe"); 
    if (iframes.length === 0) {
      task.iframe = document.createElement("iframe");
      task.iframe.setAttribute("frameborder", 0);
      task.iframe.setAttribute("width", "100%");
      task.iframe.setAttribute("height", "100%");
      container.appendChild(task.iframe);
    }
	else {
	  task.iframe = iframes[0];	
	}
    if (task.sandbox) {
      task.iframe.src = task.sandbox;
      task.iframe.onload = function () {
        var script = document.createElement("script");
        script.src = task.data.url;
        var head = task.iframe.contentDocument.head;
        head.appendChild(script);
      }
    } else {
      task.iframe.src = task.data.url;
    }
	
	container.style.textIndent = "0px";  
  });

})();
