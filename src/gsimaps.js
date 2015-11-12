(function() {
  var layers = {}, promises = [];

  var layers2html = function(json, container) {
    var li = $("<li/>");
    if (json.entries) {
      li.addClass("close");
      $("<a class='toggle' href='#'/>").text(json.title).appendTo(li);
      var ul = $("<ul/>").appendTo(li);
      json.entries.forEach(function(a) {
        layers2html(a, ul);
      });
    } else {
      $("<a class='layer'/>").attr("href", "#" + json.id).text(json.title).appendTo(li);
      layers[json.id] = L.tileLayer(json.url, json);
    }
    li.appendTo(container);
  };

  $("[data-layers]").each(function() {
    var that = $(this);
    promises.push(new Promise(function(resolve, reject) {
      $.getJSON(that.attr("data-layers"), function(json, status, xhr) {
        json.layers.forEach(function(a) {
          layers2html(a, that);
        });
        resolve();
      });
    }));
  });

  Promise.all(promises).then(function() {

    var opt = {
      zoomControl : false,
      zoom : 5,
      center : [ 35.362222, 138.731389 ],
      layers : []
    };

    var token = location.hash.replace(/^#/, "").split("/");
    if (token.length > 3) {
      var lng = parseFloat(token.pop());
      var lat = parseFloat(token.pop());
      var zoom = parseInt(token.pop());
      if (!isNaN(lng) && !isNaN(lat) && !isNaN(zoom)) {
        opt.center = [ lat, lng ];
        opt.zoom = zoom;
      }
      token.forEach(function(key) {
        var layer = layers[key];
        var opacity = 1.0;
        if (key.match(/^(.+):([0-9]+)$/)) {
          layer = layers[RegExp.$1];
          opacity = parseInt(RegExp.$2) / 100;
        }
        if (layer) {
          opt.layers.push(layer);
          layer.setOpacity(opacity);
        }
      });
    }

    if (opt.layers.length == 0)
      opt.layers.push(layers['std']);

    var map = L.map("map", opt);
    $("a.toggle").on("click", function() {
      $(this).parent().toggleClass("close");
      return false;
    });

    $("a.layer").on("click", function() {
      var lay = layers[$(this).attr("href").replace(/^#/, "")];
      if (map.hasLayer(lay)) {
        if (lay.options.opacity > 0.25)
          lay.setOpacity(lay.options.opacity - 0.25);
        else
          map.removeLayer(lay);
      } else {
        map.addLayer(lay);
        lay.bringToFront().setOpacity(1.0);
      }
      map.fire("moveend");
      return false;
    });

    map.on("moveend", function() {
      var a = [];
      map.eachLayer(function(lay) {
        var b = lay.options.id;
        if (lay.options.opacity != 1.0)
          b += (":" + Math.floor(lay.options.opacity * 100));
        a.push(b);
      });
      a.push(map.getZoom());
      a.push(map.getCenter().lat.toFixed(6));
      a.push(map.getCenter().lng.toFixed(6));
      location.replace("#" + a.join("/"));
    }).fire("moveend");

  });
})();
