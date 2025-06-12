"use strict"

window.onload = function () {
    const elencoIndirizzi = $("#elencoIndirizzi")
    const divCourses = $("#courses")
    let materie = []

    getIndirizzi()
    getMiglioriProfessori()

    divCourses.find(".event_filter").find("a").on("click", function () {
        let indirizzo = ($(this).prop("id"))
        let sigla = $(this).text()
        getMateriePerIndirizzo(indirizzo, sigla)
    })

    $("#report-feedback").on("click", function () {
        Swal.fire({
            title: "Scrivi",
            background: "#5163e8",
            color: "#fff",
            html: `
            <div>
                <input type="name" name="name" id="name" placeholder="Nome" autocomplete="on">
                <input type="text" name="email" id="email" pattern="^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$" placeholder="Email">
                <textarea name="message" id="message" placeholder="Lascia un messaggio..."></textarea>
            </div>    
                <style>
                    input {
                        width: 100%;
                        height: 50px;
                        border-radius: 25px;
                        background-color: rgba(249, 235, 255, 0.15);
                        border: none;
                        outline: none;
                        font-weight: 300;
                        padding: 0px 20px;
                        font-size: 14px;
                        color: #fff;
                        margin-bottom: 30px;
                        position: relative;
                        z-index: 3;
                    }

                    input::placeholder {
                        color: #fff;
                    }

                    textarea {
                        width: 100%;
                        height: 120px;
                        border-radius: 25px;
                        background-color: rgba(249, 235, 255, 0.15);
                        border: none;
                        outline: none;
                        font-weight: 300;
                        padding: 20px;
                        font-size: 14px;
                        color: #fff;
                        margin-bottom: 30px;
                        position: relative;
                        z-index: 3;
                    }

                    textarea::placeholder {
                        color: #fff;
                    }
                </style>
            `,
            confirmButtonText: "Invia",
            showCancelButton: true,
            cancelButtonText: "Annulla",
            buttonsStyling: false,
            customClass: {
                confirmButton: 'btn-custom-invia',
                cancelButton: 'btn-custom-annulla'
            }
        })
    })

    async function getIndirizzi() {
        const request = await inviaRichiesta("GET", "/api/getSpecializzazioni")
        if (request) {
            for (const indirizzo in request.data[0]["indirizzi"]) {
                elencoIndirizzi.append(`<li>•${indirizzo}</li>`)
            }
        }
    }

    async function getMateriePerIndirizzo(indirizzo, sigla) {
        $(".event_box").empty()
        $(".event_box").show()
        const request = await inviaRichiesta("GET", "/api/getMateriePerIndirizzo", { indirizzo })
        if (request) {
            for (const item of request.data) {
                materie = [];
                for (const anno in item) {
                    item[anno].forEach(materia => {
                        if (!materie.includes(materia)) {
                            materie.push(materia);
                        }
                    });
                }
            }
            materie.forEach(materia => {
                const div = $(`
                    <div class="col-lg-4 col-md-6 align-self-center mb-30 event_outer">
                        <div class="events_item">
                            <div class="thumb">
                                <a onclick=cercaProfessoriPerMateria('${materia.toLowerCase().trim().replace(/\s+/g, "_")}')><img class="imgMateria" src="assets/images/subjects/${materia.toLowerCase()}.jpg" alt=""></a>
                                <span class="category">${materia}</span>
                            </div>
                            <div class="down-content">
                                <span class="author">${indirizzo}</span>
                                <h4>${materia}</h4>
                            </div>
                        </div>
                    </div>
                `);
                div.hide()
                div.appendTo(".event_box")
                div.find("img").css({ "filter": "brightness(50%)", "transition": "all 400ms" })
                    .on("mouseover", function () {
                        $(this).css({ "filter": "brightness(100%)" })
                    })
                    .on("mouseout", function () {
                        $(this).css({ "filter": "brightness(50%)", "transition": "all 400ms" })
                    });
                div.show(400)
                $(".event_box").css("height", "100%")
            });
        }
    }


    async function getMiglioriProfessori() {
        const request = await inviaRichiesta("GET", "/api/getBestProfessors")
        if (request.data.length > 0) {
            $(".professori").empty()
            creaElencoProfessori(request.data)
        }
    }
}

async function cercaProfessoriPerMateria(materia) {
    let formattedMateria = materia.toLowerCase().trim().replace(/_/g, "")
    console.log(materia, formattedMateria)
    const request = await inviaRichiesta("GET", "/api/getProfessoriPerMateria", { materia: formattedMateria })
    if (request.data.length > 0) {
        $(".professori").empty()
        creaElencoProfessori(request.data)
        $(".event_box").hide()
    }
    else {
        $(".professori").text("Al momento non ci sono professori registrati per la materia " + materia)
    }
}

function creaElencoProfessori(professori) {
    professori.forEach(professore => {
        let div1 = $("<div>").prop("title", "Vedi il profilo").addClass("col-lg-3 col-md-6").appendTo(".professori")
        let div2 = $("<div>").addClass("team-member").appendTo(div1)
        let div3 = $("<div>").addClass("main-content").appendTo(div2)
        $("<img>").prop({ "src": "data:image/jpg;base64," + professore["fotoProfilo"], "alt": "" })
            .on("error", function () {
                $(this).prop({ "src": "assets/images/defaultPfp.jpg", "alt": "" })
            })
            .appendTo(div3)
        $("<span>").text(professore["materia"]).addClass("category").appendTo(div3)
        $("<h4>").text(professore["nome"] + " " + professore["cognome"]).appendTo(div3)
        let starContainer = $("<div>").addClass("star-container").appendTo(div3)
        let mediaVoti = 0
        if(professore["numeroValutazioni"] != 0){
            mediaVoti = professore["sommaValutazioni"] / professore["numeroValutazioni"]
        }
        let nStelle = arrotondaVoto(mediaVoti)
        for (let i = 0; i < nStelle; i++) {
            $("<img>").prop({ "src": "assets/images/gold-star.png", "alt": "" }).appendTo(starContainer)
        }
        for (let i = 0; i < 5 - nStelle; i++) {
            $("<img>").prop({ "src": "assets/images/grey-star.png", "alt": "" }).appendTo(starContainer)
        }
        let votoFormattato = mediaVoti % 1 === 0 ? mediaVoti.toFixed(0) : mediaVoti.toFixed(1);
        let p = $("<p>").prop("id", "container").css("text-align", "left").appendTo(div3)
        $("<div>").html("<b>Valutazione: </b>" + votoFormattato + "/5").appendTo(p);
        $("<div>").html("<b>Numero di valutazioni: </b>" + professore["numeroValutazioni"]).appendTo(p);
        $("<div>").html("<b>Modalità: </b>" +
            (Array.isArray(professore["scelte"]) ? professore["scelte"].join(", ") : "Non specificato")
        ).appendTo(p);
        $("<div>").html("<b>Città: </b>" + professore["citta"]).appendTo(p);
    });
}

function arrotondaVoto(voto) {
    const decimale = voto - Math.floor(voto);
    return decimale < 0.6 ? Math.floor(voto) : Math.ceil(voto);
}