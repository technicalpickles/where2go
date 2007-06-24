var Spots = {

  load: function() {
    if (GBrowserIsCompatible()) {
      Spots.initialize();
    }
  },

  map: "",
  geocoder: "",
  data: [],
  allProperties: [],
  hubpoint: new GLatLng(42.364434,-71.104696),
  hubMarker: "",
  baseIcon: "",
  blankImage: new Image(),
  currentSpot: "",

  initialize: function() {
    Spots.map = new GMap2(document.getElementById("map"));
    Spots.geocoder = new GClientGeocoder();
    Spots.map.addControl(new GSmallMapControl());
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

  addSpot: function(prop) {
    Spots.allProperties.push(prop);
    prop.seqnum = Spots.allProperties.length;
  },

  update: function() {
    Spots.map.clearOverlays();
    Spots.setupHubMarker();

    if (Spots.allProperties.length == 0) {
      $("resultsbody").innerHTML = "<tr><td colspan='9' align='center'>Nothing Found!</td></tr>";
    } else {
      $("resultsbody").remove();
      $("results").appendChild(Builder.node("tbody", {id: "resultsbody"}));
      var seqnum = 0;
      var ordered = Spots.allProperties.sortBy(Spots.sortFunc);

      ordered.each( function(prop) {
                      prop.addToMap(Spots.map);
                      prop.addToResults();
                    } );
    }

  },

  findSpotByFullID: function(fullid) {
    var item = Spots.allProperties.find( function(prop) {
                                           return prop.listingfullid == fullid;
                                         } );
    return item;
  },
  findSpotByDBID: function(dbid) {
    var item = Spots.allProperties.find( function(prop) {
                                           return prop.dbid == dbid;
                                         } );
    return item;
  },
  findSpotBySeqnum: function(seqnum) {
    var item = Spots.allProperties.find( function(prop) {
                                           return prop.seqnum == seqnum;
                                         } );
    return item;
  },

  prevImage: function() {
    Spots.findSpotBySeqnum(Spots.currentSpot).prevImage();
  },
  nextImage: function() {
    Spots.findSpotBySeqnum(Spots.currentSpot).nextImage();
  },

  showBubble: function(seqnum) {
    Spots.findSpotBySeqnum(seqnum).showBubble();
  },

  showImages: function(seqnum) {
    Spots.findSpotBySeqnum(seqnum).showImages();
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
    Spots.update();
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

  rehubPoint: function(point, update) {
    Spots.setNewHub(point);
    Spots.map.setCenter(Spots.hubpoint);
    Spots.map.openInfoWindow(Spots.map.getCenter(), document.createTextNode($("hubaddress").value));

    if (update) {
      $("resultsbody").innerHTML = "<tr><td colspan='9'>Loading..</td></tr>";
      new Ajax.Request('queryjs', {asynchronous:true, evalScripts:true, parameters:Form.serialize($("mainform"))});
      //$("mainform").submit();
    }
  },

  rehub: function(address, update) {
    if (address == "") { var address = $("hubaddress").value; }
    var pointPerhaps = Spots.toGLatLng(address);
    if (pointPerhaps) {
      // it was already a point, so just use that
      Spots.rehubPoint(pointPerhaps, update);
    } else {
      // look up what ought to be an address
      Spots.geocoder.getLatLng(
        address,
        function(point) {
          if (!point) {
            alert(address + " not found");
          } else {
            Spots.rehubPoint(point, update);
          }
        }
      );
    }
  },

  setNewHub: function(point) {
    Spots.hubpoint = point;
    $("hublat").value = point.lat();
    $("hublng").value = point.lng();
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
    'table#results th#col_priceint' : function(el) {
      el.onclick = function() {
	Spots.reSort("priceint");
      }
    },
    'table#results th#col_sqft' : function(el) {
      el.onclick = function() {
	Spots.reSort("sqft");
      }
    },
    'table#results th#col_dolpersqft' : function(el) {
      el.onclick = function() {
	Spots.reSort("dolpersqft");
      }
    },
    'table#results th#col_bedrooms' : function(el) {
      el.onclick = function() {
	Spots.reSort("bedrooms");
      }
    },
    'table#results th#col_bathrooms' : function(el) {
      el.onclick = function() {
	Spots.reSort("bathrooms");
      }
    },
    'table#results th#col_bathroomshalf' : function(el) {
      el.onclick = function() {
	Spots.reSort("bathroomshalf");
      }
    },
    'table#results th#col_ohstarttime' : function(el) {
      el.onclick = function() {
	Spots.reSort("ohstarttime");
      }
    },
    'table#results th#col_ohendtime' : function(el) {
      el.onclick = function() {
	Spots.reSort("ohendtime");
      }
    },
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
  allPhotos: [], // must declare new array in initialize() or it uses the same one for all Properties
  photoURLsAreLoaded: false,
  currentPhoto: 0,
        
  initialize: function(dbid, listingfullid, address, ohdate, ohstarttime, ohendtime, price, priceint, link, propertytype, sqft, bedrooms, bathrooms, bathroomshalf, amenities, description, longitude, latitude) {
    this.dbid = dbid;
    this.listingfullid = listingfullid;
    this.address = address;
    this.ohdate = ohdate;
    this.ohstarttime = ohstarttime;
    this.ohendtime = ohendtime;
    this.price = price;
    this.priceint = priceint;
    this.link = link;
    this.propertytype = propertytype;
    this.sqft = sqft;
    this.bedrooms = bedrooms;
    this.bathrooms = bathrooms;
    this.bathroomshalf = bathroomshalf;
    this.amenities = amenities;
    this.description = description;
    this.longitude = longitude;
    this.latitude = latitude;
    
    this.typecode = this.propertytype.substring(0,1);
    this.dolpersqft = this.priceint / this.sqft;

    this.allPhotos = new Array(); // this makes sure the array is mine and mine alone

    Spots.addSpot(this);
  },

  addToMap: function(map) {
    map.addOverlay(this.getMarker());
  },

  showBubble: function() {
    Spots.currentSpot = this.seqnum;
    this.marker.openInfoWindowHtml(this.address+"<br/><a href='#' onclick='Spots.showImages("+this.seqnum+");return false'>Images</a>&nbsp;&nbsp;-&nbsp;&nbsp;<a href='#' onclick='Spots.showDescription("+this.seqnum+");return false'>Description</a>");
  },

  showImages: function() {
    this.initializeImage();
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
      markerOpts.title = this.address;		 
      this.marker = new GMarker(point, markerOpts);
      this.marker.propertyItem = this;
      GEvent.addListener(this.marker, "click", function() {
                           this.propertyItem.showBubble();
                         });
      GEvent.addListener(this.marker, "mouseover", function() {
                           this.propertyItem.setAsHovered();
                         });
      GEvent.addListener(this.marker, "mouseout", function() {
                           this.propertyItem.setAsUnHovered();
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

  prevImage: function() {
    this.showRelativeImage(-1);
  },

  nextImage: function() {
    this.showRelativeImage(1);
  },

  showRelativeImage: function(increment) {
    this.currentPhoto = (this.allPhotos.length + this.currentPhoto + increment) % this.allPhotos.length;
    this.showImage();
  },

  showSpecificImage: function(num) {
    this.currentPhoto = num;
  },

  showImage: function(num) {
    $("propertyimg").src = this.allPhotos[this.currentPhoto];
  },

  initializeImage: function() {
    if (this.photoURLsAreLoaded) { // we already have them, just display the first
      // images div should aready be visible, start showing images
      this.showImage();
    } else {
      Effect.Appear("imagesdiv"); // start making it appear while we fetch the images
      // call async photo population
      new Ajax.Request('images', {asynchronous:true, evalScripts:true, parameters:{id:this.dbid}});
    }
  },

  // callback for when async call just updated our list of photos
  imagesUpdated: function() {
    this.photoURLsAreLoaded = true;
//    var collected = "Here's stuff ("+this.dbid+"):\n";
//    Spots.allProperties.each( function(prop) {
//                                collected += prop.dbid + " - " + prop.allPhotos.length + "\n";
//                              } );
//    alert(collected);
    this.initializeImage();
  },

  addPhotoURL: function(url) {
    this.allPhotos.push(url);
  },

  addToResults: function() {
    $("resultsbody").appendChild(this.createResultNode());
  },

  createResultNode: function() {
    var type = Builder.node("td",
                            {className: "markercode marker_"+this.typecode,
                             onclick: "return Spots.showBubble("+this.seqnum+");return false"},
                            this.seqnum);
    var link = Builder.node("a", {href: this.link, target: "_blank", title:this.address}, this.price);
    var price = Builder.node("td", {className: "price"}, [link]);
    var dolpersqft = Builder.node("td", {className: "dolpersqft"}, Math.round(this.dolpersqft));
    var beds = Builder.node("td", {className: "bedrooms"}, this.bedrooms);
    var baths = Builder.node("td", {className: "bathrooms"}, this.bathrooms);
    var halfbaths = Builder.node("td", {className: "bathroomshalf"}, this.bathroomshalf);
    var sqft = Builder.node("td", {className: "sqft"}, this.sqft);
    var ohstart = Builder.node("td", {className: "ohstarttime"}, this.ohstarttime);
    var ohend = Builder.node("td", {className: "ohendtime"}, this.ohendtime);

    var row = Builder.node("tr");
    row.appendChild(type);
    row.appendChild(price);
    row.appendChild(sqft);
    row.appendChild(dolpersqft);
    row.appendChild(beds);
    row.appendChild(baths);
    row.appendChild(halfbaths);
    row.appendChild(ohstart);
    row.appendChild(ohend);

    this.resultrow = row; // so we can highlight it on mouseover of marker

    return row;
  }
	

}
