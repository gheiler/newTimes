/// <reference path="js/libs/jquery-1.8.2-vsdoc.js" />
/// <reference file="js/libs/jquery-1.8.2-vsdoc.js" />

// Global vars
var itemsDaysToExpire = 1, defaultSectionHTML = "index.html", selectedOrigen = null, selectedDestino = null, justChangePage = false, defaultLanguage;
var currencies = {
    USD: {
        ARS: 4.72
    },
    ARS: {
        USD: 0.211864406779661
    }
};
var languages = { 
    es: {
        name: "es",
        file: "lang/es.txt",
        data: null
    },
    en: {
        name: "en",
        file: "lang/en.txt",
        data: null
    } 
}

defaultLanguage = languages.es;

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
(function(window,undefined){
    // Prepare
    var History = window.History;
    // Bind to StateChange Event
    History.Adapter.bind(window,'statechange',function() {
        //var State = History.getState();
        if(!justChangePage) {
            goToCurrentSection();
        } else {
            justChangePage = false;
        }
        // History.pushState(null, null, "?state=4"); -> logs {}, "", "?state=4"',
    });
})(window);
$(document).keyup(function(e) {
  // on esc
  if (e.keyCode == 27) {
      $(".dialog-box").remove();
  }
});

// Social stuff
!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");
//(function(d, s, id) {var js, fjs = d.getElementsByTagName(s)[0];if (d.getElementById(id)) return;js = d.createElement(s); js.id = id;js.src = "//connect.facebook.net/es_LA/all.js#xfbml=1";fjs.parentNode.insertBefore(js, fjs);}(document, 'script', 'facebook-jssdk'));

// Local Items
var local = { // De momento usamos localStorage, recordar que si el navegador no dispone de la opcion decae automaticamente en cookie
    get: function (key) {
        var items = localStorage.getItem(key);
        var retValue = null;
        if (items !== null) {
            var datedItems = JSON.parse(items);
            // fucking IE8<
            //var today = new Date();
            //today.setDate(today.getDate());
            //if (new Date(datedItems.dateTime) > today) {
                retValue = datedItems.items;
            //} else {
            //    localStorage.removeItem(sItems);
            ///
        }
        if (typeof retValue == "undefined") {
            retValue = null;
        }
        return retValue;
    },
    set: function (items, key, daysToExpire) {
        var tomorrow = new Date();
        var today = new Date();
        if(daysToExpire !== undefined) {
            tomorrow.setDate(today.getDate() + daysToExpire);
        } else {
            tomorrow.setDate(today.getDate() + itemsDaysToExpire);
        }
        localStorage.setItem(key, JSON.stringify({ dateTime: tomorrow, items: items }));
    },
    add: function (item) {
        var items = this.get();
        if (items !== null) {
            items.push(item);
            this.set(items);
        } else {
            this.set(item);
        }
    },
    removeItem: function (item, id) {
        var items = this.get(item);
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
    remove: function (key) {
        localStorage.removeItem(key);
    },
    getByPropVal: function (key, prop, val) {
        var items = localStorage.getItem(key);
        var retValue = null;
        if (items !== null) {
            var datedItems = JSON.parse(items);
            var i, total = datedItems.items.length;
            for (i = 0; i < total; i++) {
                if (datedItems.items[i].IdTarifario == val) {
                    return datedItems.items[i];
                }
            }
        }
        if (typeof retValue == "undefined") {
            retValue = null;
        }
        return retValue;
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
    impoConfirm: {
        html: "importacion-confirmacion.html",
        initialize: initImpoConfirm
    },
    expo: {
        html: "exportacion.html",
        initialize: function () {
            // TODO: implement
        }
    },
    home: {
        html: "index.html",
        initialize: initHome
    },
    register: {
        html: "items/registro.html",
        initialize: initRegister
    },
    contact: {
        html: "contacto.html",
        initialize: initContacto
    }
};
function goTo (section, transitionType) {
    $("#cntBody").load(section.html + "  .container", section.initialize);
    justChangePage = true;
    History.pushState(null, null, section.html);
}
function loadContent (section, target, where, success) {
    $(where).load(section.html + " " + target, success);
}

// Services
function callService(type, urlServicemethod, data, successFunction, contentType, processData) {
    var url, contentType, dataType, processData;
    url = servicesURL + urlServicemethod;
    if (typeof contentType == "undefined") {
        contentType = "application/json; charset=utf-8";
        dataType = "json";
    }
    if(typeof contentType == "undefined") {
        processData = true;
    }

    $.ajax({
        type: type,
        url: url,
        data: data,
        contentType: contentType,
        dataType: dataType,
        processdata: processData,
        timeout: 90000, // un minuto y medio de timeout
        beforeSend: function (XMLHttpRequest) {
            //loader.show();
        },
        success: function (response) {
            loader.close();
            var JSONresponse = JSON.parse(response);
            switch (JSONresponse.status) {
                case "ok":
                    // funcionamiento correcto
                    successFunction(JSONresponse);
                    break;
                case "error":
                    // errores controlados desde el servidor
                    popupMsg.error("Al parecer ha ocurrido algun problema, puedes intentarlo nuevamente mas tarde. Disculpa las molestias.");
                    //popupMsg.error(JSONresponse.msg); // debug
                    break;
                case "auth-error":
                    // error de autenticacion o token vencido
                    logout();
                    popupMsg.error("Debe estar logeado para realizar esa accion.");
                    break;
                case "warning":
                    // error/advertencia deberia indicarle algo al usuario
                    popupMsg.error(JSONresponse.msg);
                    break;
                default:
                    // tipos no definidos que maneja el Success
                    successFunction(JSONresponse);
                    break;
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            loader.close();
            if (textStatus === "timeout") {
                // Atrapar errores de comunicacion para decirle que debe estar conectado a internet 
                popupMsg.error("Al parecer tu conexion a Internet se ha perdido o es muy lenta, intentalo nuevamente mas tarde.");
            } else if (textStatus === "error") {
                if (!navigator.onLine) {
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
function callServiceBackground(type, urlServicemethod, data, successFunction, contentType, processData) {
    var url, contentType, dataType, processData;
    url = servicesURL + urlServicemethod;
    contentType = "application/json; charset=utf-8";
    dataType = "json";
    processData = true;

    $.ajax({
        type: type,
        url: url,
        data: data,
        contentType: contentType,
        dataType: dataType,
        processdata: processData,
        timeout: 90000,
        success: function (response) {
            var JSONresponse = JSON.parse(response);
            successFunction(JSONresponse);
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
            loader.show();
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
            callServiceBackground(type, urlServicemethod, "", Success);
        },
        getDestinos: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetDestinos";
            urlServicemethod = this.serviceURL + method;
            callServiceBackground(type, urlServicemethod, "", Success);
        },
        getCapacidades: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetCapacidades";
            urlServicemethod = this.serviceURL + method;
            callServiceBackground(type, urlServicemethod, "", Success);
        },
        getMedidas: function (Success) {
            var type, method, urlServicemethod;
            type = "GET";
            method = "GetMedidas";
            urlServicemethod = this.serviceURL + method;
            callServiceBackground(type, urlServicemethod, "", Success);
        },
        contact: function (data, success) { 
            var type, method, urlServicemethod;
            type = "POST";
            method = "Contact";
            urlServicemethod = this.serviceURL + method;
            callServiceBackground(type, urlServicemethod, data, success);
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
        },
        confirmTarifa: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "BuyTarifa";
            urlServicemethod = this.serviceURL + method;
            callService(type, urlServicemethod, data, Success);
        },
        uploadFile: function (data, Success) {
            var type, method, urlServicemethod;
            type = "POST";
            method = "fileUpload.ashx";
            urlServicemethod = this.serviceURL + method;
            /*var file = $("form.confirmacion")[0][1].files[0];
            var formData = new FormData();
            formData.append("data", file);
            $.ajax({
            url: servicesURL + urlServicemethod,
            type: type,
            xhr: function () {
            myXhr = $.ajaxSettings.xhr();
            if (myXhr.upload) { // if upload property exists
            //myXhr.upload.addEventListener('progress', progressHandlingFunction, false); // progressbar
            }
            return myXhr;
            },
            success: Success,
            error: errorHandler = function () {
            alert("Ha ocurrido un error subiendo el archivo");
            },
            data: formData,
            cache: false,
            contentType: false,
            processData: false
            }, "json");*/
        }
    }

};

// Sections Initializer
$(document).ready(function () {
    $.support.cors = true;
    initCurrentSection();
});
function getCurrentSection(sSection) {
    var state = History.getState(), sSection = null, section;
    if(state !== null) {
        if(state.hash.indexOf("/") === 0) {
            sSection = state.hash.substr(1);
        } else {
            sSection = state.hash;
        }
    } else {
        sSection = defaultSectionHTML;
    }
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
    var section = getCurrentSection();
    if(section !== null) {
        section.initialize();
    } else {
        initHeader();
    }
    initCurrentLanguage();
}
function goToCurrentSection() {
    var section = getCurrentSection();
    $("#cntBody").load(section.html + " .container", function () {
        section.initialize();
        initCurrentLanguage();
    });
}

function initHeader() { 
    toogleUserLoginMenus(); // move to a new function initAlways ??
    $("#btnOpenDdUser").on("click", dropdownUserOpen);
    $("#btnCloseDdUser").on("click", dropdownUserClose);
    $("#btnLogoutHeader").on("click", logout);
    $("#btnLoginHeader").on("click", submitLoginHeader);
    $("#btnAddUserHeader").on("click", loadRegister);
    $("#langEs").on("click", function () { changelanguage("es"); return false; });
    $("#langEn").on("click", function () { changelanguage("en"); return false; });

    initFooter();
}
function initFooter() { 
    $("#langEsFoot").on("click", function () { changelanguage("es"); return false; });
    $("#langEnFoot").on("click", function () { changelanguage("en"); return false; });
}
function initImpo() {
    initHeader();
    $("#btnRegisterAside").on("click", loadRegister);
    $("#btnLoginAside").on("click", submitLoginAside);
    $("#txtFecha").datepicker({ minDate: 0 });
    $("#selTipoCarga").on("change", toogleContenedores);
    $("#nextStep").on("click", searchTarifas);
    $("#lnkPaso2").on("click", searchTarifas);
    $("#lnkPaso3").on("click", function(e){ return false; });
    $("#btnFCLAgregar").on("click", addFCLItem);
    $("#btnLCLAgregar").on("click", addLCLItem);
    $("#tblFCLItems button.btn-eliminar").live("click", deleteFCLItem);
    $("#tblLCLItems button.btn-eliminar").live("click", deleteLCLItem);

    toogleContenedores();
    loadFCLCapacidades();
    loadLCLMedidas();
    loadDestinos();
    loadOrigenes();
    //loadSearch();
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
    $("#cntOrder a").on("click", orderResults);
    $("#cntMoney a").on("click", currencyResults);

    toogleContenedores();
    loadFCLCapacidades();
    loadLCLMedidas();
    loadOrigenes();
    loadDestinos();

    loadSearch();
    loadResults();
}
function initImpoConfirm() {
    initHeader();
    loadSelectedResult();
}
function initHome() {
    initHeader();
}
function initRegister() {
    $("#btnRegisterDialog").on("click", submitRegister);
}
function initContacto() {
    initHeader();

    $("#sendContact").on("click", contact);
}

// Authentication, login, register
function getToken() {
    return localStorage.getItem("AuthToken");
}
var auth = function() {
    return { Token: getToken(), AppVersion: appVersion, Device: deviceUA };
};
function logout() { 
    localStorage.removeItem("AuthToken");
    local.remove("user");
    toogleUserLoginMenus();
}
function loadRegister() {
    $.get(sections.register.html, function (sHtml) {
        $("#cntBody").append(sHtml);
        initCurrentLanguage("#cntBody");
        sections.register.initialize();
    });
}
function submitLoginHeader(e) {
    submitLogin($("#txtEmailHeader").val(), $("#txtPasswordHeader").val());
    return false;
}
function submitLoginAside(e) {
    submitLogin($("#txtEmailAside").val(), $("#txtPasswordAside").val());
    return false;
}
function submitLogin(mail, pass) {
    if(mail === "" || pass === "") {
        popupMsg.error("Debes escribir un email y passwor valido.");
        return;
    }
    var user = JSON.stringify({ 
        email: mail,
        password: pass
    });
    var userData = { 
        Email: mail
    };
    local.set(userData, "user", 30);
    services.common.login(user, function (response) {
        localStorage.setItem("AuthToken", response.msg);
        setLogged();
    });
}
function submitRegister() {
    var name = $("#txtNameRegDlg").val(), lastName = $("#txtLastNameRegDlg").val(), email = $("#txtEmailRegDlg").val(), pass = $("#txtPassRegDlg").val(), pass2 = $("#txtPassRegDlg2").val(), valid = true;
    if(name === "" || lastName === "" || email === "" || pass === "" || pass2 === "") {
        valid = false;
        popupMsg.error("Debes completar todos los campos.");
        return;
    }
    if(utils.validation.email(email)) {
        valid = false;
        popupMsg.error("Debes escribir un email valido.");
        return;
    }
    if(pass !== pass2) {
        valid = false;
        popupMsg.error("Las contraseñas deben coincidir.");
        return;
    }
    if(valid) {
        loader.show();
        var userData = {
            Nombre: name,
            Apellido: lastName,
            Email: email,
            Password: pass
        };
        local.set(userData, "user", 30);
        services.common.register(JSON.stringify({ user: userData }), function (response) {
            var msg = JSON.parse(response.msg);
            localStorage.setItem("AuthToken", msg.hash);
            setLogged();
            loader.close();
            popupMsg.success(msg.message);
        });
    }
}
function setLogged() {
    toogleUserLoginMenus();
    $(".dialog-box").remove();
}

// Language
function changelanguage(lang, from) {
    var currentLanguage = local.get("lang");
    if (currentLanguage === null) {
        currentLanguage = defaultLanguage;
    }
    if (currentLanguage.name !== lang) {
        currentLanguage = getLanguage(lang);
        local.set(currentLanguage, "lang");
        loader.show();
        if (currentLanguage.data !== null) {
            loadLangTags(currentLanguage.data, from);
        } else {
            $.get(currentLanguage.file, function (data) {
                currentLanguage.data = JSON.parse(data);
                loadLangTags(currentLanguage.data, from);
            });
        }
    }
}
function loadLangTags(langTags, from) {
    if (typeof from == "undefined") { from = "body"; }
    $(from).find("[data-language]").each(function () {
        var langTag = langTags[$(this).attr("data-language")];
        if (langTag !== null && langTag !== "") {
            // TODO: mejorar
            try {
                $(this).text(langTag);
            } catch(ex) {
                $(this).val(langTag);
            }
        }
    });
    loader.close();
}
function getLanguage(lang) {
    var sLang = null;
    for (var language in languages) {
        if (languages[language].name === lang) {
            sLang = languages[language];
        }
    }
    return sLang;
}
function initCurrentLanguage(from) { 
    var currentLanguage = local.get("lang");
    if (currentLanguage !== null) {
        if (currentLanguage !== defaultLanguage.name) {
            local.remove("lang");
            changelanguage(currentLanguage.name);
        }
    }
}

// DOM manipulation functions
function toogleUserLoginMenus() { 
    if(getToken() !== null) {
        $("#userEmailHeader").html(local.get("user").Email);
        $("#cntLoginHeader").css("display", "none");
        $("#cntUserHeader").css("display", "block");
        $("#cntLoginAside").css("display", "none");
        dropdownUserClose();
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

function loadFCLCapacidades() {
    /*var items = local.get("capacidades");
    if(items !== null) {
        loadFCLCapacidadesItems(items);
    } else {
        services.common.getCapacidades(function (response) {
            loadFCLCapacidadesItems(response.msg);
            local.set(response.msg, "capacidades");
        });
    }*/

    services.common.getCapacidades(function (response) {
        loadFCLCapacidadesItems(response.msg);
        local.set(response.msg, "capacidades");
    });
}
function loadFCLCapacidadesItems(items){
    var total = items.length, i;
    for(i = 0; i < total; i++) {
        $('#selFCLCapacidad').append($(document.createElement("option")).
        attr("value",items[i].IDTipo).text(items[i].Descripcion));
    }
}
function loadLCLMedidas() { 
    /*var items = local.get("medidas");
    if(items !== null) {
        loadLCLMedidasItems(items);
    } else {
        services.common.getMedidas(function (response) {
            loadLCLMedidasItems(response.msg);
            local.set(response.msg, "medidas");
        });
    }*/
    services.common.getMedidas(function (response) {
        loadLCLMedidasItems(response.msg);
        local.set(response.msg, "medidas");
    });
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
    // no cache always get from server
    /*var items = local.get("origen");
    if (items !== null) {
        loadOrigenesItems(items);
    } else {
        services.common.getOrigenes(function (response) {
            local.set(response.msg, "origen");
            loadOrigenesItems(response.msg);
        });
    }*/
    services.common.getOrigenes(function (response) {
        local.set(response.msg, "origen");
        loadOrigenesItems(response.msg);
    });
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
    // no cache always get from server
    /*var items = local.get("destino");
    if (items !== null) {
        loadDestinosItems(items);
    } else {
        services.common.getDestinos(function (response) {
            local.set(response.msg, "destino");
            loadDestinosItems(response.msg);
        });
    }*/
    services.common.getDestinos(function (response) {
        local.set(response.msg, "destino");
        loadDestinosItems(response.msg);
    });
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

function addFCLItem(e, tipo, cant) {
    if(typeof tipo == "undefined") {
        tipo = $("#selFCLCapacidad option:selected").val();
    }
    if(typeof cant == "undefined") {
        cant = $("#txtFCLCantidad").val();
    }
    var tipoText = $("#selFCLCapacidad option[value='" + tipo + "']").text();

    $("#tblFCLItems > tbody tr[id='fclItemId-" + tipo + "']").remove();

    if (!isNaN(parseFloat(cant))) {
        $("#tblFCLItems > tbody:last").append('<tr id="fclItemId-' + tipo + '" data-cant="' + cant + '" >' +
            '<td><button class="btn-eliminar" title="Eliminar"><img src="img/btn-eliminar.png" alt="Eliminar"></button></td>' +
            '<td><label>' + cant + '</label> contenedores de <label>' + tipoText + '</label></td>' +
            '</tr>');
        $("#txtFCLCantidad").val("");
        initCurrentLanguage("#tblFCLItems > tbody:last");
    } else {
        popupMsg.error("debe escribir una cantidad correcta.");
    }
}
function deleteFCLItem(e) {
    $(this).parent().parent().remove();
    return false;
}
function addLCLItem(e, tipo, cant) {

    if(typeof tipo == "undefined") {
        tipo = $("#selLCLMedida option:selected").val();
    }
    if(typeof cant == "undefined") {
        cant = $("#txtLCLCantidad").val();
    }
    var tipoText = $("#selLCLMedida option[value='" + tipo + "']").text();

    $("#tblLCLItems > tbody tr[id='lclItemId-" + tipo + "']").remove();

    if (!isNaN(parseFloat(cant))) {
        $("#tblLCLItems > tbody:last").append('<tr id="lclItemId-' + tipo + '" data-cant="' + cant + '" >' +
            '<td><button class="btn-eliminar" title="Eliminar"><img src="img/btn-eliminar.png" alt="Eliminar"></button></td>' +
            '<td><label>' + cant + '</label> contenedores de <label>' + tipoText + '</label></td>' +
            '</tr>');
        $("#txtLCLCantidad").val();
        initCurrentLanguage("#tblLCLItems > tbody:last");
    } else {
        popupMsg.error("debe escribir una medida correcta.");
    }
}
function deleteLCLItem() {
    $(this).parent().parent().remove();
    return false;
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
    return false;
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
        var items = $("#tblLCLItems > tbody").children();
        if (items.length === 0) {
            valid = false;
        }
    }
    return valid;
}
function loadSearch() {
    var item = local.get("search");
    if (item !== null) {
        $("#txtFecha").val(item.FechaSalida);
        $("#selTipoCarga").val(item.Tipo);
        selectedDestino = item.IDPuertoDestino;
        selectedOrigen = item.IDPuertoOrigen;
        $("#txtOrigen").val(item.Origen);
        $("#txtDestino").val(item.Destino);
        if (item.TipoCantidades.length > 0) {
            for(var i = 0; i < item.TipoCantidades.length; i++){
                if (item.Tipo.toLowerCase() === "fcl") {
                    addFCLItem(null, item.TipoCantidades[i].Key, item.TipoCantidades[i].Value);
                } else { 
                    addLCLItem(null, item.TipoCantidades[i].Key, item.TipoCantidades[i].Value);
                }
            }
        }
    }
}
function loadResults() {
    $.get("items/result.html", function (sHtml) {
        var items = local.get("searchResults"), i, total = items.length, cnt = $("#cntSearchResults"), search = local.get("search");
        $(cnt).empty();
        for (i = 0; i < total; i++) {
            var newSHtml = sHtml;
            newSHtml = newSHtml.replace(/%origen%/gi, search.Origen);
            newSHtml = newSHtml.replace(/%destino%/gi, search.Destino);
            newSHtml = newSHtml.replace(/%object%/gi, JSON.stringify(items[i]));
            newSHtml = replaceVars(newSHtml, items[i]);
            $(cnt).append(newSHtml);
            delete items[i].IdTarifario;
            delete items[i].IdCarrier;
            delete items[i].FechaDesde;
            delete items[i].FechaHasta;
        }
        generateGenericFilters(items);
        initCurrentLanguage(cnt);
        $("input[name='btnComprar']").click(comprarTarifario);
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
function currencyResults() {
    var importes = $("[data-name='result-importe']");
    var selectedCurrency = $(this).attr("data-value");
    if(importes.length > 0) {
        var currentCurrency = $(importes[0]).attr("data-value");
        var multiplier = getCurrencyMultiplier(currentCurrency, selectedCurrency);
        if (selectedCurrency != currentCurrency) {
            for (var i = 0; i < importes.length; i++) {
                var currentImporte = parseFloat($(importes[i]).children("span[data-name='importe']").html());
                $(importes[i]).attr("data-value", selectedCurrency);
                $(importes[i]).children("span[data-name='importe']").html(currentImporte * multiplier);
                $(importes[i]).children("span[data-name='currency']").html(selectedCurrency + " ");
            }
        }
    }
    return false;
}
function orderResults() {
    var type = $(this).attr("data-value"), results = local.get("searchResults");
    switch(type) {
        case "minorPrice":
            results.sort(function (a, b) {
                return a.Importe - b.Importe;
            });
            break;
        case "mayorPrice":
            results.sort(function (a, b) {
                return b.Importe - a.Importe;
            });
            break;
    }
    local.set(results, "searchResults");
    loadResults();
    return false;
}
function getCurrencyMultiplier(from, to) {
    return currencies[from][to];
}

function generateGenericFilters(items) { 
    var i, total = items.length, filterIndex, filterList = [];
    for (i = 0; i < total; i++) {
        for (var prop in items[i]) {
            if (items[i][prop] !== null) {
                filterIndex = existFilter(prop, filterList);
                if(filterIndex === null) {
                    filterList.push({ name: prop, items: [items[i][prop]] });
                } else {
                    if (existValueInFilterItems(items[i][prop], filterList[filterIndex].items) === null) {
                        filterList[filterIndex].items.push(items[i][prop]);
                    }
                }
            }
        }
    }
    // implementation
    if (filterList.length > 0) {
        var j, k, filterLength = filterList.length, itemsLength, shtml = "<hr>";
        for (j = 0; j < filterLength; j++) { 
            itemsLength = filterList[j].items.length;
            shtml += "<h6>" + filterList[j].name + "</h6>";
            for (k = 0; k < itemsLength; k++) { 
              shtml += "<input type='checkbox' data-filter='" + filterList[j].name + "' data-value='" + filterList[j].items[k] + "'><label>" + filterList[j].items[k] + "</label><br>";
            }
            shtml += "<hr>";
        }
        $("#cntFilters").html(shtml);
        $("#cntFilters input[type='checkbox']").click(function () {
            var filterEl = $("span.filterme"), l = filterEl.length, m, filter = $(this).attr("data-filter"), value = $(this).attr("data-value"), domElToBeFiltered = [];
            // TODO: evaluar si tengo mas de un filtro a la vez, guardar el nuevo filtro
            for (m = 0; m < l; m++) {
                var val = $(filterEl[m]).html();
                var obj = JSON.parse($(filterEl[m]).html());
                if (obj[filter] !== null && obj[filter].toString() === value) {
                    domElToBeFiltered.push(filterEl[m]);
                }
            }

            if (domElToBeFiltered.length > 0) {
                if ($(this).is(":checked")) {
                    $(filterEl).parent().hide();
                    $(domElToBeFiltered).parent().show();
                    $("#cntFilters input[type='checkbox']").attr("checked", false); // quita todos los filtros
                    $(this).attr("checked", true);
                } else {
                    $(filterEl).parent().show();
                    $(domElToBeFiltered).parent().show();
                    $("#cntFilters input[type='checkbox']").attr("checked", false); // quita todos los filtros
                }
            }
            
        });
    }
}
function existFilter(filter, list) {
    var i, length, exist = null;
    if(typeof list != "undefined" && list.length > 0) {
        length = list.length;
        for(i =0; i < length; i++) {
            if(filter === list[i].name) {
                return i;
            }
        }
    } else {
        return null;
    }
    return exist;
}
function existValueInFilterItems(value, items) {
    var i, length, exist = null;
    if(typeof items != "undefined" && items.length > 0) {
        length = items.length;
        for(i =0; i < length; i++) {
            if(value === items[i]) {
                return i;
            }
        }
    } else {
        return null;
    }
    return exist;
}

function comprarTarifario(){
    var idTarifario = parseInt($(this).attr("id").split("-")[1], 10);
    
    local.set(local.getByPropVal("searchResults",null, idTarifario), "selectTarifario");
    goTo(sections.impoConfirm);
}
function loadSelectedResult() {
    loader.show();
    $.get("items/tarifa.html", function (sHtml) {
        var items = local.get("selectTarifario"), i, total = items.length, cnt = $("#cntResultTarifa"), search = local.get("search");
        var newSHtml = sHtml;
        newSHtml = newSHtml.replace(/%fechaSalida%/gi, search.FechaSalida);
        newSHtml = newSHtml.replace(/%origen%/gi, search.Origen);
        newSHtml = newSHtml.replace(/%destino%/gi, search.Destino);
        var sContenedores = "";
        for (var j = 0; j < search.TipoCantidades.length; j++) {
            sContenedores += "<p><label>" + search.TipoCantidades[j].Key + "</label> <label>Contenedores</label> de <label>" + search.TipoCantidades[j].Value + "</label></p>";
        }
        newSHtml = newSHtml.replace(/%contenedores%/gi, sContenedores);
        newSHtml = replaceVars(newSHtml, items);
        $(cnt).html(newSHtml);
        //$(cnt).append("<iframe src='/upload.html' height='50' width='500' ></iframe>");
        initCurrentLanguage(cnt);
        $("input[name='btnConfirmarCompra']").click(submitUserTarifario);

        // FIXME: fileupload, nada andnuvo de forma async. Agregar un iframe con un aspx y al choto
        /*$('#cntFileUpload').on("change", "input", function () {
        var file = this.files[0];
        $("#filUploading").show();
        services.user.uploadFile(file, function (response) {
        $("#filUploading").hide();
        if (response.status === "not-ok") {
        alert(response.msg);
        }
        });
        });*/
        
        //$.getScript("js/libs/fileupload/jquery.iframe-transport.js", function () {
        //    $.getScript("js/libs/fileupload/jquery.fileupload.js", function () {
        //        $.getScript("js/libs/fileupload/jquery.fileupload-fp.js", function () {
        //            $.getScript("js/libs/fileupload/jquery.fileupload-ui.js", function () {
        //                $.getScript("js/libs/fileupload/main.js", function () {


        //                    $(function () {
        //                        $('#filDocTar').fileupload({
        //                            dataType: 'json',
        //                            url: "http://www.newtimelogistics.com/fileUpload.ashx",
        //                            done: function (e, data) {
        //                                alert(JSON.parse(data).msg);
        //                            }
        //                        });
        //                    });

        //                    $('#filDocTar').bind('change', function (e) {
        //                        $('#filDocTar').fileupload('add', {
        //                            fileInput: $(this)
        //                        });
        //                    });


        //                });
        //            });
        //        });
        //    });
        //});

        loader.close();
    });
}
function submitUserTarifario() {
    loader.show();
    var files = $('#cntBody iframe').contents().find('#filesList').html();
    var idTarifario = $(this).attr("id").split("-")[1];
    var message = $("#txtMessageTar").val();
    services.user.confirmTarifa(JSON.stringify({ auth: auth(), search: local.get("search"), tarifa: local.get("selectTarifario"), msg: message ,fileName: files }), function (response) {
        popupMsg.success(response.msg);
        local.remove("selectTarifario");
        local.remove("searchResults");
        local.remove("search");
        goTo(sections.home);
    });
    return false;
}

function contact() {
    var name = $("#txtNameCon").val(), lastName = $("#txtSurnameCon").val(), email = $("#txtMailcon").val(), tel = $("#txtTelCon").val(), message = $("#txtMessage").val(), valid = true;
    if(name === "" || lastName === "" || email === "" || tel === "" || message === "") {
        valid = false;
        popupMsg.error("Debes completar todos los campos.");
        return false;
    }
    loader.show();
    services.common.contact(JSON.stringify({
        contact: {
            Name: name,
            LastName: lastName,
            Email: email,
            Tel: tel,
            Message: message
        }
    }), function (response) {
        loader.close();
        alert(response.msg);
        goTo(sections.home);
    });
    return false;
}