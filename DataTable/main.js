(function () {
  var config = {
    css : "style.css"
  }

  /*
  var data = {
  header: [{
  "name" : "代祷者",
  "key" : "prayer"
  }, {
  "name" : "事项",
  "key" : "content"
  }, {
  "name" : "日期",
  "key"  : "date"
  }, {
  "name" : "操作",
  "key"  : "operation",
  render : function(value, data) {
  return "<a>删除</a>"
  }
  }
  ],
  records : [{
  "prayer" : "刘文金",
  "content" : "为教会的合一与发展祷告",
  "date" : "2016-10-12"
  }, {
  "prayer" : "刘文金",
  "content" : "为教会的合一与发展祷告",
  "date" : "2016-10-12"
  }, {
  "prayer" : "刘文金",
  "content" : "为教会的合一与发展祷告",
  "date" : "2016-10-12"
  }
  ]
  }
   */

  webCpu.regComponent("DataTable", config, function (container, data, task) {
    container.innerHTML = "";
    var table = document.createElement("table");
    table.setAttribute("class", "table");

    if (typeof(data.caption) !== "undefined") {
      var caption = document.createElement("caption");
      caption.innerHTML = data.caption;
      table.appendChild(caption);
    }
    if (data.header && data.header.length > 0 && data.records) {
      var thead = document.createElement("thead");
      var tbody = document.createElement("tbody");
      table.appendChild(thead);
      table.appendChild(tbody);
      var tr = document.createElement("tr");
      for (var i = 0; i < data.header.length; i++) {
        var th = document.createElement("th");
        th.innerHTML = data.header[i].name;
        tr.appendChild(th);
      }
      thead.appendChild(tr);
	  var count = i;
      for (var i = 0; i < data.records.length; i++) {
        var tr = document.createElement("tr");
        for (var j = 0; j < data.header.length; j++) {
          var td = document.createElement("td");
          if (typeof(data.header[j].render) === "function") {
            td.innerHTML = data.header[j].render(data.records[i][data.header[j].key], data.records[i]);
          } else {
            td.innerHTML = data.records[i][data.header[j].key];
          }
          tr.appendChild(td);
        }
        tbody.appendChild(tr);
      }
	  if(i===0) {
		var tr = document.createElement("tr");
		tr.innerHTML = "<td colspan='"+count+"'><p class='DataTable_emptyTip'>当前列表为空</p></td>";
		tbody.appendChild(tr);
	  }
      container.appendChild(table);
    }
  });

})();
