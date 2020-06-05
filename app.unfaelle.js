const Unfälle = function (heatmapLayer) {
    this.heatmapLayer = heatmapLayer;
    this.data = null;
    this.filtereddata = [];

    this.filter = {
        ist: {
            IstRad: true,
            IstPKW: false,
            IstFuss: false,
            IstKrad: false,
            IstGkfz: false,
            IstSonstig: false
        },
        kategorie: {
            1: true,
            2: true,
            3: true
        }
    };
    $.get('./unfaelle.csv?2', function (_csv) {
        this.data = $.csv.toObjects(_csv, { separator: ';', }).filter(function () {
            return (arguments[0].ULAND == '2')
        })
        this.updateView();
    }.bind(this));
    
    /*$.getJSON('./unfaelle.json',function(_csv,status) {
        console.log(status)
        console.log(_csv)
        this.data = _csv;
        this.updateView();
    }.bind(this));*/
    return this;
};
Unfälle.prototype.getFilter = function () {
    return this.filter.ist;
}
Unfälle.prototype.getNearestUnfall = function (lat, lng) {
    console.log(lat + ' ' + lng)
    const myPoint = L.latLng(lat, lng);
    console.log(myPoint)
    this.filtereddata.forEach(function (d) {
        d.dist = L.latLng(d.YGCSWGS84, d.XGCSWGS84).distanceTo(myPoint)
    });
    this.filtereddata.sort(function (a, b) {
        return a.dist - b.dist;
    })
    var event = this.filtereddata[0]
    return event;
};
Unfälle.prototype.getTotal = function (field) {
    var res = {};

    this.data.forEach(function (d, i) {
        !i && console.log(d[field])
        if (!res[d[field]]) res[d[field]] = 1;
        else res[d[field]]++;
    })
    return res;
};


Unfälle.prototype.updateView = function () {
    Log('updateView');
    var myfilters = { ist: [], kategorie: [] };
    Object.keys(this.filter.ist).forEach(function (field) {
        if (this.filter.ist[field] == true) myfilters.ist.push(field);
    }.bind(this));
    Object.keys(this.filter.kategorie).forEach(function (field) {
        if (this.filter.kategorie[field] == true) myfilters.kategorie.push(field);
    }.bind(this));
    this.filtereddata = [];
    Log('filtereddata');
    
    this.data.forEach(function (unfall, ndx) {
        var found = true;
        myfilters.ist.forEach(function (field) {
            if (this.filter.ist[field] == true) {
                if (unfall[field] != 1) found = false;
            }
        }.bind(this));
        if (found && myfilters.ist.length > 0) this.filtereddata.push(unfall);
        var selectedcategories = myfilters.kategorie;
        this.filtereddata = this.filtereddata.filter(function (u) {
            var kategorie = u.UKATEGORIE;
            return (selectedcategories.indexOf(kategorie) > -1);
        });

    }.bind(this));
    Log('heatdata');
    const heatdata = this.filtereddata.map(function (d) {
        return {
            count: d.UKATEGORIE * 5,
            lat: parseFloat(d.YGCSWGS84.replace(',', '.')),
            lng: parseFloat(d.XGCSWGS84.replace(',', '.'))
        };
    });
    Log('setdata');
    this.heatmapLayer.setData({ data: heatdata });
}


Unfälle.prototype.setIst = function (field, enabled) {
    if (field)
        this.filter.ist[field] = enabled ? true : false;
    this.updateView();
}
Unfälle.prototype.setKategorie = function (field, enabled) {
    if (field)
        this.filter.kategorie[field] = enabled;
    this.updateView();
}
Unfälle.prototype.hide = function () {
    this.heatmapLayer.setData({ data: [] });

}
Unfälle.prototype.show = function () {

    this.updateView();
}