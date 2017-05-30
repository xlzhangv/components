var listLayoutTask = {
  promise: {
	beforeRender: function(container, data, task) {
	  
	}  
  },	
  data : [ 1, 2, 3, 4, 5, 6, 7, 8 ],
  taskType : "single",
  column : 2,
  ratio : 0.5,
  minWidth : 300
};

var navPanelTask = {
  promise : {
    afterRender : function (container, data, task) {
      for (var i = 0; i < data.length; i++) {
        //ToDo: -------------
      }
    }
  },
  data : ["选项卡1", "选项卡2", "选项卡3"],
  taskType : "single"
}