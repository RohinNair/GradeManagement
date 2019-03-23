App = {
  web3Provider: null,
  contracts: {},
  account: '0x0',

  init: function() {
    return App.initWeb3();
  },

  initWeb3: function() {
    if (typeof web3 !== 'undefined') {
      // If a web3 instance is already provided by Meta Mask.
      App.web3Provider = web3.currentProvider;
      web3 = new Web3(web3.currentProvider);
    } else {
      // Specify default instance if no web3 instance provided
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
      web3 = new Web3(App.web3Provider);
    }
    return App.initContract();
  },

  initContract: function() {
    $.getJSON("Grade.json", function(grade) {
      // Instantiate a new truffle contract from the artifact
      App.contracts.Grade = TruffleContract(grade);
      // Connect provider to interact with contract
      App.contracts.Grade.setProvider(App.web3Provider);

      App.listenForEvents();

      return App.render();
    });
  },

  listenForEvents: function() {
    App.contracts.Grade.deployed().then(function(instance) {
      instance.gradedEvent({}, {
        fromBlock: 0,
        toBlock: 'latest'
      }).watch(function(error, event) {
        console.log("event triggered", event)
        // Reload when a new grade is recorded
        App.render();
      });
    });
  },

  render: function() {
    var gradeInstance;
    var loader = $("#loader");
    var content = $("#content");

    loader.show();
    content.hide();

    // Load account data
    web3.eth.getCoinbase(function(err, account) {
      if (err === null) {
        App.account = account;
        $("#accountAddress").html("Your Account: " + account);
      }
    });

    // Load contract data
    App.contracts.Grade.deployed().then(function(instance) {
      gradeInstance = instance;
      return gradeInstance.bmCount();
    }).then(function(bmCount) {

      var studentsResults = $("#studentsResults");
      studentsResults.empty();

      for (var i = 1; i <= bmCount; i++) {
        gradeInstance.bm(i).then(function(bms) {
          var bmid = bms[0];
          var studentid = bms[1];
          var studentName = bms[2];
          links1 = [
            "",
            '<a href="./inputmarks1.html">Grade</a>',
            '<a href="./inputmarks2.html">Grade</a>'
          ];

          links2 = [
            "",
            '<a href="./displaymarks1.html">View</a>',
            '<a href="./displaymarks2.html">View</a>'
          ];

          var goto1 = links1[bmid];
          var goto2 = links2[bmid];

          // Render Student Grade Result
          var studentTemplate = "<tr><th>" + bmid + "</th><td>" + studentid + "</td><td>" + studentName + "</td><td>" + goto1 + "</td><td>" + goto2 + "</td></tr>"
          studentsResults.append(studentTemplate);

          // Render Student Selection Menu
          /*var studentOption = "<option value='" + id + "' >" + name + "</ option>"
          studentsSelect.append(studentOption);*/
        });
      }
      return gradeInstance.graders(App.account);
  }).then(function(studentsCheck) {
    // Do not allow a teacher to grade
    if(studentsCheck.checked == true) {
      $('form').hide();
    }
      loader.hide();
      content.show();
    }).catch(function(error) {
      console.warn(error);
    });
  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});