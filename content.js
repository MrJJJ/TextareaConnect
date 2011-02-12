(function() {
  var port, textAreas;
  (function() {
    var siteId, timeStamp;
    timeStamp = new Date().getTime();
    siteId = function() {
      return location.href.replace(/[^a-zA-Z0-9_\-]/g, "") + "-" + timeStamp;
    };
    $.fn.uuid = function() {
      var e, uuid;
      e = $(this.get(0));
      uuid = e.data("uuid");
      if (uuid) {
        return uuid;
      } else {
        $.fn.uuid.counter += 1;
        uuid = siteId() + "-" + $.fn.uuid.counter;
        e.data("uuid", uuid);
        return uuid;
      }
    };
    $.fn.uuid.counter = 0;
    return $.fn.editInExternalEditor = function(port) {
      var sendToEditor, that;
      that = $(this);
      if (that.data("server")) {
        return;
      }
      that.data("server", true);
      sendToEditor = function(spawn) {
        if (spawn == null) {
          spawn = false;
        }
        return port.postMessage({
          textarea: that.val(),
          uuid: that.uuid(),
          spawn: spawn,
          action: "open"
        });
      };
      return sendToEditor(true);
    };
  })();
  textAreas = {};
  port = chrome.extension.connect({
    name: "textareapipe"
  });
  port.onMessage.addListener(function(obj) {
    var textarea;
    textarea = textAreas[obj.uuid];
    return textarea.val(obj.textarea);
  });
  chrome.extension.onRequest.addListener(function(req, sender) {
    var realUrl, textarea;
    if (req.action === "edittextarea") {
      realUrl = req.onClickData.frameUrl || req.onClickData.pageUrl;
      if (realUrl !== window.location.href) {
        return;
      }
      textarea = $(document.activeElement);
      textAreas[textarea.uuid()] = textarea;
      return textarea.editInExternalEditor(port);
    }
  });
  $(window).unload(function() {
    var key, ta, uuids;
    uuids = (function() {
      var _results;
      _results = [];
      for (key in textAreas) {
        ta = textAreas[key];
        _results.push(ta.uuid());
      }
      return _results;
    })();
    if (uuids.length > 0) {
      return port.postMessage({
        action: "delete",
        uuids: uuids
      });
    }
  });
}).call(this);
