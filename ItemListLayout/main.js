(function () {
  var config = {
    css : "style.css"
  }

  webCpu.regComponent("ItemListLayout", config, function (container, data, task) {
    task.containers = [];
    if (task.minWidth) {
      var max = Math.floor($(container).width() / task.minWidth) || 1;
      task.column = Math.min(max, task.column);
    }
    var w = 100 / (task.column || 1);
    var h = w * (task.ratio || 1);
    for (var i = 0; i < data.length; i++) {
      var div = document.createElement("div");
      div.setAttribute("class", "ItemListLayout_item");
      container.appendChild(div);
      $(div).css("width", w + "%");
      $(div).css("padding-bottom", h + "%");
      var area = document.createElement("div");
      area.setAttribute("class", "ItemListLayout_container");
      div.appendChild(area);
      task.containers.push(area);
      if (task.content && task.content.type === "component") {
        var _task = {
          container : area,
          data : data[i]
        }
        webCpu.render(task.content.value, _task);
      }
    }
  });

})();
