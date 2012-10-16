// Global vars
var itemsDaysToExpire = 1, defaultSectionHTML = "index.html", selectedOrigen = null, selectedDestino = null;

// plugin configs
jQuery(function($){
    /* InicializaciÃ³n en espaÃ±ol para la extensiÃ³n 'UI date picker' para jQuery. */
    /* Traducido por Vester (xvester@gmail.com). */
    $.datepicker.regional['es'] = {
    closeText: 'Cerrar',
    prevText: '&#x3c;Ant',
    nextText: 'Sig&#x3e;',
    currentText: 'Hoy',
    monthNames: ['Enero','Febrero','Marzo','Abril','Mayo','Junio',
    'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
    monthNamesShort: ['Ene','Feb','Mar','Abr','May','Jun',
    'Jul','Ago','Sep','Oct','Nov','Dic'],
    dayNames: ['Domingo','Lunes','Martes','Mi&eacute;rcoles','Jueves','Viernes','S&aacute;bado'],
    dayNamesShort: ['Dom','Lun','Mar','Mi&eacute;','Juv','Vie','S&aacute;b'],
    dayNamesMin: ['Do','Lu','Ma','Mi','Ju','Vi','S&aacute;'],
    weekHeader: 'Sm',
    dateFormat: 'dd/mm/yy',
    firstDay: 1,
    isRTL: false,
    showMonthAfterYear: false,
    yearSuffix: ''};
    $.datepicker.setDefaults($.datepicker.regional['es']);
});
$(function(){
    // Dialog
    $('#dialog').dialog({
        autoOpen: false,
        width: 350,
        modal: true,
        buttons: {
            "Aceptar": function() {
                $(this).dialog("close");
            }
        }
    });
    // Dialog Link
    $('#dialog_link').click(function(){
        $('#dialog').dialog('open');
        return false;
    });
});

// Social stuff
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
//(function(d, s, id) {var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) return;js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/es_LA/all.js#xfbml=1";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));

// Local Items
var local = { // De momento usamos localStorage, recordar que si el navegador no dispone de la opcion decae automaticamente en cookie
    get: function (sItems) {
        var items = localStorage.getItem(sItems);
        var retValue = null;
        if (items !== null) {
            var datedItems = JSON.parse(items);
            var today = new Date();
            today.setDate(today.getDate());
            if (new Date(datedItems.dateTime) > today) {
                retValue = datedItems.items;
            } else {
                localStorage.removeItem(sItems);
            }
        }
        if (typeof retValue == "undefined") {
            retValue = null;
        }
        return retValue;
    },
    set: function (items, sItems) {
        var tomorrow = new Date();
        var today = new Date();
        tomorrow.setDate(today.getDate() + itemsDaysToExpire);
        localStorage.setItem(sItems, JSON.stringify({ dateTime: tomorrow, items: items }));
    },
    add: function (item) {
        var items = this.Get();
        if (items !== null) {
            items.push(item);
            this.set(items);
        } else {
            this.set(item);
        }
    },
    remove: function (item) {
        var items = this.Get();
        if (items !== null) {
            var i, total = items.length;
            for (i = 0; i < total; i++) {
                if (items[i].id == item.id) {
                    items.splice(i, 1);
                    this.set(items);
                    break;
                }
            }
        }
    },
    reset: function (sItems) {
        this.set([], sItems);
    }
};

// Links
var sections = {
    impo: {
        html: "importacion.html",
        initialize: initImpo
    },
    impoResults: {
        html: "importacion-transportes.html",
        initialize: initImpoResults
    },
    expo: {
        html: "exportacion.html",
        load: loadExpo,
        initialize: function () {
            // TODO: implement
        }
    },
    home: {
        html: "index.html",
        initialize: initHome
    },
    register: {
        html: "registro.html",
        initialize: function () {
            // TODO: implement 
        }
    }
};
function goTo (section, transitionType) {
    //$.get(section.html, section.load);
    $("#cntBody").load(section.html + "  .container", section.initialize);
}
function loadContent (section, target, where, success) {
    $(where).load(section.html + " " + target, success);
}

// Services
function callService(Type, urlServicemethod, Data, SuccessFunction) {
    var Url, ContentType, DataType, ProcessData;
    Url = servicesURL + urlServicemethod;
    ContentType = "application/json; charset=utf-8";
    DataType = "json";
    ProcessData = true;

    $.ajax({
        type: Type,
        url: Url,
        data: Data,
        contentType: ContentType,
        dataType: DataType,
        processdata: ProcessData,
        timeout: 90000, // un minuto y medio de timeout
        beforeSend: function(XMLHttpRequest) {
            //Loader.ShowLoading();
        },
        success: function(response) {
            Loader.CloseLoading();
            var JSONresponse = JSON.parse(response);
            switch(JSONresponse.status) {
                case "ok":
                    // funcionamiento correcto
                    SuccessFunction(JSONresponse);
                    break;
                case "error":
                    // errores controlados desde el servidor
                    popupMsg.error("Al parecer ha ocurrido algun problema, puedes intentarlo nuevamente mas tarde. Disculpa las molestias.");
                    //popupMsg.error(JSONresponse.msg); // debug
                    break;
                case "auth-error":
                    // error de autenticacion o token vencido
                    localStorage.removeItem("AuthToken");
                    break;
                case "warning":
                    // error/advertencia deberia indicarle algo al usuario
                    popupMsg.error(JSONresponse.msg);
                    break;
                default:
                    // tipos no definidos que maneja el Success
                    SuccessFunction(JSONresponse);
                    break;
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            Loader.CloseLoading();
            if(textStatus === "timeout") {
                // Atrapar errores de comunicacion para decirle que debe estar conectado a internet 
                popupMsg.error("Al parecer tu conexion a Internet se ha perdido o es muy lenta, intentalo nuevamente mas tarde.");
            } else if (textStatus === "error") {
                if(!navigator.onLine) {
                    // Atrapar errores de comunicacion para decirle que debe estar conectado a internet 
                    popupMsg.error("Debes estar conectado a Internet continuar.");
                } else {
                    popupMsg.error("Al parecer ha ocurrido algun problema, puedes intentarlo nuevamente mas tarde. Disculpa las molestias.");
                    //popupMsg.error(errorThrown); // debug
                }
            } else {
                // Sino muestro error generico y pido disculpas, el log esta en el Server
                popupMsg.error("Al parecer ha ocurrido algun problema, puedes intentarlo nuevamente mas tarde. Disculpa las molestias.");
                //popupMsg.error(errorThrown); // debug
            }
        }
    });
}
var services = {
    common: {
        serviceURL: "/Service/",
        login: function (user, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "Login";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, user, Success);
        },
        register: function (user, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "Register";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, user, Success);
        },
        getTarifas: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "GetTarifasBySearch";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, data, Success);
        },
        recoverPassword: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "RecoverPassword";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, data, Success);
        },
        getOrigenes: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetOrigenes";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, "", Success);
        },
        getDestinos: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetDestinos";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, "", Success);
        },
        getCapacidades: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetCapacidades";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, "", Success);
        },
        getMedidas: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetMedidas";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, "", Success);
        }
    },
    user: {
        serviceURL: "/Service/",
        getUser: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "GetUser";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, data, Success);
        },
        editUser: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "EditUser";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, data, Success);
        },
        editPassword: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "EditPassword";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, data, Success);
        }
    }

};

// Sections Loader
function loadExpo(sHtml) {

}

// Sections Initializer
$(document).ready(function () {
    $.support.cors = true;
    initCurrentSection();
});
function getCurrentSection(sSection) {
    var section;
    for (section in sections) {
        section = sections[section];
        if (section.html === sSection) {
            break;
        } else {
            section = null;
        }
    }
    return section;
}
function initCurrentSection() { 
    var sSection = utils.getFileName();
    if(sSection === null) {
        sSection = defaultSectionHTML;
    }
    var section = getCurrentSection(sSection);
    section.initialize();
}

function initHeader() { 
    toogleUserLoginMenus(); // move to a new function initAlways ??
    $("#btnOpenDdUser").on("click", dropdownUserOpen);
    $("#btnCloseDdUser").on("click", dropdownUserClose);
    $("#btnLogoutHeader").on("click", logout);
    $("#btnLoginHeader").on("click", loginHeader);
    $("#btnAddUserHeader").on("click", function(){ goTo(sections.register); } );
}
function initImpo() {
    initHeader();
    $("#btnRegisterAside").on("click", function(){ goTo(sections.expo); });
    $("#btnLoginAside").on("click", loginAside);
    $("#txtFecha").datepicker({ minDate: 0 });
    $("#selTipoCarga").on("change", toogleContenedores);
    $("#nextStep").on("click", searchTarifas);
    $("#lnkPaso2").on("click", searchTarifas);
    $("#btnFCLAgregar").on("click", addFCLItem);
    $("#btnLCLAgregar").on("click", addLCLItem);
    $("#tblFCLItems button.btn-eliminar").live("click", deleteFCLItem);
    $("#tblLCLItems button.btn-eliminar").live("click", deleteLCLItem);

    toogleContenedores();
    loadFCLCapacidades();
    loadLCLMedidas();
    loadDestinos();
    loadOrigenes();
    loadSearch();
}
function initImpoResults() {
    initHeader();
    $("#txtFecha").datepicker({ minDate: 0 });
    $("#selTipoCarga").on("change", toogleContenedores);
    $("#btnAsideSearch").on("click", searchTarifas);
    $("#btnFCLAgregar").on("click", addFCLItem);
    $("#btnLCLAgregar").on("click", addLCLItem);
    $("#tblFCLItems button.btn-eliminar").live("click", deleteFCLItem);
    $("#tblLCLItems button.btn-eliminar").live("click", deleteLCLItem);

    toogleContenedores();
    loadFCLCapacidades();
    loadLCLMedidas();
    loadOrigenes();
    loadDestinos();

    loadSearch();
    loadResults();
}
function initHome() {
    initHeader();
}

// Authentication, login, register
function getToken() {
    return localStorage.getItem("AuthToken");
}
function JustGetToken() {
    // Se debe utilizar solo en el login
    return localStorage.getItem("AuthToken");
}
var auth = function() {
    return { Token: getToken(), AppVersion: appVersion };
};
function logout() { 
    localStorage.removeItem("AuthToken");
    goTo(sections.home);
}
function loginHeader(e) {
    var user = JSON.stringify({ 
        User: {
            Email: $("#txtEmailHeader").val(),
            Password: $("#txtEmailHeader").val()
        }
    });
    services.common.login(user, function () { });
    e.preventDefault();
    e.stopPropagation();
}
function loginAside(e) {
    var user = JSON.stringify({ 
        User: {
            Email: $("#txtEmailAside").val(),
            Password: $("#txtEmailAside").val()
        }
    });
    services.common.login(user, function () { });
    e.preventDefault();
    e.stopPropagation();
}

// DOM manipulation functions
function toogleUserLoginMenus() { 
    if(getToken() !== null) {
        $("#userEmailHeader").val(local.user.get().Email);
        $("#cntLoginHeader").css("display", "none");
        $("#cntUserHeader").css("display", "block");
        $("#cntLoginAside").css("display", "none");
    } else {
        $("#cntLoginHeader").css("display", "block");
        $("#cntUserHeader").css("display", "none");
        $("#cntLoginAside").css("display", "block");
    }
}
function dropdownUserOpen() {
    document.getElementById("dropdownUser").style.display="block";
    document.getElementById("btnOpenDdUser").style.display="none";
    document.getElementById("btnCloseDdUser").style.display="inline";
}
function dropdownUserClose() {
    document.getElementById("dropdownUser").style.display="none";
    document.getElementById("btnOpenDdUser").style.display="inline";
    document.getElementById("btnCloseDdUser").style.display="none";
}
function filterOrigen(e) {
    var filterText = $("#txtOrigen").val();
    if (filterText.length > 0) {
        var items = local.get("origen"), total = items.length, i, totalVisible = 0;
        for(i = 0; i < total; i++) {
            if (items[i].Puerto.toLowerCase().search(filterText) >= 0 || items[i].Pais.toLowerCase().search(filterText) >= 0) {
                $("#origenItem-" + items[i].IDPuerto).css("display", "block");
                totalVisible++;
            } else { 
                $("#origenItem-" + items[i].IDPuerto).css("display", "none");
            }
        }
        if (totalVisible > 0) {
            $("#origenFilterList").show();
        } else { 
            $("#origenFilterList").hide();
        }
    } else { 
        $("#origenFilterList").hide();
    }
}
function filterDestino(e) {
    var filterText = $("#txtDestino").val();
    if (filterText.length > 0) {
        var items = local.get("destino"), total = items.length, i, totalVisible = 0;
        for(i = 0; i < total; i++) {
            if (items[i].Puerto.toLowerCase().search(filterText) >= 0 || items[i].Pais.toLowerCase().search(filterText) >= 0) {
                $("#destinoItem-" + items[i].IDPuerto).css("display", "block");
                totalVisible++;
            } else { 
                $("#destinoItem-" + items[i].IDPuerto).css("display", "none");
            }
        }
        if (totalVisible > 0) {
            $("#destinoFilterList").show();
        } else { 
            $("#destinoFilterList").hide();
        }
    } else { 
        $("#destinoFilterList").hide();
    }
}
function loadFCLCapacidades() {
    var items = local.get("capacidades");
    if(items !== null) {
        loadFCLCapacidadesItems(items);
    } else {
        services.common.getCapacidades(function (response) {
            loadFCLCapacidadesItems(response.msg);
            local.set(response.msg, "capacidades");
        });
    }
}
function loadFCLCapacidadesItems(items){
    var total = items.length, i;
    for(i = 0; i < total; i++) {
        $('#selFCLCapacidad').append($(document.createElement("option")).
        attr("value",items[i].IDTipo).text(items[i].Descripcion));
    }
}
function loadLCLMedidas() { 
    var items = local.get("medidas");
    if(items !== null) {
        loadLCLMedidasItems(items);
    } else {
        services.common.getMedidas(function (response) {
            loadLCLMedidasItems(response.msg);
            local.set(response.msg, "medidas");
        });
    }
}
function loadLCLMedidasItems(items) {
    var total = items.length, i;
    for(i = 0; i < total; i++) {
        $('#selLCLMedida').append($(document.createElement("option")).
        attr("value",items[i].IDTipo).text(items[i].Descripcion));
    }
}
function toogleContenedores() {
    if ($("#selTipoCarga").val() === "fcl") {
        $("#cntFCLContenedores").show();
        $("#cntLCLContenedores").hide();
    } else { 
        $("#cntFCLContenedores").hide();
        $("#cntLCLContenedores").show();
    }
}
function loadOrigenes(response) {
    var items = local.get("origen");
    if (items !== null) {
        loadOrigenesItems(items);
    } else {
        services.common.getOrigenes(function (response) {
            local.set(response.msg, "origen");
            loadOrigenesItems(response.msg);
        });
    }
}
function loadOrigenesItems(items) {
    var total = items.length, i;
    var ul = document.createElement("ul");
    $(ul).attr("class", "list-filter").attr("id","origenFilterList");
    for(i = 0; i < total; i++) {
        $(ul).append($(document.createElement("li")).
        attr("id", "origenItem-" + items[i].IDPuerto).text(items[i].Puerto + ", " + items[i].Pais ));
    }
    $('#cntOrigen').append(ul);
    $("#txtOrigen").on("keyup", filterOrigen);
    $(ul).children().on("click", selectOrigen);
}
function loadDestinos(response) {
    var items = local.get("destino");
    if (items !== null) {
        loadDestinosItems(items);
    } else {
        services.common.getDestinos(function (response) {
            local.set(response.msg, "destino");
            loadDestinosItems(response.msg);
        });
    }
}
function loadDestinosItems(items) {
    var total = items.length, i;
    var ul = document.createElement("ul");
    $(ul).attr("class", "list-filter").attr("id","destinoFilterList");
    for(i = 0; i < total; i++) {
        $(ul).append($(document.createElement("li")).
        attr("id","destinoItem-" + items[i].IDPuerto).text(items[i].Puerto + ", " + items[i].Pais ));
    }
    $('#cntDestino').append(ul);
    $("#txtDestino").on("keyup", filterDestino);
    $(ul).children().on("click", selectDestino);
}
function selectOrigen() {
    $("#txtOrigen").val($(this).text());
    $("#origenFilterList").hide();
    selectedOrigen = parseInt($(this).attr("id").split("-")[1], 10);
    $("#txtDestino").focus();
}
function selectDestino() {
    $("#txtDestino").val($(this).text());
    $("#destinoFilterList").hide();
    selectedDestino = parseInt($(this).attr("id").split("-")[1], 10);
    $("#txtFecha").focus();
}
function addFCLItem() {
    var cant = $("#txtFCLCantidad").val();
    if (!isNaN(parseFloat(cant))) {
        $("#tblFCLItems > tbody:last").append('<tr id="fclItemId-' + $("#selFCLCapacidad option:selected").val() + '" data-cant="' + cant + '" >' +
            '<td><button class="btn-eliminar" title="Eliminar"><img src="img/btn-eliminar.png" alt="Eliminar"></button></td>' +
            '<td><label>' + cant + '</label> contenedores de <label>' + $("#selFCLCapacidad option:selected").text() + '</label></td>' +
            '</tr>');
        $("#txtFCLCantidad").val("");
    } else {
        popupMsg.error("debe escribir una cantidad correcta.");
    }
}
function deleteFCLItem(e) {
    $(this).parent().parent().remove();
    e.preventDefault();
    e.stopPropagation();
}
function addLCLItem() {
    var cant = $("#txtLCLCantidad").val();
    if (!isNaN(parseFloat(cant))) {
        $("#tblLCLItems > tbody:last").append('<tr id="lclItemId-' + $("#selLCLMedida option:selected").val() + '" >' +
            '<td><button class="btn-eliminar" title="Eliminar"><img src="img/btn-eliminar.png" alt="Eliminar"></button></td>' +
            '<td><label>' + cant + '</label> contenedores de <label>' + $("#selLCLMedida option:selected").text() + '</label></td>' +
            '</tr>');
        $("#txtLCLCantidad").val("");
    } else {
        popupMsg.error("debe escribir una medida correcta.");
    }
}
function deleteLCLItem() {
    $(this).parent().parent().remove();
    e.preventDefault();
    e.stopPropagation();
}
function searchTarifas(e) {
    if (searchIsValid()) {
        var items, i, cant = [], search;
        if ($("#selTipoCarga").val() === "fcl") {
            items = $("#tblFCLItems > tbody").children()
        } else { 
            items = $("#tblLCLItems > tbody").children()
        }
        for (i = 0; i < items.length; i++) {
            cant.push({Key: $(items[i]).attr("id").split("-")[1], Value: $(items[i]).attr("data-cant") });
        }
        search = {
            Tipo: $("#selTipoCarga").val(),
            IDPuertoOrigen: selectedOrigen,
            IDPuertoDestino: selectedDestino,
            FechaSalida: $("#txtFecha").val(),
            TipoCantidades: cant
        };
        services.common.getTarifas(JSON.stringify({ search: search }), function (response) {
            if (response.status === "ok") {
                local.set(response.msg, "searchResults");
                goTo(sections.impoResults);
            } else {
                popupMsg.warning("No se pudieron encontrar resultados para su busqueda.");
            }
        });
        search.Origen = $("#txtOrigen").val();
        search.Destino = $("#txtDestino").val();
        local.set(search, "search");
    } else {
        popupMsg.error("Debe completar todo los datos del formulario para continuar");
    }
    e.preventDefault();
    e.stopPropagation();
}
function searchIsValid() {
    var valid = true;
    if (selectedDestino === null) {
        valid = false;
    }
    if (selectedOrigen === null) {
        valid = false;
    }
    if (!utils.validation.date($("#txtFecha").val())) {
        valid = false;
    }
    if ($("#selTipoCarga").val() === "fcl") {
        var items = $("#tblFCLItems > tbody").children();
        if (items.length === 0) {
            valid = false;
        }
    } else {
        var items = $("#tblFCLItems > tbody").children();
        if (items.length === 0) {
            valid = false;
        }
    }
    return valid;
}
function loadSearch() {
    item = local.get("search");
    if (item !== null) {
        $("#txtFecha").val(item.FechaSalida);
        $("#selTipoCarga").val(item.Tipo);
        selectedDestino = item.IDPuertoDestino;
        selectedOrigen = item.IDPuertoOrigen;
        $("#txtOrigen").val(item.Origen);
        $("#txtDestino").val(item.Destino);
        // TODO: load cants
    }
}
function loadResults() {
    $.get("items/result.html", function (sHtml) {
        var items = local.get("searchResults"), i, total = items.length, cnt = $("#cntSearchResults"), search = local.get("search"); ;
        for (i = 0; i < total; i++) {
            var newSHtml = sHtml;
            newSHtml = newSHtml.replace(/%origen%/gi, search.Origen);
            newSHtml = newSHtml.replace(/%destino%/gi, search.Destino);
            newSHtml = replaceVars(newSHtml, items[i]);
            $(cnt).append(newSHtml);
        }
    });
}
function replaceVars(sHtml, item) {
    var vars = sHtml.match(/[%].*[%]/gi);
    var total = vars.length, i;
    for(i = 0; i < total; i++) {
        var setted = false;
        var varName = vars[i].replace(/%/g, "");
        var bar = vars[i];
        var re = new RegExp(bar,"gi");
        for (var prop in item) {
            if (item[prop] !== null && prop.toLowerCase() === varName.toLowerCase()) {
                sHtml = sHtml.replace(re, item[prop]);
                setted = true;
                break;
            }
        }
        if (!setted) {
            sHtml = sHtml.replace(re, "");
        }
    }
    return sHtml;
}