App = {
  web3Provider: null,
  contracts: {},
  names: new Array(),
  url: "https://eth-sepolia.g.alchemy.com/v2/_8JHmMNHYEWdFM86u3zYkIHyM27m0K3S",
  instructor: null,
  currentAccount: null,
  scheduleID: null,

  init: function () {
    $.getJSON("../schedules.json")
      .done(function (data) {
        $("#course_name").text(data["courseName"]);
        var schedulesRow = $("#schedulesRow");
        var scheduleTemplate = $("#scheduleTemplate");
        var array = data["schedules"];

        for (i = 0; i < array.length; i++) {
          scheduleTemplate.find(".card-title").text(array[i].title);
          scheduleTemplate.find("#detail").text(array[i].details);
          scheduleTemplate
            .find(".btn-startevaluate")
            .attr("data-id", array[i].id);
          scheduleTemplate.find("#evaluation").attr("data-id", array[i].id);

          schedulesRow.append(scheduleTemplate.html());
          App.names.push(array[i].name);
        }
        scheduleTemplate.find(".btn-startevaluate").attr("data-id", -1);
        scheduleTemplate.find("#evaluation").attr("data-id", -1);
      })
      .fail(function (jqXHR, textStatus, error) {
        console.error("Error:", error);
      });
    return App.initWeb3();
  },

  initWeb3: function () {
    if (typeof web3 !== "undefined") {
      App.web3Provider = web3.currentProvider;
    } else {
      //if no injected web3 instance, fallback
      App.web3Provider = new Web3.providers.HttpProvider(App.url);
    }
    web3 = new Web3(App.web3Provider);
    // ethereum.enable();

    return App.initContract();
  },

  initContract: function () {
    $.getJSON("Evaluation.json", function (data) {
      var artifact = data;
      App.contracts.evaluation = TruffleContract(artifact);
      App.contracts.evaluation.setProvider(App.web3Provider);

      web3.eth.getCoinbase().then((x) => {
        web3.eth.defaultAccount = x;
        App.currentAccount = x;
        $("#current_account").text(App.currentAccount);
      });

      App.getInstructor();
	  App.getNumStudents();
	  App.getNumTokens();

      for (i = 0; i < App.names.length; i++) {
        App.getEvaluationOf(i);
      }

      App.getTotalEvaluation();

      return App.bindEvents();
    });
  },

  bindEvents: function () {
    $(document).on("click", ".btn-startevaluate", function (event) {
      event.preventDefault();
      App.scheduleID = parseInt($(event.target).data("id"));
    });
    $(document).on("click", ".btn-evaluate", App.handleEvaluation);
    $(document).on("click", "#certificate", App.giveRightToVote);
    $(document).on("click", "#register", App.register);
  },

  handleEvaluation: function (event) {
    event.preventDefault();
    var checkedButton = $(".btn-check:checked")[0];
    var score = parseInt(checkedButton.id);
    var evaluationInstance;
    var account = App.currentAccount;

    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance.evaluate(App.scheduleID, score, {
          from: App.currentAccount,
        });
      })
      .then((res) => {
        location.reload();
      })
      .catch((o) => {
        App.erH(o["code"]);
      });
  },

  getInstructor: function () {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance;
      })
      .then(function (result) {
        result.instructor.call().then((x) => {
          App.instructor = x;
          if (
            App.instructor.toLowerCase() === App.currentAccount.toLowerCase()
          ) {
            $("#for_instructor").show();
          }
        });
      });
  },
  
  getNumStudents: function () {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance;
      })
      .then(function (result) {
        result.numStudents.call().then((x) => {
          $('#num-student').text(parseInt(x));
        });
      });
  },

  getNumTokens: function () {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance;
      })
      .then(function (result) {
        result.numTokens.call().then((x) => {
          $('#num-token').text(parseInt(x));
        });
      });
  },

  giveRightToVote: function () {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        var str = $("#enter_address_ctf").val().toLowerCase();
        return instance.giveRightToVote(str, { from: App.currentAccount });
      })
      .then(function (res) {
        var str = $("#enter_address_ctf").val().toLowerCase();
        App.getTokenInfo(str);
      })
      .then(()=>{
        App.getNumTokens();
      })
      .catch((o) => {
        App.erH(o["code"]);
      });
  },

  getTokenInfo: function (address) {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance.getTokenInfo(address, {
          from: App.currentAccount,
        });
      })
      .then(function (res) {
        $("#token_address").text(res[0]);
        $("#token_id").text(res[1].toNumber());
        $("#token_info").show();
      })
      .catch((o) => {
        App.erH(o["code"]);
      });
  },

  register: function () {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        var str = $("#enter_address_reg").val().toLowerCase();
        return instance.register(str, { from: App.currentAccount });
      })
      .then(()=>{
        App.getNumStudents();
      })
      .catch((o) => {
        App.erH(o["code"]);
      });
  },

  getEvaluationOf: function (SID) {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance.evaluationOf(SID, { from: App.currentAccount });
      })
      .then(function (res) {
        var ev = parseInt(res);
        var score;

        if (ev == 999) score = "No one evaluated yet!";
        else score = ((ev * 1.0) / 100).toFixed(2);
        $(`span[data-id=${SID}]`).text(score);
      });
  },

  getTotalEvaluation: function () {
    App.contracts.evaluation
      .deployed()
      .then(function (instance) {
        return instance.totalEvaluation({ from: App.currentAccount });
      })
      .then(function (res) {
        var ev = parseInt(res);
        var score;

        if (ev == 999) score = "No one evaluated yet!";
        else score = ((ev * 1.0) / 100).toFixed(2);
        $("#total-rating-text").text(score);
      });
  },

  erH: function (e) {
    var et = "";
    switch (e) {
      case -32603:
        et = "REJECTED_BY_CONTRACT: Already Done or no permission";
        break;
      case 4001:
        et = "USER_DENIED";
        break;
      default:
        et = "UNKNOWN";
    }
    alert("ERROR: " + et);
  },
};

App.init();
