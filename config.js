var listLayoutTask = {
  promise : {
    beforeRender : function (container, data, task) {}
  },
  data : [1, 2, 3, 4, 5, 6, 7, 8],
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
  data : ["Nav1", "Nav2", "Nav3"],
  taskType : "single"
}

var dataTableTask = {
  data : {
    header : [{
        "name" : "列名1",
        "key" : "key1"
      }, {
        "name" : "列名2",
        "key" : "key2"
      }, {
        "name" : "列名3",
        "key" : "key3"
      }, {
        "name" : "列名4",
        "key" : "key4"
      }
    ],
    records : [{
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }, {
        key1 : "NO.2232",
        key2 : "abc1",
        key3 : "xyz1",
        key4 : "hello1"
      }
    ]
  }
}

listLayoutTask.data[0] = {
  component : "NavPanel",
  task : navPanelTask
}
listLayoutTask.data[2] = {
  component : "DataTable",
  task : dataTableTask
}
