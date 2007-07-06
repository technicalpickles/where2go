var Spots = {

  load: function() {
    if (GBrowserIsCompatible()) {
      Spots.initialize();
    }
  },

  map: "",
  geocoder: "",
  data: [],
  allSpots: [],
  hubpoint: new GLatLng(42.364434,-71.104696),
  hubMarker: "",
  baseIcon: "",
  currentSpot: "",

  initialize: function() {
    Spots.map = new GMap2(document.getElementById("map"));
    Spots.geocoder = new GClientGeocoder();
    Spots.map.addControl(new GLargeMapControl());
    Spots.map.addControl(new GMapTypeControl());
    Spots.map.setCenter(new GLatLng(42.364434,-71.104696), 14);
    Spots.rehub("13 Magazine St. Cambridge, MA 02139");
    Spots.setupHubMarker();

    Spots.baseIcon = new GIcon();
    Spots.baseIcon.shadow = "http://www.google.com/mapfiles/shadow50.png";
    Spots.baseIcon.iconSize = new GSize(20, 34);
    Spots.baseIcon.shadowSize = new GSize(37, 34);
    Spots.baseIcon.iconAnchor = new GPoint(9, 34);
    Spots.baseIcon.infoWindowAnchor = new GPoint(9, 2);
    Spots.baseIcon.infoShadowAnchor = new GPoint(18, 25);

    Behaviour.register(Spots.beh);
    Behaviour.apply();

    Spots.initSort();
    Spots.initTooltips();
  },

  addSpot: function(spot) {
    Spots.allSpots.push(spot);
    spot.seqnum = Spots.allSpots.length;
  },

  process_json_spots: function(json_spots) {
    Spots.allSpots = [];
    json_spots.each(function(json_spot) {
      spot = new Spot(json_spot);
      Spots.addSpot(spot);
    });
  },

  refresh: function() {
    Spots.map.clearOverlays();
    Spots.setupHubMarker();

    if (Spots.allSpots.length == 0) {
      $("resultsbody").innerHTML = "<tr><td colspan='9' align='center'>Nothing Found!</td></tr>";
    } else {
      $("resultsbody").remove();
      $("results").appendChild(Builder.node("tbody", {id: "resultsbody"}));
      var seqnum = 1;
      var ordered = Spots.allSpots.sortBy(Spots.sortFunc);

      ordered.each( function(spot) {
                      spot.seqnum = seqnum++;
                      spot.addToMap(Spots.map);
                      spot.addToResults();
                    } );
    }

  },

  findSpotByExternalID: function(id) {
    var item = Spots.allSpots.find( function(spot) {
                                           return spot.id == id;
                                         } );
    return item;
  },
  findSpotByDBID: function(dbid) {
    var item = Spots.allSpots.find( function(spot) {
                                           return spot.dbid == dbid;
                                         } );
    return item;
  },
  findSpotBySeqnum: function(seqnum) {
    var item = Spots.allSpots.find( function(spot) {
                                           return spot.seqnum == seqnum;
                                         } );
    return item;
  },

  showBubble: function(seqnum) {
    Spots.findSpotBySeqnum(seqnum).showBubble();
  },

  showDescription: function(seqnum) {
    Spots.findSpotBySeqnum(seqnum).showDescription();
  },

  initSort: function() {
    var currentmethod = $("sortcolumn").value;
    var currentdirection = $("sortdirection").value;
    var currentelement = $("col_"+currentmethod);
    currentelement.addClassName(currentdirection);
  },

  reSort: function(newmethod) {
    $("sortingindicator").setStyle({display: "block"});

    var currentmethod = $("sortcolumn").value;
    var currentdirection = $("sortdirection").value;
    var currentelement = $("col_"+currentmethod);
    var newdirection = "ascending";
    if (newmethod == currentmethod) { // clicked on the same header
      if (currentdirection == "ascending") {
        newdirection = "descending";
      } else {
        newdirection = "ascending";
      }
      currentelement.removeClassName(currentdirection);
      currentelement.addClassName(newdirection);
    } else { // moving... clear out whatever was there
      currentelement.removeClassName(currentdirection);
      $("col_"+newmethod).addClassName(newdirection);
    }

    $("sortcolumn").value = newmethod;
    $("sortdirection").value = newdirection;
    Spots.refresh();
    $("sortingindicator").setStyle({display: "none"});
  },

  sortFunc: function(p) { 
    return p[$("sortcolumn").value] * ($("sortdirection").value == "ascending" ? 1 : -1);
  },

  setupHubMarker: function() {
    Spots.hubMarker = new GMarker(Spots.hubpoint, {icon: Spots.getSpecialIcon("green"), draggable: true});
    GEvent.addListener(Spots.hubMarker, "click", function() {
                         Spots.hubMarker.openInfoWindowHtml(document.createTextNode($("hubaddress").value));
                       });

    GEvent.addListener(Spots.hubMarker, "dragstart", function() {
                         Spots.map.closeInfoWindow();
                       });

    GEvent.addListener(Spots.hubMarker, "dragend", function() {
                         $("hubaddress").value = Spots.hubMarker.getPoint();
                         Spots.rehubPoint(Spots.hubMarker.getPoint(), true);
                       });
    Spots.map.addOverlay(Spots.hubMarker);
  },

  rehubPoint: function(point, should_refresh) {
    Spots.setNewHub(point);
    Spots.map.setCenter(Spots.hubpoint);

    if (should_refresh) {
      $("resultsbody").innerHTML = "<tr><td colspan='9'>Loading..</td></tr>";
      new Ajax.Request('queryjs', {asynchronous:true, evalScripts:true, parameters:Form.serialize($("mainform"))});
      //$("mainform").submit();
    }
  },

  rehub: function(address, should_refresh) {
    if (address == "") { var address = $("hubaddress").value; }
    var pointPerhaps = Spots.toGLatLng(address);
    if (pointPerhaps) {
      // it was already a point, so just use that
      Spots.rehubPoint(pointPerhaps, should_refresh);
    } else {
      // look up what ought to be an address
      Spots.geocoder.getLatLng(
        address,
        function(point) {
          if (!point) {
            alert(address + " not found");
          } else {
            Spots.rehubPoint(point, should_refresh);
          }
        }
      );
    }
  },

  setNewHub: function(point) {
    Spots.hubpoint = point;
    $("lat").value = point.lat();
    $("lng").value = point.lng();
  },

  toGLatLng: function(s) {
    // looking for something like: "(42.400245, -71.124967)"
    var re = new RegExp("\\(([-\\d.]+), ([-\\d.]+)\\)");
    var m = re.exec(s);
    if (m != null) { // then we matched... second and third are captured parts
      var lat = m[1]; 
      var lng = m[2];
      var latlng = new GLatLng(lat, lng);
      return latlng;
    }
    return null;
  },

  getSpecialIcon: function(color) {
    var icon = new GIcon();
    icon.image = "http://labs.google.com/ridefinder/images/mm_20_"+color+".png";
    icon.shadow = "http://labs.google.com/ridefinder/images/mm_20_shadow.png";
    icon.iconSize = new GSize(12, 20);
    icon.shadowSize = new GSize(22, 20);
    icon.iconAnchor = new GPoint(6, 20);
    icon.infoWindowAnchor = new GPoint(5, 1);

    return icon;
  },

  getSequentialIcon: function(sequencenumber) {
    var icon = new GIcon();
    icon.image = Spots.getMarkerImage(sequencenumber)
    icon.shadow = "http://www.google.com/mapfiles/shadow50.png";
    icon.iconSize = new GSize(20, 34);
    icon.shadowSize = new GSize(37, 34);
    icon.iconAnchor = new GPoint(10, 17);
    icon.infoWindowAnchor = new GPoint(10, 1);

    return icon;
  },


  getMarkerImage: function(sequencenumber) {
    var letter = String.fromCharCode(64+sequencenumber);
    return "http://www.google.com/mapfiles/marker"+letter+".png";
  },

  beh: {
    'table#results th#col_name' : function(el) {
      el.onclick = function() {
	Spots.reSort("name");
      }
    },
    'table#results th#col_distance' : function(el) {
      el.onclick = function() {
	Spots.reSort("distance");
      }
    },
/*
    'table#results th#col_opensat' : function(el) {
      el.onclick = function() {
	Spots.reSort("opensat");
      }
    },
    'table#results th#col_closesat' : function(el) {
      el.onclick = function() {
	Spots.reSort("closesat");
      }
    },
*/
    'table#results th#col_seqnum' : function(el) {
      el.onclick = function() {
	Spots.reSort("seqnum");
      }
    }
  },

  initTooltips: function() {
    // the table headers of the results table
    // the following refuses to work, so do the old style until I figure out why
    // TODO: figure out why
//    $("results").getElementsByTagName("th").each( function(th) {th.title = "hello";} );
    var heds = $("results").getElementsByTagName("th");
    for (var i = 0; i < heds.length; i++) { 
      heds[i].title = "Click to sort, click again to reverse order";
    }

    
  }
};

var Spot = Class.create();
Spot.prototype = {
  initialize: function(json) {
    for(property in json.attributes) {
      var value = json.attributes[property];
      this[property] = value;
    }
  },
/*
  initialize: function(dbid, id, name, address, phone, opensat, closesat, link, spottype, description, distance, latitude, longitude) {
    this.dbid = dbid;
    this.id = id;
    this.name = name;
    this.address = address;
    this.phone = phone;
    this.opensat = opensat;
    this.closesat = closesat;
    this.link = link;
    this.spottype = spottype;
    this.description = description;
    this.distance = distance;
    this.latitude = latitude;
    this.longitude = longitude;
    
    this.typecode = this.spottype.substring(0,1);

    Spots.addSpot(this);
  },
  */

  addToMap: function(map) {
    map.addOverlay(this.getMarker());
  },

  showBubble: function() {
    Spots.currentSpot = this.seqnum;
    this.marker.openInfoWindowHtml(this.address+"&nbsp;&nbsp;-&nbsp;&nbsp;"+this.phone+"<br/><a href='#' onclick='Spots.showDescription("+this.seqnum+");return false'>Description</a>");
  },

  showDescription: function() {
    $("descriptiondiv").innerHTML = this.description + "<br/><a href='#' onclick='Effect.Fade(\"descriptiondiv\");return false'>close</a>";
    Effect.Appear("descriptiondiv");
  },

  getMarkerColor: function() {
    switch(this.typecode) {
    case "C": return "blue";
    case "S": return "green";
    case "M": return "red";
    default: return "orange";
    }
  },

  getMarker: function() {
    if (!this.marker) {
      var baseurl = "http://gmaps-samples.googlecode.com/svn/trunk/";
      var nIcon = new GIcon(Spots.baseIcon);
      if(this.seqnum > 0 && this.seqnum < 100) {
        nIcon.image = baseurl + "markers/" + this.getMarkerColor() + "/marker" + this.seqnum + ".png";
      } else { 
        nIcon.image = baseurl + "markers/" + this.getMarkerColor() + "/blank.png";
      }
    
      var point = new GLatLng(this.latitude, this.longitude);

      var markerOpts = {};
      markerOpts.icon = nIcon;
      markerOpts.title = this.address + " - " + this.phone;
      this.marker = new GMarker(point, markerOpts);
      this.marker.spotItem = this;
      GEvent.addListener(this.marker, "click", function() {
                           this.spotItem.showBubble();
                         });
      GEvent.addListener(this.marker, "mouseover", function() {
                           this.spotItem.setAsHovered();
                         });
      GEvent.addListener(this.marker, "mouseout", function() {
                           this.spotItem.setAsUnHovered();
                         });
    }
    return this.marker;
  },
  
  setAsHovered: function() {
    this.resultrow.addClassName("hovered");
  },
  setAsUnHovered: function() {
    this.resultrow.removeClassName("hovered");
  },

  addToResults: function() {
    $("resultsbody").appendChild(this.createResultNode());
  },

  createResultNode: function() {
    var type = Builder.node("td",
                            {className: "markercode marker_"+this.typecode,
                             onclick: "return Spots.showBubble("+this.seqnum+");return false"},
                            this.seqnum);
    var link = this.name;
    if (this.link != null) {
      link = Builder.node("a", {href: this.link, target: "_blank", title:this.address + " - " + this.phone}, this.name);
    }
    var name = Builder.node("td", {className: "name"}, [link]);
    var distance = Builder.node("td", {className: "distance"}, this.distance);
//    var opensat = Builder.node("td", {className: "opensat"}, this.opensat);
//    var closesat = Builder.node("td", {className: "closesat"}, this.closesat);

    var row = Builder.node("tr");
    row.appendChild(type);
    row.appendChild(name);
    row.appendChild(distance);
//    row.appendChild(opensat);
//    row.appendChild(closesat);

    this.resultrow = row; // so we can highlight it on mouseover of marker

    return row;
  }
	

}
